import Link from 'next/link';
import PageTop from '@/components/page-top';
import Icon from '@/components/icon';
import { requireProfile } from '@/lib/auth';
import { BOOKING_SELECT } from '@/lib/queries';
import { approveBooking, rejectBooking } from '@/lib/actions/agenda';
import { DOW, MESF, addDays, brl, daysBetween, dowIndex, fmtDay, hrs, monthEnd, monthStart, parseDay, todaySP, weekOffset, weekStart } from '@/lib/dates';

export const metadata = { title: 'Painel' };

export default async function PainelPage() {
  const { supabase, profile } = await requireProfile();
  const today = todaySP();
  const d = parseDay(today);
  const dateLine = `${DOW[dowIndex(today)]}, ${d.getUTCDate()} de ${MESF[d.getUTCMonth()]}`;

  if (profile.role === 'artist') return <ArtistPanel supabase={supabase} profile={profile} today={today} dateLine={dateLine} />;
  return <TeamPanel supabase={supabase} profile={profile} today={today} dateLine={dateLine} />;
}

function SessionRow({ b, showArtist }) {
  const week = weekOffset(todaySP(), b.date);
  return (
    <Link href={`/agenda?semana=${week}&sessao=${b.id}`} className="row link-row">
      <span className="dot" style={{ '--c': b.artist?.color || '#6fcf9f' }} />
      <div className="grow">
        <b>
          {showArtist ? `${b.artist?.stage_name || b.artist?.name} · ` : ''}
          {b.service_name}
        </b>
        <span>{b.status === 'pendente' ? 'Aguardando aprovação' : b.note || (b.engineer ? `Técnico: ${b.engineer.name}` : 'Estúdio')}</span>
      </div>
      <div className="when">
        <b>{b.date === todaySP() ? 'Hoje' : fmtDay(b.date)}</b>
        {hrs(b.start_hour, b.duration)}
      </div>
    </Link>
  );
}

async function TeamPanel({ supabase, profile, today, dateLine }) {
  const admin = profile.role === 'admin';
  const ms = monthStart(today);
  const me = monthEnd(today);
  const ws = weekStart(today);
  const we = addDays(ws, 6);

  const [{ data: cfg }, { data: month }, { data: pending }, { data: upcoming }, { count: artistCount }] = await Promise.all([
    supabase.from('settings').select('open_hour, close_hour').single(),
    supabase.from('bookings').select('date, duration, price, status, engineer_id').gte('date', ms).lte('date', me).eq('status', 'confirmado'),
    supabase.from('bookings').select(BOOKING_SELECT).eq('status', 'pendente').gte('date', today).order('date').order('start_hour').limit(8),
    supabase.from('bookings').select(BOOKING_SELECT).neq('status', 'cancelado').gte('date', today).order('date').order('start_hour').limit(8),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'artist').eq('active', true),
  ]);

  const rows = month || [];
  const revenue = rows.filter((b) => b.date <= today).reduce((s, b) => s + Number(b.price), 0);
  const booked = rows.reduce((s, b) => s + Number(b.price), 0);
  const weekRows = rows.filter((b) => b.date >= ws && b.date <= we);
  const weekHours = weekRows.reduce((s, b) => s + b.duration, 0);
  const capacity = 7 * ((cfg?.close_hour ?? 23) - (cfg?.open_hour ?? 9));
  const occ = capacity ? Math.round((weekHours / capacity) * 100) : 0;
  const todayRows = (upcoming || []).filter((b) => b.date === today);
  const mine = rows.filter((b) => b.engineer_id === profile.id && b.date >= today).length;
  const firstName = (profile.name || '').split(' ')[0];

  return (
    <>
      <PageTop title={admin ? 'Painel do estúdio' : `Fala, ${firstName}`} subtitle={dateLine}>
        <Link href="/agenda?novo=1" className="btn pri">
          <Icon name="plus" size={16} />
          Nova sessão
        </Link>
      </PageTop>

      <section className="kpis">
        {admin ? (
          <div className="card kpi">
            <span className="label">Faturado em {MESF[parseDay(today).getUTCMonth()]}</span>
            <span className="v">{brl(revenue)}</span>
            <span className="s">{brl(booked)} com as sessões já marcadas no mês</span>
          </div>
        ) : (
          <div className="card kpi">
            <span className="label">Sessões hoje</span>
            <span className="v">{todayRows.length}</span>
            <span className="s">{todayRows.reduce((s, b) => s + b.duration, 0)}h de estúdio</span>
          </div>
        )}
        <div className="card kpi">
          <span className="label">Ocupação da semana</span>
          <span className="v">{occ}%</span>
          <div className="meter">
            <i style={{ width: `${Math.min(occ, 100)}%` }} />
          </div>
          <span className="s">
            {weekHours}h de {capacity}h
          </span>
        </div>
        <div className={`card kpi ${(pending || []).length ? 'hot' : ''}`}>
          <span className="label">Aguardando aprovação</span>
          <span className="v">{(pending || []).length}</span>
          <span className="s">pedidos de horário</span>
        </div>
        <div className="card kpi">
          <span className="label">{admin ? 'Artistas ativos' : 'Comigo este mês'}</span>
          <span className="v">{admin ? artistCount ?? 0 : mine}</span>
          <span className="s">{admin ? 'com acesso ao app' : 'sessões confirmadas'}</span>
        </div>
      </section>

      <section className="two">
        <div className="card">
          <div className="card-h">
            <h2>Pedidos de horário</h2>
            {(pending || []).length ? <span className="pill warn">{pending.length}</span> : null}
          </div>
          <div className="list">
            {(pending || []).length ? (
              pending.map((b) => (
                <div key={b.id} className="row">
                  <span className="dot" style={{ '--c': b.artist?.color }} />
                  <div className="grow">
                    <b>{b.artist?.stage_name || b.artist?.name}</b>
                    <span>
                      {b.service_name} · {fmtDay(b.date)}, {hrs(b.start_hour, b.duration)}
                    </span>
                  </div>
                  <form action={approveBooking}>
                    <input type="hidden" name="id" value={b.id} />
                    <input type="hidden" name="back" value="/painel" />
                    <button className="btn sm ok">Aprovar</button>
                  </form>
                  <form action={rejectBooking}>
                    <input type="hidden" name="id" value={b.id} />
                    <input type="hidden" name="back" value="/painel" />
                    <button className="btn sm bad" aria-label={`Recusar pedido de ${b.artist?.stage_name || ''}`}>
                      Recusar
                    </button>
                  </form>
                </div>
              ))
            ) : (
              <p className="empty">Nenhum pedido esperando. Os pedidos dos artistas aparecem aqui.</p>
            )}
          </div>
        </div>
        <div className="card">
          <div className="card-h">
            <h2>Próximas sessões</h2>
            <Link href="/agenda" className="linkbtn">
              Ver agenda
            </Link>
          </div>
          <div className="list">
            {(upcoming || []).length ? upcoming.map((b) => <SessionRow key={b.id} b={b} showArtist />) : <p className="empty">Nenhuma sessão marcada.</p>}
          </div>
        </div>
      </section>
    </>
  );
}

