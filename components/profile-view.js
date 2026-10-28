import Avatar from './avatar';
import { MESF, fmtDay, hrs, parseDay, todaySP } from '@/lib/dates';

function handleUrl(kind, value) {
  const v = (value || '').trim();
  if (!v) return null;
  if (/^https?:\/\//i.test(v)) return v;
  if (kind === 'instagram') return `https://instagram.com/${v.replace(/^@/, '')}`;
  if (kind === 'youtube') return v.startsWith('youtube.com') || v.startsWith('www.') ? `https://${v}` : `https://youtube.com/${v.startsWith('@') ? v : '@' + v}`;
  return null;
}

// Ondas decorativas do banner, sempre iguais para a mesma pessoa
function Wave({ seed }) {
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const rand = () => {
    h = (h + 0x6d2b79f5) >>> 0;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const n = 90;
  const w = 1200 / n;
  const bars = Array.from({ length: n }, (_, i) => {
    const env = Math.sin((i / n) * Math.PI) * 0.7 + 0.3;
    const v = (18 + rand() * 82) * env;
    return <rect key={i} x={(i * w + 1).toFixed(1)} y={(110 - v).toFixed(1)} width={(w - 3).toFixed(1)} height={v.toFixed(1)} rx="2" />;
  });
  return (
    <svg viewBox="0 0 1200 110" preserveAspectRatio="none" aria-hidden="true">
      <g className="wave-bars">{bars}</g>
    </svg>
  );
}

export default function ProfileView({ p, sessions = [], actions = null }) {
  const today = todaySP();
  const artist = p.role === 'artist';
  const live = sessions.filter((b) => b.status !== 'cancelado');
  const done = live.filter((b) => b.status === 'confirmado' && b.date <= today);
  const upcoming = live.filter((b) => b.date >= today).slice(0, 5);
  const since = p.created_at ? parseDay(p.created_at.slice(0, 10)) : null;
  const links = [
    ['Instagram', p.instagram, handleUrl('instagram', p.instagram)],
    ['Spotify', p.spotify, /^https?:\/\//i.test(p.spotify || '') ? p.spotify : null],
    ['YouTube', p.youtube, handleUrl('youtube', p.youtube)],
  ].filter((l) => l[1]);

  return (
    <article className="prof" style={{ '--c': p.color }}>
      <div className="banner">
        <Wave seed={p.id} />
      </div>
      <div className="prof-head">
        <Avatar p={p} size="xl" />
        <div className="prof-name">
          <h2>{artist ? p.stage_name || p.name : p.name}</h2>
          <div className="mono small muted">
            {[artist && p.stage_name && p.stage_name !== p.name ? p.name : null, !artist ? p.title || 'Equipe' : null, p.city || null, since ? `no Xeque Mate desde ${MESF[since.getUTCMonth()]} de ${since.getUTCFullYear()}` : null]
              .filter(Boolean)
              .join(' · ')}
          </div>
        </div>
        {actions ? <div className="prof-actions">{actions}</div> : null}
      </div>
      {p.genres?.length ? (
        <div className="chips prof-chips">
          {p.genres.map((g) => (
            <span key={g} className="chip">
              {g}
            </span>
          ))}
        </div>
      ) : null}

      {artist ? (
        <div className="pstats">
          <div>
            <b>{done.length}</b>
            <span className="label">Sessões feitas</span>
          </div>
          <div>
            <b>{done.reduce((s, b) => s + b.duration, 0)}h</b>
            <span className="label">No estúdio</span>
          </div>
          <div>
            <b>{upcoming.length}</b>
            <span className="label">Próximas</span>
          </div>
        </div>
      ) : null}

      <div className="prof-body">
        <div className="stack">
          <span className="label">Sobre</span>
          <p className="bio">{p.bio || (artist ? 'Este artista ainda não escreveu a bio.' : 'Sem descrição.')}</p>
        </div>
        <div className="stack">
          {links.length ? (
            <>
              <span className="label">Redes</span>
              <div className="links">
                {links.map(([label, text, url]) => (
                  <div key={label}>
                    <span>{label}</span>
                    {url ? (
                      <a href={url} target="_blank" rel="noreferrer">
                        {text}
                      </a>
                    ) : (
                      <span>{text}</span>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : null}
          {artist ? (
            <>
              <span className="label">Próximas sessões no estúdio</span>
              <div className="list">
                {upcoming.length ? (
                  upcoming.map((b) => (
                    <div key={b.id} className="row">
                      <div className="grow">
                        <b>{b.service_name}</b>
                        <span>{b.status === 'pendente' ? 'Aguardando aprovação' : 'Confirmada'}</span>
                      </div>
                      <div className="when">
                        <b>{b.date === today ? 'Hoje' : fmtDay(b.date)}</b>
                        {hrs(b.start_hour, b.duration)}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="empty">Nada marcado.</p>
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </article>
  );
}
