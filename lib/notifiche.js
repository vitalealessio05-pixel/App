import { supabase } from './supabase';

export async function notificaGruppo(groupId, { title, body, url = '/home' }) {
  try {
    const sb = supabase();

    const { data: membri } = await sb
      .from('group_members')
      .select('user_id')
      .eq('group_id', groupId);

    const userIds = (membri || []).map((m) => m.user_id);
    if (userIds.length === 0) return;

    const { data: subs } = await sb
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .in('user_id', userIds);

    if (!subs || subs.length === 0) return;

    await fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscriptions: subs, title, body, url }),
    });
  } catch (e) {
    console.error('notifica gruppo:', e);
  }
}
