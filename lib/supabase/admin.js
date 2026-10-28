import { createClient } from '@supabase/supabase-js';
import { supabaseServiceKey, supabaseUrl } from '@/lib/env';

// Cliente com a chave secreta. Só usar em ações do servidor que o admin dispara
// (convidar pessoas). Ignora as permissões do banco, por isso fica fora do navegador.
export function createAdminClient() {
  const key = supabaseServiceKey();
  if (!key) return null;
  return createClient(supabaseUrl(), key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
