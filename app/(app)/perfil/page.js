import Link from 'next/link';
import PageTop from '@/components/page-top';
import ProfileView from '@/components/profile-view';
import Icon from '@/components/icon';
import { requireProfile } from '@/lib/auth';

export const metadata = { title: 'Meu perfil' };

export default async function MeuPerfilPage() {
  const { supabase, profile, user } = await requireProfile();
  let sessions = [];
  if (profile.role === 'artist') {
    const { data } = await supabase.from('bookings').select('id, date, start_hour, duration, status, service_name').eq('artist_id', profile.id).order('date').order('start_hour');
    sessions = data || [];
  }

  return (
    <>
      <PageTop title="Meu perfil" subtitle={user.email} />
      <ProfileView
        p={profile}
        sessions={sessions}
        actions={
          <Link href="/perfil/editar" className="btn">
            <Icon name="edit" size={16} />
            Editar perfil
          </Link>
        }
      />
      <section className="card account">
        <div>
          <b>Conta</b>
          <p className="muted small">Troque a sua senha ou saia do app neste aparelho.</p>
        </div>
        <div className="row-actions">
          <Link href="/definir-senha" className="btn sm">
            Trocar senha
          </Link>
          <form action="/sair" method="post">
            <button className="btn sm ghost">
              <Icon name="sair" size={16} />
              Sair
            </button>
          </form>
        </div>
      </section>
    </>
  );
}
