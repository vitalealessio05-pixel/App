import webpush from 'web-push';
import { chiamanteEAdmin } from '../../../lib/verificaAdmin';

let configurato = false;

function assicuraConfigurazione() {
  if (configurato) return true;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return false;

  webpush.setVapidDetails(
    'mailto:' + (process.env.VAPID_CONTACT_EMAIL || 'noreply@example.com'),
    pub,
    priv
  );
  configurato = true;
  return true;
}

export async function POST(request) {
  try {
    if (!(await chiamanteEAdmin(request))) {
      return Response.json({ error: 'non autorizzato' }, { status: 401 });
    }

    if (!assicuraConfigurazione()) {
      return Response.json({ error: 'Notifiche non configurate: mancano le chiavi VAPID su Vercel.' }, { status: 500 });
    }

    const { subscriptions, title, body, url } = await request.json();

    if (!Array.isArray(subscriptions) || subscriptions.length === 0) {
      return Response.json({ inviate: 0 });
    }

    const payload = JSON.stringify({ title, body, url });

    const risultati = await Promise.allSettled(
      subscriptions.map((s) =>
        webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload
        )
      )
    );

    const inviate = risultati.filter((r) => r.status === 'fulfilled').length;
    return Response.json({ inviate, totali: subscriptions.length });
  } catch (e) {
    console.error('invio notifiche:', e);
    return Response.json({ error: 'invio fallito' }, { status: 500 });
  }
}
