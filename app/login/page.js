import AuthShell from '@/components/auth-shell';
import LoginForm from './login-form';

export const metadata = { title: 'Entrar' };

const ERRORS = {
  link: 'Esse link expirou ou já foi usado. Peça um novo abaixo.',
};

export default async function LoginPage({ searchParams }) {
  const sp = (await searchParams) || {};
  return (
    <AuthShell title="Entrar" subtitle="Use o e-mail cadastrado pelo estúdio.">
      <LoginForm next={typeof sp.next === 'string' ? sp.next : ''} notice={ERRORS[sp.erro] || ''} />
    </AuthShell>
  );
}
