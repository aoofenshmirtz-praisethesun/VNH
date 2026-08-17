import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Water } from 'three/examples/jsm/objects/Water.js';

/**
 * ThreeWaterDivider Component
 * Renders a subtle animated water strip transition (70px height) between light parchment content and dark navy footer.
 */
export const ThreeWaterDivider = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion || !containerRef.current) return;

    let scene, camera, renderer, water;
    let animationFrameId;
    let isVisible = true;
    const container = containerRef.current;

    const checkWebGL = () => {
      try {
        const canvas = document.createElement('canvas');
        return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
      } catch (e) {
        return false;
      }
    };

    if (!checkWebGL()) return;

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
          const waveX = Math.sin(u * Math.PI * 12) * Math.cos(v * Math.PI * 12);
          const waveY = Math.cos(u * Math.PI * 8) * Math.sin(v * Math.PI * 8);

          data[index] = Math.floor((waveX * 0.5 + 0.5) * 255);
          data[index + 1] = Math.floor((waveY * 0.5 + 0.5) * 255);
          data[index + 2] = 255;
          data[index + 3] = 255;
        }
      }

      ctx.putImageData(imgData, 0, 0);
      const texture = new THREE.CanvasTexture(canvas);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      return texture;
    };

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0d1b2a);

    const width = container.clientWidth || window.innerWidth;
    const height = 70;
    camera = new THREE.PerspectiveCamera(45, width / height, 1, 1000);
    camera.position.set(0, 15, 30);
    camera.lookAt(0, 0, 0);

    const waterGeometry = new THREE.PlaneGeometry(300, 120);
    const waterNormals = createProceduralWaterNormals();

    water = new Water(waterGeometry, {
      textureWidth: 512,
      textureHeight: 512,
      waterNormals: waterNormals,
      sunDirection: new THREE.Vector3(0.3, 0.4, 0.5),
      sunColor: 0xc9a15f,     // Gold highlights
      waterColor: 0x0d1b2a,   // Deep navy
      distortionScale: 1.5,
      fog: false
    });

    water.rotation.x = -Math.PI / 2;
    scene.add(water);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    const clock = new THREE.Clock();
    const render = () => {
      if (isVisible && document.visibilityState === 'visible') {
        const delta = clock.getDelta();
        water.material.uniforms['time'].value += delta * 0.7;
        renderer.render(scene, camera);
      }
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const newWidth = container.clientWidth;
      camera.aspect = newWidth / 70;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, 70);
    };

    window.addEventListener('resize', handleResize);

    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
      },
      { threshold: 0.05 }
    );
    observer.observe(container);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
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
        position: 'relative',
        width: '100%',
        height: '70px',
        overflow: 'hidden',
        background: 'linear-gradient(180deg, #f7f3ea 0%, #0d1b2a 100%)',
        borderTop: '1px solid rgba(201, 161, 95, 0.2)'
      }}
    />
  );
};
