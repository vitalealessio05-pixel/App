'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

const ALTRO = 'Altro (scrivi)';

const ATENEI = {
  'Sapienza Università di Roma': {
    campus: ['Città Universitaria', 'San Pietro in Vincoli', 'Via Ariosto', 'Ostiense', 'Polo Pontino'],
    corsi: ['Ingegneria Informatica', 'Ingegneria Gestionale', 'Comunicazione', 'Giurisprudenza',
            'Economia', 'Psicologia', 'Lettere', 'Medicina', 'Architettura'],
  },
  'Università della Tuscia': {
    campus: ['Riello', 'Santa Maria in Gradi', 'San Carlo'],
    corsi: ['Scienze Agrarie', 'Economia Aziendale', 'Beni Culturali', 'Scienze Biologiche', 'Informatica'],
  },
};

function pulisci(s) {
  return (s || '').trim().replace(/\s+/g, ' ');
}

export default function Onboarding() {
  const router = useRouter();

  const [nome, setNome] = useState('');
  const [ateneo, setAteneo] = useState('Sapienza Università di Roma');
  const [ateneoLibero, setAteneoLibero] = useState('');
  const [campus, setCampus] = useState('');
  const [campusLibero, setCampusLibero] = useState('');
  const [corso, setCorso] = useState('');
  const [corsoLibero, setCorsoLibero] = useState('');
  const [anno, setAnno] = useState(1);
  const [dispo, setDispo] = useState('');
  const [conosce, setConosce] = useState('');
  const [salvo, setSalvo] = useState(false);
  const [err, setErr] = useState('');

  const ateneoAltro = ateneo === ALTRO;
  const opzioni = ATENEI[ateneo];

  useEffect(() => {
    if (ateneoAltro) {
      setCampus(ALTRO);
      setCorso(ALTRO);
    } else {
      setCampus(opzioni.campus[0]);
      setCorso(opzioni.corsi[0]);
    }
    setCampusLibero('');
    setCorsoLibero('');
  }, [ateneo]);

  const campusAltro = ateneoAltro || campus === ALTRO;
  const corsoAltro = ateneoAltro || corso === ALTRO;

  const vAteneo = ateneoAltro ? pulisci(ateneoLibero) : ateneo;
  const vCampus = campusAltro ? pulisci(campusLibero) : campus;
  const vCorso = corsoAltro ? pulisci(corsoLibero) : corso;

  const completo = pulisci(nome) && dispo && vAteneo && vCampus && vCorso;

  async function salva(e) {
    e.preventDefault();
    setErr('');
    setSalvo(true);

    try {
      const sb = supabase();

      const { data: sessionData, error: sessErr } = await sb.auth.getSession();
      if (sessErr) throw sessErr;

      const session = sessionData?.session;
      if (!session) {
        setErr('Sessione scaduta. Rifai il login.');
        setSalvo(false);
        setTimeout(() => router.replace('/login'), 1200);
        return;
      }

      const { error } = await sb.from('profiles').upsert(
        {
          id: session.user.id,
          nome: pulisci(nome),
          ateneo: vAteneo,
          campus: vCampus,
          corso: vCorso,
          anno: Number(anno),
          disponibilita: dispo,
          conosce_nome: pulisci(conosce) || null,
        },
        { onConflict: 'id' }
      );

      if (error) throw error;
      router.replace('/home');
    } catch (e) {
      console.error('Errore salvataggio profilo:', e);
      setErr(e?.message || 'Qualcosa non ha funzionato. Riprova.');
      setSalvo(false);
    }
  }

  return (
    <form onSubmit={salva}>
      <div className="brand"><span className="brand-dot" />Missio</div>

      <p className="eyebrow" style={{ marginTop: 34 }}>Ultimo passo</p>
      <h1 className="display" style={{ marginTop: 10 }}>Dicci<br />chi sei.</h1>
      <p className="sub">
        Serve per metterti con gente del tuo corso, che gira negli stessi posti alle stesse ore.
      </p>

      <div className="card d1">
        <label htmlFor="nome">Nome</label>
        <input id="nome" required value={nome} onChange={(e) => setNome(e.target.value)}
               placeholder="Come ti chiami" />

        <label htmlFor="ateneo">Ateneo</label>
        <select id="ateneo" value={ateneo} onChange={(e) => setAteneo(e.target.value)}>
          {Object.keys(ATENEI).map((a) => <option key={a}>{a}</option>)}
          <option>{ALTRO}</option>
        </select>
        {ateneoAltro && (
          <>
            <input style={{ marginTop: 10 }} value={ateneoLibero}
                   onChange={(e) => setAteneoLibero(e.target.value)}
                   placeholder="Es. Università di Bologna" />
            <p className="hint">
              Scrivilo per esteso, come lo scriverebbe un tuo compagno di corso: è così che vi
              ritrovate tra voi.
            </p>
          </>
        )}

        <label htmlFor="campus">Campus / sede</label>
        {!ateneoAltro && (
          <select id="campus" value={campus} onChange={(e) => setCampus(e.target.value)}>
            {opzioni.campus.map((c) => <option key={c}>{c}</option>)}
            <option>{ALTRO}</option>
          </select>
        )}
        {campusAltro && (
          <input style={{ marginTop: ateneoAltro ? 0 : 10 }} value={campusLibero}
                 onChange={(e) => setCampusLibero(e.target.value)}
                 placeholder="Zona o nome della sede" />
        )}

        <label htmlFor="corso">Corso di laurea</label>
        {!ateneoAltro && (
          <select id="corso" value={corso} onChange={(e) => setCorso(e.target.value)}>
            {opzioni.corsi.map((c) => <option key={c}>{c}</option>)}
            <option>{ALTRO}</option>
          </select>
        )}
        {corsoAltro && (
          <input style={{ marginTop: ateneoAltro ? 0 : 10 }} value={corsoLibero}
                 onChange={(e) => setCorsoLibero(e.target.value)}
                 placeholder="Es. Scienze Politiche" />
        )}

        <label htmlFor="anno">Anno</label>
        <select id="anno" value={anno} onChange={(e) => setAnno(e.target.value)}>
          <option value={1}>Primo anno</option>
          <option value={2}>Secondo anno</option>
          <option value={3}>Terzo anno</option>
          <option value={4}>Fuori corso o magistrale</option>
        </select>
      </div>

      <div className="card d2">
        <label style={{ marginTop: 0 }}>Quando sei libero</label>
        <div className="chip-row">
          {[['settimana', 'Infrasettimanale'], ['weekend', 'Weekend'], ['entrambi', 'Entrambi']].map(([v, l]) => (
            <button type="button" key={v}
                    className={dispo === v ? 'chip sel' : 'chip'}
                    onClick={() => setDispo(v)}>
              {l}
            </button>
          ))}
        </div>
        <p className="hint">
          Se in un gruppo uno può solo la domenica e gli altri no, la missione muore lì.
        </p>

        <label htmlFor="conosce">Conosci già qualcuno che si sta iscrivendo?</label>
        <input id="conosce" value={conosce} onChange={(e) => setConosce(e.target.value)}
               placeholder="Nome e cognome (facoltativo)" />
        <p className="hint">
          Serve per <b>non</b> mettervi insieme. Il punto è conoscere gente nuova.
        </p>
      </div>

      {err && <p className="err">{err}</p>}

      <button className="btn btn-coral" type="submit" disabled={salvo || !completo}>
        {salvo ? 'Salvo…' : 'Entra in Missio'}
      </button>
    </form>
  );
}
