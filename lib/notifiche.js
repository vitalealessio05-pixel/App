import { supabase } from './supabase';

export async function notificaGruppo(groupId, { title, body, url = '/home' }) {
  try {
    const sb = supabase();

    const { data: membri, error: errMembri } = await sb
      .from('group_members')
      .select('user_id')
      .eq('group_id', groupId);

    if (errMembri) return { ok: false, motivo: 'lettura membri fallita: ' + errMembri.message };

    const userIds = (membri || []).map((m) => m.user_id);
    if (userIds.length === 0) return { ok: false, motivo: 'nessun membro nel gruppo' };

    const { data: subs, error: errSubs } = await sb
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .in('user_id', userIds);

    if (errSubs) return { ok: false, motivo: 'lettura iscrizioni fallita: ' + errSubs.message };
    if (!subs || subs.length === 0) return { ok: false, motivo: 'nessuno del gruppo ha attivato le notifiche' };

    const { data: { session } } = await sb.auth.getSession();

    const res = await fetch('/api/notify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      body: JSON.stringify({ subscriptions: subs, title, body, url }),
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) return { ok: false, motivo: json.error || `errore server (${res.status})` };
    return { ok: true, motivo: `inviate ${json.inviate}/${json.totali}` };
  } catch (e) {
    console.error('notifica gruppo:', e);
    return { ok: false, motivo: e?.message || 'errore imprevisto' };
  }
}
