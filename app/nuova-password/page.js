'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import CampoPassword from '../CampoPassword';

export default function NuovaPassword() {
  const router = useRouter();
  const [pronto, setPronto] = useState(false);
  const [valida, setValida] = useState(false);
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [salvo, setSalvo] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    async function check() {
      const sb = supabase();
      const { data: { session } } = await sb.auth.getSession();
      setValida(!!session);
      setPronto(true);
    }
    const t = setTimeout(check, 600);
    return () => clearTimeout(t);
  }, []);

  const pwOk = pw.length >= 8;
  const combaciano = pw && pw === pw2;

  async function salva(e) {
    e.preventDefault();
    setErr('');
    if (!pwOk) { setErr('Almeno 8 caratteri.'); return; }
    if (!combaciano) { setErr('Le due password non sono uguali.'); return; }

    setSalvo(true);
    try {
      const { error } = await supabase().auth.updateUser({ password: pw });
      if (error) throw error;
      router.replace('/home');
    } catch (e) {
      console.error(e);
      setErr('Non è riuscito. Riprova.');
      setSalvo(false);
    }
  }

  if (!pronto) return <p className="muted">Un attimo…</p>;

  if (!valida) {
    return (
      <div>
        <div className="brand"><span className="brand-dot" />Maisola</div>
        <h1 className="display" style={{ marginTop: 40 }}>Link<br />scaduto.</h1>
        <p className="sub">
          Questo link non è più valido, oppure lo stai aprendo da un dispositivo diverso da
          quello dove hai chiesto il recupero.
        </p>
        <button className="btn" onClick={() => router.push('/recupera')}>Chiedine un altro</button>
      </div>
    );
  }

  return (
    <form onSubmit={salva}>
      <div className="brand"><span className="brand-dot" />Maisola</div>

      <p className="eyebrow" style={{ marginTop: 40 }}>Ci siamo</p>
      <h1 className="display" style={{ marginTop: 10 }}>Scegli<br />la nuova.</h1>
      <p className="sub">Da adesso entri con questa.</p>

      <div className="card d1">
        <label htmlFor="pw" style={{ marginTop: 0 }}>Nuova password</label>
        <CampoPassword id="pw" value={pw} onChange={(e) => setPw(e.target.value)}
                       placeholder="Almeno 8 caratteri" autoComplete="new-password" />

        <label htmlFor="pw2">Ripetila</label>
        <CampoPassword id="pw2" value={pw2} onChange={(e) => setPw2(e.target.value)}
                       placeholder="La stessa di sopra" autoComplete="new-password" />
      </div>

      {err && <p className="err">{err}</p>}

      <button className="btn btn-iris" type="submit"
              disabled={salvo || !pwOk || !combaciano}>
        {salvo ? 'Salvo…' : 'Salva la password'}
      </button>
    </form>
  );
}
