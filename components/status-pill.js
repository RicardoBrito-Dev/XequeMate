export default function StatusPill({ status }) {
  if (status === 'pendente') return <span className="pill warn">Aguardando aprovação</span>;
  if (status === 'cancelado') return <span className="pill bad">Cancelada</span>;
  return <span className="pill ok">Confirmada</span>;
}
