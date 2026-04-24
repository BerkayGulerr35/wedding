'use client';

export function EucalyptusSprig({ size = 140 }: { size?: number }) {
  return (
    <svg width={size} height={size * 1.3} viewBox="0 0 80 110">
      <path d="M 40 105 Q 38 70 42 40 T 38 5" stroke="#6a8a6a" strokeWidth="0.8" fill="none" />
      {[0,1,2,3,4,5,6,7,8].map((i) => {
        const y = 100 - i * 11;
        const side = i % 2 === 0 ? -1 : 1;
        const sz = 7 - i * 0.4;
        return (
          <g key={i}>
            <ellipse cx={40 + side * 8} cy={y} rx={sz * 0.7} ry={sz} fill="#9ab59a" opacity="0.85" transform={`rotate(${side * 25} ${40 + side * 8} ${y})`} />
            <ellipse cx={40 + side * 8} cy={y} rx={sz * 0.4} ry={sz * 0.7} fill="#7aa07a" opacity="0.5" transform={`rotate(${side * 25} ${40 + side * 8} ${y})`} />
          </g>
        );
      })}
    </svg>
  );
}

export function OliveBranch({ size = 200, flip = false }: { size?: number; flip?: boolean }) {
  return (
    <svg width={size} height={size * 0.45} viewBox="0 0 200 90">
      <g transform={flip ? 'scale(-1,1) translate(-200,0)' : ''}>
        <path d="M 10 50 Q 60 30 110 45 T 195 50" stroke="#5a6e4a" strokeWidth="1.2" fill="none" />
        {Array.from({ length: 14 }).map((_, i) => {
          const t = i / 13;
          const x = 10 + t * 185;
          const yWave = Math.sin(t * Math.PI) * -10;
          const y = 50 + yWave;
          const up = i % 2 === 0;
          const angle = up ? -35 : 35;
          return (
            <g key={i} transform={`translate(${x} ${y}) rotate(${angle})`}>
              <ellipse cx="0" cy="-8" rx="4" ry="10" fill="#7a9a72" opacity="0.85" />
              <ellipse cx="0" cy="-8" rx="2" ry="8" fill="#5a7e54" opacity="0.6" />
            </g>
          );
        })}
        <circle cx="80"  cy="42" r="2.4" fill="#3a4a30" opacity="0.85" />
        <circle cx="120" cy="46" r="2"   fill="#3a4a30" opacity="0.85" />
        <circle cx="155" cy="48" r="2.2" fill="#3a4a30" opacity="0.85" />
      </g>
    </svg>
  );
}

export function WatercolorBlob({ color = '#6b8f71', size = 200, opacity = 0.25 }: { color?: string; size?: number; opacity?: number }) {
  const id = `wc-${color.replace('#', '')}`;
  return (
    <svg width={size} height={size} viewBox="0 0 200 200">
      <defs>
        <filter id={id}>
          <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="2" />
          <feDisplacementMap in="SourceGraphic" scale="6" />
          <feGaussianBlur stdDeviation="2" />
        </filter>
      </defs>
      <ellipse cx="100" cy="100" rx="80" ry="65" fill={color} opacity={opacity} filter={`url(#${id})`} />
      <ellipse cx="100" cy="100" rx="60" ry="48" fill={color} opacity={opacity * 0.6} filter={`url(#${id})`} />
    </svg>
  );
}

export function Monogram({ size = 80 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="46" fill="none" stroke="#5a4a35" strokeWidth="0.6" opacity="0.5" />
      <circle cx="50" cy="50" r="42" fill="none" stroke="#5a4a35" strokeWidth="0.4" opacity="0.4" />
      <path d="M 50 8 Q 45 14 50 20 Q 55 14 50 8" fill="#6b8f71" opacity="0.8" />
      <path d="M 50 92 Q 45 86 50 80 Q 55 86 50 92" fill="#6b8f71" opacity="0.8" />
      <text x="50" y="60" textAnchor="middle" fontFamily="Cormorant Garamond, serif" fontStyle="italic" fontSize="42" fill="#3a3022" fontWeight="500">G&amp;B</text>
    </svg>
  );
}

export function StringLightSwag({ width = 400 }: { width?: number }) {
  const bulbs = 10;
  return (
    <svg width="100%" height="90" viewBox={`0 0 ${width} 90`} preserveAspectRatio="none" style={{ display: 'block' }}>
      <defs>
        <radialGradient id="bulbGlowSvg">
          <stop offset="0%"   stopColor="#fff5c4" stopOpacity="1" />
          <stop offset="35%"  stopColor="#f5cf6f" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#c98a3a" stopOpacity="0" />
        </radialGradient>
      </defs>
      <path d={`M 0 8 Q ${width/2} 65 ${width} 8`} stroke="#3a2a18" strokeWidth="0.9" fill="none" opacity="0.6" />
      {Array.from({ length: bulbs }).map((_, i) => {
        const t = (i + 0.5) / bulbs;
        const x = t * width;
        const y = 8 + 4 * 14 * t * (1 - t);
        const dropY = y + 8;
        return (
          <g key={i}>
            <line x1={x} y1={y} x2={x} y2={dropY} stroke="#3a2a18" strokeWidth="0.6" opacity="0.55" />
            <circle cx={x} cy={dropY + 14} r="14" fill="url(#bulbGlowSvg)" opacity="0.85">
              <animate attributeName="opacity" values="0.65;1;0.8;1;0.7" dur={`${2.5 + (i % 3) * 0.5}s`} repeatCount="indefinite" />
            </circle>
            <ellipse cx={x} cy={dropY + 14} rx="3.5" ry="4.5" fill="#fde2a0" />
            <ellipse cx={x - 1} cy={dropY + 12} rx="1" ry="1.6" fill="#fff8d8" opacity="0.9" />
            <rect x={x - 1.6} y={dropY + 7} width="3.2" height="3" fill="#2a1f12" />
          </g>
        );
      })}
    </svg>
  );
}

export function HeartScribble({ size = 24, color = '#b06b4a' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path d="M 12 20 C 6 16 2 12 2 8 C 2 5 4 3 7 3 C 9 3 11 4.5 12 6 C 13 4.5 15 3 17 3 C 20 3 22 5 22 8 C 22 12 18 16 12 20 Z"
        fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
    </svg>
  );
}
