'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

function base64ToUint8Array(base64) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const base64Safe = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64Safe);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

function isIOS() {
  if (typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandalone() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

export default function Notifiche() {
  const [supportato, setSupportato] = useState(true);
  const [stato, setStato] = useState('controllo'); // controllo | ios-non-installata | da-attivare | attive | negate | errore
  const [msg, setMsg] = useState('');

  useEffect(() => {
    async function check() {
      if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
        setSupportato(false);
        setStato('errore');
        return;
      }

      if (isIOS() && !isStandalone()) {
        setStato('ios-non-installata');
        return;
      }

      if (Notification.permission === 'denied') {
        setStato('negate');
        return;
      }

      try {
        const reg = await navigator.serviceWorker.register('/sw.js');
        const sub = await reg.pushManager.getSubscription();
        setStato(sub ? 'attive' : 'da-attivare');
      } catch (e) {
        console.error(e);
        setStato('errore');
      }
    }
    check();
  }, []);

  async function attiva() {
    setMsg('');
    try {
      const permesso = await Notification.requestPermission();
      if (permesso !== 'granted') {
        setStato('negate');
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!key) { setMsg('Notifiche non ancora configurate lato server.'); return; }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: base64ToUint8Array(key),
      });

      const sb = supabase();
      const { data: { session } } = await sb.auth.getSession();
      if (!session) return;

      const json = sub.toJSON();
      await sb.from('push_subscriptions').upsert(
        {
          user_id: session.user.id,
          endpoint: json.endpoint,
          p256dh: json.keys.p256dh,
          auth: json.keys.auth,
          piattaforma: isIOS() ? 'ios' : 'altro',
        },
        { onConflict: 'endpoint' }
      );

      setStato('attive');
    } catch (e) {
      console.error('attivazione notifiche:', e);
      setMsg('Non è riuscito. Riprova.');
      setStato('errore');
    }
  }

  if (!supportato) return null;

  if (stato === 'controllo') return null;

  if (stato === 'attive') {
    return null; // già attive: non serve occupare spazio per dirlo ogni volta
  }

  if (stato === 'ios-non-installata') {
    return (
      <div className="card d3" style={{ background: 'var(--sun-soft)' }}>
        <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: 'var(--sun-text)' }}>
          Per ricevere le notifiche su iPhone: tocca l'icona Condividi in Safari →
          "Aggiungi a Home". Poi apri Maisola da quell'icona, non da Safari.
        </p>
      </div>
    );
  }

  if (stato === 'negate') {
    return (
      <div className="card d3">
        <p className="muted" style={{ margin: 0 }}>
          Hai bloccato le notifiche per Maisola. Per riattivarle, vai nelle impostazioni
          del telefono o del browser e consenti le notifiche per questo sito.
        </p>
      </div>
    );
  }

  return (
    <div className="card d3">
      <p style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700 }}>
        Attiva le notifiche
      </p>
      <p className="muted" style={{ margin: '0 0 14px' }}>
        Ti avvisiamo appena il gruppo è pronto o una missione viene approvata.
      </p>
      <button className="btn-ghost" style={{ marginTop: 0 }} onClick={attiva}>
        Attiva
      </button>
      {msg && <p className="err">{msg}</p>}
    </div>
  );
}
