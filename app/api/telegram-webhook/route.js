import { createClient } from '@supabase/supabase-js';
import { inviaMessaggioTelegram } from '../../../lib/telegram';

function supabaseServer() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

async function generaLinkInvito(chatId) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/createChatInviteLink`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, name: 'Maisola' }),
    });
    const json = await res.json();
    if (json.ok) return json.result.invite_link;
  } catch (e) {
    console.error('generazione link invito:', e);
  }
  return null; // il bot probabilmente non è admin del gruppo: va bene, si aggiunge il link a mano
}

export async function POST(request) {
  try {
    const secretAtteso = process.env.TELEGRAM_WEBHOOK_SECRET;
    if (secretAtteso) {
      const secretRicevuto = request.headers.get('x-telegram-bot-api-secret-token');
      if (secretRicevuto !== secretAtteso) {
        return Response.json({ ok: false }, { status: 401 });
      }
    }

    const update = await request.json();

    // il bot è appena stato aggiunto (o rimosso) da un gruppo
    const membership = update.my_chat_member;
    if (membership) {
      const statoNuovo = membership.new_chat_member?.status;
      const statoVecchio = membership.old_chat_member?.status;
      const entrato = ['member', 'administrator'].includes(statoNuovo) &&
                       ['left', 'kicked'].includes(statoVecchio);

      if (entrato) {
        const chatId = String(membership.chat.id);
        const titolo = membership.chat.title || 'Gruppo senza nome';

        const link = statoNuovo === 'administrator' ? await generaLinkInvito(chatId) : null;

        const sb = supabaseServer();
        await sb.rpc('registra_gruppo_telegram', {
          p_chat_id: chatId,
          p_titolo: titolo,
          p_invite_link: link,
        });

        await inviaMessaggioTelegram(
          chatId,
          statoNuovo === 'administrator'
            ? `Questo gruppo è pronto per Maisola. Link d'invito generato automaticamente.`
            : `Questo gruppo è registrato per Maisola. Per generare il link d'invito da solo, rendimi amministratore del gruppo.`
        );
      }
      return Response.json({ ok: true });
    }

    const msg = update.message;
    if (!msg || !msg.text) {
      return Response.json({ ok: true }); // niente da fare, ma rispondi 200 comunque
    }

    const testo = msg.text.trim();
    const chatId = msg.chat.id;

    if (testo === '/id' || testo.startsWith('/id@')) {
      await inviaMessaggioTelegram(
        chatId,
        `Il chat ID di questo gruppo è:\n<code>${chatId}</code>\n\nDi solito non serve più: questo gruppo dovrebbe essere già nel magazzino automatico di Maisola.`
      );
    }

    if (testo === '/start' || testo.startsWith('/start@')) {
      await inviaMessaggioTelegram(
        chatId,
        `Ciao! Sono il bot di Maisola. Aggiungimi a un gruppo (meglio se come amministratore) e mi registro da solo.`
      );
    }

    return Response.json({ ok: true });
  } catch (e) {
    console.error('webhook telegram:', e);
    // rispondi comunque 200: se Telegram riceve un errore, riprova a mandare
    // lo stesso update all'infinito, meglio assorbire l'errore qui
    return Response.json({ ok: true });
  }
}
