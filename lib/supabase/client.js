import { createBrowserClient } from '@supabase/ssr';
import { supabaseAnonKey, supabaseUrl } from '@/lib/env';

// Cliente do Supabase usado no navegador (ex.: envio da foto de perfil).
export function createClient() {
  return createBrowserClient(
    supabaseUrl(),
    supabaseAnonKey()
  );
}
