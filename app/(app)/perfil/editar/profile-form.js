'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import Avatar from '@/components/avatar';
import { updateProfile } from '@/lib/actions/perfil';
import { createClient } from '@/lib/supabase/client';
import { PROFILE_COLORS } from '@/lib/colors';

// Reduz a foto para 480×480 antes de enviar
function shrink(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const size = 480;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const m = Math.min(img.width, img.height);
      canvas.getContext('2d').drawImage(img, (img.width - m) / 2, (img.height - m) / 2, m, m, 0, 0, size, size);
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('foto'))), 'image/jpeg', 0.85);
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => reject(new Error('foto'));
    img.src = URL.createObjectURL(file);
  });
}

export default function ProfileForm({ profile }) {
  const [state, action, pending] = useActionState(updateProfile, null);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || '');
  const [color, setColor] = useState(profile.color);
  const [uploading, setUploading] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const artist = profile.role === 'artist';

  async function onPhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoError('');
    setUploading(true);
    try {
      const blob = await shrink(file);
      const supabase = createClient();
      const path = `${profile.id}/${Date.now()}.jpg`;
      const { error } = await supabase.storage.from('avatars').upload(path, blob, { contentType: 'image/jpeg', upsert: false });
      if (error) throw error;
      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      setAvatarUrl(data.publicUrl);
    } catch {
      setPhotoError('Não deu para enviar a foto. Tente outra imagem.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  return (
    <form action={action} className="card form">
      <input type="hidden" name="avatar_url" value={avatarUrl} />
      <input type="hidden" name="color" value={color} />

      <div className="field full photo-row">
        <Avatar p={{ ...profile, avatar_url: avatarUrl, color }} size="lg" />
        <div className="stack tight">
          <label htmlFor="pf-photo" className="btn sm">
            {uploading ? 'Enviando…' : avatarUrl ? 'Trocar foto' : 'Enviar foto'}
          </label>
          <input id="pf-photo" type="file" accept="image/*" onChange={onPhoto} className="sr-only" disabled={uploading} />
          {avatarUrl ? (
            <button type="button" className="linkbtn" onClick={() => setAvatarUrl('')}>
              Remover foto
            </button>
          ) : null}
          {photoError ? <span className="err">{photoError}</span> : null}
        </div>
      </div>

      {artist ? (
        <div className="field">
          <label htmlFor="pf-stage">Nome artístico</label>
          <input id="pf-stage" name="stage_name" defaultValue={profile.stage_name} maxLength={80} required />
        </div>
      ) : (
        <div className="field">
          <label htmlFor="pf-title">Função</label>
          <input id="pf-title" name="title" defaultValue={profile.title} maxLength={60} placeholder="Ex.: Técnico de som" />
        </div>
      )}
      <div className="field">
        <label htmlFor="pf-name">Nome</label>
        <input id="pf-name" name="name" defaultValue={profile.name} maxLength={80} required />
      </div>
      <div className="field">
        <label htmlFor="pf-city">Cidade</label>
        <input id="pf-city" name="city" defaultValue={profile.city} maxLength={80} placeholder="Ex.: Rio de Janeiro, RJ" />
      </div>
      {artist ? (
        <div className="field">
          <label htmlFor="pf-genres">Gêneros (separe por vírgula)</label>
          <input id="pf-genres" name="genres" defaultValue={(profile.genres || []).join(', ')} maxLength={200} placeholder="Ex.: Trap, Drill" />
        </div>
      ) : null}
      <div className="field full">
        <label htmlFor="pf-bio">Bio</label>
        <textarea id="pf-bio" name="bio" defaultValue={profile.bio} maxLength={600} rows={4} />
      </div>
      <div className="field">
        <label htmlFor="pf-ig">Instagram</label>
        <input id="pf-ig" name="instagram" defaultValue={profile.instagram} placeholder="@seuperfil" />
      </div>
      <div className="field">
        <label htmlFor="pf-sp">Spotify (link)</label>
        <input id="pf-sp" name="spotify" defaultValue={profile.spotify} placeholder="https://open.spotify.com/artist/…" />
      </div>
      <div className="field">
        <label htmlFor="pf-yt">YouTube</label>
        <input id="pf-yt" name="youtube" defaultValue={profile.youtube} placeholder="@seucanal" />
      </div>
      <fieldset className="field full">
        <legend>Cor do perfil</legend>
        <div className="swatches">
          {PROFILE_COLORS.map((c) => (
            <button key={c} type="button" className={`sw ${color === c ? 'on' : ''}`} style={{ '--c': c }} onClick={() => setColor(c)} aria-label={`Cor ${c}`} aria-pressed={color === c} />
          ))}
        </div>
      </fieldset>

      {state?.error ? <p className="err full">{state.error}</p> : null}
      <div className="mact full">
        <Link href="/perfil" className="btn ghost">
          Cancelar
        </Link>
        <button className="btn pri" disabled={pending || uploading}>
          {pending ? 'Salvando…' : 'Salvar perfil'}
        </button>
      </div>
    </form>
  );
}
