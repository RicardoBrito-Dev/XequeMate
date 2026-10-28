'use server';

import { randomInt } from 'node:crypto';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireProfile } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { siteUrl } from '@/lib/site';
import { dbError, withParam } from '@/lib/messages';

const ROLES = ['admin', 'staff', 'artist'];
const COLORS = ['#d98b6f', '#8fb8d8', '#b3a2db', '#d8b765', '#6fcf9f', '#e08a9a', '#c9b48f', '#9fc7b5'];

function tempPassword() {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 12; i++) out += chars[randomInt(chars.length)];
  return out.slice(0, 4) + '-' + out.slice(4, 8) + '-' + out.slice(8);
}

function inviteError(error) {
  const m = (error?.message || '').toLowerCase();
  const code = error?.code || '';
  if (code === 'email_exists' || m.includes('already been registered') || m.includes('already registered')) return 'Esse e-mail já tem conta no app.';
  if (code.includes('rate_limit') || m.includes('rate limit')) {
    return 'O Supabase atingiu o limite de e-mails do plano grátis. Configure um SMTP (veja o guia) ou crie com senha provisória.';
  }
  if (m.includes('sending') || m.includes('smtp') || m.includes('email')) {
    return 'O Supabase não conseguiu enviar o e-mail. Configure um SMTP (veja o guia) ou crie com senha provisória.';
  }
  return 'Não deu para criar a conta. Tente de novo.';
}

// Admin convida artista ou alguém da equipe
export async function inviteUser(_prev, formData) {
  await requireProfile(['admin']);

  const email = String(formData.get('email') || '').trim().toLowerCase();
  const name = String(formData.get('name') || '').trim().slice(0, 80);
  const stageName = String(formData.get('stage_name') || '').trim().slice(0, 80);
  const title = String(formData.get('title') || '').trim().slice(0, 60);
  const role = ROLES.includes(formData.get('role')) ? String(formData.get('role')) : 'artist';
  const mode = formData.get('mode') === 'senha' ? 'senha' : 'email';
  const keep = { email, name, stage_name: stageName, title, role, mode };

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'Digite um e-mail válido.', keep };
  if (!name) return { error: 'Digite o nome.', keep };

  const admin = createAdminClient();
  if (!admin) return { error: 'Falta a chave secreta do Supabase na Vercel (SUPABASE_SECRET_KEY ou SUPABASE_SERVICE_ROLE_KEY). Veja o guia de instalação.', keep };

  const meta = { name, stage_name: stageName || name };
  let userId;
  let password = null;

  if (mode === 'senha') {
    password = tempPassword();
    const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: meta });
    if (error) return { error: inviteError(error), keep };
    userId = data.user.id;
  } else {
    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
      data: meta,
      redirectTo: `${siteUrl()}/auth/confirm?next=/definir-senha`,
    });
    if (error) return { error: inviteError(error), keep };
    userId = data.user.id;
  }

  const { count } = await admin.from('profiles').select('id', { count: 'exact', head: true });
  const { error: upError } = await admin
    .from('profiles')
    .update({ role, name, stage_name: stageName || name, title: role === 'artist' ? '' : title, color: COLORS[(count || 0) % COLORS.length] })
    .eq('id', userId);
  if (upError) return { error: 'A conta foi criada, mas não deu para salvar o tipo de acesso. Ajuste na lista abaixo.', keep };

  revalidatePath('/pessoas');
  return { ok: true, email, name, password, mode };
}

// Admin muda o tipo de acesso ou bloqueia uma conta
export async function updateAccess(formData) {
  const { supabase } = await requireProfile(['admin']);
  const id = String(formData.get('id') || '');
  const role = String(formData.get('role') || '');
  const active = formData.get('active') === 'true';
  if (!ROLES.includes(role)) redirect(withParam('/pessoas', 'erro', 'Tipo de acesso inválido.'));

  const { data, error } = await supabase.from('profiles').update({ role, active }).eq('id', id).select('id');
  if (error) redirect(withParam('/pessoas', 'erro', dbError(error)));
  if (!data?.length) redirect(withParam('/pessoas', 'erro', 'Pessoa não encontrada.'));

  revalidatePath('/pessoas');
  redirect('/pessoas?msg=acesso');
}
