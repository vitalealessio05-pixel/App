'use client';

import { useState } from 'react';
import { SOGLIA } from '../../lib/supabase';

export default function Attesa({ profilo, inAttesa }) {
  const [copiato, setCopiato] = useState(false);
  const mancano = Math.max(0, SOGLIA - inAttesa);
  const pct = Math.min(1, inAttesa / SOGLIA);
  const C = 339;

  const link = typeof window !== 'undefined' ? window.location.origin : '';

  async function copia() {
    try {
      await navigator.clipboard.writeText(link);
      setCopiato(true);
      setTimeout(() => setCopiato(false), 1500);
    } catch (e) { /* clipboard non disponibile */ }
  }

  return (
    <div>
      <h1>Sei dentro</h1>
      <p className="sub">Ti mettiamo in gruppo appena siete abbastanza nel tuo corso.</p>

      <div className="card center">
        <p style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.04em',
                    color: 'var(--ink-soft)', margin: '0 0 16px' }}>
          {profilo.corso} · {profilo.campus}
        </p>

        <div style={{ width: 132, height: 132, margin: '0 auto 16px', position: 'relative' }}>
          <svg width="132" height="132" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="66" cy="66" r="54" fill="none" stroke="var(--paper-2)" strokeWidth="8" />
            <circle cx="66" cy="66" r="54" fill="none" stroke="var(--stamp)" strokeWidth="8"
                    strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - pct)}
                    style={{ transition: 'stroke-dashoffset .5s ease' }} />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 600 }}>{inAttesa}</div>
            <div style={{ fontSize: 11, color: 'var(--ink-soft)' }}>su {SOGLIA} per partire</div>
          </div>
        </div>

        <p style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--ink-soft)', margin: 0 }}>
          {inAttesa <= 1
            ? <>Sei il primo del tuo corso. Appena arrivate a <b style={{ color: 'var(--ink)' }}>{SOGLIA}</b>, formiamo i gruppi.</>
            : mancano > 0
              ? <>Siete già in <b style={{ color: 'var(--ink)' }}>{inAttesa}</b>. Ne mancano <b style={{ color: 'var(--ink)' }}>{mancano}</b> per partire.</>
              : <>Siete abbastanza. I gruppi partono a giorni.</>}
        </p>

        <div style={{ marginTop: 22, padding: 14, background: 'var(--stamp-soft)',
                      borderRadius: 10, textAlign: 'left' }}>
          <p style={{ fontSize: 13, margin: '0 0 10px' }}>
            Fai partire prima il tuo corso: manda il link nel gruppo delle matricole.
          </p>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: '#fff',
                        borderRadius: 8, padding: '8px 10px', border: '1px solid var(--line)' }}>
            <span style={{ flex: 1, fontSize: 12, color: 'var(--ink-soft)', overflow: 'hidden',
                           textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{link}</span>
            <button onClick={copia}
                    style={{ background: 'var(--ink)', color: 'var(--paper)', padding: '6px 10px',
                             borderRadius: 6, fontSize: 11, fontWeight: 600 }}>
              {copiato ? 'Copiato' : 'Copia'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
