'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';

export default function Callback() {
  const router = useRouter();

  useEffect(() => {
    async function vai() {
      const sb = supabase();
      const { data: { session } } = await sb.auth.getSession();

      if (!session) { router.replace('/login'); return; }

      const { data: profile } = await sb
        .from('profiles')
        .select('id')
        .eq('id', session.user.id)
        .maybeSingle();

      router.replace(profile ? '/home' : '/onboarding');
    }
    const t = setTimeout(vai, 400);
    return () => clearTimeout(t);
  }, [router]);

  return <p className="muted">Ti stiamo facendo entrare…</p>;
}
