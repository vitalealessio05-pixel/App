import { createClient } from '@supabase/supabase-js';

/**
 * Verifica che la richiesta arrivi davvero da un admin loggato.
 * Il client deve mandare il token della sessione nell'header
 * Authorization: Bearer <token>. Ritorna true/false — non lancia
 * eccezioni, così chi chiama può semplicemente rifiutare la richiesta.
 */
export async function chiamanteEAdmin(request) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!token) return false;

    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );

    const { data: { user }, error: erroreUtente } = await sb.auth.getUser(token);
    if (erroreUtente || !user) return false;

    const { data: profilo, error: erroreProfilo } = await sb
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .maybeSingle();

    if (erroreProfilo || !profilo) return false;
    return profilo.is_admin === true;
  } catch (e) {
    console.error('verifica admin:', e);
    return false;
  }
}
