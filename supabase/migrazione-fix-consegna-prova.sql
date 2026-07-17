-- ============================================================
-- MAISOLA — fix: uno studente non poteva mai segnare la propria
-- missione come "in verifica" dopo aver caricato la foto, perché
-- solo l'admin aveva il permesso di scrivere su group_missions.
-- Il bottone "Consegna la prova" restava bloccato su "Carico..."
-- per sempre, in silenzio, per chiunque non fosse admin.
-- Incolla in Supabase → SQL Editor → Run.
-- ============================================================

create or replace function segna_in_verifica(gm_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  riga group_missions%rowtype;
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

  if riga.stato <> 'attiva' then
    return jsonb_build_object('ok', false, 'motivo', 'questa missione non è più attiva');
  end if;

  update group_missions set stato = 'in_verifica' where id = gm_id;

  return jsonb_build_object('ok', true);
end;
$$;
