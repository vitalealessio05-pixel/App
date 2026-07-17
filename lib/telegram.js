export async function inviaMessaggioTelegram(chatId, testo) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    return { ok: false, motivo: 'TELEGRAM_BOT_TOKEN non configurato su Vercel' };
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: testo,
        parse_mode: 'HTML',
      }),
    });

    const json = await res.json();
    if (!json.ok) {
      return { ok: false, motivo: json.description || 'Telegram ha rifiutato il messaggio' };
    }
    return { ok: true };
  } catch (e) {
    console.error('invio telegram:', e);
    return { ok: false, motivo: e?.message || 'errore di rete verso Telegram' };
  }
}
