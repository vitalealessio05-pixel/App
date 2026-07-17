'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import Attesa from './Attesa';
import Gruppo from './Gruppo';
import Notifiche from '../Notifiche';
import BrandMark from '../BrandMark';
import InstallaApp from '../InstallaApp';

export default function Home() {
  const router = useRouter();
  const [profilo, setProfilo] = useState(null);
  const [gruppo, setGruppo] = useState(null);
  const [inAttesa, setInAttesa] = useState(0);
  const [caricando, setCaricando] = useState(true);

  const carica = useCallback(async () => {
    try {
      const sb = supabase();
      const { data: { session } } = await sb.auth.getSession();
      if (!session) { router.replace('/login'); return; }

      const { data: p } = await sb.from('profiles').select('*').eq('id', session.user.id).maybeSingle();
      if (!p) { router.replace('/onboarding'); return; }
      if (p.is_admin) { router.replace('/admin'); return; }
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
    } catch (e) {
      console.error(e);
    } finally {
      setCaricando(false);
    }
  }, [router]);

  useEffect(() => { carica(); }, [carica]);

  async function esci() {
    await supabase().auth.signOut();
    router.replace('/');
  }

  if (caricando) {
    return (
      <div>
        <div className="brand"><BrandMark />Maisola</div>
        <p className="muted">Un attimo…</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="brand" style={{ marginBottom: 0 }}><BrandMark />Maisola</div>
        <button className="btn-text" onClick={() => router.push('/profilo')}>Profilo</button>
      </div>

      <InstallaApp />
      <Notifiche urgente={!gruppo} />

      <div style={{ marginTop: 16 }}>
        {gruppo
          ? <Gruppo gruppo={gruppo} profilo={profilo} onRefresh={carica} />
          : <Attesa profilo={profilo} inAttesa={inAttesa} />}
      </div>
    </div>
  );
}
