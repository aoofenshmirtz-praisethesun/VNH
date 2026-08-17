import React, { useEffect, useRef, useState } from 'react';

/**
 * VantaFogBackground Component
 * Renders Vanta.js FOG animation behind the login screen with brand navy & gold tones.
 */
export const VantaFogBackground = ({ enableVantaFog = true }) => {
  const vantaRef = useRef(null);
  const [vantaEffect, setVantaEffect] = useState(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!enableVantaFog || prefersReducedMotion) return;

    const checkWebGL = () => {
      try {
        const canvas = document.createElement('canvas');
        return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
      } catch (e) {
        return false;
      }
    };

    if (!checkWebGL()) return;

    let isMounted = true;

    const loadScript = (src) => {
      return new Promise((resolve, reject) => {
        const existingScript = document.querySelector(`script[src="${src}"]`);
        if (existingScript) {
          if (existingScript.getAttribute('data-loaded') === 'true') {
            resolve();
          } else {
            existingScript.addEventListener('load', () => resolve());
            existingScript.addEventListener('error', (e) => reject(e));
          }
          return;
        }

        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.onload = () => {
          script.setAttribute('data-loaded', 'true');
          resolve();
        };
        script.onerror = (e) => reject(e);
        document.body.appendChild(script);
      });
    };

    const initVantaFog = async () => {
      try {
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/three.js/r121/three.min.js');
        await loadScript('https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.fog.min.js');

        if (isMounted && vantaRef.current && window.VANTA && window.VANTA.FOG) {
          const effect = window.VANTA.FOG({
            el: vantaRef.current,
            mouseControls: true,
            touchControls: true,
            gyroControls: false,
            minHeight: 200.00,
            minWidth: 200.00,
            highlightColor: 0xc9a15f,
            midtoneColor: 0x1a2f42,
            lowlightColor: 0x0d1b2a,
            baseColor: 0x0d1b2a,
            blurFactor: 0.60,
            speed: 1.00,
            zoom: 1.00
          });
          setVantaEffect(effect);
        }
      } catch (err) {
        console.warn('Vanta FOG initialization failed:', err);
      }
    };

    const timer = setTimeout(initVantaFog, 50);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (vantaEffect) vantaEffect.destroy();
    };
  }, [enableVantaFog]);

  return (
    <div
      ref={vantaRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
        backgroundColor: '#0d1b2a',
        background: 'linear-gradient(135deg, #05070d 0%, #0d1b2a 100%)'
      }}
    />
  );
};
