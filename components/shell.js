'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Icon from './icon';
import Avatar from './avatar';
import Flash from './flash';

const NAV = {
  admin: [
    ['/painel', 'Painel', 'painel'],
    ['/agenda', 'Agenda', 'agenda'],
    ['/pessoas', 'Pessoas', 'pessoas'],
    ['/configuracoes', 'Ajustes', 'config'],
    ['/perfil', 'Meu perfil', 'perfil'],
  ],
  staff: [
    ['/painel', 'Painel', 'painel'],
    ['/agenda', 'Agenda', 'agenda'],
    ['/pessoas', 'Pessoas', 'pessoas'],
    ['/perfil', 'Meu perfil', 'perfil'],
  ],
  artist: [
    ['/painel', 'Meu painel', 'painel'],
    ['/agenda', 'Agenda', 'agenda'],
    ['/perfil', 'Meu perfil', 'perfil'],
  ],
};

const ROLE_LABEL = { admin: 'Admin', staff: 'Equipe', artist: 'Artista' };

export default function Shell({ profile, children }) {
  const path = usePathname();
  const items = NAV[profile.role] || NAV.artist;
  const isOn = (href) => path === href || path.startsWith(href + '/');

  return (
    <div className="app">
      <aside className="side">
        <Link href="/painel" className="brand">
          <span className="king" aria-hidden="true">♚</span>
          <span>
            <b>Xeque Mate</b>
            <small>STUDIO</small>
          </span>
        </Link>
        <nav className="menu" aria-label="Seções">
          {items.map(([href, label, icon]) => (
            <Link key={href} href={href} className={`nav-a ${isOn(href) ? 'on' : ''}`} aria-current={isOn(href) ? 'page' : undefined}>
              <Icon name={icon} />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
        <div className="side-foot">
          <div className="who">
            <Avatar p={profile} size="sm" />
            <div>
              <b>{profile.stage_name || profile.name}</b>
              <span className="label">{ROLE_LABEL[profile.role]}</span>
            </div>
          </div>
          <form action="/sair" method="post">
            <button className="linkbtn">Sair</button>
          </form>
        </div>
      </aside>
      <main>{children}</main>
      <Suspense fallback={null}>
        <Flash />
      </Suspense>
    </div>
  );
}
