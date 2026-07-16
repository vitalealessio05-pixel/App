'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

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
  'Altro ateneo': { campus: ['Altro'], corsi: ['Altro'] },
};

export default function Onboarding() {
  const router = useRouter();
  const [nome, setNome] = useState('');
  const [ateneo, setAteneo] = useState('Sapienza Università di Roma');
  const [campus, setCampus] = useState('');
  const [corso, setCorso] = useState('');
  const [anno, setAnno] = useState(1);
  const [dispo, setDispo] = useState('');
  const [conosce, setConosce] = useState('');
  const [salvo, setSalvo] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    const a = ATENEI[ateneo];
    setCampus(a.campus[0]);
    setCorso(a.corsi[0]);
  }, [ateneo]);

  async function salva(e) {
    e.preventDefault();
    setErr('');
    setSalvo(true);

    const sb = supabase();
    const { data: { session } } = await sb.auth.getSession();
    if (!session) { router.replace('/login'); return; }

    const { error } = await sb.from('profiles').insert({
      id: session.user.id,
      nome: nome.trim(),
      ateneo,
      campus,
      corso,
      anno: Number(anno),
      disponibilita: dispo,
      conosce_nome: conosce.trim() || null,
    });

    if (error) { setErr(error.message); setSalvo(false); return; }
    router.replace('/home');
  }

  const opzioni = ATENEI[ateneo];

  return (
    <form onSubmit={salva}>
      <div className="brand">Missio</div>
      <h1>Dicci chi sei</h1>
      <p className="sub">
        Serve per metterti con persone del tuo corso, che girano negli stessi posti.
      </p>

      <label htmlFor="nome">Nome</label>
      <input id="nome" required value={nome} onChange={(e) => setNome(e.target.value)}
             placeholder="Come ti chiami" />

      <label htmlFor="ateneo">Ateneo</label>
      <select id="ateneo" value={ateneo} onChange={(e) => setAteneo(e.target.value)}>
        {Object.keys(ATENEI).map((a) => <option key={a}>{a}</option>)}
      </select>

      <label htmlFor="campus">Campus / sede</label>
      <select id="campus" value={campus} onChange={(e) => setCampus(e.target.value)}>
        {opzioni.campus.map((c) => <option key={c}>{c}</option>)}
      </select>

      <label htmlFor="corso">Corso di laurea</label>
      <select id="corso" value={corso} onChange={(e) => setCorso(e.target.value)}>
        {opzioni.corsi.map((c) => <option key={c}>{c}</option>)}
      </select>

      <label htmlFor="anno">Anno</label>
      <select id="anno" value={anno} onChange={(e) => setAnno(e.target.value)}>
        <option value={1}>Primo anno</option>
        <option value={2}>Secondo anno</option>
        <option value={3}>Terzo anno</option>
        <option value={4}>Fuori corso o magistrale</option>
      </select>

      <label>Quando sei libero</label>
      <div className="chip-row">
        {[['settimana', 'Infrasettimanale'], ['weekend', 'Weekend'], ['entrambi', 'Entrambi']].map(([v, l]) => (
          <button type="button" key={v}
                  className={dispo === v ? 'chip sel' : 'chip'}
                  onClick={() => setDispo(v)}>
            {l}
          </button>
        ))}
      </div>
      <p className="hint">Se in un gruppo uno può solo la domenica e gli altri no, la missione muore lì.</p>

      <label htmlFor="conosce">
        Conosci già qualcuno che si sta iscrivendo? <span style={{ textTransform: 'none', fontWeight: 400 }}>(facoltativo)</span>
      </label>
      <input id="conosce" value={conosce} onChange={(e) => setConosce(e.target.value)}
             placeholder="Nome e cognome" />
      <p className="hint">Serve per <b>non</b> mettervi nello stesso gruppo. L'obiettivo è conoscere gente nuova.</p>

      {err && <p className="err">{err}</p>}

      <button className="btn" type="submit" disabled={salvo || !nome || !dispo}>
        {salvo ? 'Salvo…' : 'Conferma'}
      </button>
    </form>
  );
}
