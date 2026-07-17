-- ============================================================
-- MAISOLA — migrazione: bot Telegram
-- Serve un posto dove salvare il "chat ID" numerico di ogni
-- gruppo Telegram (diverso dal link d'invito): è quello che il
-- bot usa per mandare messaggi in quel gruppo specifico.
-- Incolla in Supabase → SQL Editor → Run.
-- ============================================================

alter table groups add column if not exists telegram_chat_id text;
