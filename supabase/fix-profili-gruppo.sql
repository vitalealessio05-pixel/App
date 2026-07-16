-- FIX: i membri di un gruppo devono poter vedere i profili l'uno dell'altro.
-- Prima, un utente non-admin poteva leggere solo il proprio profilo:
-- questo faceva sparire gli altri membri dalla vista di chi non era admin.
-- Incolla ed esegui in Supabase → SQL Editor.

drop policy if exists "vedo i profili dei miei compagni di gruppo" on profiles;
create policy "vedo i profili dei miei compagni di gruppo" on profiles
  for select using (
    exists (
      select 1
      from group_members mio
      join group_members loro on loro.group_id = mio.group_id
      where mio.user_id = auth.uid()
        and loro.user_id = profiles.id
    )
  );
