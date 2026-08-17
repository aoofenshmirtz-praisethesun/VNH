import React, { useEffect, useRef } from 'react';

/**
 * WaterRippleCanvas Component
 * Interactive canvas water ripple effect on mouse movement and click.
 * Rendered with translucent clear fill so Vanta.FOG background is visible underneath.
 */
export const WaterRippleCanvas = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let ripples = [];

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    class Ripple {
      constructor(x, y, isClick = false) {
        this.x = x;
        this.y = y;
        this.radius = 2;
        this.maxRadius = isClick ? 140 : 70;
        this.opacity = isClick ? 0.85 : 0.5;
        this.speed = isClick ? 3.5 : 2.0;
        this.lineWidth = isClick ? 2.5 : 1.5;
        this.color = Math.random() > 0.3 ? '56, 189, 248' : '201, 161, 95';
      }

      update() {
        this.radius += this.speed;
        this.opacity -= (this.speed / this.maxRadius) * 0.9;
      }

      draw(ctx) {
        if (this.opacity <= 0) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, Math.max(0, this.radius), 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${this.color}, ${Math.max(0, this.opacity)})`;
        ctx.lineWidth = this.lineWidth;
        ctx.stroke();
      }
    }

    let lastMoveTime = 0;
    const handleMouseMove = (e) => {
      const now = Date.now();
      if (now - lastMoveTime > 60) {
        ripples.push(new Ripple(e.clientX, e.clientY, false));
        lastMoveTime = now;
      }
    };

    const handleClick = (e) => {
      ripples.push(new Ripple(e.clientX, e.clientY, true));
      ripples.push(new Ripple(e.clientX, e.clientY, true));
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('click', handleClick);

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ripples = ripples.filter((r) => r.opacity > 0);
      ripples.forEach((r) => {
        r.update();
        r.draw(ctx);
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleClick);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 1,
        pointerEvents: 'none'
      }}
    />
  );
};
