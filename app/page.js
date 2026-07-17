'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';
import Splash from './Splash';
import BrandMark from './BrandMark';

const SLIDE = [
  {
    eyebrow: 'Settembre',
    titolo: 'Arrivi in una città\nche non conosci.',
    testo: 'Aule enormi, facce nuove, nessun numero in rubrica. Le prime settimane decidono tutto.',
    art: 'citta',
    bg: 'var(--void)',
    fg: '#fff',
  },
  {
    eyebrow: 'Il gruppo',
    titolo: 'Non ti lasciamo\nda solo.',
    testo: 'Ti mettiamo con 3 o 4 persone del tuo corso. Mai uno a uno: il gruppo è già formato, nessuno deve fare il primo passo.',
    art: 'gruppo',
    bg: 'var(--iris)',
    fg: '#fff',
  },
  {
    eyebrow: 'La missione',
    titolo: 'Una scusa\nper uscire.',
    testo: 'Ogni settimana una cosa concreta da fare insieme, in quattro giorni. Non "andate a socializzare". Andate a fare una cosa.',
    art: 'missione',
    bg: 'var(--coral)',
    fg: '#fff',
  },
  {
    eyebrow: 'La prova',
    titolo: 'Una foto,\ne la città è vostra.',
    testo: 'Foto di gruppo come prova. I punti vanno a chi c’era davvero.',
    art: 'foto',
    bg: 'var(--sun)',
    fg: 'var(--void)',
  },
];

function Art({ tipo }) {
  const common = { width: '100%', height: 180, viewBox: '0 0 300 180', fill: 'none' };

  if (tipo === 'citta') {
    return (
      <svg {...common} aria-hidden="true">
        <g opacity="0.9">
          {[[40, 90], [78, 60], [116, 110], [154, 44], [192, 84], [230, 70]].map(([x, h], i) => (
            <rect key={i} x={x} y={170 - h} width="28" height={h} rx="5" fill="rgba(255,255,255,.16)">
              <animate attributeName="y" from="170" to={170 - h} dur="0.7s" begin={`${i * 0.09}s`} fill="freeze" />
              <animate attributeName="height" from="0" to={h} dur="0.7s" begin={`${i * 0.09}s`} fill="freeze" />
            </rect>
          ))}
        </g>
        <circle cx="150" cy="150" r="7" fill="var(--coral)">
          <animate attributeName="r" values="7;10;7" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx="150" cy="150" r="7" fill="none" stroke="var(--coral)" strokeWidth="2" opacity="0.5">
          <animate attributeName="r" values="7;34" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.5;0" dur="2s" repeatCount="indefinite" />
        </circle>
      </svg>
    );
  }

  if (tipo === 'gruppo') {
    const p = [[110, 92], [150, 70], [190, 92], [150, 122]];
    return (
      <svg {...common} aria-hidden="true">
        {p.map(([x, y], i) =>
          p.slice(i + 1).map(([x2, y2], j) => (
            <line key={`${i}-${j}`} x1={x} y1={y} x2={x2} y2={y2}
                  stroke="rgba(255,255,255,.35)" strokeWidth="1.5">
              <animate attributeName="stroke-dasharray" from="0 120" to="120 0" dur="0.8s"
                       begin={`${0.4 + i * 0.1}s`} fill="freeze" />
            </line>
          ))
        )}
        {p.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="16" fill="#fff">
            <animate attributeName="r" from="0" to="16" dur="0.5s" begin={`${i * 0.1}s`} fill="freeze" />
          </circle>
        ))}
      </svg>
    );
  }

  if (tipo === 'missione') {
    return (
      <svg {...common} aria-hidden="true">
        <path d="M40 140 Q 90 60 150 100 T 260 50" stroke="rgba(255,255,255,.5)" strokeWidth="3"
              strokeDasharray="7 8" strokeLinecap="round">
          <animate attributeName="stroke-dashoffset" from="300" to="0" dur="2.4s" repeatCount="indefinite" />
        </path>
        <circle cx="40" cy="140" r="9" fill="#fff" />
        <g>
          <path d="M260 32 l6 12 -12 0 z" fill="#fff" />
          <rect x="257" y="32" width="3" height="26" rx="1.5" fill="#fff" />
          <path d="M260 32 h22 l-6 7 6 7 h-22 z" fill="var(--void)">
            <animateTransform attributeName="transform" type="scale" values="1 1;1 .9;1 1"
                              additive="sum" dur="1.6s" repeatCount="indefinite" />
          </path>
        </g>
      </svg>
    );
  }

  return (
    <svg {...common} aria-hidden="true">
      <g>
        <rect x="88" y="34" width="124" height="118" rx="8" fill="#fff" transform="rotate(-5 150 92)">
          <animateTransform attributeName="transform" type="rotate" from="-24 150 92" to="-5 150 92"
                            dur="0.7s" fill="freeze" />
        </rect>
        <rect x="98" y="44" width="104" height="80" rx="4" fill="var(--void)" transform="rotate(-5 150 92)" opacity="0.9" />
        {[[124, 84], [150, 76], [176, 84]].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="11" fill="var(--sun)" transform="rotate(-5 150 92)">
            <animate attributeName="opacity" from="0" to="1" dur="0.4s" begin={`${0.6 + i * 0.12}s`} fill="freeze" />
          </circle>
        ))}
      </g>
      <g transform="translate(214 118)">
        <circle r="24" fill="none" stroke="var(--coral)" strokeWidth="2.5">
          <animateTransform attributeName="transform" type="scale" from="2.4" to="1" dur="0.5s"
                            begin="1s" fill="freeze" />
          <animate attributeName="opacity" from="0" to="1" dur="0.4s" begin="1s" fill="freeze" />
        </circle>
        <text y="4" textAnchor="middle" fill="var(--coral)" fontSize="9" fontWeight="700"
              fontFamily="Bricolage Grotesque, sans-serif" opacity="0">
          FATTO
          <animate attributeName="opacity" from="0" to="1" dur="0.3s" begin="1.3s" fill="freeze" />
        </text>
      </g>
    </svg>
  );
}

