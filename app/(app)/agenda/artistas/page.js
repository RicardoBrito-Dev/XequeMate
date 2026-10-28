import Link from 'next/link';
import AgendaTabs from '@/components/agenda-tabs';
import { requireProfile, isTeam } from '@/lib/auth';
import { MESF, addDays, dayKey, monthEnd, monthStart, parseDay, todaySP, weekStart } from '@/lib/dates';
import Eventos from './eventos';
import { EVENT_SELECT } from '@/lib/queries';
import Icon from '@/components/icon';

export const metadata = { title: 'Agenda dos artistas' };

const UUID = /^[0-9a-f-]{36}$/i;
const hhmm = (t) => (t ? String(t).slice(0, 5) : '');
const clean = (e) => ({ ...e, time: hhmm(e.time), fee: e.fee === null ? null : Number(e.fee) });

export default async function AgendaArtistasPage({ searchParams }) {
  const sp = (await searchParams) || {};
  const { supabase, profile } = await requireProfile();
  const team = isTeam(profile);

  const today = todaySP();
  const off = Number.parseInt(sp.mes || '0', 10) || 0;
  const t = parseDay(monthStart(today));
  const m0 = dayKey(new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() + off, 1)));
  const mEnd = monthEnd(m0);
  const gs = weekStart(m0);
  const ge = addDays(weekStart(mEnd), 6);

  // Admin/equipe podem filtrar por artista. Artista só enxerga o próprio (o banco também garante).
  const who = team ? (UUID.test(String(sp.artista || '')) ? String(sp.artista) : 'todos') : profile.id;
  const one = who !== 'todos';

  const filter = (q) => (one ? q.eq('artist_id', who) : q);
  const [{ data: evs }, { data: sess }, { data: nextEvs }, { data: nextSess }, artistsRes] = await Promise.all([
    filter(supabase.from('events').select(EVENT_SELECT).gte('date', gs).lte('date', ge).order('time', { nullsFirst: true })),
    one
      ? supabase.from('bookings').select('id, date, start_hour, duration, service_name, status').eq('artist_id', who).gte('date', gs).lte('date', ge).neq('status', 'cancelado')
      : Promise.resolve({ data: [] }),
    filter(supabase.from('events').select(EVENT_SELECT).gte('date', today).order('date').order('time', { nullsFirst: true }).limit(8)),
    one
      ? supabase.from('bookings').select('id, date, start_hour, duration, service_name, status').eq('artist_id', who).gte('date', today).neq('status', 'cancelado').order('date').order('start_hour').limit(8)
      : Promise.resolve({ data: [] }),
    team
      ? supabase.from('profiles').select('id, name, stage_name, color').eq('role', 'artist').eq('active', true).order('stage_name')
      : Promise.resolve({ data: [] }),
  ]);

  const artists = artistsRes.data || [];
  const sessions = (sess || []).map((b) => ({ ...b, time: `${String(b.start_hour).padStart(2, '0')}:00` }));
  const upcomingSessions = (nextSess || []).map((b) => ({ ...b, time: `${String(b.start_hour).padStart(2, '0')}:00` }));
  const mesLabel = `${MESF[parseDay(m0).getUTCMonth()]} ${parseDay(m0).getUTCFullYear()}`;
  const href = (o, a = who) => `/agenda/artistas?mes=${o}${team && a !== 'todos' ? `&artista=${a}` : ''}`;

  return (
    <>
      <Eventos
        title={team ? 'Agenda dos artistas' : 'Minha agenda'}
        subtitle={
          team
            ? 'Shows, ensaios, entrevistas e compromissos de cada artista.'
            : 'Seus shows, ensaios, entrevistas e o que mais precisar. As sessões no estúdio aparecem aqui sozinhas.'
        }
        key={`${m0}-${who}`}
        team={team}
        today={today}
        monthStart={m0}
        gridStart={gs}
        weeks={Math.round((Date.parse(ge) - Date.parse(gs)) / 864e5 / 7 + 1 / 7)}
        who={who}
        meId={profile.id}
        artists={artists}
        events={(evs || []).map(clean)}
        sessions={sessions}
        upcoming={{ events: (nextEvs || []).map(clean), sessions: upcomingSessions }}
        toolbar={
          <div className="toolbar">
            <AgendaTabs active="artistas" team={team} />
            {team ? (
              <div className="chips" aria-label="Filtrar por artista">
                <Link href={href(off, 'todos')} className={`chip ${!one ? 'on' : ''}`}>
                  Todos
                </Link>
                {artists.map((a) => (
                  <Link key={a.id} href={href(off, a.id)} className={`chip ${who === a.id ? 'on' : ''}`}>
                    {a.stage_name || a.name}
                  </Link>
                ))}
              </div>
            ) : null}
            <div className="week-nav" style={{ marginLeft: 'auto' }}>
              <Link href={href(off - 1)} className="btn sm ghost" aria-label="Mês anterior">
                <Icon name="left" size={16} />
              </Link>
              <span className="mlbl">{mesLabel}</span>
              <Link href={href(off + 1)} className="btn sm ghost" aria-label="Próximo mês">
                <Icon name="right" size={16} />
              </Link>
              {off !== 0 ? (
                <Link href={href(0)} className="btn sm">
                  Hoje
                </Link>
              ) : null}
            </div>
          </div>
        }
      />
    </>
  );
}
