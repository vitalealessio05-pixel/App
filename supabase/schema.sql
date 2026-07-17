-- ============================================================
-- MISSIO — schema database
-- Incolla tutto questo file nell'SQL Editor di Supabase e premi Run.
-- ============================================================

-- ---------- PROFILI ----------
create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  nome text not null,
  ateneo text not null,
  campus text not null,
  corso text not null,
  anno int not null default 1,
  disponibilita text not null check (disponibilita in ('settimana','weekend','entrambi')),
  conosce_nome text,
  segment_key text generated always as (
    lower(ateneo) || '|' || lower(campus) || '|' || lower(corso)
  ) stored,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists profiles_segment_idx on profiles(segment_key);

-- ---------- GRUPPI ----------
create table if not exists groups (
  id uuid primary key default gen_random_uuid(),
  segment_key text not null,
  nome text,
  chat_link text,
  stato text not null default 'attivo' check (stato in ('attivo','completato','sciolto')),
  ondata int not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists group_members (
  group_id uuid references groups on delete cascade,
  user_id uuid references profiles on delete cascade,
  primary key (group_id, user_id)
);

create index if not exists group_members_user_idx on group_members(user_id);

-- ---------- MISSIONI ----------
create table if not exists missions (
  id uuid primary key default gen_random_uuid(),
  titolo text not null unique,
  descrizione text not null,
  citta text,
  punti int not null default 100,
  attiva boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists group_missions (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups on delete cascade,
  mission_id uuid not null references missions on delete cascade,
  assegnata_il timestamptz not null default now(),
  scadenza timestamptz not null,
  stato text not null default 'attiva' check (stato in ('attiva','in_verifica','approvata','scaduta')),
  unique (group_id, mission_id)
);

create index if not exists group_missions_group_idx on group_missions(group_id);

-- ---------- SUBMISSION ----------
create table if not exists submissions (
  id uuid primary key default gen_random_uuid(),
  group_mission_id uuid not null references group_missions on delete cascade,
  foto_path text not null,
  caricata_da uuid not null references profiles on delete cascade,
  stato text not null default 'in_verifica' check (stato in ('in_verifica','approvata','rifiutata')),
  nota_admin text,
  created_at timestamptz not null default now()
);

create table if not exists submission_presenze (
  submission_id uuid references submissions on delete cascade,
  user_id uuid references profiles on delete cascade,
  primary key (submission_id, user_id)
);

-- ---------- PUNTI (ledger di gruppo) ----------
create table if not exists points_ledger (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups on delete cascade,
  submission_id uuid references submissions on delete set null,
  punti int not null,
  motivo text not null,
  created_at timestamptz not null default now()
);

create index if not exists points_group_idx on points_ledger(group_id);

-- ============================================================
-- FUNZIONI DI SUPPORTO
-- ============================================================

-- Quante persone sono in attesa (senza gruppo attivo) nel mio segmento
create or replace function conta_in_attesa(seg text)
returns int
language sql
security definer
set search_path = public
as $$
  select count(*)::int
  from profiles p
  where p.segment_key = seg
    and not exists (
      select 1 from group_members gm
      join groups g on g.id = gm.group_id
      where gm.user_id = p.id and g.stato = 'attivo'
    );
$$;

-- Soglia minima per formare i gruppi
create or replace function soglia_minima()
returns int language sql immutable as $$ select 9 $$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table profiles enable row level security;
alter table groups enable row level security;
alter table group_members enable row level security;
alter table missions enable row level security;
alter table group_missions enable row level security;
alter table submissions enable row level security;
alter table submission_presenze enable row level security;
alter table points_ledger enable row level security;

-- helper: sono admin?
create or replace function is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select coalesce((select is_admin from profiles where id = auth.uid()), false);
$$;

-- helper: appartengo a questo gruppo?
create or replace function in_gruppo(g uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (select 1 from group_members where group_id = g and user_id = auth.uid());
$$;

-- PROFILI
drop policy if exists "leggo il mio profilo" on profiles;
create policy "leggo il mio profilo" on profiles
  for select using (id = auth.uid() or is_admin());

drop policy if exists "creo il mio profilo" on profiles;
create policy "creo il mio profilo" on profiles
  for insert with check (id = auth.uid());

drop policy if exists "aggiorno il mio profilo" on profiles;
create policy "aggiorno il mio profilo" on profiles
  for update using (id = auth.uid());

-- GRUPPI
drop policy if exists "vedo i miei gruppi" on groups;
create policy "vedo i miei gruppi" on groups
  for select using (in_gruppo(id) or is_admin());

drop policy if exists "admin gestisce gruppi" on groups;
create policy "admin gestisce gruppi" on groups
  for all using (is_admin()) with check (is_admin());

-- MEMBRI
drop policy if exists "vedo i membri del mio gruppo" on group_members;
create policy "vedo i membri del mio gruppo" on group_members
  for select using (in_gruppo(group_id) or is_admin());

drop policy if exists "admin gestisce membri" on group_members;
create policy "admin gestisce membri" on group_members
  for all using (is_admin()) with check (is_admin());

-- MISSIONI (tutti leggono)
drop policy if exists "tutti leggono missioni" on missions;
create policy "tutti leggono missioni" on missions
  for select using (auth.uid() is not null);

drop policy if exists "admin gestisce missioni" on missions;
create policy "admin gestisce missioni" on missions
  for all using (is_admin()) with check (is_admin());

-- MISSIONI ASSEGNATE
drop policy if exists "vedo le missioni del mio gruppo" on group_missions;
create policy "vedo le missioni del mio gruppo" on group_missions
  for select using (in_gruppo(group_id) or is_admin());

drop policy if exists "admin assegna missioni" on group_missions;
create policy "admin assegna missioni" on group_missions
  for all using (is_admin()) with check (is_admin());

-- SUBMISSION
drop policy if exists "vedo le submission del mio gruppo" on submissions;
create policy "vedo le submission del mio gruppo" on submissions
  for select using (
    is_admin() or exists (
      select 1 from group_missions gm
      where gm.id = group_mission_id and in_gruppo(gm.group_id)
    )
  );

drop policy if exists "carico submission per il mio gruppo" on submissions;
create policy "carico submission per il mio gruppo" on submissions
  for insert with check (
    caricata_da = auth.uid() and exists (
      select 1 from group_missions gm
      where gm.id = group_mission_id and in_gruppo(gm.group_id)
    )
  );

drop policy if exists "admin gestisce submission" on submissions;
create policy "admin gestisce submission" on submissions
  for all using (is_admin()) with check (is_admin());

-- PRESENZE
drop policy if exists "vedo presenze del mio gruppo" on submission_presenze;
create policy "vedo presenze del mio gruppo" on submission_presenze
  for select using (
    is_admin() or exists (
      select 1 from submissions s
      join group_missions gm on gm.id = s.group_mission_id
      where s.id = submission_id and in_gruppo(gm.group_id)
    )
  );

drop policy if exists "segno presenze" on submission_presenze;
create policy "segno presenze" on submission_presenze
  for insert with check (
    exists (
      select 1 from submissions s
      where s.id = submission_id and s.caricata_da = auth.uid()
    )
  );

drop policy if exists "admin gestisce presenze" on submission_presenze;
create policy "admin gestisce presenze" on submission_presenze
  for all using (is_admin()) with check (is_admin());

-- PUNTI
drop policy if exists "vedo i punti del mio gruppo" on points_ledger;
create policy "vedo i punti del mio gruppo" on points_ledger
  for select using (in_gruppo(group_id) or is_admin());

drop policy if exists "admin assegna punti" on points_ledger;
create policy "admin assegna punti" on points_ledger
  for all using (is_admin()) with check (is_admin());

-- ============================================================
-- STORAGE (foto delle missioni)
-- ============================================================
insert into storage.buckets (id, name, public)
values ('prove', 'prove', false)
on conflict (id) do nothing;

drop policy if exists "carico le mie prove" on storage.objects;
create policy "carico le mie prove" on storage.objects
  for insert with check (bucket_id = 'prove' and auth.uid() is not null);

drop policy if exists "leggo le prove" on storage.objects;
create policy "leggo le prove" on storage.objects
  for select using (bucket_id = 'prove' and auth.uid() is not null);

-- ============================================================
-- MISSIONI DI ESEMPIO (luoghi pubblici gratuiti — Roma)
-- ============================================================
insert into missions (titolo, descrizione, citta, punti) values
  ('Il murales nascosto', 'Trovate un murales nel quartiere del vostro campus e fatevi una foto davanti. Bonus: scoprite chi lo ha dipinto.', 'Roma', 100),
  ('Colazione da matricole', 'Trovate il bar più vicino al campus con il cornetto migliore. Foto del tavolo con tutti i cornetti.', 'Roma', 100),
  ('La panchina con vista', 'Trovate un punto panoramico gratuito della città e fate una foto di gruppo con il panorama alle spalle.', 'Roma', 120),
  ('Il libro dimenticato', 'Andate insieme in una biblioteca del campus e trovate il libro più vecchio che riuscite. Foto con il libro.', 'Roma', 100)
on conflict (titolo) do nothing;
