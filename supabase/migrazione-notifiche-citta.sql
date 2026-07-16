-- ============================================================
-- MAISOLA — migrazione: notifiche push + città di provenienza
-- Incolla in Supabase → SQL Editor → Run.
-- ============================================================

-- città di provenienza (facoltativa, solo informativa)
alter table profiles add column if not exists citta_provenienza text;

-- ---------- abbonamenti alle notifiche push ----------
create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  piattaforma text,
  created_at timestamptz not null default now()
);

create index if not exists push_subscriptions_user_idx on push_subscriptions(user_id);

alter table push_subscriptions enable row level security;

drop policy if exists "gestisco il mio abbonamento" on push_subscriptions;
create policy "gestisco il mio abbonamento" on push_subscriptions
  for all using (user_id = auth.uid() or is_admin())
  with check (user_id = auth.uid() or is_admin());

drop policy if exists "admin legge tutti gli abbonamenti" on push_subscriptions;
create policy "admin legge tutti gli abbonamenti" on push_subscriptions
  for select using (is_admin());
