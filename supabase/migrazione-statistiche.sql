-- ============================================================
-- MAISOLA — statistiche per il pannello admin
-- Una funzione sola che calcola: tasso di completamento e tempo
-- medio per ogni missione, e quali gruppi sono fermi da troppo
-- tempo su una missione senza aver consegnato nulla.
-- Incolla in Supabase → SQL Editor → Run.
-- ============================================================

create or replace function statistiche_admin()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  per_missione jsonb;
  gruppi_fermi jsonb;
begin
  if not is_admin() then
    return jsonb_build_object('ok', false, 'motivo', 'solo admin');
  end if;

  select coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb) into per_missione
  from (
    select
      m.titolo,
      count(gm.id) as assegnate,
      count(gm.id) filter (where gm.stato = 'approvata') as approvate,
      case when count(gm.id) > 0 then
        round(100.0 * count(gm.id) filter (where gm.stato = 'approvata') / count(gm.id), 0)
      else null end as tasso_completamento,
      round(
        (avg(
          extract(epoch from (s.created_at - gm.assegnata_il)) / 3600.0
        ) filter (where gm.stato = 'approvata'))::numeric, 1
      ) as tempo_medio_ore
    from missions m
    left join group_missions gm on gm.mission_id = m.id
    left join submissions s on s.group_mission_id = gm.id and s.stato = 'approvata'
    where m.ordine is not null
    group by m.id, m.titolo, m.ordine
    order by m.ordine
  ) t;

  select coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb) into gruppi_fermi
  from (
    select
      g.id as group_id,
      g.nome,
      m.titolo as missione_titolo,
      extract(day from (now() - gm.assegnata_il))::int as giorni_fermo
    from group_missions gm
    join groups g on g.id = gm.group_id
    join missions m on m.id = gm.mission_id
    where gm.stato = 'attiva'
      and gm.assegnata_il < now() - interval '3 days'
      and g.stato = 'attivo'
    order by gm.assegnata_il asc
  ) t;

  return jsonb_build_object('ok', true, 'per_missione', per_missione, 'gruppi_fermi', gruppi_fermi);
end;
$$;
