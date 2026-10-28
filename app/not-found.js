import Link from 'next/link';
import AuthShell from '@/components/auth-shell';

export default function NotFound() {
  return (
    <AuthShell title="Página não encontrada" subtitle="O endereço pode estar errado ou a página foi removida.">
      <Link href="/painel" className="btn pri wide">
        Ir para o painel
      </Link>
    </AuthShell>
  );
}
