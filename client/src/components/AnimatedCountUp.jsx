import React, { useEffect, useState } from 'react';

/**
 * AnimatedCountUp Component (Task 3)
 * Animates numbers counting up from 0 to target value over ~1 second using ease-out curve.
 */
export const AnimatedCountUp = ({ value, decimals = 0, suffix = '', duration = 1000 }) => {
  const [displayVal, setDisplayVal] = useState(0);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const target = Number(value) || 0;

    if (prefersReducedMotion || target === 0) {
      setDisplayVal(target);
      return;
    }

    let startTime = null;
    let animationFrameId;

    const easeOutCubic = (x) => 1 - Math.pow(1 - x, 3);

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easedProgress = easeOutCubic(progress);

      const currentVal = easedProgress * target;
      setDisplayVal(currentVal);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        setDisplayVal(target);
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [value, duration]);

  return (
    <span>
      {displayVal.toFixed(decimals)}
      {suffix}
    </span>
  );
};
