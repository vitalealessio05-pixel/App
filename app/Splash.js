'use client';

export default function Splash({ uscendo }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 999,
      background: 'var(--void)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      opacity: uscendo ? 0 : 1,
      transition: 'opacity .35s ease',
      pointerEvents: uscendo ? 'none' : 'auto',
    }}>
      <style>{`
        @keyframes arcIn {
          from { opacity: 0; transform: scale(0.5); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes splashSlide {
          from { transform: translateY(10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .splash-arc { transform-origin: center; animation: arcIn .4s cubic-bezier(0.22,1,0.36,1) both; }
        .splash-name { animation: splashSlide .5s ease .5s both; }
        .splash-motto { animation: splashSlide .5s ease .65s both; }
      `}</style>

      <svg width="88" height="88" viewBox="0 0 100 100" style={{ marginBottom: 22 }}>
        <g stroke="var(--coral)" strokeWidth="8" strokeLinecap="round">
          <line className="splash-arc" style={{ animationDelay: '.18s' }} x1="32" y1="70" x2="32" y2="48" />
          <line className="splash-arc" style={{ animationDelay: '.30s' }} x1="50" y1="70" x2="50" y2="34" />
          <line className="splash-arc" style={{ animationDelay: '.42s' }} x1="68" y1="70" x2="68" y2="48" />
        </g>
        <path className="splash-arc" style={{ animationDelay: '.52s' }}
              d="M 24 72 Q 50 82 76 72" stroke="var(--coral)" strokeWidth="8" fill="none" strokeLinecap="round" />
      </svg>

      <h1 className="splash-name display" style={{ fontSize: 32, color: '#fff', margin: 0 }}>
        Maisola
      </h1>
      <p className="splash-motto" style={{
        fontSize: 14, fontWeight: 600, fontStyle: 'italic',
        color: 'rgba(255,255,255,.65)', margin: '8px 0 0',
      }}>
        Fuorisede, mai soli.
      </p>
    </div>
  );
}
