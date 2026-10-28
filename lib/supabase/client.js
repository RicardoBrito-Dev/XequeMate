import { createBrowserClient } from '@supabase/ssr';

// Cliente do Supabase usado no navegador (ex.: envio da foto de perfil).
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
