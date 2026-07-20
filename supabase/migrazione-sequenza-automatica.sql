-- ============================================================
-- MAISOLA — automazione della sequenza missioni
-- Ogni missione ha un "ordine" (1,2,3...) e un "attesa_minuti"
-- (quanto aspettare dopo la missione precedente prima di
-- assegnare questa). Una funzione controlla tutti i gruppi
-- attivi e assegna la prossima missione dovuta, rispettando
-- anche la città del gruppo.
-- Incolla in Supabase → SQL Editor → Run.
-- ============================================================

alter table missions add column if not exists ordine int;
alter table missions add column if not exists attesa_minuti int;

-- imposta la sequenza sulle missioni già scritte
update missions set ordine = 1, attesa_minuti = 5    where titolo = 'Presentatevi in chat';
update missions set ordine = 2, attesa_minuti = 1440 where titolo = 'Il sondaggio del gruppo';
update missions set ordine = 3, attesa_minuti = 1440 where titolo = 'Scegliete un nome al gruppo';
update missions set ordine = 4, attesa_minuti = 4320 where titolo = 'Il primo incontro';
update missions set ordine = 5, attesa_minuti = 4320 where titolo = 'Tramonto al Pincio';
update missions set ordine = 6, attesa_minuti = 4320 where titolo = 'Un caffè insieme in ateneo';
update missions set ordine = 7, attesa_minuti = 5760 where titolo = 'La caccia al citofono strano';
update missions set ordine = 8, attesa_minuti = 4320 where titolo = 'Colazione da matricole';
update missions set ordine = 9, attesa_minuti = 5760 where titolo = 'Il nasone più lontano';
update missions set ordine = 10, attesa_minuti = 5760 where titolo = 'Uscita serale';
update missions set ordine = 11, attesa_minuti = 4320 where titolo = 'Chiedete l''ora a uno sconosciuto';
update missions set ordine = 12, attesa_minuti = 4320 where titolo = 'Uno strappo insieme';
update missions set ordine = 13, attesa_minuti = 10080 where titolo = 'Serata a casa di qualcuno';
update missions set ordine = 14, attesa_minuti = 5760 where titolo = 'Rubate una parola';

-- ---------- la funzione che controlla e assegna ----------
create or replace function assegna_missioni_dovute()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  grp record;
  prossima record;
  ultimo_assegnato timestamptz;
  citta_grp text;
  assegnazioni jsonb := '[]'::jsonb;
  subs_json jsonb;
begin
  for grp in select g.id, g.segment_key, g.created_at from groups g where g.stato = 'attivo' loop

    citta_grp := case
      when split_part(grp.segment_key, '|', 1) = 'sapienza università di roma' then 'Roma'
      when split_part(grp.segment_key, '|', 1) = 'università di perugia' then 'Perugia'
      else null
    end;

    select max(gm.assegnata_il) into ultimo_assegnato
    from group_missions gm
    join missions m on m.id = gm.mission_id
    where gm.group_id = grp.id and m.ordine is not null;

    if ultimo_assegnato is null then
      ultimo_assegnato := grp.created_at;
    end if;

    select m.* into prossima
    from missions m
    where m.ordine is not null
      and m.attiva = true
      and (m.citta is null or (citta_grp is not null and lower(m.citta) = lower(citta_grp)))
      and not exists (
        select 1 from group_missions gm2 where gm2.group_id = grp.id and gm2.mission_id = m.id
      )
    order by m.ordine asc
    limit 1;

    if prossima.id is not null
       and now() >= ultimo_assegnato + make_interval(mins => prossima.attesa_minuti) then
      insert into group_missions (group_id, mission_id, scadenza)
      values (grp.id, prossima.id, now() + interval '4 days')
      on conflict (group_id, mission_id) do nothing;

      select coalesce(jsonb_agg(jsonb_build_object(
               'endpoint', ps.endpoint, 'p256dh', ps.p256dh, 'auth', ps.auth
             )), '[]'::jsonb)
      into subs_json
      from push_subscriptions ps
      join group_members gmem on gmem.user_id = ps.user_id
      where gmem.group_id = grp.id;

      assegnazioni := assegnazioni || jsonb_build_object(
        'group_id', grp.id,
        'titolo', prossima.titolo,
        'punti', prossima.punti,
        'subs', subs_json
      );
    end if;

  end loop;

  return jsonb_build_object('ok', true, 'assegnazioni', assegnazioni);
end;
$$;
