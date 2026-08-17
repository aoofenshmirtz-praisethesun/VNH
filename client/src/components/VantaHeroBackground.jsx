import React, { useEffect, useRef, useState } from 'react';

/**
 * VantaHeroBackground Component
 * Renders Vanta.js BIRDS animation in hero section with bright water-themed blue-teal birds on a deep dark navy band.
 * High visibility birds with fast response and crisp contrast.
 */
export const VantaHeroBackground = ({ enableVantaBirds = true, children, style = {}, className = '' }) => {
  const vantaRef = useRef(null);
  const [vantaEffect, setVantaEffect] = useState(null);

  useEffect(() => {
    const checkWebGL = () => {
      try {
        const canvas = document.createElement('canvas');
        return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
      } catch (e) {
        return false;
      }
    };

    if (!enableVantaBirds || !checkWebGL()) {
      return;
    }

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

    const initVanta = async () => {
      try {
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/three.js/r121/three.min.js');
        await loadScript('https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.birds.min.js');

        if (isMounted && vantaRef.current && window.VANTA && window.VANTA.BIRDS) {
          const effect = window.VANTA.BIRDS({
            el: vantaRef.current,
            mouseControls: true,
            touchControls: true,
            gyroControls: false,
            minHeight: 220.00,
            minWidth: 200.00,
            scale: 1.00,
            scaleMobile: 1.00,
            backgroundColor: 0x05070d, // Dark deep navy band
            color1: 0x38bdf8, // Vibrant sky blue
            color2: 0x14b8a6, // Water teal
            colorMode: "variance",
            birdSize: 1.60,    // Increased for crisp visibility
            wingSpan: 22.00,
            speedLimit: 5.00,  // Faster flight
            separation: 35.00,
            alignment: 40.00,
            cohesion: 40.00,
            quantity: 4.50     // Increased bird count
          });
          setVantaEffect(effect);
        }
      } catch (err) {
        console.warn('Vanta BIRDS initialization failed:', err);
      }
    };

    const timer = setTimeout(initVanta, 50);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (vantaEffect) vantaEffect.destroy();
    };
  }, [enableVantaBirds]);

  return (
    <div
      ref={vantaRef}
      className={`vanta-hero-wrapper ${className}`}
      style={{
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: '#05070d',
        background: 'linear-gradient(135deg, #05070d 0%, #0d1b2a 100%)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: '0 20px 48px rgba(13, 27, 42, 0.4)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        ...style
      }}
    >
      {/* Crisp overlay without blur so birds remain sharp */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          background: 'rgba(5, 7, 13, 0.35)',
          padding: '2.25rem'
        }}
      >
        {children}
      </div>
    </div>
  );
};
