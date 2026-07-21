-- ============================================================
-- MAISOLA — impostazioni globali + cancello data di arrivo
-- Le missioni fisiche non devono scadere prima che le persone
-- siano davvero arrivate in città. Aggiunge anche un canale
-- Telegram privato per avvisare l'admin quando qualcosa si rompe.
-- Incolla in Supabase → SQL Editor → Run.
-- ============================================================

create table if not exists impostazioni (
  id int primary key default 1,
  data_inizio_missioni_fisiche timestamptz,
  admin_telegram_chat_id text,
  constraint una_riga_sola check (id = 1)
);

insert into impostazioni (id) values (1) on conflict (id) do nothing;

alter table impostazioni enable row level security;

drop policy if exists "solo admin legge le impostazioni" on impostazioni;
create policy "solo admin legge le impostazioni" on impostazioni
  for select using (is_admin());

drop policy if exists "solo admin modifica le impostazioni" on impostazioni;
create policy "solo admin modifica le impostazioni" on impostazioni
  for update using (is_admin()) with check (is_admin());

-- il webhook (senza sessione utente) deve poter registrare il chat ID
-- privato dell'admin quando scrive /start al bot in privato
create or replace function registra_chat_admin(p_chat_id text)
returns void
language sql
security definer
set search_path = public
as $$
  update impostazioni set admin_telegram_chat_id = p_chat_id where id = 1;
$$;

-- letta da un sistema automatico (cron, webhook) per sapere dove
-- mandare un avviso se qualcosa si rompe
create or replace function leggi_chat_admin()
returns text
language sql
security definer
set search_path = public
as $$
  select admin_telegram_chat_id from impostazioni where id = 1;
$$;

-- ---------- aggiorna la sequenza: rispetta il cancello data di arrivo ----------
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
  v_data_inizio timestamptz;
begin
  select data_inizio_missioni_fisiche into v_data_inizio from impostazioni where id = 1;

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
      -- le missioni fisiche non partono prima della data di arrivo, se impostata
      and (m.virtuale = true or v_data_inizio is null or now() >= v_data_inizio)
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
