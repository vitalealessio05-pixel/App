'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

export default function Recupera() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [stato, setStato] = useState('idle');
  const [err, setErr] = useState('');

  async function invia(e) {
    e.preventDefault();
    setErr('');
    setStato('invio');

    try {
      const { error } = await supabase().auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        { redirectTo: `${window.location.origin}/nuova-password` }
      );

      if (error) {
        const m = (error.message || '').toLowerCase();
        if (m.includes('rate limit') || error.status === 429) {
          setErr('Non riusciamo a mandare la mail in questo momento. Riprova tra un’ora.');
        } else {
          console.error('reset:', error);
          setErr('Non è riuscito. Riprova.');
        }
        setStato('idle');
        return;
      }
      setStato('inviato');
    } catch (e) {
      setErr('Qualcosa non ha funzionato. Riprova.');
      setStato('idle');
    }
  }

  if (stato === 'inviato') {
    return (
      <div>
        <div className="brand"><span className="brand-dot" />Missio</div>
        <div className="card card-dark" style={{ marginTop: 30, padding: 30 }}>
          <div className="stamp" style={{ borderColor: 'var(--sun)', color: 'var(--sun)',
                                          marginBottom: 22 }}>
            Link<br />inviato
          </div>
          <h1 className="display" style={{ fontSize: 30 }}>Controlla<br />la mail.</h1>
          <p style={{ fontSize: 15, lineHeight: 1.55, opacity: .78, marginTop: 14, marginBottom: 0 }}>
            Apri il link arrivato a <b style={{ color: 'var(--sun)' }}>{email}</b> e scegli
            una password nuova.
          </p>
        </div>
        <button className="btn-ghost" onClick={() => router.push('/login')}>Torna ad accedere</button>
      </div>
    );
  }

  return (
    <form onSubmit={invia}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="brand" style={{ marginBottom: 0 }}><span className="brand-dot" />Missio</div>
        <button type="button" className="btn-text" onClick={() => router.push('/login')}>Indietro</button>
      </div>

      <p className="eyebrow" style={{ marginTop: 40 }}>Capita</p>
      <h1 className="display" style={{ marginTop: 10 }}>Password<br />dimenticata.</h1>
      <p className="sub">Ti mandiamo un link per sceglierne una nuova.</p>

      <div className="card d1">
        <label htmlFor="email" style={{ marginTop: 0 }}>Email</label>
        <input id="email" type="email" required value={email} autoComplete="email"
               onChange={(e) => setEmail(e.target.value)} placeholder="la tua mail" />
      </div>

      {err && <p className="err">{err}</p>}

      <button className="btn" type="submit" disabled={stato === 'invio' || !email}>
        {stato === 'invio' ? 'Invio…' : 'Mandami il link'}
      </button>
    </form>
  );
}
