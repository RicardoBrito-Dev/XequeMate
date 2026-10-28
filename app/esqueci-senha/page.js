import AuthShell from '@/components/auth-shell';
import ForgotForm from './forgot-form';

export const metadata = { title: 'Esqueci a senha' };

export default function ForgotPage() {
  return (
    <AuthShell title="Esqueci a senha" subtitle="Digite o seu e-mail e enviamos um link para criar uma senha nova.">
      <ForgotForm />
    </AuthShell>
  );
}
