import React from 'react';

/**
 * ParchmentBackground Component (Task 1)
 * Full-page fixed background layer for the light parchment area (#f7f3ea).
 * Renders SVG topographic contour lines and ambient blurred gradient blobs.
 * 100% CSS/SVG (No WebGL) for ultra-fast performance.
 */
export const ParchmentBackground = () => {
  return (
    <div className="parchment-background-layer" aria-hidden="true">
      {/* Ambient Blurred Drifting Blobs */}
      <div className="blob-ambient blob-1" />
      <div className="blob-ambient blob-2" />

      {/* Topographic Contour SVG Lines */}
      <svg
        className="topographic-svg-container"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1440 900"
        preserveAspectRatio="none"
      >
        {/* Layer 1 Contour Paths */}
        <g className="contour-path-1" stroke="#c9a15f" strokeWidth="1.2" fill="none" opacity="0.8">
          <path d="M-100,150 Q250,50 600,180 T1300,120 T1600,220" />
          <path d="M-100,280 Q350,180 750,300 T1450,260 T1600,340" />
          <path d="M-100,420 Q200,320 650,450 T1350,380 T1600,460" />
          <path d="M-100,560 Q400,480 800,580 T1500,520 T1600,600" />
          <path d="M-100,720 Q300,620 700,750 T1400,680 T1600,780" />
        </g>

        {/* Layer 2 Counter-Parallax Contour Paths */}
        <g className="contour-path-2" stroke="#c9a15f" strokeWidth="1" fill="none" opacity="0.5">
          <path d="M-100,90 Q450,190 850,100 T1550,160 T1600,80" />
          <path d="M-100,220 Q150,310 550,220 T1250,290 T1600,200" />
          <path d="M-100,360 Q400,440 800,360 T1400,420 T1600,320" />
          <path d="M-100,500 Q250,580 650,500 T1300,560 T1600,480" />
          <path d="M-100,640 Q450,720 850,640 T1500,700 T1600,620" />
          <path d="M-100,780 Q200,850 600,780 T1350,840 T1600,760" />
        </g>
      </svg>
    </div>
  );
};
