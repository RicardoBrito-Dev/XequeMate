import AuthShell from '@/components/auth-shell';

export const metadata = { title: 'Sem acesso' };

export default function NoAccessPage() {
  return (
    <AuthShell title="Conta sem acesso" subtitle="Esta conta foi desativada ou ainda não foi liberada. Fale com o estúdio.">
      <form action="/sair" method="post">
        <button className="btn wide">Sair</button>
      </form>
    </AuthShell>
  );
}
