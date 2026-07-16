'use client';

import { useEffect } from 'react';

export default function AggiornamentoAuto() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    let ricaricato = false;

    async function setup() {
      const reg = await navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' });

      // se un nuovo service worker prende il controllo, la versione è cambiata: ricarica
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (ricaricato) return;
        ricaricato = true;
        window.location.reload();
      });

      // controlla subito se c'è un aggiornamento in attesa
      if (reg.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' });

      reg.addEventListener('updatefound', () => {
        const nuovo = reg.installing;
        if (!nuovo) return;
        nuovo.addEventListener('statechange', () => {
          if (nuovo.state === 'installed' && navigator.serviceWorker.controller) {
            nuovo.postMessage({ type: 'SKIP_WAITING' });
          }
        });
      });

      // ricontrolla ogni volta che l'app torna in primo piano
      function ricontrolla() {
        if (document.visibilityState === 'visible') reg.update().catch(() => {});
      }
      document.addEventListener('visibilitychange', ricontrolla);
      window.addEventListener('focus', ricontrolla);

      // e comunque ogni 60 secondi mentre resta aperta
      const interval = setInterval(() => reg.update().catch(() => {}), 60000);
      return () => {
        document.removeEventListener('visibilitychange', ricontrolla);
        window.removeEventListener('focus', ricontrolla);
        clearInterval(interval);
      };
    }

    setup();
  }, []);

  return null;
}
