'use client';

export default function BrandMark({ size = 22 }) {
  return (
    <img
      src="/brand-mark.png"
      alt="Maisola"
      width={size}
      height={size}
      style={{ flex: 'none', borderRadius: '50%', objectFit: 'cover' }}
    />
  );
}
