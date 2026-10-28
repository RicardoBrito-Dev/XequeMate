'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireProfile } from '@/lib/auth';
import { dbError, withParam } from '@/lib/messages';

const BACK = '/configuracoes';

export async function saveSettings(formData) {
  const { supabase } = await requireProfile(['admin']);
  const open = Number.parseInt(formData.get('open_hour'), 10);
  const close = Number.parseInt(formData.get('close_hour'), 10);
  const name = String(formData.get('studio_name') || '').trim().slice(0, 80);
  if (!(open >= 0 && open <= 23 && close >= 1 && close <= 24 && close > open)) {
    redirect(withParam(BACK, 'erro', 'O horário de fechar precisa ser depois do de abrir.'));
  }
  const { error } = await supabase.from('settings').update({ open_hour: open, close_hour: close, studio_name: name || 'Xeque Mate Studio' }).eq('id', true);
  if (error) redirect(withParam(BACK, 'erro', dbError(error)));
  revalidatePath('/', 'layout');
  redirect(`${BACK}?msg=config`);
}

export async function saveService(formData) {
  const { supabase } = await requireProfile(['admin']);
  const id = String(formData.get('id') || '');
  const name = String(formData.get('name') || '').trim().slice(0, 40);
  const price = Number(String(formData.get('price') || '').replace(',', '.'));
  const active = formData.get('active') === 'true';
  if (!name || !(price >= 0)) redirect(withParam(BACK, 'erro', 'Preencha o nome e um preço válido.'));

  const row = { name, price_per_hour: price, active };
  const { error } = id
    ? await supabase.from('services').update(row).eq('id', id)
    : await supabase.from('services').insert({ ...row, sort: 99 });
  if (error) {
    const msg = error.code === '23505' ? 'Já existe um serviço com esse nome.' : dbError(error);
    redirect(withParam(BACK, 'erro', msg));
  }
  revalidatePath(BACK);
  redirect(`${BACK}?msg=servico`);
}
