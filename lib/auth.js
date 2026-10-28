import { cache } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const ROLE_LABEL = { admin: 'Admin', staff: 'Equipe', artist: 'Artista' };

export const isTeam = (p) => p?.role === 'admin' || p?.role === 'staff';

// Usuário logado + perfil, uma vez por requisição
export const getSession = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
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
