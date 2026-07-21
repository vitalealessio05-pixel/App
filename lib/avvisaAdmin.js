import { createClient } from '@supabase/supabase-js';
import { inviaMessaggioTelegram } from './telegram';

export async function avvisaAdminErrore(messaggio) {
  try {
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    const { data: chatId } = await sb.rpc('leggi_chat_admin');
    if (!chatId) return; // nessuno ha ancora scritto /start in privato al bot

    await inviaMessaggioTelegram(chatId, `⚠️ Maisola — qualcosa non va:\n\n${messaggio}`);
  } catch (e) {
    console.error('avviso admin fallito:', e);
  }
}
