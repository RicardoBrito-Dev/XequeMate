import { cache } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const ROLE_LABEL = { admin: 'Admin', staff: 'Equipe', artist: 'Artista' };

export const isTeam = (p) => p?.role === 'admin' || p?.role === 'staff';

// Confere o login. Com as chaves novas do Supabase (JWKS) a checagem é local,
// sem ir até o servidor de autenticação a cada página.
export async function currentUser(supabase) {
  if (typeof supabase.auth.getClaims === 'function') {
    const { data, error } = await supabase.auth.getClaims();
    if (error || !data?.claims?.sub) return null;
    return { id: data.claims.sub, email: data.claims.email || '' };
  }
  const { data } = await supabase.auth.getUser();
  return data?.user ? { id: data.user.id, email: data.user.email || '' } : null;
}

// Usuário logado + perfil, uma vez por requisição
export const getSession = cache(async () => {
  const supabase = await createClient();
  const user = await currentUser(supabase);
  if (!user) return { supabase, user: null, profile: null };
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
  return { supabase, user, profile };
});

// Exige login (e, se informado, um dos papéis). Redireciona quando não pode.
export async function requireProfile(roles) {
  const s = await getSession();
  if (!s.user) redirect('/login');
  if (!s.profile || !s.profile.active) redirect('/sem-acesso');
  if (roles && !roles.includes(s.profile.role)) redirect('/painel');
  return s;
}
