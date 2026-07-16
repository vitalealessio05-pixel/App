'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

export default function Register() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [stato, setStato] = useState('idle');
  const [err, setErr] = useState('');

  async function invia(e) {
    e.preventDefault();
    setErr('');
    setStato('invio');

    try {
      const { error } = await supabase().auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          shouldCreateUser: true,
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        const m = (error.message || '').toLowerCase();
        if (m.includes('rate limit') || error.status === 429) {
          setErr('Troppe mail inviate. Riprova tra un po’.');
        } else {
          setErr(error.message);
        }
        setStato('idle');
        return;
      }
      setStato('inviato');
    } catch (e) {
      setErr(e?.message || 'Qualcosa non ha funzionato.');
      setStato('idle');
    }
  }

  if (stato === 'inviato') {
    return (
      <div>
        <div className="brand"><span className="brand-dot" />Missio</div>
        <div className="card card-coral" style={{ marginTop: 30, padding: 30 }}>
          <div className="stamp" style={{ borderColor: '#fff', color: '#fff', marginBottom: 22 }}>
            Quasi<br />dentro
          </div>
          <h1 className="display" style={{ fontSize: 30 }}>Ti abbiamo<br />scritto.</h1>
          <p style={{ fontSize: 15, lineHeight: 1.55, opacity: .85, marginTop: 14, marginBottom: 0 }}>
            Apri il link che è arrivato a <b>{email}</b> da questo telefono. Poi ti chiediamo
            due cose sul tuo corso e sei dentro.
          </p>
        </div>
        <p className="hint" style={{ textAlign: 'center' }}>Non arriva? Controlla lo spam.</p>
        <button className="btn-ghost" onClick={() => setStato('idle')}>Usa un’altra mail</button>
      </div>
    );
  }

  return (
    <form onSubmit={invia}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="brand" style={{ marginBottom: 0 }}><span className="brand-dot" />Missio</div>
        <button type="button" className="btn-text" onClick={() => router.push('/')}>Indietro</button>
      </div>

      <p className="eyebrow" style={{ marginTop: 44 }}>Nuovo qui</p>
      <h1 className="display" style={{ marginTop: 10 }}>Registrati.</h1>
      <p className="sub">
        Serve solo una mail. Nessuna password da inventare, nessun profilo da riempire.
      </p>

      <label htmlFor="email">Email</label>
      <input id="email" type="email" required value={email} autoComplete="email"
             onChange={(e) => setEmail(e.target.value)} placeholder="nome@studenti.uniroma1.it" />
      <p className="hint">Se ne hai una dell’università, usa quella: ci aiuta a capire che sei uno studente vero.</p>

      {err && <p className="err">{err}</p>}

      <button className="btn btn-coral" type="submit" disabled={stato === 'invio' || !email}>
        {stato === 'invio' ? 'Invio…' : 'Crea il mio account'}
      </button>

      <button type="button" className="btn-text"
              style={{ display: 'block', margin: '20px auto 0' }}
              onClick={() => router.push('/login')}>
        Hai già un account? Accedi
      </button>
    </form>
  );
}
