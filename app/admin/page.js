'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { notificaGruppo } from '../../lib/notifiche';

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
      .select('id, nome, ateneo, campus, corso, anno, disponibilita, conosce_nome, citta_provenienza, curiosita, segment_key, created_at')
      .eq('is_admin', false)
      .order('created_at');

    const { data: membri } = await sb.from('group_members').select('user_id, groups(stato)');
    const occupati = new Set(
      (membri || []).filter((m) => m.groups?.stato === 'attivo').map((m) => m.user_id)
    );
    setAttesa((tutti || []).filter((p) => !occupati.has(p.id)));

    const { data: g } = await sb
      .from('groups')
      .select('id, nome, segment_key, stato, chat_link, telegram_chat_id, group_members(user_id, profiles(nome, curiosita)), group_missions(mission_id)')
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

    const notifica = await notificaGruppo(g.id, {
      title: 'Il tuo gruppo è pronto!',
      body: 'Siete stati messi insieme. Apri l’app per vedere chi c’è nel tuo gruppo.',
      url: '/home',
    });

    setSel([]);
    setMsg('Gruppo creato con ' + sel.length + ' persone. Notifiche: ' + notifica.motivo);
    carica();
  }

  async function assegna(groupId, missionId) {
    const sb = supabase();
    const scadenza = new Date(Date.now() + 4 * 86400000).toISOString();
    const { error } = await sb.from('group_missions').insert({ group_id: groupId, mission_id: missionId, scadenza });

    if (error) {
      const messaggio = error.message.includes('duplicate key')
        ? 'Questo gruppo ha già questa missione assegnata.'
        : 'Assegnazione fallita: ' + error.message;
      setMsg(messaggio);
      carica();
      return;
    }

    const missione = missioni.find((m) => m.id === missionId);
    const notifica = await notificaGruppo(groupId, {
      title: 'Nuova missione!',
      body: missione ? missione.titolo : 'Il tuo gruppo ha una nuova missione.',
    });
    setMsg('Missione assegnata. Notifiche: ' + notifica.motivo);
    carica();
  }

  async function salvaChat(groupId, link) {
    await supabase().from('groups').update({ chat_link: link }).eq('id', groupId);
    setMsg('Link chat salvato.');
    carica();
  }

  async function salvaChatId(groupId, telegramChatId) {
    await supabase().from('groups').update({ telegram_chat_id: telegramChatId || null }).eq('id', groupId);
    setMsg('Chat ID salvato.');
    carica();
  }

  async function mandaBenvenuto(gruppo) {
    if (!gruppo.telegram_chat_id) {
      setMsg('Manca il Chat ID di questo gruppo: scrivi /id nel gruppo Telegram e incollalo qui sotto.');
      return;
    }

    const membri = (gruppo.group_members || []).map((m) => m.profiles).filter(Boolean);
    const righe = membri.map((m) =>
      m.curiosita ? `• <b>${m.nome}</b> — ${m.curiosita}` : `• <b>${m.nome}</b>`
    );

    const testo =
      `Ciao! Siete voi ${membri.length}:\n\n${righe.join('\n')}\n\n` +
      `Presto arriva la prima missione. Nel frattempo, rompete il ghiaccio 👋`;

    setMsg('Invio in corso…');
    const res = await fetch('/api/telegram-invia', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId: gruppo.telegram_chat_id, testo }),
    });
    const json = await res.json();
    setMsg(json.ok ? 'Messaggio di benvenuto inviato.' : 'Invio fallito: ' + json.motivo);
  }

  async function approva(sub) {
    const sb = supabase();
    const presenti = sub.submission_presenze?.length || 0;
    if (presenti < 2) { setMsg('Meno di 2 presenti: non approvabile.'); return; }

    const groupId = sub.group_missions.group_id;

    await sb.from('submissions').update({ stato: 'approvata' }).eq('id', sub.id);
    await sb.from('group_missions').update({ stato: 'approvata' }).eq('id', sub.group_missions.id);
    await sb.from('points_ledger').insert({
      group_id: groupId,
      submission_id: sub.id,
      punti: sub.group_missions.missions.punti,
      motivo: sub.group_missions.missions.titolo,
    });

    const notificaA = await notificaGruppo(groupId, {
      title: 'Missione approvata!',
      body: `+${sub.group_missions.missions.punti} punti per "${sub.group_missions.missions.titolo}"`,
      url: '/profilo',
    });

    // appena approvato, prova ad assegnare subito una missione nuova allo stesso gruppo
    const { data: usateRows } = await sb
      .from('group_missions')
      .select('mission_id')
      .eq('group_id', groupId);
    const usate = new Set((usateRows || []).map((r) => r.mission_id));
    const disponibili = missioni.filter((m) => !usate.has(m.id));

    let msgFinale = 'Approvata, punti assegnati. Notifiche: ' + notificaA.motivo;

    if (disponibili.length > 0) {
      const prossima = disponibili[Math.floor(Math.random() * disponibili.length)];
      const scadenza = new Date(Date.now() + 4 * 86400000).toISOString();
      const { error: errNuova } = await sb
        .from('group_missions')
        .insert({ group_id: groupId, mission_id: prossima.id, scadenza });

      if (!errNuova) {
        await notificaGruppo(groupId, {
          title: 'Nuova missione!',
          body: prossima.titolo,
        });
        msgFinale += ' — nuova missione assegnata: ' + prossima.titolo;
      }
    } else {
      msgFinale += ' — nessuna missione nuova disponibile per questo gruppo.';
    }

    setMsg(msgFinale);
    carica();
  }

  async function rifiuta(sub) {
    const motivo = window.prompt(
      'Perché la rifiuti? Il gruppo vedrà questo messaggio (es. "la foto non mostra il posto giusto").'
    );
    if (motivo === null) return; // hanno annullato

    const sb = supabase();
    await sb.from('submissions').update({ stato: 'rifiutata', nota_admin: motivo || null }).eq('id', sub.id);
    await sb.from('group_missions').update({ stato: 'attiva' }).eq('id', sub.group_missions.id);
    const notificaR = await notificaGruppo(sub.group_missions.group_id, {
      title: 'La prova non è passata',
      body: motivo || 'Ricontrollate la missione e riprovate.',
    });
    setMsg('Rifiutata, la missione torna attiva. Notifiche: ' + notificaR.motivo);
    carica();
  }

  async function vediFoto(path) {
    const { data } = await supabase().storage.from('prove').createSignedUrl(path, 300);
    if (data?.signedUrl) window.open(data.signedUrl, '_blank');
  }

  async function esci() {
    await supabase().auth.signOut();
    router.replace('/');
  }

  if (!ok) return <div className="adm"><div className="adm-guard">Controllo permessi…</div></div>;

  const perSegmento = attesa.reduce((acc, p) => {
    (acc[p.segment_key] = acc[p.segment_key] || []).push(p);
    return acc;
  }, {});

  return (
    <div className="adm">
      <div className="adm-topbar">
        <div className="adm-brand">
          <span className="adm-brand-mark">M</span>
          Maisola
          <span className="adm-brand-tag">Admin</span>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <a className="adm-link" href="/home">Vista studente</a>
          <button className="adm-link" style={{ border: 'none', background: 'none', cursor: 'pointer' }}
                  onClick={esci}>Esci</button>
        </div>
      </div>

      <div className="adm-body">
        <p className="adm-title">Pannello operativo</p>
        <p className="adm-subtitle">Formazione gruppi, missioni e verifica delle prove.</p>

        {msg && <div className="adm-msg">{msg}</div>}

        <div className="adm-grid">

          {/* colonna sinistra: formazione gruppi */}
          <div>
            <div className="adm-card">
              <div className="adm-card-head">
                <p className="adm-card-title">In attesa</p>
                <span className="adm-badge">{attesa.length}</span>
              </div>
              <p className="adm-card-sub">Seleziona da 2 a 4 persone dello stesso segmento, poi crea il gruppo.</p>

              {attesa.length === 0 && <p className="adm-empty">Nessuno in attesa. Tutti hanno un gruppo.</p>}

              {Object.entries(perSegmento).map(([seg, persone]) => (
                <div key={seg}>
                  <p className="adm-section-label">
                    {persone[0].corso} · {persone[0].campus} — {persone.length}
                  </p>
                  {persone.map((p) => (
                    <label key={p.id} className={sel.includes(p.id) ? 'adm-row sel' : 'adm-row'}
                           style={{ alignItems: 'flex-start' }}>
                      <input type="checkbox" checked={sel.includes(p.id)} onChange={() => toggleSel(p.id)}
                             style={{ marginTop: 3 }} />
                      <span style={{ flex: 1 }}>
                        <b>{p.nome}</b>
                        {p.citta_provenienza && <span className="adm-row-meta"> ({p.citta_provenienza})</span>}
                        <span className="adm-row-meta"> · {p.disponibilita} · {p.anno}° anno</span>
                        {p.conosce_nome && (
                          <span className="adm-flag"> — conosce: {p.conosce_nome}</span>
                        )}
                        {p.curiosita && (
                          <div style={{ fontSize: 12, color: 'var(--a-accent)', marginTop: 2, fontStyle: 'italic' }}>
                            "{p.curiosita}"
                          </div>
                        )}
                      </span>
                    </label>
                  ))}
                </div>
              ))}

              {sel.length > 0 && (
                <div className="adm-bar">
                  <button className="adm-btn adm-btn-accent" style={{ width: '100%' }} onClick={creaGruppo}>
                    Crea gruppo con {sel.length} {sel.length === 1 ? 'persona' : 'persone'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* colonna destra: verifiche e gruppi attivi */}
          <div className="adm-sticky">

            <div className="adm-card">
              <div className="adm-card-head">
                <p className="adm-card-title">Da verificare</p>
                <span className="adm-badge">{daVerificare.length}</span>
              </div>
              {daVerificare.length === 0 && <p className="adm-empty" style={{ marginTop: 8 }}>Niente in coda.</p>}
              {daVerificare.map((s) => (
                <div key={s.id} className="adm-item">
                  <p className="adm-item-title">{s.group_missions?.missions?.titolo}</p>
                  <p className="adm-item-meta">
                    Presenti ({s.submission_presenze?.length || 0}):{' '}
                    {(s.submission_presenze || []).map((p) => p.profiles?.nome).join(', ')}
                  </p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="adm-btn adm-btn-ghost" onClick={() => vediFoto(s.foto_path)}>Vedi foto</button>
                    <button className="adm-btn adm-btn-primary" onClick={() => approva(s)}>Approva</button>
                    <button className="adm-btn adm-btn-danger-ghost" onClick={() => rifiuta(s)}>Rifiuta</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="adm-card">
              <div className="adm-card-head">
                <p className="adm-card-title">Gruppi attivi</p>
                <span className="adm-badge">{gruppi.length}</span>
              </div>
              {gruppi.length === 0 && <p className="adm-empty" style={{ marginTop: 8 }}>Ancora nessun gruppo.</p>}
              {gruppi.map((g) => (
                <div key={g.id} className="adm-item">
                  <p className="adm-item-title">{g.nome}</p>
                  <p className="adm-item-meta">
                    {(g.group_members || []).map((m) => m.profiles?.nome).join(' · ')}
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label className="adm-field-label">Link chat</label>
                      <input className="adm-input" defaultValue={g.chat_link || ''} placeholder="https://t.me/..."
                             onBlur={(e) => e.target.value !== (g.chat_link || '') && salvaChat(g.id, e.target.value)} />
                    </div>
                    <div>
                      <label className="adm-field-label">Assegna missione</label>
                      {(() => {
                        const giaUsate = new Set((g.group_missions || []).map((gm) => gm.mission_id));
                        const disponibili = missioni.filter((m) => !giaUsate.has(m.id));
                        if (disponibili.length === 0) {
                          return <p className="adm-empty" style={{ padding: 0 }}>Nessuna missione nuova disponibile.</p>;
                        }
                        return (
                          <select className="adm-select" defaultValue=""
                                  onChange={(e) => e.target.value && assegna(g.id, e.target.value)}>
                            <option value="">Scegli…</option>
                            {disponibili.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.titolo}{m.virtuale ? ' — virtuale' : ''}
                              </option>
                            ))}
                          </select>
                        );
                      })()}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12,
                                alignItems: 'end', marginTop: 12 }}>
                    <div>
                      <label className="adm-field-label">Telegram Chat ID</label>
                      <input className="adm-input" defaultValue={g.telegram_chat_id || ''}
                             placeholder="Scrivi /id nel gruppo per averlo"
                             onBlur={(e) => e.target.value !== (g.telegram_chat_id || '') && salvaChatId(g.id, e.target.value)} />
                    </div>
                    <button className="adm-btn adm-btn-accent" onClick={() => mandaBenvenuto(g)}>
                      Manda benvenuto
                    </button>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
