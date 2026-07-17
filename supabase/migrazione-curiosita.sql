-- ============================================================
-- MAISOLA — migrazione: campo "rompighiaccio" in registrazione
-- Una cosa buffa/interessante su di sé, mostrata al gruppo appena
-- si forma e utile a te per scrivere il primo messaggio a mano
-- nel test di agosto, prima che esista il bot.
-- Incolla in Supabase → SQL Editor → Run.
-- ============================================================

alter table profiles add column if not exists curiosita text;
