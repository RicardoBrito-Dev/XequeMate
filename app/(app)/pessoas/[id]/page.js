import Link from 'next/link';
import { notFound } from 'next/navigation';
import ProfileView from '@/components/profile-view';
import { requireProfile } from '@/lib/auth';

export const metadata = { title: 'Perfil' };

export default async function PessoaPage({ params }) {
  const { id } = await params;
  const { supabase } = await requireProfile(['admin', 'staff']);

  const { data: p } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
  if (!p) notFound();

  let sessions = [];
  if (p.role === 'artist') {
    const { data } = await supabase.from('bookings').select('id, date, start_hour, duration, status, service_name').eq('artist_id', p.id).order('date').order('start_hour');
    sessions = data || [];
  }

  return (
    <>
      <div>
        <Link href="/pessoas" className="linkbtn">
          ← Voltar para Pessoas
        </Link>
      </div>
      <ProfileView p={p} sessions={sessions} />
    </>
  );
}
