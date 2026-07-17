'use client';

import { useEffect, useState } from 'react';

function isIOS() {
  if (typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isAndroid() {
  if (typeof navigator === 'undefined') return false;
  return /android/i.test(navigator.userAgent);
}

function isStandalone() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

export default function InstallaApp() {
  const [piattaforma, setPiattaforma] = useState(null); // 'ios' | 'android' | 'altro' | null
  const [installata, setInstallata] = useState(true);
  const [promptEvento, setPromptEvento] = useState(null);
  const [installando, setInstallando] = useState(false);

  useEffect(() => {
    setInstallata(isStandalone());
    if (isIOS()) setPiattaforma('ios');
    else if (isAndroid()) setPiattaforma('android');
    else setPiattaforma('altro');

    function onBeforeInstall(e) {
      e.preventDefault();
      setPromptEvento(e);
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstall);

    function onInstalled() {
      setInstallata(true);
    }
    window.addEventListener('appinstalled', onInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  async function installaAndroid() {
    if (!promptEvento) return;
    setInstallando(true);
    promptEvento.prompt();
    await promptEvento.userChoice;
    setPromptEvento(null);
    setInstallando(false);
  }

  if (installata || !piattaforma || piattaforma === 'altro') return null;

  return (
    <div className="card d1" style={{ background: 'var(--iris)' }}>
      <p className="eyebrow" style={{ color: 'rgba(255,255,255,.7)' }}>Un passo prima delle notifiche</p>
      <h2 className="display" style={{ fontSize: 18, marginTop: 8, color: '#fff' }}>
        Installa Maisola sul telefono
      </h2>
      <p style={{ fontSize: 13.5, lineHeight: 1.55, color: 'rgba(255,255,255,.88)', marginTop: 8 }}>
        Senza questo passo le notifiche {piattaforma === 'ios' ? 'su iPhone non funzionano affatto' : 'possono non arrivare sempre'}.
        Richiede 15 secondi.
      </p>

      {piattaforma === 'ios' && (
        <ol style={{ margin: '14px 0 0', paddingLeft: 20, color: '#fff', fontSize: 13.5, lineHeight: 1.9 }}>
          <li>Apri Maisola da <b>Safari</b> (non da un altro browser)</li>
          <li>Tocca l'icona <b>Condividi</b> in basso</li>
          <li>Scorri e scegli <b>"Aggiungi a Home"</b></li>
          <li>Da ora in poi apri Maisola dall'icona nuova, non da Safari</li>
        </ol>
      )}

      {piattaforma === 'android' && promptEvento && (
        <button className="btn" style={{ background: '#fff', color: 'var(--iris)' }}
                onClick={installaAndroid} disabled={installando}>
          {installando ? 'Un attimo…' : 'Installa ora'}
        </button>
      )}

      {piattaforma === 'android' && !promptEvento && (
        <ol style={{ margin: '14px 0 0', paddingLeft: 20, color: '#fff', fontSize: 13.5, lineHeight: 1.9 }}>
          <li>Tocca i <b>tre puntini</b> in alto a destra del browser</li>
          <li>Scegli <b>"Installa app"</b> o <b>"Aggiungi a schermata Home"</b></li>
          <li>Conferma</li>
        </ol>
      )}
    </div>
  );
}
