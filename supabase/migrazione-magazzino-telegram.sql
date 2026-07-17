-- ============================================================
-- MAISOLA — migrazione: magazzino automatico dei gruppi Telegram
-- Appena il bot entra in un gruppo, si registra da solo qui —
-- niente più /id da scrivere a mano, niente più copia-incolla.
-- Incolla in Supabase → SQL Editor → Run.
-- ============================================================

create table if not exists telegram_pool (
  id uuid primary key default gen_random_uuid(),
  chat_id text not null unique,
  titolo text,
  invite_link text,
  assegnato_a_group_id uuid references groups(id) on delete set null,
  creato_il timestamptz not null default now()
);

alter table telegram_pool enable row level security;

drop policy if exists "solo admin legge il magazzino" on telegram_pool;
create policy "solo admin legge il magazzino" on telegram_pool
  for select using (is_admin());

drop policy if exists "solo admin assegna dal magazzino" on telegram_pool;
create policy "solo admin assegna dal magazzino" on telegram_pool
  for update using (is_admin()) with check (is_admin());

-- Il bot registra i gruppi nuovi tramite questa funzione, chiamata dal
-- webhook senza una sessione utente (nessun login, è un sistema esterno
-- fidato — Telegram, non una persona). Per questo è "security definer":
-- gira con permessi propri invece di quelli di chi la chiama.
create or replace function registra_gruppo_telegram(
  p_chat_id text,
  p_titolo text,
  p_invite_link text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into telegram_pool (chat_id, titolo, invite_link)
  values (p_chat_id, p_titolo, p_invite_link)
  on conflict (chat_id) do update
    set titolo = excluded.titolo,
        invite_link = coalesce(excluded.invite_link, telegram_pool.invite_link);
end;
$$;

-- L'admin assegna un gruppo del magazzino a un gruppo Maisola: aggiorna
-- entrambe le tabelle in un colpo solo, così non si scollegano mai.
create or replace function assegna_gruppo_telegram(p_pool_id uuid, p_group_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  riga telegram_pool%rowtype;
begin
  if not is_admin() then
    return jsonb_build_object('ok', false, 'motivo', 'solo un admin può farlo');
  end if;

  select * into riga from telegram_pool where id = p_pool_id;
  if not found then
    return jsonb_build_object('ok', false, 'motivo', 'gruppo del magazzino non trovato');
  end if;
  if riga.assegnato_a_group_id is not null then
    return jsonb_build_object('ok', false, 'motivo', 'questo gruppo Telegram è già assegnato');
  end if;

  update telegram_pool set assegnato_a_group_id = p_group_id where id = p_pool_id;
  update groups set telegram_chat_id = riga.chat_id, chat_link = coalesce(riga.invite_link, chat_link)
    where id = p_group_id;

  return jsonb_build_object('ok', true);
end;
$$;
