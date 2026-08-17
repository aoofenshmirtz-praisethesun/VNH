import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Water } from 'three/examples/jsm/objects/Water.js';

/**
 * ThreeWaterFooter Component
 * Renders an animated 3D water plane using Three.js Water shader.
 * Palette:
 *  - waterColor: 0x0d1b2a (Deep Navy matching NeerNetra theme)
 *  - sunColor: 0xc9a15f (Muted Gold highlights/reflections)
 *  - distortionScale: 1.8 (Calm municipal water flow)
 */
export const ThreeWaterFooter = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    // Check reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion || !containerRef.current) return;

    let scene, camera, renderer, water;
    let animationFrameId;
    let isVisible = true;
    const container = containerRef.current;

    // Check WebGL availability
    const checkWebGL = () => {
      try {
        const canvas = document.createElement('canvas');
        return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
      } catch (e) {
        return false;
      }
    };

    if (!checkWebGL()) return;

    // Procedural Water Normal Texture Generator (100% offline & fast)
    const createProceduralWaterNormals = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');
      const imgData = ctx.createImageData(256, 256);
      const data = imgData.data;

      for (let y = 0; y < 256; y++) {
        for (let x = 0; x < 256; x++) {
          const index = (y * 256 + x) * 4;
          const u = x / 256;
          const v = y / 256;

          // Sine wave combinations for smooth water normal map vectors
          const waveX = Math.sin(u * Math.PI * 12) * Math.cos(v * Math.PI * 12);
          const waveY = Math.cos(u * Math.PI * 8) * Math.sin(v * Math.PI * 8);

          data[index] = Math.floor((waveX * 0.5 + 0.5) * 255);     // R -> normal X
          data[index + 1] = Math.floor((waveY * 0.5 + 0.5) * 255); // G -> normal Y
          data[index + 2] = 255;                                  // B -> normal Z
          data[index + 3] = 255;                                  // Alpha
        }
      }

      ctx.putImageData(imgData, 0, 0);
      const texture = new THREE.CanvasTexture(canvas);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      return texture;
    };

    // 1. Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0d1b2a); // Deep Navy background

    // 2. Camera with slight horizon angle tilt
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || 220;
    camera = new THREE.PerspectiveCamera(55, width / height, 1, 1000);
    camera.position.set(0, 20, 45);
    camera.lookAt(0, 0, 0);

    // 3. Water geometry & Material using color-matched uniforms
    const waterGeometry = new THREE.PlaneGeometry(300, 300);
    const waterNormals = createProceduralWaterNormals();

    water = new Water(waterGeometry, {
      textureWidth: 512,
      textureHeight: 512,
      waterNormals: waterNormals,
      sunDirection: new THREE.Vector3(0.3, 0.4, 0.5), // Low soft angle
      sunColor: 0xc9a15f,     // Muted gold highlights
      waterColor: 0x0d1b2a,   // Deep navy body
      distortionScale: 1.8,   // Calm, low-moderate distortion
      fog: false
    });

    water.rotation.x = -Math.PI / 2; // Flat horizon plane
    scene.add(water);

    // 4. Renderer scoped to container
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    // 5. Animation loop with time delta
    const clock = new THREE.Clock();
    const render = () => {
      if (isVisible && document.visibilityState === 'visible') {
        const delta = clock.getDelta();
        water.material.uniforms['time'].value += delta * 0.8;
        renderer.render(scene, camera);
      }
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    // 6. Handle container resize
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight || 220;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    // 7. IntersectionObserver & Visibility API to pause rendering when off-screen
    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
      },
      { threshold: 0.05 }
    );
    observer.observe(container);

    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible') {
        isVisible = false;
      } else {
        isVisible = true;
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup on unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      observer.disconnect();

      if (renderer) {
        if (renderer.domElement && container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
        renderer.dispose();
      }

      if (waterGeometry) waterGeometry.dispose();
      if (waterNormals) waterNormals.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        background: 'linear-gradient(180deg, #0d1b2a 0%, #05070d 100%)'
      }}
    />
  );
};
