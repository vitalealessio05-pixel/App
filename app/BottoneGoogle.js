'use client';

import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function BottoneGoogle({ testo = 'Continua con Google' }) {
  const [carico, setCarico] = useState(false);
  const [err, setErr] = useState('');

  async function vai() {
    setErr('');
    setCarico(true);
    try {
      const { error } = await supabase().auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) throw error;
    } catch (e) {
      console.error('google oauth:', e);
      setErr('Accesso con Google non riuscito. Riprova.');
      setCarico(false);
    }
  }

  return (
    <>
      <button type="button" onClick={vai} disabled={carico}
        style={{
          width: '100%', padding: 15, marginTop: 12, background: '#fff',
          border: '2px solid var(--line)', borderRadius: 'var(--r-md)',
          fontFamily: 'inherit', fontSize: 15, fontWeight: 700, color: 'var(--void)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          cursor: carico ? 'default' : 'pointer', opacity: carico ? 0.6 : 1,
        }}>
        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
          <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.6 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.8 6.1C12.3 13.2 17.6 9.5 24 9.5z"/>
          <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 7l7.6 5.9c4.4-4.1 6.7-10.1 6.7-17.4z"/>
          <path fill="#FBBC05" d="M10.4 28.7a14.5 14.5 0 010-9.4l-7.8-6.1a24 24 0 000 21.6l7.8-6.1z"/>
          <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2.1 1.4-4.8 2.3-8.3 2.3-6.4 0-11.7-3.7-13.6-9.8l-7.8 6.1C6.5 42.6 14.6 48 24 48z"/>
        </svg>
        {carico ? 'Un attimo…' : testo}
      </button>
      {err && <p className="err">{err}</p>}
    </>
  );
}
