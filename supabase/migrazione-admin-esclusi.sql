-- ============================================================
-- MAISOLA — migrazione: gli admin non contano come "in attesa"
-- Incolla in Supabase → SQL Editor → Run.
-- ============================================================

create or replace function conta_in_attesa(seg text)
returns int
language sql
security definer
set search_path = public
as $$
  select count(*)::int
  from profiles p
  where p.segment_key = seg
    and p.is_admin = false
    and not exists (
      select 1 from group_members gm
      join groups g on g.id = gm.group_id
      where gm.user_id = p.id and g.stato = 'attivo'
    );
$$;
