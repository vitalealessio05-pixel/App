import webpush from 'web-push';

webpush.setVapidDetails(
  'mailto:' + (process.env.VAPID_CONTACT_EMAIL || 'noreply@example.com'),
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

export async function POST(request) {
  try {
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
