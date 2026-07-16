'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import CampoPassword from '../CampoPassword';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [stato, setStato] = useState('idle');
  const [err, setErr] = useState('');

  async function invia(e) {
    e.preventDefault();
    setErr('');
    setStato('invio');

    try {
      const sb = supabase();
      const { data, error } = await sb.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: pw,
      });

      if (error) {
        const m = (error.message || '').toLowerCase();
        if (m.includes('invalid login credentials')) {
          setErr('Mail o password sbagliate.');
        } else if (m.includes('email not confirmed')) {
          setErr('Devi ancora confermare la mail. Apri il link che ti abbiamo mandato.');
        } else {
          console.error('signIn:', error);
          setErr('Accesso non riuscito. Riprova.');
        }
        setStato('idle');
        return;
      }

      const { data: p } = await sb
        .from('profiles')
        .select('id')
        .eq('id', data.user.id)
        .maybeSingle();

      router.replace(p ? '/home' : '/onboarding');
    } catch (e) {
      console.error(e);
      setErr('Qualcosa non ha funzionato. Riprova.');
      setStato('idle');
    }
  }

  return (
    <form onSubmit={invia}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="brand" style={{ marginBottom: 0 }}><span className="brand-dot" />Missio</div>
        <button type="button" className="btn-text" onClick={() => router.push('/')}>Indietro</button>
      </div>

      <p className="eyebrow" style={{ marginTop: 40 }}>Bentornato</p>
      <h1 className="display" style={{ marginTop: 10 }}>Accedi.</h1>
      <p className="sub">Mail e password. Nessuna mail da aspettare.</p>

      <div className="card d1">
        <label htmlFor="email" style={{ marginTop: 0 }}>Email</label>
        <input id="email" type="email" required value={email} autoComplete="email"
               onChange={(e) => setEmail(e.target.value)} placeholder="la tua mail" />

        <label htmlFor="pw">Password</label>
        <CampoPassword id="pw" value={pw} onChange={(e) => setPw(e.target.value)}
                       placeholder="La tua password" autoComplete="current-password" />
      </div>

      {err && <p className="err">{err}</p>}

      <button className="btn btn-iris" type="submit" disabled={stato === 'invio' || !email || !pw}>
        {stato === 'invio' ? 'Entro…' : 'Entra'}
      </button>

      <button type="button" className="btn-text"
              style={{ display: 'block', margin: '18px auto 0' }}
              onClick={() => router.push('/recupera')}>
        Password dimenticata?
      </button>

      <button type="button" className="btn-text"
              style={{ display: 'block', margin: '2px auto 0' }}
              onClick={() => router.push('/register')}>
        Non hai un account? Registrati
      </button>
    </form>
  );
}
