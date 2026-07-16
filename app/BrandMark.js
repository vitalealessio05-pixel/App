'use client';

export default function BrandMark({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ flex: 'none' }}>
      <g transform="translate(50,50)" fill="none" strokeLinecap="round">
        <path d="M -6,-32 A 32,32 0 0 0 -6,32" strokeWidth="9" stroke="var(--coral)" />
        <path d="M -6,-21 A 21,21 0 0 0 -6,21" strokeWidth="9" stroke="var(--coral)" />
        <path d="M -6,-10 A 10,10 0 0 0 -6,10" strokeWidth="9" stroke="var(--coral)" />
        <path d="M 6,-32 A 32,32 0 0 1 6,32" strokeWidth="9" stroke="var(--iris)" />
        <path d="M 6,-21 A 21,21 0 0 1 6,21" strokeWidth="9" stroke="var(--iris)" />
        <path d="M 6,-10 A 10,10 0 0 1 6,10" strokeWidth="9" stroke="var(--iris)" />
      </g>
    </svg>
  );
}
