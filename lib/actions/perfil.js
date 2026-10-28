'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireProfile } from '@/lib/auth';
import { dbError } from '@/lib/messages';
import { PROFILE_COLORS } from '@/lib/colors';
import { supabaseUrl } from '@/lib/env';

const txt = (v, max) => String(v || '').trim().slice(0, max);

export async function updateProfile(_prev, formData) {
  const { supabase, profile } = await requireProfile();
  const artist = profile.role === 'artist';

  const color = String(formData.get('color') || '');
  const avatar = String(formData.get('avatar_url') || '');
  const avatarPrefix = `${supabaseUrl()}/storage/v1/object/public/avatars/${profile.id}/`;

  const changes = {
    name: txt(formData.get('name'), 80),
    stage_name: artist ? txt(formData.get('stage_name'), 80) : txt(formData.get('name'), 80),
    title: artist ? profile.title : txt(formData.get('title'), 60),
    city: txt(formData.get('city'), 80),
    bio: txt(formData.get('bio'), 600),
    genres: txt(formData.get('genres'), 200)
      .split(',')
      .map((g) => g.trim())
      .filter(Boolean)
      .slice(0, 6),
    instagram: txt(formData.get('instagram'), 120),
    spotify: txt(formData.get('spotify'), 200),
    youtube: txt(formData.get('youtube'), 200),
    color: PROFILE_COLORS.includes(color) ? color : profile.color,
    avatar_url: avatar === '' ? null : avatar.startsWith(avatarPrefix) ? avatar : profile.avatar_url,
  };

  if (!changes.name) return { error: 'Digite o seu nome.' };
  if (artist && !changes.stage_name) changes.stage_name = changes.name;

  const { error } = await supabase.from('profiles').update(changes).eq('id', profile.id);
  if (error) return { error: dbError(error) };

  revalidatePath('/', 'layout');
  redirect('/perfil?msg=perfil');
}
