-- ============================================================
-- MAISOLA — migrazione: pulizia missioni duplicate
-- Le missioni si sono duplicate perché "on conflict do nothing"
-- senza un vincolo di unicità non impedisce nulla — ogni volta
-- che l'INSERT veniva rieseguito, creava righe nuove.
-- Questa migrazione: 1) riassocia eventuali missioni già
-- assegnate a un gruppo verso la copia più vecchia,
-- 2) cancella i doppioni, 3) aggiunge il vincolo che mancava,
-- così da ora in poi non può più succedere.
-- Incolla in Supabase → SQL Editor → Run. Sicura da eseguire
-- anche più volte.
-- ============================================================

-- 1. Se una missione duplicata era già assegnata a un gruppo,
--    sposta quel collegamento sulla copia più vecchia (quella
--    che sopravvive al passo successivo)
with ranked as (
  select id, titolo,
         row_number() over (partition by titolo order by created_at asc) as rn,
         first_value(id) over (partition by titolo order by created_at asc) as id_da_tenere
  from missions
)
update group_missions gm
set mission_id = ranked.id_da_tenere
from ranked
where gm.mission_id = ranked.id and ranked.rn > 1;

-- 2. Cancella tutte le copie in più, tenendo solo la più vecchia per titolo
with ranked as (
  select id, row_number() over (partition by titolo order by created_at asc) as rn
  from missions
)
delete from missions m
using ranked
where m.id = ranked.id and ranked.rn > 1;

-- 3. Il vincolo che avrebbe dovuto esserci fin dall'inizio: da ora,
--    due missioni non possono avere lo stesso titolo, quindi
--    "on conflict" avrà finalmente qualcosa da rispettare
alter table missions drop constraint if exists missions_titolo_unique;
alter table missions add constraint missions_titolo_unique unique (titolo);
