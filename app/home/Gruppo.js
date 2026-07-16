'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

const COLORI = ['var(--iris)', 'var(--coral)', 'var(--mint)', 'var(--sun)'];

function iniziali(nome) {
  return nome.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
}

function rimasto(scadenza) {
  const ms = new Date(scadenza) - new Date();
  if (ms <= 0) return null;
  const g = Math.floor(ms / 86400000);
  const o = Math.floor((ms % 86400000) / 3600000);
  if (g >= 1) return `${g}g ${o}h`;
  return `${o}h`;
}

export default function Gruppo({ gruppo, profilo, onRefresh }) {
  const [membri, setMembri] = useState([]);
  const [missione, setMissione] = useState(null);
  const [motivoRifiuto, setMotivoRifiuto] = useState(null);
  const [punti, setPunti] = useState(0);
  const [storico, setStorico] = useState([]);
  const [caricando, setCaricando] = useState(true);

  if (!profilo || !gruppo) return <p className="muted">Un attimo…</p>;

  const carica = useCallback(async () => {
    const sb = supabase();

    const { data: m } = await sb
      .from('group_members')
      .select('user_id, profiles(id, nome, citta_provenienza)')
      .eq('group_id', gruppo.id);
    setMembri((m || []).map((x) => x.profiles).filter(Boolean));

    const { data: gm } = await sb
      .from('group_missions')
      .select('id, scadenza, stato, missions(titolo, descrizione, punti, virtuale)')
      .eq('group_id', gruppo.id)
      .in('stato', ['attiva', 'in_verifica'])
      .order('assegnata_il', { ascending: false })
      .limit(1);
    const missioneAttuale = gm && gm[0] ? gm[0] : null;
    setMissione(missioneAttuale);

    if (missioneAttuale && missioneAttuale.stato === 'attiva') {
      const { data: rifiutate } = await sb
        .from('submissions')
        .select('nota_admin, created_at')
        .eq('group_mission_id', missioneAttuale.id)
        .eq('stato', 'rifiutata')
        .order('created_at', { ascending: false })
        .limit(1);
      setMotivoRifiuto(rifiutate && rifiutate[0] ? rifiutate[0].nota_admin : null);
    } else {
      setMotivoRifiuto(null);
    }

    const { data: pl } = await sb
      .from('points_ledger')
      .select('punti, motivo, created_at')
      .eq('group_id', gruppo.id)
      .order('created_at', { ascending: false });
    setStorico(pl || []);
    setPunti((pl || []).reduce((s, r) => s + r.punti, 0));

    setCaricando(false);
  }, [gruppo.id]);

  useEffect(() => { carica(); }, [carica]);

  if (caricando) return <p className="muted">Un attimo…</p>;

  return (
    <div>
      <p className="eyebrow">Il tuo gruppo</p>
      <h1 className="display" style={{ marginTop: 10 }}>{gruppo.nome || 'Siete un gruppo.'}</h1>

      <div className="card d1">
        <div style={{ display: 'flex', marginBottom: 16 }}>
          {membri.map((m, i) => (
            <div key={m.id} style={{
              width: 46, height: 46, borderRadius: '50%', background: COLORI[i % 4],
              border: '3px solid var(--card)', marginLeft: i === 0 ? 0 : -12,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 800, color: '#fff',
              animation: `rise .4s var(--spring) ${i * 0.08}s both`,
            }}>{iniziali(m.nome)}</div>
          ))}
        </div>
        <p style={{ margin: 0, fontSize: 15, fontWeight: 700, lineHeight: 1.5 }}>
          {membri.map((m) => m.citta_provenienza ? `${m.nome} (${m.citta_provenienza})` : m.nome).join(' · ')}
        </p>

        {gruppo.chat_link && (
          <a href={gruppo.chat_link} target="_blank" rel="noreferrer"
             style={{ display: 'block', marginTop: 18, textAlign: 'center', padding: 15,
                      background: 'var(--iris-soft)', borderRadius: 'var(--r-md)',
                      color: 'var(--iris)', textDecoration: 'none', fontWeight: 800, fontSize: 15 }}>
            Apri la chat del gruppo →
          </a>
        )}
      </div>

      <div className="card card-iris d2" style={{ display: 'flex', alignItems: 'center',
                                                   justifyContent: 'space-between' }}>
        <div>
          <p className="eyebrow" style={{ color: 'rgba(255,255,255,.6)' }}>Punti del gruppo</p>
          <div className="display" style={{ fontSize: 42, marginTop: 6 }}>{punti}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="display" style={{ fontSize: 26 }}>{storico.length}</div>
          <p style={{ fontSize: 12, opacity: .7, margin: 0, fontWeight: 700 }}>
            {storico.length === 1 ? 'missione' : 'missioni'}
          </p>
        </div>
      </div>

      {missione ? (
        <Missione gm={missione} membri={membri} profilo={profilo} motivoRifiuto={motivoRifiuto}
                  onDone={() => { carica(); onRefresh(); }} />
      ) : (
        <div className="card d3">
          <h2 className="display" style={{ fontSize: 20 }}>Niente da fare. Per ora.</h2>
          <p className="muted" style={{ margin: '10px 0 0', lineHeight: 1.5 }}>
            La prossima missione arriva a inizio settimana. Ti avvisiamo.
          </p>
        </div>
      )}
    </div>
  );
}

