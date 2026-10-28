import AuthShell from '@/components/auth-shell';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import PasswordForm from './password-form';

export const metadata = { title: 'Definir senha' };

export default async function SetPasswordPage({ searchParams }) {
  const sp = (await searchParams) || {};
  const { user, profile } = await getSession();
  if (!user) redirect('/login?erro=link');

  const welcome = sp.bemvindo === '1';
  const firstName = (profile?.name || '').split(' ')[0];
  return (
    <AuthShell
      title={welcome ? `Bem-vindo${firstName ? ', ' + firstName : ''}!` : 'Nova senha'}
      subtitle={welcome ? 'Crie a sua senha para entrar no app do estúdio.' : `Defina uma senha nova para ${user.email}.`}
    >
      <PasswordForm />
    </AuthShell>
  );
}
