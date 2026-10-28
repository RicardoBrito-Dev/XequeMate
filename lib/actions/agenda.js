'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireProfile, isTeam } from '@/lib/auth';
import { dbError, safeNext, withParam } from '@/lib/messages';
import { isDay, todaySP, weekOffset } from '@/lib/dates';

const UUID = /^[0-9a-f-]{36}$/i;

function refresh() {
  revalidatePath('/agenda');
  revalidatePath('/painel');
}

// Pedido (artista) ou sessão confirmada (equipe)
export async function createBooking(_prev, formData) {
  const { supabase, profile } = await requireProfile();
  const team = isTeam(profile);

  const row = {
    artist_id: team ? String(formData.get('artist_id') || '') : profile.id,
    service_id: String(formData.get('service_id') || ''),
    date: String(formData.get('date') || ''),
    start_hour: Number.parseInt(formData.get('start_hour'), 10),
    duration: Number.parseInt(formData.get('duration'), 10),
    note: String(formData.get('note') || '').trim().slice(0, 300),
  };
  if (team) {
    row.status = 'confirmado';
    const eng = String(formData.get('engineer_id') || '');
    row.engineer_id = UUID.test(eng) ? eng : null;
  }

  if (!UUID.test(row.artist_id)) return { error: 'Escolha o artista.' };
  if (!UUID.test(row.service_id)) return { error: 'Escolha o serviço.' };
  if (!isDay(row.date)) return { error: 'Escolha a data.' };
  if (!Number.isInteger(row.start_hour) || !Number.isInteger(row.duration)) return { error: 'Escolha o horário e a duração.' };

  const { error } = await supabase.from('bookings').insert(row);
  if (error) return { error: dbError(error) };

  refresh();
  const week = weekOffset(todaySP(), row.date);
  redirect(`/agenda?semana=${week}&msg=${team ? 'sessao_marcada' : 'pedido'}`);
}

async function updateBooking(formData, changes, okCode) {
  const { supabase } = await requireProfile();
  const id = String(formData.get('id') || '');
  const back = safeNext(formData.get('back'), '/agenda');
  if (!UUID.test(id)) redirect(withParam(back, 'erro', 'Sessão não encontrada.'));

  const { data, error } = await supabase.from('bookings').update(changes).eq('id', id).select('id');
  if (error) redirect(withParam(back, 'erro', dbError(error)));
  if (!data?.length) redirect(withParam(back, 'erro', 'Você não tem permissão para alterar essa sessão.'));

  refresh();
  redirect(withParam(back, 'msg', okCode));
}

export async function approveBooking(formData) {
  await updateBooking(formData, { status: 'confirmado' }, 'aprovada');
}

export async function rejectBooking(formData) {
  await updateBooking(formData, { status: 'cancelado' }, 'recusada');
}

export async function cancelBooking(formData) {
  await updateBooking(formData, { status: 'cancelado' }, 'cancelada');
}

export async function setEngineer(formData) {
  const eng = String(formData.get('engineer_id') || '');
  await updateBooking(formData, { engineer_id: UUID.test(eng) ? eng : null }, 'tecnico');
}