async function ArtistPanel({ supabase, profile, today, dateLine }) {
  const ms = monthStart(today);
  const [{ data: upcoming }, { data: month }] = await Promise.all([
    supabase.from('bookings').select(BOOKING_SELECT).eq('artist_id', profile.id).neq('status', 'cancelado').gte('date', today).order('date').order('start_hour').limit(8),
    supabase.from('bookings').select('duration, price, date').eq('artist_id', profile.id).eq('status', 'confirmado').gte('date', ms).lte('date', monthEnd(today)),
  ]);
  const list = upcoming || [];
  const next = list[0];
  const diff = next ? daysBetween(today, next.date) : 0;
  const hoursMonth = (month || []).reduce((s, b) => s + b.duration, 0);
  const pending = list.filter((b) => b.status === 'pendente').length;

  return (
    <>
      <PageTop title={`Fala, ${profile.stage_name || profile.name}`} subtitle={dateLine}>
        <Link href="/agenda?novo=1" className="btn pri">
          <Icon name="plus" size={16} />
          Pedir horário
        </Link>
      </PageTop>

      <section className="kpis">
        <div className="card kpi span2">
          <span className="label">Próxima sessão</span>
          {next ? (
            <>
              <span className="v">{diff === 0 ? 'Hoje' : diff === 1 ? 'Amanhã' : `Em ${diff} dias`}</span>
              <span className="s">
                {fmtDay(next.date)} · {hrs(next.start_hour, next.duration)} · {next.service_name}
                {next.status === 'pendente' ? ' · aguardando aprovação' : ''}
              </span>
            </>
          ) : (
            <>
              <span className="v">—</span>
              <span className="s">Nenhuma sessão marcada. Peça um horário na agenda.</span>
            </>
          )}
        </div>
        <div className="card kpi">
          <span className="label">Horas em {MESF[parseDay(today).getUTCMonth()]}</span>
          <span className="v">{hoursMonth}h</span>
          <span className="s">confirmadas no estúdio</span>
        </div>
        <div className={`card kpi ${pending ? 'hot' : ''}`}>
          <span className="label">Pedidos em análise</span>
          <span className="v">{pending}</span>
          <span className="s">aguardando o estúdio</span>
        </div>
      </section>

      <section className="card">
        <div className="card-h">
          <h2>Minhas próximas sessões</h2>
          <Link href="/agenda" className="linkbtn">
            Ver agenda
          </Link>
        </div>
        <div className="list">{list.length ? list.map((b) => <SessionRow key={b.id} b={b} />) : <p className="empty">Nenhuma sessão marcada.</p>}</div>
      </section>
    </>
  );
}
