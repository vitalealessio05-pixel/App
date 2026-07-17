'use client';

export default function BrandMark({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ flex: 'none' }}>
      <g stroke="var(--coral)" strokeWidth="8" strokeLinecap="round">
        <line x1="32" y1="70" x2="32" y2="48" />
        <line x1="50" y1="70" x2="50" y2="34" />
        <line x1="68" y1="70" x2="68" y2="48" />
      </g>
      <path d="M 24 72 Q 50 82 76 72" stroke="var(--coral)" strokeWidth="8" fill="none" strokeLinecap="round" />
    </svg>
  );
}
