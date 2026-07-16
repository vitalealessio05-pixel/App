'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import CampoPassword from '../CampoPassword';
import BottoneGoogle from '../BottoneGoogle';

export default function Register() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [stato, setStato] = useState('idle');
  const [err, setErr] = useState('');

  const pwOk = pw.length >= 8;
  const combaciano = pw && pw === pw2;
  const completo = email && pwOk && combaciano;

  async function invia(e) {
    e.preventDefault();
    setErr('');

    if (!pwOk) { setErr('La password deve essere di almeno 8 caratteri.'); return; }
    if (!combaciano) { setErr('Le due password non sono uguali.'); return; }

    setStato('invio');

    try {
      const { data, error } = await supabase().auth.signUp({
        email: email.trim().toLowerCase(),
        password: pw,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });

      if (error) {
        const m = (error.message || '').toLowerCase();
        if (m.includes('already registered') || m.includes('already been registered')) {
          setErr('Questa mail è già registrata. Vai su Accedi.');
        } else if (m.includes('rate limit') || error.status === 429) {
          setErr('Non riusciamo a mandare la mail in questo momento. Riprova tra un’ora.');
        } else if (m.includes('password')) {
          setErr('Password troppo debole. Prova con qualcosa di più lungo.');
        } else {
          console.error('signUp:', error);
          setErr('Registrazione non riuscita. Riprova.');
        }
        setStato('idle');
        return;
      }

      if (data?.session) {
        router.replace('/onboarding');
        return;
      }

      setStato('inviato');
    } catch (e) {
      console.error(e);
      setErr('Qualcosa non ha funzionato. Riprova.');
      setStato('idle');
    }
  }

  if (stato === 'inviato') {
    return (
      <div>
        <div className="brand"><span className="brand-dot" />Maisola</div>
        <div className="card card-coral" style={{ marginTop: 30, padding: 30 }}>
          <div className="stamp" style={{ borderColor: '#fff', color: '#fff', marginBottom: 22 }}>
            Quasi<br />dentro
          </div>
          <h1 className="display" style={{ fontSize: 30 }}>Confermi<br />e basta.</h1>
          <p style={{ fontSize: 15, lineHeight: 1.55, opacity: .88, marginTop: 14, marginBottom: 0 }}>
            Ti abbiamo mandato un link a <b>{email}</b>. Aprilo una volta sola, da questo telefono.
            Da lì in poi entri con la tua password: niente più mail da aspettare.
          </p>
        </div>
        <p className="hint" style={{ textAlign: 'center' }}>Non arriva? Controlla lo spam.</p>
        <button className="btn-ghost" onClick={() => router.push('/login')}>
          Ho già confermato — accedi
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={invia}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="brand" style={{ marginBottom: 0 }}><span className="brand-dot" />Maisola</div>
        <button type="button" className="btn-text" onClick={() => router.push('/')}>Indietro</button>
      </div>

      <p className="eyebrow" style={{ marginTop: 40 }}>Nuovo qui</p>
      <h1 className="display" style={{ marginTop: 10 }}>Registrati.</h1>
      <p className="sub">
        Un tap con Google, oppure mail e password.
      </p>

      <BottoneGoogle testo="Registrati con Google" />

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '22px 0 4px' }}>
        <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)',
                       letterSpacing: '.1em' }}>OPPURE</span>
        <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
      </div>

      <div className="card d1">
        <label htmlFor="email" style={{ marginTop: 0 }}>Email</label>
        <input id="email" type="email" required value={email} autoComplete="email"
               onChange={(e) => setEmail(e.target.value)}
               placeholder="nome@studenti.uniroma1.it" />
        <p className="hint">Se ne hai una dell’università, usa quella.</p>

        <label htmlFor="pw">Password</label>
        <CampoPassword id="pw" value={pw} onChange={(e) => setPw(e.target.value)}
                       placeholder="Almeno 8 caratteri" autoComplete="new-password" />

        <label htmlFor="pw2">Ripeti la password</label>
        <CampoPassword id="pw2" value={pw2} onChange={(e) => setPw2(e.target.value)}
                       placeholder="La stessa di sopra" autoComplete="new-password" />

        {pw && (
          <div style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 800,
                           color: pwOk ? 'var(--mint)' : 'var(--muted)' }}>
              {pwOk ? '✓ lunghezza ok' : `${pw.length}/8 caratteri`}
            </span>
            {pw2 && (
              <span style={{ fontSize: 12, fontWeight: 800,
                             color: combaciano ? 'var(--mint)' : 'var(--coral)' }}>
                {combaciano ? '✓ combaciano' : '✕ non combaciano'}
              </span>
            )}
          </div>
        )}
      </div>

      {err && <p className="err">{err}</p>}

      <button className="btn btn-coral" type="submit" disabled={stato === 'invio' || !completo}>
        {stato === 'invio' ? 'Creo l’account…' : 'Crea il mio account'}
      </button>

      <p style={{ textAlign: 'center', fontSize: 11.5, color: 'var(--muted)', marginTop: 14 }}>
        Creando l'account accetti i <a href="/termini" style={{ color: 'inherit' }}>Termini</a> e la{' '}
        <a href="/privacy" style={{ color: 'inherit' }}>Privacy</a>.
      </p>

      <button type="button" className="btn-text"
              style={{ display: 'block', margin: '8px auto 0' }}
              onClick={() => router.push('/login')}>
        Hai già un account? Accedi
      </button>
    </form>
  );
}
