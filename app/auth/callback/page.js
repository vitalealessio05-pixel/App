'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';

export default function Callback() {
  const router = useRouter();

  useEffect(() => {
    async function vai() {
      try {
        const sb = supabase();
        const { data: { session } } = await sb.auth.getSession();
        if (!session) { router.replace('/login'); return; }

        const { data: profile } = await sb
          .from('profiles')
          .select('id')
          .eq('id', session.user.id)
          .maybeSingle();

        router.replace(profile ? '/home' : '/onboarding');
      } catch (e) {
        router.replace('/login');
      }
    }
    const t = setTimeout(vai, 500);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center', minHeight: '70vh' }}>
      <div className="stamp" style={{ marginBottom: 20 }}>Entro</div>
      <p className="muted">Ti stiamo facendo entrare…</p>
    </div>
  );
}
