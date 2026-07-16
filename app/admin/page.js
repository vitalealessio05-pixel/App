'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

export default function Admin() {
  const router = useRouter();
  const [ok, setOk] = useState(false);
  const [attesa, setAttesa] = useState([]);
  const [gruppi, setGruppi] = useState([]);
  const [missioni, setMaisolani] = useState([]);
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
    setMaisolani(ms || []);

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
    if (!primo) { setMsg('Errore interno: persona non trovata, ricarica la pagina.'); return; }

    const segmenti = new Set(sel.map((id) => attesa.find((p) => p.id === id)?.segment_key));
    if (segmenti.size > 1) {
      setMsg('Attenzione: stai mettendo insieme persone di segmenti diversi.');
    }

    const { data: g, error } = await sb
      .from('groups')
      .insert({ segment_key: primo.segment_key, nome: `Gruppo ${primo.corso}` })
      .select('id')
      .single();

    if (error) {
      console.error('creazione gruppo:', error);
      setMsg('Creazione gruppo fallita: ' + error.message);
      return;
    }

    const { error: errMembri } = await sb
      .from('group_members')
      .insert(sel.map((uid) => ({ group_id: g.id, user_id: uid })));

    if (errMembri) {
      console.error('aggiunta membri:', errMembri);
      setMsg('Gruppo creato ma senza membri (' + errMembri.message + ').');
      carica();
      return;
    }

    setSel([]);
    setMsg('Gruppo creato con ' + sel.length + ' persone.');
    carica();
  }

  async function assegna(groupId, missionId) {
    const sb = supabase();
    const scadenza = new Date(Date.now() + 4 * 86400000).toISOString();
    const { error } = await sb.from('group_missions').insert({ group_id: groupId, mission_id: missionId, scadenza });
    setMsg(error ? 'Assegnazione fallita: ' + error.message : 'Maisolane assegnata.');
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

  if (!ok) return <div className="admin-wrap"><p className="muted">Controllo permessi…</p></div>;

  const perSegmento = attesa.reduce((acc, p) => {
    (acc[p.segment_key] = acc[p.segment_key] || []).push(p);
    return acc;
  }, {});

  return (
    <div className="admin-wrap">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    marginBottom: 24 }}>
        <div className="brand" style={{ marginBottom: 0 }}>
          <span className="brand-dot" />Maisola · admin
        </div>
        <button className="btn-text" onClick={() => router.push('/home')}>Vista studente</button>
      </div>

      {msg && <div className="admin-msg">{msg}</div>}

      <div className="admin-grid">

        {/* colonna sinistra: formazione gruppi */}
        <div className="admin-col">
          <div className="admin-card">
            <p className="admin-h">In attesa <span className="admin-count">{attesa.length}</span></p>
            <p className="admin-meta">Spunta da 2 a 4 persone dello stesso segmento, poi crea il gruppo.</p>

            {attesa.length === 0 && (
              <p className="muted" style={{ marginTop: 18 }}>Nessuno in attesa. Tutti hanno un gruppo.</p>
            )}

            {Object.entries(perSegmento).map(([seg, persone]) => (
              <div key={seg}>
                <p className="admin-seg">
                  {persone[0].corso} · {persone[0].campus} — {persone.length}
                </p>
                {persone.map((p) => (
                  <label key={p.id} className={sel.includes(p.id) ? 'admin-row sel' : 'admin-row'}>
                    <input type="checkbox" checked={sel.includes(p.id)}
                           onChange={() => toggleSel(p.id)} />
                    <span style={{ flex: 1 }}>
                      <b>{p.nome}</b>
                      <span className="admin-meta"> · {p.disponibilita} · {p.anno}° anno</span>
                      {p.conosce_nome && (
                        <span style={{ color: 'var(--coral)', fontWeight: 700, fontSize: 12 }}>
                          {' '}— conosce: {p.conosce_nome}
                        </span>
                      )}
                    </span>
                  </label>
                ))}
              </div>
            ))}

            {sel.length > 0 && (
              <div className="admin-bar">
                <button className="btn btn-iris" style={{ marginTop: 0 }} onClick={creaGruppo}>
                  Crea gruppo con {sel.length} {sel.length === 1 ? 'persona' : 'persone'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* colonna destra: verifiche e gruppi attivi */}
        <div className="admin-col admin-sticky">

          <div className="admin-card">
            <p className="admin-h">Da verificare <span className="admin-count">{daVerificare.length}</span></p>
            {daVerificare.length === 0 && <p className="muted" style={{ marginTop: 12 }}>Niente in coda.</p>}
            {daVerificare.map((s) => (
              <div key={s.id} style={{ borderTop: '1px solid var(--line)', paddingTop: 14, marginTop: 14 }}>
                <p style={{ margin: 0, fontWeight: 800 }}>{s.group_missions?.missions?.titolo}</p>
                <p className="admin-meta" style={{ margin: '4px 0 10px' }}>
                  Presenti ({s.submission_presenze?.length || 0}):{' '}
                  {(s.submission_presenze || []).map((p) => p.profiles?.nome).join(', ')}
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn-ghost" style={{ marginTop: 0 }}
                          onClick={() => vediFoto(s.foto_path)}>Vedi foto</button>
                  <button className="btn" style={{ marginTop: 0 }}
                          onClick={() => approva(s)}>Approva</button>
                  <button className="btn-ghost" style={{ marginTop: 0 }}
                          onClick={() => rifiuta(s)}>Rifiuta</button>
                </div>
              </div>
            ))}
          </div>

          <div className="admin-card">
            <p className="admin-h">Gruppi attivi <span className="admin-count">{gruppi.length}</span></p>
            {gruppi.length === 0 && <p className="muted" style={{ marginTop: 12 }}>Ancora nessun gruppo.</p>}
            {gruppi.map((g) => (
              <div key={g.id} style={{ borderTop: '1px solid var(--line)', paddingTop: 14, marginTop: 14 }}>
                <p style={{ margin: 0, fontWeight: 800 }}>{g.nome}</p>
                <p className="admin-meta" style={{ margin: '4px 0 10px' }}>
                  {(g.group_members || []).map((m) => m.profiles?.nome).join(' · ')}
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ marginTop: 0 }}>Link chat</label>
                    <input defaultValue={g.chat_link || ''} placeholder="https://t.me/..."
                           style={{ padding: '10px 12px', fontSize: 14 }}
                           onBlur={(e) => e.target.value !== (g.chat_link || '') && salvaChat(g.id, e.target.value)} />
                  </div>
                  <div>
                    <label style={{ marginTop: 0 }}>Assegna missione</label>
                    <select defaultValue="" style={{ padding: '10px 12px', fontSize: 14 }}
                            onChange={(e) => e.target.value && assegna(g.id, e.target.value)}>
                      <option value="">Scegli…</option>
                      {missioni.map((m) => <option key={m.id} value={m.id}>{m.titolo}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}
