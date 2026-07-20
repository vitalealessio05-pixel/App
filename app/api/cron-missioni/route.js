import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

function supabaseServer() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

let vapidPronto = false;
function assicuraVapid() {
  if (vapidPronto) return true;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return false;
  webpush.setVapidDetails(
    'mailto:' + (process.env.VAPID_CONTACT_EMAIL || 'noreply@example.com'),
    pub,
    priv
  );
  vapidPronto = true;
  return true;
}

async function notificaGruppoServer(titolo, subs) {
  if (!subs || subs.length === 0) return;
  if (!assicuraVapid()) return;

  const payload = JSON.stringify({ title: 'Nuova missione!', body: titolo, url: '/home' });

  await Promise.allSettled(
    subs.map((s) =>
      webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        payload
      )
    )
  );
}

async function esegui(request) {
  const segreto = process.env.CRON_SECRET;
  if (segreto) {
    const url = new URL(request.url);
    const fornito = request.headers.get('x-cron-secret') || url.searchParams.get('secret');
    if (fornito !== segreto) {
      return Response.json({ ok: false, motivo: 'non autorizzato' }, { status: 401 });
    }
  }

  try {
    const sb = supabaseServer();
    const { data, error } = await sb.rpc('assegna_missioni_dovute');
    if (error) {
      console.error('assegna_missioni_dovute:', error);
      return Response.json({ ok: false, motivo: error.message }, { status: 500 });
    }

    const assegnazioni = data?.assegnazioni || [];
    for (const a of assegnazioni) {
      await notificaGruppoServer(a.titolo, a.subs);
    }

    return Response.json({ ok: true, assegnate: assegnazioni.length });
  } catch (e) {
    console.error('cron-missioni:', e);
    return Response.json({ ok: false, motivo: 'errore imprevisto' }, { status: 500 });
  }
}

export async function GET(request) { return esegui(request); }
export async function POST(request) { return esegui(request); }