export default function Intro() {
  const router = useRouter();
  const [pronto, setPronto] = useState(false);
  const [minimoPassato, setMinimoPassato] = useState(false);
  const [destinazione, setDestinazione] = useState(null);
  const [i, setI] = useState(0);
  const [finito, setFinito] = useState(false);
  const touch = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setMinimoPassato(true), 1300);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    async function check() {
      const sb = supabase();
      const { data: { session } } = await sb.auth.getSession();
      if (session) {
        const { data: p } = await sb.from('profiles').select('id').eq('id', session.user.id).maybeSingle();
        setDestinazione(p ? '/home' : '/onboarding');
        return;
      }
      if (typeof window !== 'undefined' && localStorage.getItem('missio_intro') === 'ok') {
        setFinito(true);
      }
      setPronto(true);
    }
    check();
  }, [router]);

  // naviga solo quando lo splash ha avuto il suo tempo minimo, anche se il
  // controllo sessione è finito subito (utente già loggato, tutto in cache)
  useEffect(() => {
    if (destinazione && minimoPassato) router.replace(destinazione);
  }, [destinazione, minimoPassato, router]);

  function chiudi() {
    try { localStorage.setItem('missio_intro', 'ok'); } catch (e) {}
    setFinito(true);
  }

  function avanti() {
    if (i < SLIDE.length - 1) setI(i + 1);
    else chiudi();
  }

  function onStart(e) { touch.current = e.touches[0].clientX; }
  function onEnd(e) {
    if (touch.current === null) return;
    const d = e.changedTouches[0].clientX - touch.current;
    if (d < -50) avanti();
    if (d > 50 && i > 0) setI(i - 1);
    touch.current = null;
  }

  const mostraApp = pronto && minimoPassato;
  const [splashVia, setSplashVia] = useState(false);

  useEffect(() => {
    if (!mostraApp) return;
    const t = setTimeout(() => setSplashVia(true), 400);
    return () => clearTimeout(t);
  }, [mostraApp]);

  let contenuto = null;

  if (mostraApp && finito) {
    contenuto = (
      <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 22 }}>
          <BrandMark size={64} />
        </div>

        <h1 className="display" style={{ fontSize: 40, textAlign: 'center', marginBottom: 10 }}>
          Maisola
        </h1>
        <p style={{ textAlign: 'center', fontSize: 16, fontWeight: 600, color: 'var(--muted)',
                    fontStyle: 'italic', margin: '0 0 36px' }}>
          Fuorisede, mai soli.
        </p>

        <p className="sub" style={{ textAlign: 'center', marginBottom: 28 }}>
          Un gruppo del tuo corso. Una missione a settimana. Nessuno deve fare il primo passo da solo.
        </p>

        <button className="btn btn-coral" onClick={() => router.push('/register')}>
          Registrati
        </button>
        <button className="btn-ghost" onClick={() => router.push('/login')}>
          Ho già un account — accedi
        </button>

        <button className="btn-text" style={{ display: 'block', margin: '24px auto 0' }}
                onClick={() => { setFinito(false); setI(0); }}>
          Rivedi la presentazione
        </button>

        <p style={{ textAlign: 'center', fontSize: 11.5, color: 'var(--muted)', marginTop: 28 }}>
          Registrandoti accetti i <a href="/termini" style={{ color: 'inherit' }}>Termini</a> e la{' '}
          <a href="/privacy" style={{ color: 'inherit' }}>Privacy</a>.
        </p>
      </div>
    );
  } else if (mostraApp) {
    const s = SLIDE[i];
    contenuto = (
      <div onTouchStart={onStart} onTouchEnd={onEnd}
           style={{ minHeight: 'calc(100vh - 84px)', display: 'flex', flexDirection: 'column' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="brand" style={{ marginBottom: 0 }}><BrandMark />Maisola</div>
          <button className="btn-text" onClick={chiudi}>Salta</button>
        </div>

        <div key={i} className="card" style={{
          background: s.bg, color: s.fg, marginTop: 24, padding: '30px 26px 34px',
          borderRadius: 32, flex: 'none',
        }}>
          <Art tipo={s.art} />
          <p className="eyebrow" style={{ color: s.fg, opacity: .65, marginTop: 22 }}>{s.eyebrow}</p>
          <h1 className="display" style={{ fontSize: 32, marginTop: 10, whiteSpace: 'pre-line' }}>
            {s.titolo}
          </h1>
          <p style={{ fontSize: 15, lineHeight: 1.55, marginTop: 14, marginBottom: 0, opacity: .82 }}>
            {s.testo}
          </p>
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ display: 'flex', gap: 7, justifyContent: 'center', margin: '4px 0 18px' }}>
          {SLIDE.map((_, k) => (
            <button key={k} onClick={() => setI(k)} aria-label={`Slide ${k + 1}`}
                    style={{
                      width: k === i ? 26 : 8, height: 8, borderRadius: 4, border: 'none',
                      background: k === i ? 'var(--ink)' : 'rgba(245,243,251,.2)',
                      transition: 'width .3s var(--spring), background .3s', padding: 0,
                    }} />
          ))}
        </div>

        <button className="btn" style={{ marginTop: 0 }} onClick={avanti}>
          {i === SLIDE.length - 1 ? 'Iniziamo' : 'Avanti'}
        </button>
      </div>
    );
  }

  return (
    <>
      {!splashVia && <Splash uscendo={mostraApp} />}
      {contenuto}
    </>
  );
}
