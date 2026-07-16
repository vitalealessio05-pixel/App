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
        @keyframes splashPop {
          0% { transform: scale(0.3); opacity: 0; }
          60% { transform: scale(1.08); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes splashSlide {
          from { transform: translateY(10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .splash-c1 {
          animation: splashPop .55s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }
        .splash-c2 {
          animation: splashPop .55s cubic-bezier(0.34, 1.56, 0.64, 1) .12s both;
        }
        .splash-name {
          animation: splashSlide .5s ease .38s both;
        }
        .splash-motto {
          animation: splashSlide .5s ease .55s both;
        }
      `}</style>

      <div style={{ position: 'relative', width: 96, height: 72, marginBottom: 24 }}>
        <div className="splash-c1" style={{
          position: 'absolute', left: 0, top: 6, width: 60, height: 60,
          borderRadius: '50%', background: 'var(--coral)',
        }} />
        <div className="splash-c2" style={{
          position: 'absolute', left: 36, top: 6, width: 60, height: 60,
          borderRadius: '50%', background: 'var(--iris)', opacity: 0.88,
        }} />
      </div>

      <h1 className="splash-name display" style={{ fontSize: 32, color: '#fff', margin: 0 }}>
        Maisola
      </h1>
      <p className="splash-motto" style={{
        fontSize: 14, fontWeight: 600, fontStyle: 'italic',
        color: 'rgba(255,255,255,.65)', margin: '8px 0 0',
      }}>
        Perché nessuno è un'isola.
      </p>
    </div>
  );
}
