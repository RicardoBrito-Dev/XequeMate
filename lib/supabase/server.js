import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Cliente do Supabase usado no servidor (páginas, ações e rotas).
// Age como o usuário logado, então todas as permissões do banco valem.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Chamado de um Server Component: o middleware renova a sessão.
          }
        },
      },
    }
  );
}
