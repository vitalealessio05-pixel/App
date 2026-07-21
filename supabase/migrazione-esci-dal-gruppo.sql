-- ============================================================
-- MAISOLA — uscire dal gruppo
-- Nessuno deve sentirsi in trappola. La persona esce, i punti
-- già guadagnati restano nello storico del gruppo (non si toccano),
-- lei torna in sala d'attesa per un gruppo nuovo.
-- Incolla in Supabase → SQL Editor → Run.
-- ============================================================

create or replace function esci_dal_gruppo(p_group_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from group_members where group_id = p_group_id and user_id = auth.uid()
  ) then
    return jsonb_build_object('ok', false, 'motivo', 'non fai parte di questo gruppo');
  end if;

  delete from group_members where group_id = p_group_id and user_id = auth.uid();

  return jsonb_build_object('ok', true);
end;
$$;
