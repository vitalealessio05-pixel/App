-- ============================================================
-- MAISOLA — missioni definitive (livello 2 + livello 3)
-- Sostituisce i segnaposto vecchi con la lista vera, con città
-- assegnata dove conta (Roma-specifiche) e punti pesati in base
-- a quanto impegno richiede ciascuna.
-- Incolla in Supabase → SQL Editor → Run.
-- ============================================================

-- disattiva i quattro segnaposto vecchi (titolo ora è univoco, quindi
-- questo tocca esattamente una riga per titolo, non doppioni)
update missions set attiva = false
where titolo in ('Il murales nascosto', 'La panchina con vista', 'Il libro dimenticato');

-- livello 2 — il primo incontro
insert into missions (titolo, descrizione, citta, punti, virtuale) values
  ('Il primo incontro', 'Prima missione vera: incontratevi di persona, da qualche parte tranquilla. Una foto di gruppo, come vi va — mani, facce, quello che preferite. L''importante è esserci.', null, 40, false)
on conflict (titolo) do update set descrizione = excluded.descrizione, punti = excluded.punti, citta = excluded.citta, attiva = true;

-- livello 3 — universali (qualsiasi città)
insert into missions (titolo, descrizione, citta, punti, virtuale) values
  ('Un caffè insieme in ateneo', 'Andate insieme al bar più vicino al campus. Foto al tavolo, tutti presenti.', null, 50, false),
  ('Chiedete l''ora a uno sconosciuto', 'Fermate una persona per strada e chiedetele l''ora, anche se avete il telefono in tasca. Foto di gruppo nel punto esatto.', null, 50, false),
  ('La caccia al citofono strano', 'Trovate un citofono con un nome che vi fa ridere o vi incuriosisce. Foto delle mani che lo indicano.', null, 80, false),
  ('Colazione da matricole', 'Trovate il bar con il cornetto migliore vicino al campus. Foto del tavolo con tutti i cornetti.', null, 60, false),
  ('Uscita serale', 'Una sera, uscite insieme — un locale, una piazza, dove vi va. Foto di gruppo.', null, 90, false),
  ('Uno strappo insieme', 'Comprate insieme una cosa piccola e dividetevela — un caffè, delle caramelle. Foto dello scontrino sulle mani aperte.', null, 70, false),
  ('Serata a casa di qualcuno', 'Organizzate una serata a casa di uno di voi. Foto di gruppo, libera.', null, 150, false),
  ('Rubate una parola', 'Chiedete a qualcuno del posto una parola nel dialetto locale che non conoscete, e il suo significato. Foto delle mani che la scrivono insieme, con la parola scritta nella didascalia.', null, 120, false)
on conflict (titolo) do update set descrizione = excluded.descrizione, punti = excluded.punti, citta = excluded.citta, attiva = true;

-- livello 3 — solo Roma
insert into missions (titolo, descrizione, citta, punti, virtuale) values
  ('Tramonto al Pincio', 'Andate insieme a vedere il tramonto dal Pincio. Foto di gruppo, pollici su, tramonto alle spalle.', 'Roma', 90, false),
  ('Il nasone più lontano', 'A piedi, trovate il nasone (la fontanella pubblica) più lontano che riuscite a raggiungere in 15 minuti. Foto delle mani sotto lo stesso getto d''acqua.', 'Roma', 100, false)
on conflict (titolo) do update set descrizione = excluded.descrizione, punti = excluded.punti, citta = excluded.citta, attiva = true;
