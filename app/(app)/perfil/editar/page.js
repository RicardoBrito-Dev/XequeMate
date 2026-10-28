import PageTop from '@/components/page-top';
import ProfileForm from './profile-form';
import { requireProfile } from '@/lib/auth';

export const metadata = { title: 'Editar perfil' };

export default async function EditarPerfilPage() {
  const { profile } = await requireProfile();
  return (
    <>
      <PageTop title="Editar perfil" subtitle={profile.role === 'artist' ? 'É assim que o estúdio e a equipe veem você.' : 'Seus dados na equipe do estúdio.'} />
      <ProfileForm profile={profile} />
    </>
  );
}
