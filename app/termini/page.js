'use client';

import { useRouter } from 'next/navigation';
import BrandMark from '../BrandMark';

export default function Termini() {
  const router = useRouter();

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="brand" style={{ marginBottom: 0 }}><BrandMark />Maisola</div>
        <button className="btn-text" onClick={() => router.back()}>Indietro</button>
      </div>

      <h1 className="display" style={{ marginTop: 34, fontSize: 26 }}>Termini e condizioni</h1>
      <p className="hint" style={{ marginBottom: 24 }}>Ultimo aggiornamento: luglio 2026</p>

      <div style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--ink)' }}>

        <h2 className="display" style={{ fontSize: 17, marginTop: 24 }}>1. Cos'è Maisola</h2>
        <p>
          Maisola è un servizio che mette in contatto studenti universitari appena arrivati in
          una nuova città, organizzandoli in piccoli gruppi e proponendo attività leggere
          ("missioni") da svolgere insieme. Maisola è attualmente in fase di test (pilot) e le
          funzionalità possono cambiare senza preavviso.
        </p>

        <h2 className="display" style={{ fontSize: 17, marginTop: 24 }}>2. Chi può usarlo</h2>
        <p>
          Il servizio è pensato per studenti universitari maggiorenni. Iscrivendoti dichiari di
          avere almeno 18 anni e di fornire dati veritieri (nome, ateneo, corso).
        </p>

        <h2 className="display" style={{ fontSize: 17, marginTop: 24 }}>
          3. Le attività si svolgono fuori dalla piattaforma, a tuo rischio
        </h2>
        <p>
          Questo è il punto più importante di questi termini, leggilo con attenzione.
        </p>
        <p>
          Maisola forma i gruppi e propone le missioni, ma <b>non organizza, supervisiona né
          controlla</b> gli incontri, gli spostamenti o le attività che gli utenti svolgono tra
          loro. Le missioni si svolgono in luoghi pubblici, in autonomia, tra persone maggiorenni
          libere di decidere come, quando e se parteciparvi.
        </p>
        <p>
          Nella misura massima consentita dalla legge applicabile, Maisola e chi lo gestisce
          <b> non si assumono responsabilità</b> per infortuni, incidenti, furti, dispute tra
          utenti o qualunque altro danno, diretto o indiretto, che si verifichi durante o in
          relazione a un incontro organizzato tramite l'app. Partecipare a una missione è una
          scelta libera e a proprio rischio.
        </p>
        <p>
          Consigliamo sempre buon senso: incontrarsi in luoghi pubblici e frequentati, specie al
          primo incontro, e interrompere qualunque attività non ci si senta di continuare.
        </p>

        <h2 className="display" style={{ fontSize: 17, marginTop: 24 }}>4. I gruppi</h2>
        <p>
          I gruppi sono formati dal team di Maisola in base a corso, sede e disponibilità
          indicati in fase di registrazione. Non garantiamo compatibilità caratteriale tra i
          membri di un gruppo, né la presenza costante di tutti i membri a ogni missione.
        </p>

        <h2 className="display" style={{ fontSize: 17, marginTop: 24 }}>5. Le prove fotografiche</h2>
        <p>
          Per completare una missione, un membro del gruppo carica una foto come prova
          dell'attività svolta, indicando chi era presente. Le foto vengono riviste
          manualmente. Maisola si riserva il diritto di rifiutare una prova non conforme e di
          non assegnare punti, motivando la decisione.
        </p>

        <h2 className="display" style={{ fontSize: 17, marginTop: 24 }}>6. I punti</h2>
        <p>
          I punti accumulati non hanno, al momento, alcun valore monetario e non sono
          convertibili in denaro. In futuro potrebbero essere utilizzabili per sconti presso
          esercizi commerciali convenzionati: questa funzionalità non è garantita e potrebbe non
          essere mai attivata.
        </p>

        <h2 className="display" style={{ fontSize: 17, marginTop: 24 }}>7. Comportamento</h2>
        <p>
          Non è consentito registrarsi con dati falsi, molestare altri utenti, o usare il
          servizio per scopi diversi da quello per cui è pensato. Ci riserviamo il diritto di
          sospendere un account che violi queste regole.
        </p>

        <h2 className="display" style={{ fontSize: 17, marginTop: 24 }}>8. Modifiche al servizio</h2>
        <p>
          Essendo un progetto in fase di test, funzionalità, missioni, regole di formazione dei
          gruppi e questi stessi termini possono cambiare. Le modifiche rilevanti verranno
          comunicate agli utenti attivi quando ragionevolmente possibile.
        </p>

        <h2 className="display" style={{ fontSize: 17, marginTop: 24 }}>9. Legge applicabile</h2>
        <p>
          Questi termini sono regolati dalla legge italiana.
        </p>

        <h2 className="display" style={{ fontSize: 17, marginTop: 24 }}>10. Contatti</h2>
        <p>
          Per domande su questi termini, contatta il responsabile del servizio all'indirizzo
          indicato nell'app.
        </p>

        <p className="hint" style={{ marginTop: 32 }}>
          Questo documento è una base di partenza redatta per la fase di test del servizio e non
          costituisce consulenza legale. Prima di un lancio pubblico più ampio è consigliata una
          revisione da parte di un professionista.
        </p>
      </div>
    </div>
  );
}
