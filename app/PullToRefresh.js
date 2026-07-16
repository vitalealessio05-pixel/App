'use client';

import { useEffect, useRef, useState } from 'react';

const SOGLIA = 72; // px da tirare giù prima che scatti

export default function PullToRefresh() {
  const [distanza, setDistanza] = useState(0);
  const [aggiornando, setAggiornando] = useState(false);
  const inizio = useRef(null);
  const attivo = useRef(false);

  useEffect(() => {
    function onStart(e) {
      const scrollTop = document.scrollingElement?.scrollTop ?? window.scrollY;
      if (scrollTop > 0 || aggiornando) { inizio.current = null; return; }
      inizio.current = e.touches[0].clientY;
      attivo.current = true;
    }

    function onMove(e) {
      if (!attivo.current || inizio.current === null) return;
      const delta = e.touches[0].clientY - inizio.current;
      if (delta <= 0) { setDistanza(0); return; }

      const scrollTop = document.scrollingElement?.scrollTop ?? window.scrollY;
      if (scrollTop > 0) { attivo.current = false; setDistanza(0); return; }

      const smorzata = delta < SOGLIA ? delta : SOGLIA + (delta - SOGLIA) * 0.25;
      setDistanza(smorzata);
    }

    function onEnd() {
      if (!attivo.current) return;
      attivo.current = false;
      if (distanza >= SOGLIA) {
        setAggiornando(true);
        setTimeout(() => window.location.reload(), 250);
      } else {
        setDistanza(0);
      }
      inizio.current = null;
    }

    window.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onEnd, { passive: true });
    return () => {
      window.removeEventListener('touchstart', onStart);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
    };
  }, [distanza, aggiornando]);

  const visibile = distanza > 4 || aggiornando;
  const pronto = distanza >= SOGLIA;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0,
      height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center',
      transform: `translateY(${visibile ? Math.min(distanza, SOGLIA) - 56 : -56}px)`,
      transition: attivo.current ? 'none' : 'transform .25s ease',
      zIndex: 998, pointerEvents: 'none',
    }}>
      <div style={{
        width: 30, height: 30, borderRadius: '50%',
        border: '3px solid var(--line)',
        borderTopColor: pronto || aggiornando ? 'var(--iris)' : 'var(--muted)',
        transform: aggiornando ? 'none' : `rotate(${distanza * 2.4}deg)`,
        animation: aggiornando ? 'spin .7s linear infinite' : 'none',
        transition: 'border-top-color .15s ease',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