function Missione({ gm, membri, profilo, motivoRifiuto, onDone }) {
  const [file, setFile] = useState(null);
  const [anteprima, setAnteprima] = useState(null);
  const [presenti, setPresenti] = useState([profilo.id]);
  const [invio, setInvio] = useState(false);
  const [invioVirtuale, setInvioVirtuale] = useState(false);
  const [err, setErr] = useState('');

  async function completaVirtuale() {
    setErr('');
    setInvioVirtuale(true);
    try {
      const sb = supabase();
      const { data, error } = await sb.rpc('completa_missione_virtuale', { gm_id: gm.id });
      if (error) throw error;
      if (!data?.ok) {
        setErr(data?.motivo || 'Non è riuscito. Riprova.');
        setInvioVirtuale(false);
        return;
      }
      onDone();
    } catch (e) {
      console.error(e);
      setErr('Non è riuscito. Riprova.');
      setInvioVirtuale(false);
    }
  }

  function scegli(e) {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setAnteprima(URL.createObjectURL(f));
  }

  function toggle(id) {
    setPresenti((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  }

  async function invia() {
    setErr('');
    if (presenti.length < 2) {
      setErr('Servono almeno 2 persone: è la prova che vi siete incontrati.');
      return;
    }
    if (!file) { setErr('Manca la foto.'); return; }

    setInvio(true);
    try {
      const sb = supabase();
      const path = `${gm.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;

      const { error: upErr } = await sb.storage.from('prove').upload(path, file);
      if (upErr) throw upErr;

      const { data: sub, error: subErr } = await sb
        .from('submissions')
        .insert({ group_mission_id: gm.id, foto_path: path, caricata_da: profilo.id })
        .select('id')
        .single();
      if (subErr) throw subErr;

      const { error: presErr } = await sb
        .from('submission_presenze')
        .insert(presenti.map((uid) => ({ submission_id: sub.id, user_id: uid })));
      if (presErr) throw presErr;

      await sb.from('group_missions').update({ stato: 'in_verifica' }).eq('id', gm.id);
      onDone();
    } catch (e) {
      console.error(e);
      setErr('Il caricamento non è riuscito. Riprova.');
      setInvio(false);
    }
  }

  if (gm.stato === 'in_verifica') {
    return (
      <div className="card d3" style={{ background: 'var(--mint-soft)', textAlign: 'center' }}>
        <div className="stamp" style={{ borderColor: 'var(--mint)', color: 'var(--mint)',
                                        margin: '4px auto 18px' }}>
          In<br />verifica
        </div>
        <h2 className="display" style={{ fontSize: 20 }}>{gm.missions.titolo}</h2>
        <p className="muted" style={{ margin: '10px 0 0' }}>
          Prova caricata. Ti diciamo a breve se è tutto a posto.
        </p>
      </div>
    );
  }

  const r = rimasto(gm.scadenza);
  const scaduta = !r;

  if (scaduta) {
    return (
      <div className="card d3">
        <p className="eyebrow" style={{ color: 'var(--coral)' }}>Scaduta</p>
        <h2 className="display" style={{ fontSize: 20, marginTop: 8 }}>{gm.missions.titolo}</h2>
        <p className="muted" style={{ margin: '10px 0 0', lineHeight: 1.5 }}>
          Questa settimana non ce l’avete fatta. La prossima si riparte, senza rancore.
        </p>
      </div>
    );
  }

  if (gm.missions.virtuale) {
    return (
      <div className="card d3" style={{ background: 'var(--iris)', color: '#fff' }}>
        <p className="eyebrow" style={{ color: 'rgba(255,255,255,.7)' }}>Missione veloce</p>
        <h2 className="display" style={{ fontSize: 24, marginTop: 10 }}>{gm.missions.titolo}</h2>
        <p style={{ fontSize: 15, lineHeight: 1.55, opacity: .88, marginTop: 10 }}>
          {gm.missions.descrizione}
        </p>
        <p style={{ fontSize: 13, fontWeight: 800, opacity: .8, margin: '0 0 4px' }}>
          +{gm.missions.punti} punti al gruppo
        </p>

        {err && <p className="err" style={{ color: '#fff' }}>{err}</p>}

        <button className="btn" onClick={completaVirtuale} disabled={invioVirtuale}
                style={{ background: '#fff', color: 'var(--iris)',
                         boxShadow: '0 6px 0 -1px rgba(0,0,0,.18)' }}>
          {invioVirtuale ? 'Un attimo…' : 'Fatto!'}
        </button>
        <p className="hint" style={{ color: 'rgba(255,255,255,.6)', textAlign: 'center', marginTop: 10 }}>
          Basta un tap di uno del gruppo, niente foto.
        </p>
      </div>
    );
  }

  return (
    <>
      {motivoRifiuto && (
        <div className="card d3" style={{ background: 'var(--coral-soft)' }}>
          <p style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 800, textTransform: 'uppercase',
                     letterSpacing: '.05em', color: 'var(--coral)' }}>
            La foto di prima non è passata
          </p>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: 'var(--ink)' }}>
            {motivoRifiuto}
          </p>
        </div>
      )}
    <div className="card d3" style={{ background: 'var(--coral)', color: '#fff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p className="eyebrow" style={{ color: 'rgba(255,255,255,.7)' }}>Missione della settimana</p>
        <span style={{ background: 'rgba(255,255,255,.2)', padding: '5px 11px',
                       borderRadius: 'var(--r-full)', fontSize: 12, fontWeight: 800 }}>
          {r}
        </span>
      </div>

      <h2 className="display" style={{ fontSize: 26, marginTop: 12 }}>{gm.missions.titolo}</h2>
      <p style={{ fontSize: 15, lineHeight: 1.55, opacity: .88, marginTop: 10 }}>
        {gm.missions.descrizione}
      </p>
      <p style={{ fontSize: 13, fontWeight: 800, opacity: .8, margin: '0 0 4px' }}>
        +{gm.missions.punti} punti al gruppo
      </p>

      <div style={{ background: 'rgba(255,255,255,.14)', borderRadius: 'var(--r-md)',
                    padding: 18, marginTop: 20 }}>
        <label style={{ color: 'rgba(255,255,255,.75)', margin: '0 0 10px' }}>La prova</label>

        <label htmlFor="foto" style={{
          display: 'block', textAlign: 'center', padding: anteprima ? 0 : '26px 16px',
          background: 'rgba(255,255,255,.16)', borderRadius: 'var(--r-sm)',
          border: '2px dashed rgba(255,255,255,.4)', cursor: 'pointer', color: '#fff',
          margin: 0, textTransform: 'none', letterSpacing: 0, fontSize: 14, overflow: 'hidden',
        }}>
          {anteprima
            ? <img src={anteprima} alt="" style={{ width: '100%', display: 'block', maxHeight: 220,
                                                    objectFit: 'cover' }} />
            : <>Scatta o carica la foto di gruppo</>}
        </label>
        <input id="foto" type="file" accept="image/*" capture="environment"
               onChange={scegli} style={{ display: 'none' }} />

        <label style={{ color: 'rgba(255,255,255,.75)', marginTop: 20 }}>Chi c’era?</label>
        <div className="chip-row">
          {membri.map((m) => (
            <button type="button" key={m.id} onClick={() => toggle(m.id)}
                    className="chip"
                    style={presenti.includes(m.id)
                      ? { background: '#fff', color: 'var(--coral)', borderColor: '#fff', transform: 'scale(1.04)' }
                      : { background: 'transparent', color: 'rgba(255,255,255,.8)',
                          borderColor: 'rgba(255,255,255,.4)' }}>
              {m.nome}
            </button>
          ))}
        </div>
        <p style={{ fontSize: 12.5, opacity: .75, marginTop: 10, marginBottom: 0 }}>
          I punti vanno solo a chi c’era. Minimo 2 persone.
        </p>
      </div>

      {err && <p className="err" style={{ color: '#fff' }}>{err}</p>}

      <button className="btn" onClick={invia} disabled={invio}
              style={{ background: '#fff', color: 'var(--coral)', boxShadow: '0 6px 0 -1px rgba(0,0,0,.18)' }}>
        {invio ? 'Carico…' : 'Consegna la prova'}
      </button>
    </div>
    </>
  );
}
