import { inviaMessaggioTelegram } from '../../../lib/telegram';

export async function POST(request) {
  try {
    const { chatId, testo } = await request.json();

    if (!chatId || !testo) {
      return Response.json({ ok: false, motivo: 'manca chatId o testo' }, { status: 400 });
    }

    const risultato = await inviaMessaggioTelegram(chatId, testo);
    return Response.json(risultato);
  } catch (e) {
    console.error('telegram-invia:', e);
    return Response.json({ ok: false, motivo: 'errore imprevisto' }, { status: 500 });
  }
}
