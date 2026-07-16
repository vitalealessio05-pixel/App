'use client';

import { useRouter } from 'next/navigation';
import BrandMark from '../BrandMark';

export default function Privacy() {
  const router = useRouter();

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="brand" style={{ marginBottom: 0 }}><BrandMark />Maisola</div>
        <button className="btn-text" onClick={() => router.back()}>Indietro</button>
      </div>

      <h1 className="display" style={{ marginTop: 34, fontSize: 26 }}>Privacy</h1>
      <p className="hint" style={{ marginBottom: 24 }}>Ultimo aggiornamento: luglio 2026</p>

      <div style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--ink)' }}>

        <h2 className="display" style={{ fontSize: 17, marginTop: 24 }}>Quali dati raccogliamo</h2>
        <p>
          Quando ti registri raccogliamo: email, nome, ateneo, campus, corso, anno, disponibilità
          oraria, città di provenienza (facoltativa) ed eventuali persone che conosci già tra gli
          iscritti (facoltativo). Quando partecipi a una missione raccogliamo la foto caricata
          come prova e chi tra i membri del gruppo era presente. Se attivi le notifiche,
          registriamo l'indirizzo tecnico necessario per inviartele.
        </p>

        <h2 className="display" style={{ fontSize: 17, marginTop: 24 }}>Perché li raccogliamo</h2>
        <p>
          Usiamo questi dati esclusivamente per: formare i gruppi in base a corso e sede,
          assegnare le missioni, verificare il loro completamento, calcolare i punti, e (se
          attive) inviarti notifiche sull'andamento del tuo gruppo. Non vendiamo né condividiamo
          i tuoi dati con soggetti esterni per scopi pubblicitari.
        </p>

        <h2 className="display" style={{ fontSize: 17, marginTop: 24 }}>Chi vede cosa</h2>
        <p>
          Nome e città di provenienza (se inserita) sono visibili agli altri membri del tuo
          stesso gruppo. Le foto caricate come prova sono visibili ai membri del gruppo e a chi
          amministra il servizio, per la verifica. Nessun dato è pubblico o visibile a persone
          esterne al tuo gruppo.
        </p>

        <h2 className="display" style={{ fontSize: 17, marginTop: 24 }}>Dove sono conservati</h2>
        <p>
          I dati sono conservati su Supabase (infrastruttura database) e l'applicazione gira su
          Vercel (hosting). Entrambi sono fornitori tecnici che trattano i dati per nostro conto,
          secondo i rispettivi standard di sicurezza.
        </p>

        <h2 className="display" style={{ fontSize: 17, marginTop: 24 }}>Quanto li conserviamo</h2>
        <p>
          Conserviamo i tuoi dati finché il tuo account è attivo. Se richiedi la cancellazione
          dell'account, i tuoi dati personali vengono rimossi entro un tempo ragionevole, salvo
          quanto debba essere conservato per obblighi di legge.
        </p>

        <h2 className="display" style={{ fontSize: 17, marginTop: 24 }}>I tuoi diritti</h2>
        <p>
          Puoi in qualsiasi momento chiedere di vedere quali dati abbiamo su di te, correggerli,
          o chiederne la cancellazione, scrivendo al contatto indicato nell'app. Puoi disattivare
          le notifiche push in qualsiasi momento dalle impostazioni del tuo telefono o browser.
        </p>

        <h2 className="display" style={{ fontSize: 17, marginTop: 24 }}>Minori</h2>
        <p>
          Il servizio è pensato per studenti universitari maggiorenni e non è rivolto a minori
          di 18 anni.
        </p>

        <p className="hint" style={{ marginTop: 32 }}>
          Questo documento è una base di partenza redatta per la fase di test del servizio e non
          costituisce consulenza legale.
        </p>
      </div>
    </div>
  );
}
