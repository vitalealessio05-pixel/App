'use client';

import { useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [stato, setStato] = useState('idle');
  const [err, setErr] = useState('');

  async function invia(e) {
    e.preventDefault();
    setErr('');
    setStato('invio');

    const { error } = await supabase().auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });

    if (error) {
      setErr(error.message);
      setStato('idle');
    } else {
      setStato('inviato');
    }
  }

  if (stato === 'inviato') {
    return (
      <div>
        <div className="brand">Missio</div>
        <h1>Controlla la mail</h1>
        <p className="sub">
          Abbiamo mandato un link a <b>{email}</b>. Aprilo da questo telefono per entrare.
          Niente password da ricordare.
        </p>
        <p className="hint">Non arriva? Guarda nello spam, oppure riprova tra un minuto.</p>
        <button className="btn-ghost" onClick={() => setStato('idle')}>
          Usa un'altra mail
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={invia}>
      <div className="brand">Missio</div>
      <h1>Entra</h1>
      <p className="sub">Ti mandiamo un link via mail. Nessuna password.</p>

      <label htmlFor="email">Email</label>
      <input
        id="email"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="nome@studenti.uniroma1.it"
        autoComplete="email"
      />

      {err && <p className="err">{err}</p>}

      <button className="btn" type="submit" disabled={stato === 'invio' || !email}>
        {stato === 'invio' ? 'Invio…' : 'Mandami il link'}
      </button>
    </form>
  );
}
