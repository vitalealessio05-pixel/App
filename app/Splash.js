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
        @keyframes splashImgIn {
          from { opacity: 0; transform: scale(0.88); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes splashSlide {
          from { transform: translateY(10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .splash-img {
          animation: splashImgIn .6s cubic-bezier(0.22,1,0.36,1) both;
        }
        .splash-name { animation: splashSlide .5s ease .35s both; }
        .splash-motto { animation: splashSlide .5s ease .5s both; }
      `}</style>

      <img
        src="/splash-mark.jpg"
        alt=""
        className="splash-img"
        style={{ width: 148, height: 148, borderRadius: '50%', marginBottom: 22, objectFit: 'cover' }}
      />

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
