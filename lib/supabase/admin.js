import { createClient } from '@supabase/supabase-js';

// Cliente com a chave secreta. Só usar em ações do servidor que o admin dispara
// (convidar pessoas). Ignora as permissões do banco, por isso fica fora do navegador.
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return null;
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
