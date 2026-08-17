import React from 'react';

/**
 * FloatingDroplets Component
 * Renders 12 translucent water droplet shapes drifting slowly upward across the screen.
 */
export const FloatingDroplets = () => {
  const droplets = [
    { size: 14, left: '8%', duration: 18, delay: 0, opacity: 0.15 },
    { size: 20, left: '18%', duration: 22, delay: 3, opacity: 0.12 },
    { size: 10, left: '27%', duration: 15, delay: 1, opacity: 0.18 },
    { size: 24, left: '38%', duration: 25, delay: 5, opacity: 0.10 },
    { size: 12, left: '46%', duration: 16, delay: 2, opacity: 0.16 },
    { size: 18, left: '55%', duration: 20, delay: 4, opacity: 0.14 },
    { size: 8,  left: '64%', duration: 14, delay: 0.5, opacity: 0.20 },
    { size: 22, left: '73%', duration: 24, delay: 6, opacity: 0.11 },
    { size: 16, left: '82%', duration: 19, delay: 2.5, opacity: 0.15 },
    { size: 11, left: '91%', duration: 17, delay: 1.5, opacity: 0.17 },
    { size: 26, left: '32%', duration: 28, delay: 7, opacity: 0.09 },
    { size: 13, left: '78%', duration: 16, delay: 3.5, opacity: 0.16 }
  ];

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      zIndex: 2,
      pointerEvents: 'none',
      overflow: 'hidden'
    }}>
      {droplets.map((d, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            bottom: '-40px',
            left: d.left,
            width: `${d.size}px`,
            height: `${d.size}px`,
            borderRadius: '50% 50% 50% 0',
            transform: 'rotate(-45deg)',
            background: 'linear-gradient(135deg, rgba(201, 161, 95, 0.4) 0%, rgba(56, 189, 248, 0.4) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            opacity: d.opacity,
            animation: `floatUp ${d.duration}s linear infinite`,
            animationDelay: `${d.delay}s`
          }}
        />
      ))}
    </div>
  );
};
