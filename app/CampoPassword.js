'use client';

import { useState } from 'react';

export default function CampoPassword({ id, value, onChange, placeholder, autoComplete }) {
  const [visibile, setVisibile] = useState(false);

  return (
    <div style={{ position: 'relative' }}>
      <input
        id={id}
        type={visibile ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        style={{ paddingRight: 68 }}
      />
      <button
        type="button"
        onClick={() => setVisibile((v) => !v)}
        style={{
          position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
          background: 'transparent', border: 'none', color: 'var(--muted)',
          fontFamily: 'inherit', fontSize: 12, fontWeight: 800, padding: '10px 10px',
          textTransform: 'uppercase', letterSpacing: '.06em', cursor: 'pointer',
        }}
      >
        {visibile ? 'Nascondi' : 'Mostra'}
      </button>
    </div>
  );
}
