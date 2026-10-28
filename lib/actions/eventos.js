'use server';

import { revalidatePath } from 'next/cache';
import { requireProfile, isTeam } from '@/lib/auth';
import { dbError } from '@/lib/messages';
import { isDay } from '@/lib/dates';

const UUID = /^[0-9a-f-]{36}$/i;
const KINDS = ['Show', 'Ensaio', 'Entrevista', 'Lançamento', 'Viagem', 'Outro'];
const txt = (v, max) => String(v || '').trim().slice(0, max);

// Cria ou edita um compromisso. Devolve { ok } ou { error }; a tela fecha a janela sozinha.
export async function saveEvent(_prev, formData) {
  const { supabase, profile } = await requireProfile();
  const team = isTeam(profile);

  const id = String(formData.get('id') || '');
  const artistId = team ? String(formData.get('artist_id') || '') : profile.id;
  const kind = String(formData.get('kind') || 'Show');
  const title = txt(formData.get('title'), 120);
  const date = String(formData.get('date') || '');
  const time = String(formData.get('time') || '');
  const feeRaw = String(formData.get('fee') || '').replace(',', '.').trim();
  const fee = feeRaw === '' ? null : Number(feeRaw);

  if (!UUID.test(artistId)) return { error: 'Escolha o artista.' };
  if (!KINDS.includes(kind)) return { error: 'Escolha o tipo do compromisso.' };
  if (!title) return { error: 'Dê um título ao compromisso.' };
  if (!isDay(date)) return { error: 'Escolha a data.' };
  if (time && !/^\d{2}:\d{2}$/.test(time)) return { error: 'Horário inválido.' };
  if (fee !== null && (!Number.isFinite(fee) || fee < 0 || fee > 9999999)) return { error: 'Cachê inválido.' };

  const row = {
    artist_id: artistId,
    kind,
    title,
    date,
    time: time || null,
    place: txt(formData.get('place'), 120),
    city: txt(formData.get('city'), 80),
    fee,
    status: formData.get('status') === 'a confirmar' ? 'a confirmar' : 'confirmado',
    notes: txt(formData.get('notes'), 300),
  };

  let error;
  if (id) {
    if (!UUID.test(id)) return { error: 'Compromisso não encontrado.' };
    const res = await supabase.from('events').update(row).eq('id', id).select('id');
    error = res.error;
    if (!error && !res.data?.length) return { error: 'Você não tem permissão para alterar este compromisso.' };
  } else {
    ({ error } = await supabase.from('events').insert(row));
  }
  if (error) return { error: dbError(error) };

  revalidatePath('/agenda/artistas');
  revalidatePath('/painel');
  return { ok: true };
}

export async function deleteEvent(_prev, formData) {
  const { supabase } = await requireProfile();
  const id = String(formData.get('id') || '');
  if (!UUID.test(id)) return { error: 'Compromisso não encontrado.' };
  const { data, error } = await supabase.from('events').delete().eq('id', id).select('id');
  if (error) return { error: dbError(error) };
  if (!data?.length) return { error: 'Você não tem permissão para excluir este compromisso.' };
  revalidatePath('/agenda/artistas');
  revalidatePath('/painel');
  return { ok: true };
}
