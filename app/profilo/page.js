'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

function dataIt(s) {
  try {
    return new Date(s).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch (e) { return ''; }
}

export default function Profilo() {
  const router = useRouter();
  const [profilo, setProfilo] = useState(null);
  const [gruppi, setGruppi] = useState([]);
  const [puntiMiei, setPuntiMiei] = useState(0);
  const [missioniFatte, setMissioniFatte] = useState([]);
  const [caricando, setCaricando] = useState(true);

  const carica = useCallback(async () => {
    try {
      const sb = supabase();
      const { data: { session } } = await sb.auth.getSession();
      if (!session) { router.replace('/login'); return; }
      const uid = session.user.id;

      const { data: p } = await sb.from('profiles').select('*').eq('id', uid).maybeSingle();
      if (!p) { router.replace('/onboarding'); return; }
      setProfilo(p);

      const { data: gm } = await sb
        .from('group_members')
        .select('groups(id, nome, stato, created_at, segment_key)')
        .eq('user_id', uid);
      setGruppi((gm || []).map((x) => x.groups).filter(Boolean));

      // punti personali: solo le missioni in cui risultavo presente e approvate
      const { data: pres } = await sb
        .from('submission_presenze')
        .select('submissions(stato, created_at, group_missions(missions(titolo, punti)))')
        .eq('user_id', uid);

      const approvate = (pres || [])
        .map((x) => x.submissions)
        .filter((s) => s && s.stato === 'approvata');

      setMissioniFatte(approvate);
      setPuntiMiei(
        approvate.reduce((tot, s) => tot + (s.group_missions?.missions?.punti || 0), 0)
      );
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
        <div className="brand"><span className="brand-dot" />Maisola</div>
        <p className="muted">Un attimo…</p>
      </div>
    );
  }

  const attivi = gruppi.filter((g) => g.stato === 'attivo');
  const passati = gruppi.filter((g) => g.stato !== 'attivo');

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="brand" style={{ marginBottom: 0 }}><span className="brand-dot" />Maisola</div>
        <button className="btn-text" onClick={() => router.push('/home')}>Indietro</button>
      </div>

      <p className="eyebrow" style={{ marginTop: 34 }}>Il tuo profilo</p>
      <h1 className="display" style={{ marginTop: 10 }}>{profilo.nome}</h1>
      <p className="sub">{profilo.corso} · {profilo.campus} · {profilo.ateneo}</p>

      <div className="card card-iris d1" style={{ display: 'flex', alignItems: 'center',
                                                   justifyContent: 'space-between' }}>
        <div>
          <p className="eyebrow" style={{ color: 'rgba(255,255,255,.6)' }}>I tuoi punti</p>
          <div className="display" style={{ fontSize: 46, marginTop: 6 }}>{puntiMiei}</div>
          <p style={{ fontSize: 12, opacity: .7, margin: '4px 0 0', fontWeight: 700 }}>
            solo dalle missioni in cui c’eri
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="display" style={{ fontSize: 28 }}>{missioniFatte.length}</div>
          <p style={{ fontSize: 12, opacity: .7, margin: 0, fontWeight: 700 }}>
            {missioniFatte.length === 1 ? 'missione' : 'missioni'}
          </p>
        </div>
      </div>

      <div className="card d2" style={{ background: 'var(--sun-soft)' }}>
        <p className="eyebrow" style={{ color: 'var(--sun-text)' }}>Presto</p>
        <p className="muted" style={{ margin: '8px 0 0', lineHeight: 1.5, color: 'var(--sun-text)' }}>
          I punti serviranno a sbloccare sconti nei locali vicino al campus. Intanto accumulali:
          restano tutti sul tuo profilo.
        </p>
      </div>

      <h2 className="display" style={{ fontSize: 20, marginTop: 32, marginBottom: 12 }}>
        I tuoi gruppi ({gruppi.length})
      </h2>

      {gruppi.length === 0 && (
        <div className="card d3">
          <p className="muted" style={{ margin: 0 }}>
            Non sei ancora in nessun gruppo. Appena siete abbastanza nel tuo corso, ci pensiamo noi.
          </p>
        </div>
      )}

      {attivi.map((g) => (
        <div className="card d3" key={g.id}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ margin: 0, fontWeight: 800, fontSize: 15 }}>{g.nome}</p>
              <p className="muted" style={{ margin: '4px 0 0', fontSize: 13 }}>
                dal {dataIt(g.created_at)}
              </p>
            </div>
            <span style={{ background: 'var(--mint-soft)', color: 'var(--mint)',
                           padding: '5px 11px', borderRadius: 'var(--r-full)',
                           fontSize: 11, fontWeight: 800 }}>
              ATTIVO
            </span>
          </div>
        </div>
      ))}

      {passati.map((g) => (
        <div className="card d3" key={g.id} style={{ opacity: .65 }}>
          <p style={{ margin: 0, fontWeight: 800, fontSize: 15 }}>{g.nome}</p>
          <p className="muted" style={{ margin: '4px 0 0', fontSize: 13 }}>
            {dataIt(g.created_at)} · concluso
          </p>
        </div>
      ))}

      {missioniFatte.length > 0 && (
        <>
          <h2 className="display" style={{ fontSize: 20, marginTop: 32, marginBottom: 12 }}>
            Missioni completate
          </h2>
          <div className="card d3">
            {missioniFatte.map((s, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 0',
                borderBottom: i < missioniFatte.length - 1 ? '1px solid var(--line)' : 'none',
              }}>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>
                    {s.group_missions?.missions?.titolo}
                  </p>
                  <p className="muted" style={{ margin: '2px 0 0', fontSize: 12 }}>
                    {dataIt(s.created_at)}
                  </p>
                </div>
                <span style={{ fontWeight: 800, color: 'var(--mint)', fontSize: 14 }}>
                  +{s.group_missions?.missions?.punti}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      <button className="btn-ghost" style={{ marginTop: 24 }} onClick={esci}>Esci</button>
    </div>
  );
}
