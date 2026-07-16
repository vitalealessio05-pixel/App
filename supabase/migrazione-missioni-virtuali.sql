-- ============================================================
-- MAISOLA — migrazione: missioni virtuali
-- Missioni leggere, senza foto, che un gruppo può completare da
-- solo (basta un tap) mentre aspetta di incontrarsi di persona.
-- Servono a far prendere confidenza con l'app e a far scattare
-- il game loop (missione -> punti -> notifica) prima dell'arrivo
-- fisico in citta.
-- Incolla in Supabase -> SQL Editor -> Run.
-- ============================================================

alter table missions add column if not exists virtuale boolean not null default false;

-- ---------- completamento di una missione virtuale ----------
create or replace function completa_missione_virtuale(gm_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  riga group_missions%rowtype;
  mis missions%rowtype;
  sono_nel_gruppo boolean;
begin
  select * into riga from group_missions where id = gm_id;
  if not found then
    return jsonb_build_object('ok', false, 'motivo', 'missione non trovata');
  end if;

  select exists (
    select 1 from group_members
    where group_id = riga.group_id and user_id = auth.uid()
  ) into sono_nel_gruppo;

  if not sono_nel_gruppo then
    return jsonb_build_object('ok', false, 'motivo', 'non fai parte di questo gruppo');
  end if;

  select * into mis from missions where id = riga.mission_id;

  if not mis.virtuale then
    return jsonb_build_object('ok', false, 'motivo', 'questa missione non e virtuale');
  end if;

  if riga.stato <> 'attiva' then
    return jsonb_build_object('ok', false, 'motivo', 'missione gia conclusa');
  end if;

  update group_missions set stato = 'approvata' where id = gm_id;

  insert into points_ledger (group_id, punti, motivo)
  values (riga.group_id, mis.punti, mis.titolo);

  return jsonb_build_object('ok', true, 'punti', mis.punti, 'titolo', mis.titolo);
end;
$$;

-- ---------- un paio di missioni virtuali di esempio ----------
insert into missions (titolo, descrizione, punti, virtuale) values
  ('Presentatevi in chat', 'Ognuno scrive nel gruppo una cosa a caso di se: una canzone, un piatto, una serie TV. Niente di serio, solo per rompere il ghiaccio prima di vedervi davvero.', 15, true),
  ('Il sondaggio del gruppo', 'In chat, decidete insieme: mare o montagna? Basta rispondere.', 10, true),
  ('Scegliete un nome al gruppo', 'Proponete e scegliete un soprannome per il vostro gruppo, da usare da qui in poi.', 10, true)
on conflict do nothing;
