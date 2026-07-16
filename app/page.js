'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';

export default function Page() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function check() {
      const sb = supabase();
      const { data: { session } } = await sb.auth.getSession();
      if (!session) { setLoading(false); return; }

      const { data: profile } = await sb
        .from('profiles')
        .select('id')
        .eq('id', session.user.id)
        .maybeSingle();

      router.replace(profile ? '/home' : '/onboarding');
    }
    check();
  }, [router]);

  if (loading) return <p className="muted">Caricamento…</p>;

  return (
    <div>
      <div className="brand">Missio</div>
      <h1>La tua città inizia qui</h1>
      <p className="sub">
        Ti mettiamo in un piccolo gruppo del tuo corso. Ogni settimana, una missione
        da fare insieme. Nessuno deve fare il primo passo da solo.
      </p>

      <div className="card">
        <h2>Come funziona</h2>
        <p className="muted" style={{ lineHeight: 1.6 }}>
          1. Ti iscrivi con il tuo corso.<br />
          2. Appena siete abbastanza, ti mettiamo in un gruppo di 3–4 persone.<br />
          3. Ogni settimana il gruppo riceve una missione da fare in città.<br />
          4. Foto di gruppo come prova, punti per tutti quelli che c'erano.
        </p>
      </div>

      <button className="btn" onClick={() => router.push('/login')}>
        Iscriviti
      </button>
    </div>
  );
}
