'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

function iniziali(nome) {
  return nome.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
}

function giorniRimasti(scadenza) {
  const ms = new Date(scadenza) - new Date();
  if (ms <= 0) return 'scaduta';
  const g = Math.floor(ms / 86400000);
  const o = Math.floor((ms % 86400000) / 3600000);
  if (g >= 1) return `${g} ${g === 1 ? 'giorno' : 'giorni'} rimasti`;
  return `${o} ore rimaste`;
}

export default function Gruppo({ gruppo, profilo, onRefresh }) {
  const [membri, setMembri] = useState([]);
  const [missione, setMissione] = useState(null);
  const [punti, setPunti] = useState(0);
  const [storico, setStorico] = useState([]);
  const [caricando, setCaricando] = useState(true);

  const carica = useCallback(async () => {
    const sb = supabase();

    const { data: m } = await sb
      .from('group_members')
      .select('user_id, profiles(id, nome)')
      .eq('group_id', gruppo.id);
    setMembri((m || []).map((x) => x.profiles).filter(Boolean));

    const { data: gm } = await sb
      .from('group_missions')
      .select('id, scadenza, stato, missions(titolo, descrizione, punti)')
      .eq('group_id', gruppo.id)
      .in('stato', ['attiva', 'in_verifica'])
      .order('assegnata_il', { ascending: false })
      .limit(1);
    setMissione(gm && gm[0] ? gm[0] : null);

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

  if (caricando) return <p className="muted">Caricamento…</p>;

  return (
    <div>
      <h1>{gruppo.nome || 'Il tuo gruppo'}</h1>
      <p className="sub">Siete in {membri.length}. Nessuno deve fare il primo passo da solo.</p>

      <div className="card">
        <div style={{ display: 'flex', marginBottom: 14 }}>
          {membri.map((m, i) => (
            <div key={m.id} style={{
              width: 38, height: 38, borderRadius: '50%', background: 'var(--ok-soft)',
              border: '2px solid #fff', marginLeft: i === 0 ? 0 : -8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 600, color: 'var(--ok)',
            }}>{iniziali(m.nome)}</div>
          ))}
        </div>
        <p className="muted" style={{ margin: 0 }}>
          {membri.map((m) => m.nome).join(' · ')}
        </p>
        {gruppo.chat_link && (
          <a href={gruppo.chat_link} target="_blank" rel="noreferrer"
             style={{ display: 'block', marginTop: 14, textAlign: 'center', padding: 12,
                      border: '1px solid var(--line)', borderRadius: 10,
                      color: 'var(--ink)', textDecoration: 'none', fontWeight: 500, fontSize: 14 }}>
            Apri la chat del gruppo
          </a>
        )}
      </div>

      <div className="card">
        <p style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.04em',
                    color: 'var(--ink-soft)', margin: '0 0 6px' }}>Punti del gruppo</p>
        <div style={{ fontSize: 32, fontWeight: 600 }}>{punti}</div>
        {storico.length > 0 && (
          <p className="muted" style={{ marginTop: 10, marginBottom: 0 }}>
            {storico.length} {storico.length === 1 ? 'missione completata' : 'missioni completate'}
          </p>
        )}
      </div>

      {missione ? (
        <Missione gm={missione} membri={membri} profilo={profilo}
                  onDone={() => { carica(); onRefresh(); }} />
      ) : (
        <div className="card">
          <h2>Nessuna missione attiva</h2>
          <p className="muted" style={{ margin: 0 }}>
            La prossima arriva a inizio settimana. Ti avvisiamo.
          </p>
        </div>
      )}
    </div>
  );
}

function Missione({ gm, membri, profilo, onDone }) {
  const [file, setFile] = useState(null);
  const [presenti, setPresenti] = useState([profilo.id]);
  const [invio, setInvio] = useState(false);
  const [err, setErr] = useState('');

  function toggle(id) {
    setPresenti((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  }

  async function invia() {
    setErr('');
    if (presenti.length < 2) {
      setErr('Servono almeno 2 persone nella foto: è la prova che vi siete incontrati.');
      return;
    }
    if (!file) { setErr('Carica la foto di gruppo.'); return; }

    setInvio(true);
    const sb = supabase();

    const path = `${gm.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
    const { error: upErr } = await sb.storage.from('prove').upload(path, file);
    if (upErr) { setErr(upErr.message); setInvio(false); return; }

    const { data: sub, error: subErr } = await sb
      .from('submissions')
      .insert({ group_mission_id: gm.id, foto_path: path, caricata_da: profilo.id })
      .select('id')
      .single();
    if (subErr) { setErr(subErr.message); setInvio(false); return; }

    const { error: presErr } = await sb
      .from('submission_presenze')
      .insert(presenti.map((uid) => ({ submission_id: sub.id, user_id: uid })));
    if (presErr) { setErr(presErr.message); setInvio(false); return; }

    await sb.from('group_missions').update({ stato: 'in_verifica' }).eq('id', gm.id);
    onDone();
  }

  if (gm.stato === 'in_verifica') {
    return (
      <div className="card">
        <p style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.04em',
                    color: 'var(--ink-soft)', margin: '0 0 8px' }}>In verifica</p>
        <h2>{gm.missions.titolo}</h2>
        <p className="muted" style={{ margin: 0 }}>
          Prova caricata. Ti diciamo a breve se è tutto a posto.
        </p>
      </div>
    );
  }

  const scaduta = new Date(gm.scadenza) < new Date();

  return (
    <div className="card">
      <p style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.04em',
                  color: scaduta ? 'var(--stamp)' : 'var(--ink-soft)', margin: '0 0 8px' }}>
        {scaduta ? 'Scaduta' : giorniRimasti(gm.scadenza)} · {gm.missions.punti} punti
      </p>
      <h2>{gm.missions.titolo}</h2>
      <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--ink-soft)', marginTop: 0 }}>
        {gm.missions.descrizione}
      </p>

      {!scaduta && (
        <>
          <label htmlFor="foto">Foto di gruppo</label>
          <input id="foto" type="file" accept="image/*" capture="environment"
                 onChange={(e) => setFile(e.target.files[0])}
                 style={{ padding: 10, fontSize: 14 }} />

          <label>Chi c'era?</label>
          <div className="chip-row">
            {membri.map((m) => (
              <button type="button" key={m.id}
                      className={presenti.includes(m.id) ? 'chip sel' : 'chip'}
                      onClick={() => toggle(m.id)}>
                {m.nome}
              </button>
            ))}
          </div>
          <p className="hint">I punti vanno solo a chi c'era davvero. Minimo 2 persone.</p>

          {err && <p className="err">{err}</p>}

          <button className="btn" onClick={invia} disabled={invio}>
            {invio ? 'Carico…' : 'Carica la prova'}
          </button>
        </>
      )}

      {scaduta && (
        <p className="muted" style={{ margin: 0 }}>
          Questa settimana non ce l'avete fatta. La prossima si riparte.
        </p>
      )}
    </div>
  );
}
