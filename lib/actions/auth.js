'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { siteUrl } from '@/lib/site';
import { authError, safeNext } from '@/lib/messages';

const clean = (v) => String(v || '').trim().toLowerCase();

export async function loginWithPassword(_prev, formData) {
  const email = clean(formData.get('email'));
  const password = String(formData.get('password') || '');
  if (!email || !password) return { error: 'Preencha o e-mail e a senha.', email };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: authError(error), email };

  redirect(safeNext(formData.get('next')));
}

export async function sendMagicLink(_prev, formData) {
  const email = clean(formData.get('email'));
  if (!email) return { error: 'Digite o seu e-mail.' };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false, emailRedirectTo: `${siteUrl()}/auth/confirm` },
  });
  // Não contamos se o e-mail existe ou não
  if (error && (error.code || '').includes('rate_limit')) return { error: authError(error), email };
  return { ok: 'Se esse e-mail tiver conta, o link de acesso chega em instantes. Confira também o spam.', email };
}

export async function sendPasswordReset(_prev, formData) {
  const email = clean(formData.get('email'));
  if (!email) return { error: 'Digite o seu e-mail.' };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl()}/auth/confirm?next=/definir-senha`,
  });
  if (error && (error.code || '').includes('rate_limit')) return { error: authError(error), email };
  return { ok: 'Se esse e-mail tiver conta, enviamos um link para criar uma nova senha.', email };
}

export async function updatePassword(_prev, formData) {
  const password = String(formData.get('password') || '');
  const confirm = String(formData.get('confirm') || '');
  if (password.length < 8) return { error: 'A senha precisa ter pelo menos 8 caracteres.' };
  if (password !== confirm) return { error: 'As duas senhas não são iguais.' };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?erro=link');

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: authError(error) };

  redirect('/painel?msg=senha');
}
