'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

export default function Admin() {
  const router = useRouter();
  const [ok, setOk] = useState(false);
  const [attesa, setAttesa] = useState([]);
  const [gruppi, setGruppi] = useState([]);
  const [missioni, setMissioni] = useState([]);
  const [daVerificare, setDaVerificare] = useState([]);
  const [sel, setSel] = useState([]);
  const [msg, setMsg] = useState('');

  const carica = useCallback(async () => {
    const sb = supabase();
    const { data: { session } } = await sb.auth.getSession();
    if (!session) { router.replace('/login'); return; }

    const { data: me } = await sb.from('profiles').select('is_admin').eq('id', session.user.id).maybeSingle();
    if (!me?.is_admin) { router.replace('/home'); return; }
    setOk(true);

    const { data: tutti } = await sb
      .from('profiles')
      .select('id, nome, ateneo, campus, corso, anno, disponibilita, conosce_nome, segment_key, created_at')
      .order('created_at');

    const { data: membri } = await sb.from('group_members').select('user_id, groups(stato)');
    const occupati = new Set(
      (membri || []).filter((m) => m.groups?.stato === 'attivo').map((m) => m.user_id)
    );
    setAttesa((tutti || []).filter((p) => !occupati.has(p.id)));

    const { data: g } = await sb
      .from('groups')
      .select('id, nome, segment_key, stato, chat_link, group_members(user_id, profiles(nome))')
      .eq('stato', 'attivo');
    setGruppi(g || []);

    const { data: ms } = await sb.from('missions').select('*').eq('attiva', true);
    setMissioni(ms || []);

    const { data: subs } = await sb
      .from('submissions')
      .select('id, foto_path, stato, created_at, group_missions(id, group_id, missions(titolo, punti)), submission_presenze(user_id, profiles(nome))')
      .eq('stato', 'in_verifica');
    setDaVerificare(subs || []);
  }, [router]);

  useEffect(() => { carica(); }, [carica]);

  function toggleSel(id) {
    setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  async function creaGruppo() {
    if (sel.length < 2 || sel.length > 4) { setMsg('Seleziona da 2 a 4 persone.'); return; }
    const sb = supabase();
    const primo = attesa.find((p) => p.id === sel[0]);

    const { data: g, error } = await sb
      .from('groups')
      .insert({ segment_key: primo.segment_key, nome: `Gruppo ${primo.corso}` })
      .select('id')
      .single();
    if (error) { setMsg(error.message); return; }

    await sb.from('group_members').insert(sel.map((uid) => ({ group_id: g.id, user_id: uid })));
    setSel([]);
    setMsg('Gruppo creato.');
    carica();
  }

  async function assegna(groupId, missionId) {
    const sb = supabase();
    const scadenza = new Date(Date.now() + 4 * 86400000).toISOString();
    const { error } = await sb.from('group_missions').insert({ group_id: groupId, mission_id: missionId, scadenza });
    setMsg(error ? error.message : 'Missione assegnata.');
    carica();
  }

  async function salvaChat(groupId, link) {
    await supabase().from('groups').update({ chat_link: link }).eq('id', groupId);
    setMsg('Link chat salvato.');
    carica();
  }

  async function approva(sub) {
    const sb = supabase();
    const presenti = sub.submission_presenze?.length || 0;
    if (presenti < 2) { setMsg('Meno di 2 presenti: non approvabile.'); return; }

    await sb.from('submissions').update({ stato: 'approvata' }).eq('id', sub.id);
    await sb.from('group_missions').update({ stato: 'approvata' }).eq('id', sub.group_missions.id);
    await sb.from('points_ledger').insert({
      group_id: sub.group_missions.group_id,
      submission_id: sub.id,
      punti: sub.group_missions.missions.punti,
      motivo: sub.group_missions.missions.titolo,
    });
    setMsg('Approvata, punti assegnati.');
    carica();
  }

  async function rifiuta(sub) {
    const sb = supabase();
    await sb.from('submissions').update({ stato: 'rifiutata' }).eq('id', sub.id);
    await sb.from('group_missions').update({ stato: 'attiva' }).eq('id', sub.group_missions.id);
    setMsg('Rifiutata, la missione torna attiva.');
    carica();
  }

  async function vediFoto(path) {
    const { data } = await supabase().storage.from('prove').createSignedUrl(path, 300);
    if (data?.signedUrl) window.open(data.signedUrl, '_blank');
  }

  if (!ok) return <p className="muted">Controllo permessi…</p>;

  const perSegmento = attesa.reduce((acc, p) => {
    (acc[p.segment_key] = acc[p.segment_key] || []).push(p);
    return acc;
  }, {});

  return (
    <div>
      <div className="brand">Missio · admin</div>
      {msg && <p className="ok-msg">{msg}</p>}

      <h2>In attesa ({attesa.length})</h2>
      <p className="sub">Seleziona 3–4 persone dello stesso segmento e crea il gruppo.</p>

      {Object.entries(perSegmento).map(([seg, persone]) => (
        <div className="card" key={seg}>
          <p style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.04em',
                      color: 'var(--ink-soft)', margin: '0 0 12px' }}>
            {persone[0].corso} · {persone[0].campus} — {persone.length} in attesa
          </p>
          {persone.map((p) => (
            <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10,
                                       textTransform: 'none', margin: '0 0 10px',
                                       fontSize: 14, fontWeight: 400, color: 'var(--ink)' }}>
              <input type="checkbox" checked={sel.includes(p.id)} onChange={() => toggleSel(p.id)}
                     style={{ width: 18, height: 18, flex: 'none' }} />
              <span>
                {p.nome} · {p.disponibilita} · {p.anno}° anno
                {p.conosce_nome && (
                  <span style={{ color: 'var(--stamp)' }}> — conosce: {p.conosce_nome}</span>
                )}
              </span>
            </label>
          ))}
        </div>
      ))}

      {sel.length > 0 && (
        <button className="btn" onClick={creaGruppo}>
          Crea gruppo con {sel.length} {sel.length === 1 ? 'persona' : 'persone'}
        </button>
      )}

      <h2 style={{ marginTop: 40 }}>Gruppi attivi ({gruppi.length})</h2>
      {gruppi.map((g) => (
        <div className="card" key={g.id}>
          <p style={{ margin: '0 0 8px', fontWeight: 500 }}>{g.nome}</p>
          <p className="muted" style={{ marginTop: 0 }}>
            {(g.group_members || []).map((m) => m.profiles?.nome).join(' · ')}
          </p>

          <label style={{ marginTop: 12 }}>Link chat (Telegram/WhatsApp)</label>
          <input defaultValue={g.chat_link || ''} placeholder="https://t.me/..."
                 onBlur={(e) => e.target.value !== (g.chat_link || '') && salvaChat(g.id, e.target.value)} />

          <label style={{ marginTop: 12 }}>Assegna missione</label>
          <select defaultValue="" onChange={(e) => e.target.value && assegna(g.id, e.target.value)}>
            <option value="">Scegli…</option>
            {missioni.map((m) => <option key={m.id} value={m.id}>{m.titolo}</option>)}
          </select>
        </div>
      ))}

      <h2 style={{ marginTop: 40 }}>Da verificare ({daVerificare.length})</h2>
      {daVerificare.length === 0 && <p className="muted">Niente in coda.</p>}
      {daVerificare.map((s) => (
        <div className="card" key={s.id}>
          <p style={{ margin: '0 0 6px', fontWeight: 500 }}>{s.group_missions?.missions?.titolo}</p>
          <p className="muted" style={{ marginTop: 0 }}>
            Presenti ({s.submission_presenze?.length || 0}):{' '}
            {(s.submission_presenze || []).map((p) => p.profiles?.nome).join(', ')}
          </p>
          <button className="btn-ghost" onClick={() => vediFoto(s.foto_path)}>Vedi foto</button>
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button className="btn" style={{ marginTop: 0 }} onClick={() => approva(s)}>Approva</button>
            <button className="btn-ghost" style={{ marginTop: 0 }} onClick={() => rifiuta(s)}>Rifiuta</button>
          </div>
        </div>
      ))}

      <button className="btn-ghost" style={{ marginTop: 40 }} onClick={() => router.push('/home')}>
        Torna alla home
      </button>
    </div>
  );
}
