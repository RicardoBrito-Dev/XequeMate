import Link from 'next/link';

// Abas no alto da agenda: horários do estúdio / compromissos dos artistas
export default function AgendaTabs({ active, team }) {
  return (
    <div className="seg" role="tablist">
      <Link href="/agenda" role="tab" aria-selected={active === 'estudio'} className={active === 'estudio' ? 'on' : ''}>
        Estúdio
      </Link>
      <Link href="/agenda/artistas" role="tab" aria-selected={active === 'artistas'} className={active === 'artistas' ? 'on' : ''}>
        {team ? 'Agenda dos artistas' : 'Minha agenda'}
      </Link>
    </div>
  );
}
