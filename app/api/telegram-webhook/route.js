import { inviaMessaggioTelegram } from '../../../lib/telegram';

export async function POST(request) {
  try {
    // verifica facoltativa: Telegram manda questo header se l'abbiamo configurato
    // al momento di impostare il webhook, per essere sicuri che le richieste
    // arrivino davvero da Telegram e non da chiunque trovi l'indirizzo.
    const secretAtteso = process.env.TELEGRAM_WEBHOOK_SECRET;
    if (secretAtteso) {
      const secretRicevuto = request.headers.get('x-telegram-bot-api-secret-token');
      if (secretRicevuto !== secretAtteso) {
        return Response.json({ ok: false }, { status: 401 });
      }
    }

    const update = await request.json();
    const msg = update.message;
    if (!msg || !msg.text) {
      return Response.json({ ok: true }); // niente da fare, ma rispondi 200 comunque
    }

    const testo = msg.text.trim();
    const chatId = msg.chat.id;

    if (testo === '/id' || testo.startsWith('/id@')) {
      await inviaMessaggioTelegram(
        chatId,
        `Il chat ID di questo gruppo è:\n<code>${chatId}</code>\n\nCopialo nel pannello admin di Maisola, nel campo "Telegram Chat ID" di questo gruppo.`
      );
    }

    if (testo === '/start' || testo.startsWith('/start@')) {
      await inviaMessaggioTelegram(
        chatId,
        `Ciao! Sono il bot di Maisola. Scrivi /id per avere il chat ID di questo gruppo.`
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
