'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import Attesa from './Attesa';
import Gruppo from './Gruppo';

export default function Home() {
  const router = useRouter();
  const [profilo, setProfilo] = useState(null);
  const [gruppo, setGruppo] = useState(null);
  const [inAttesa, setInAttesa] = useState(0);
  const [caricando, setCaricando] = useState(true);

  const carica = useCallback(async () => {
    const sb = supabase();
    const { data: { session } } = await sb.auth.getSession();
    if (!session) { router.replace('/login'); return; }

    const { data: p } = await sb.from('profiles').select('*').eq('id', session.user.id).maybeSingle();
    if (!p) { router.replace('/onboarding'); return; }
    setProfilo(p);

    const { data: membri } = await sb
      .from('group_members')
      .select('group_id, groups(id, nome, chat_link, stato, segment_key)')
      .eq('user_id', session.user.id);

    const attivo = (membri || []).map((m) => m.groups).find((g) => g && g.stato === 'attivo');

    if (attivo) {
      setGruppo(attivo);
    } else {
      const { data: n } = await sb.rpc('conta_in_attesa', { seg: p.segment_key });
      setInAttesa(n || 1);
    }
    setCaricando(false);
  }, [router]);

  useEffect(() => { carica(); }, [carica]);

  async function esci() {
    await supabase().auth.signOut();
    router.replace('/');
  }

  if (caricando) return <p className="muted">Caricamento…</p>;

  return (
    <div>
      <div className="brand">Missio</div>
      {gruppo
        ? <Gruppo gruppo={gruppo} profilo={profilo} onRefresh={carica} />
        : <Attesa profilo={profilo} inAttesa={inAttesa} />}

      {profilo?.is_admin && (
        <button className="btn-ghost" onClick={() => router.push('/admin')}>
          Pannello admin
        </button>
      )}
      <button className="btn-ghost" onClick={esci}>Esci</button>
    </div>
  );
}
