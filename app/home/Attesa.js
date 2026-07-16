'use client';

import { useEffect, useState } from 'react';
import { SOGLIA } from '../../lib/supabase';

export default function Attesa({ profilo, inAttesa }) {
  const [copiato, setCopiato] = useState(false);
  const [anim, setAnim] = useState(0);

  if (!profilo) return <p className="muted">Un attimo…</p>;

  const mancano = Math.max(0, SOGLIA - inAttesa);
  const pct = Math.min(1, inAttesa / SOGLIA);
  const C = 2 * Math.PI * 58;

  useEffect(() => {
    const t = setTimeout(() => setAnim(pct), 250);
    return () => clearTimeout(t);
  }, [pct]);

  const link = typeof window !== 'undefined' ? window.location.origin : '';

  async function copia() {
    try {
      await navigator.clipboard.writeText(link);
      setCopiato(true);
      setTimeout(() => setCopiato(false), 1600);
    } catch (e) {}
  }

  return (
    <div>
      <p className="eyebrow">Ciao {profilo?.nome || 'di nuovo'}</p>
      <h1 className="display" style={{ marginTop: 10 }}>
        {mancano > 0 ? 'Stiamo\nradunando.' : 'Ci siete\nquasi.'}
      </h1>
      <p className="sub">
        Appena siete abbastanza nel tuo corso, formiamo i gruppi e parte la prima missione.
      </p>

      <div className="card card-dark d1" style={{ textAlign: 'center', padding: '30px 24px' }}>
        <p className="eyebrow" style={{ color: 'rgba(255,255,255,.5)' }}>
          {profilo?.corso} · {profilo?.campus}
        </p>

        <div style={{ width: 144, height: 144, margin: '20px auto 4px', position: 'relative' }}>
          <svg width="144" height="144" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="72" cy="72" r="58" fill="none" stroke="rgba(255,255,255,.12)" strokeWidth="10" />
            <circle cx="72" cy="72" r="58" fill="none" stroke="var(--coral)" strokeWidth="10"
                    strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - anim)}
                    style={{ transition: 'stroke-dashoffset 1.1s cubic-bezier(0.22,1,0.36,1)' }} />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center' }}>
            <div className="display" style={{ fontSize: 40, color: '#fff' }}>{inAttesa}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,.5)', fontWeight: 700,
                          letterSpacing: '.06em', textTransform: 'uppercase' }}>
              su {SOGLIA}
            </div>
          </div>
        </div>

        <p style={{ fontSize: 15, lineHeight: 1.5, color: 'rgba(255,255,255,.75)', margin: '14px 0 0' }}>
          {inAttesa <= 1
            ? <>Sei il primo del tuo corso. Serve essere in <b style={{ color: '#fff' }}>{SOGLIA}</b>.</>
            : mancano > 0
              ? <>Ne mancano <b style={{ color: 'var(--coral)' }}>{mancano}</b> e si parte.</>
              : <>Siete abbastanza. I gruppi partono a giorni.</>}
        </p>
      </div>

      <div className="card d2" style={{ background: 'var(--sun-soft)' }}>
        <p className="eyebrow" style={{ color: 'var(--sun-text)' }}>Acceleratore</p>
        <h2 className="display" style={{ fontSize: 20, marginTop: 8 }}>
          Dipende da te quanto ci mettiamo.
        </h2>
        <p className="muted" style={{ margin: '10px 0 16px', lineHeight: 1.5 }}>
          Manda il link nel gruppo delle matricole del tuo corso. Ogni persona che entra vi
          avvicina alla prima missione.
        </p>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'var(--card-2)',
                      borderRadius: 'var(--r-md)', padding: '10px 10px 10px 14px' }}>
          <span style={{ flex: 1, fontSize: 13, color: 'var(--muted)', fontWeight: 700,
                         overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {link.replace('https://', '')}
          </span>
          <button onClick={copia}
                  style={{ background: copiato ? 'var(--mint)' : 'var(--ink)',
                           color: 'var(--void)',
                           padding: '10px 16px', borderRadius: 'var(--r-sm)', fontSize: 13,
                           fontWeight: 700, fontFamily: 'inherit', transition: 'background .3s' }}>
            {copiato ? 'Copiato' : 'Copia'}
          </button>
        </div>
      </div>
    </div>
  );
}
