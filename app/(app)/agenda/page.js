import Link from 'next/link';
import PageTop from '@/components/page-top';
import Modal from '@/components/modal';
import Avatar from '@/components/avatar';
import Icon from '@/components/icon';
import AgendaTabs from '@/components/agenda-tabs';
import NewSession, { NewLink } from './new-session';
import { requireProfile, isTeam } from '@/lib/auth';
import StatusPill from '@/components/status-pill';
import { BOOKING_SELECT } from '@/lib/queries';
import { approveBooking, cancelBooking, setEngineer } from '@/lib/actions/agenda';
import { DOW, MES, addDays, brl, fmtDay, hrs, isDay, nowHourSP, pad, parseDay, todaySP, weekStart } from '@/lib/dates';

export const metadata = { title: 'Agenda' };

export default async function AgendaPage({ searchParams }) {
  const sp = (await searchParams) || {};
  const { supabase, profile } = await requireProfile();
  const team = isTeam(profile);

  const today = todaySP();
  const nowH = nowHourSP();
  const week = Number.parseInt(sp.semana || '0', 10) || 0;
  const ws = addDays(weekStart(today), week * 7);
  const we = addDays(ws, 6);
  const days = Array.from({ length: 7 }, (_, i) => addDays(ws, i));
  const base = `/agenda?semana=${week}`;

  // Tudo de uma vez: configurações, sessões da semana e os dados da janela "Nova sessão"
  const cfgQuery = supabase.from('settings').select('open_hour, close_hour').single();
  const svcQuery = supabase.from('services').select('id, name, price_per_hour').eq('active', true).order('sort');
  const none = Promise.resolve({ data: [] });
  const artistsQuery = team ? supabase.from('profiles').select('id, name, stage_name').eq('role', 'artist').eq('active', true).order('stage_name') : none;
  const staffQuery = team ? supabase.from('profiles').select('id, name').in('role', ['admin', 'staff']).eq('active', true).order('name') : none;
  let blocks = [];
  let cfg = null;
  let services = [];
  let artists = [];
  let staff = [];
  if (team) {
    const [{ data: c }, { data }, sv, ar, st] = await Promise.all([
      cfgQuery,
      supabase.from('bookings').select(BOOKING_SELECT).gte('date', ws).lte('date', we).neq('status', 'cancelado'),
      svcQuery,
      artistsQuery,
      staffQuery,
    ]);
    cfg = c;
    services = sv.data || [];
    artists = ar.data || [];
    staff = st.data || [];
    blocks = (data || []).map((b) => ({ ...b, own: true }));
  } else {
    const [{ data: c }, { data: mine }, { data: busy }, sv] = await Promise.all([
      cfgQuery,
      supabase.from('bookings').select(BOOKING_SELECT).eq('artist_id', profile.id).gte('date', ws).lte('date', we).neq('status', 'cancelado'),
      supabase.rpc('studio_busy', { d_from: ws, d_to: we }),
      svcQuery,
    ]);
    cfg = c;
    services = sv.data || [];
    const mineIds = new Set((mine || []).map((b) => b.id));
    blocks = [...(mine || []).map((b) => ({ ...b, own: true })), ...(busy || []).filter((b) => !mineIds.has(b.id)).map((b) => ({ ...b, own: false }))];
  }
  const H0 = cfg?.open_hour ?? 9;
  const H1 = cfg?.close_hour ?? 23;
  const hours = Array.from({ length: H1 - H0 }, (_, i) => H0 + i);

  // Janela de nova sessão: abre no navegador. Só se vier de um link com ?novo=... ela já abre pronta.
  const defaultDate = ws < today ? today : ws;
  const defaultStart = Math.min(Math.max(14, H0), H1 - 1);
  let initial = null;
  if (sp.novo) {
    const [d, h] = String(sp.novo).split('T');
    const startRaw = Number.parseInt(h, 10);
    initial = {
      date: isDay(d) ? d : defaultDate,
      start: Number.isInteger(startRaw) && startRaw >= H0 && startRaw < H1 ? startRaw : defaultStart,
    };
  }

  // Janela de detalhes
  let detailModal = null;
  if (sp.sessao) {
    const { data: b } = await supabase.from('bookings').select(BOOKING_SELECT).eq('id', String(sp.sessao)).maybeSingle();
    if (b) {
      const detailHref = `${base}&sessao=${b.id}`;
      const confirming = sp.cancelar === '1';
      const canCancel = b.status !== 'cancelado' && (team || b.date >= today);
      let staff = [];
      if (team) {
        const { data } = await supabase.from('profiles').select('id, name').in('role', ['admin', 'staff']).eq('active', true).order('name');
        staff = data || [];
      }
      detailModal = (
        <Modal closeHref={base} label="Detalhes da sessão">
          <div className="m-head">
            <Avatar p={b.artist} />
            <div>
              <span className="label">{b.service_name}</span>
              <h2>{team ? b.artist?.stage_name || b.artist?.name : b.service_name}</h2>
            </div>
          </div>
          <dl className="kv">
            <dt>Quando</dt>
            <dd>
              {fmtDay(b.date)} · <span className="mono">{hrs(b.start_hour, b.duration)}</span>
            </dd>
            <dt>Situação</dt>
            <dd>
              <StatusPill status={b.status} />
            </dd>
            <dt>Valor</dt>
            <dd className="mono">{brl(b.price)}</dd>
            {b.note ? (
              <>
                <dt>Obs.</dt>
                <dd>{b.note}</dd>
              </>
            ) : null}
            {!team ? (
              <>
                <dt>Técnico</dt>
                <dd>{b.engineer?.name || 'A definir'}</dd>
              </>
            ) : null}
          </dl>

          {team && b.status !== 'cancelado' ? (
            <form action={setEngineer} className="inline-form">
              <input type="hidden" name="id" value={b.id} />
              <input type="hidden" name="back" value={detailHref} />
              <label htmlFor="eng" className="label">
                Técnico
              </label>
              <select id="eng" name="engineer_id" defaultValue={b.engineer_id || ''}>
                <option value="">A definir</option>
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <button className="btn sm">Salvar</button>
            </form>
          ) : null}

          {confirming && canCancel ? (
            <div className="confirm">
              <span>{b.status === 'pendente' && !team ? 'Retirar este pedido?' : 'Cancelar esta sessão?'}</span>
              <div className="row-actions">
                <Link href={detailHref} className="btn ghost sm" scroll={false}>
                  Voltar
                </Link>
                <form action={cancelBooking}>
                  <input type="hidden" name="id" value={b.id} />
                  <input type="hidden" name="back" value={base} />
                  <button className="btn bad sm">Sim, cancelar</button>
                </form>
              </div>
            </div>
          ) : null}

          <div className="mact">
            {team && b.status === 'pendente' ? (
              <form action={approveBooking}>
                <input type="hidden" name="id" value={b.id} />
                <input type="hidden" name="back" value={base} />
                <button className="btn ok">Aprovar</button>
              </form>
            ) : null}
            {canCancel && !confirming ? (
              <Link href={`${detailHref}&cancelar=1`} className="btn bad" scroll={false}>
                {b.status === 'pendente' && !team ? 'Retirar pedido' : b.status === 'pendente' ? 'Recusar' : 'Cancelar sessão'}
              </Link>
            ) : null}
            <Link href={base} className="btn ghost" scroll={false}>
              Fechar
            </Link>
          </div>
        </Modal>
      );
    }
  }

  const label = `${parseDay(ws).getUTCDate()} ${MES[parseDay(ws).getUTCMonth()]} – ${parseDay(we).getUTCDate()} ${MES[parseDay(we).getUTCMonth()]}`;
  const showNow = today >= ws && today <= we && nowH >= H0 && nowH < H1;

  return (
    <NewSession
      team={team}
      artists={artists}
      staff={staff}
      services={services}
      today={today}
      openHour={H0}
      closeHour={H1}
      defaultDate={defaultDate}
      defaultStart={defaultStart}
      initial={initial}
    >
      <PageTop
        title="Agenda do estúdio"
        subtitle={team ? 'Clique num horário livre para marcar. Pedidos dos artistas aparecem tracejados.' : 'Clique num horário livre para pedir uma sessão. O estúdio confirma o pedido.'}
      >
        <NewLink href={`${base}&novo=1`} className="btn pri">
          <Icon name="plus" size={16} />
          {team ? 'Nova sessão' : 'Pedir horário'}
        </NewLink>
      </PageTop>

      <div className="toolbar">
        <AgendaTabs active="estudio" team={team} />
        <div className="week-nav" style={{ marginLeft: 'auto' }}>
          <Link href={`/agenda?semana=${week - 1}`} className="btn sm ghost" aria-label="Semana anterior" scroll={false}>
            <Icon name="left" size={16} />
          </Link>
          <span className="weeklbl">{label}</span>
          <Link href={`/agenda?semana=${week + 1}`} className="btn sm ghost" aria-label="Próxima semana" scroll={false}>
            <Icon name="right" size={16} />
          </Link>
          {week !== 0 ? (
            <Link href="/agenda" className="btn sm" scroll={false}>
              Hoje
            </Link>
          ) : null}
        </div>
      </div>

      <div className="cal-wrap">
        <div className="cal">
          <div className="cal-head">
            <div />
            {days.map((d) => (
              <div key={d} className={d === today ? 'today' : ''}>
                <small>{DOW[(parseDay(d).getUTCDay() + 6) % 7]}</small>
                <b>{parseDay(d).getUTCDate()}</b>
              </div>
            ))}
          </div>
          <div className="cal-body" style={{ '--rows': H1 - H0 }}>
            <div className="cal-times">
              {hours.map((h) => (
                <div key={h}>{pad(h)}:00</div>
              ))}
            </div>
            {days.map((d) => {
              const past = d < today;
              return (
                <div key={d} className={`cal-day ${d === today ? 'today' : ''} ${past ? 'past' : ''}`}>
                  {hours.map((h) => {
                    const free = !past && !(d === today && h < Math.ceil(nowH));
                    if (!free) return null;
                    return (
                      <NewLink
                        key={h}
                        date={d}
                        hour={h}
                        href={`${base}&novo=${d}T${h}`}
                        className="slot"
                        style={{ top: `calc(${h - H0} * var(--rh))` }}
                        aria-label={`${team ? 'Marcar' : 'Pedir'} ${fmtDay(d)} às ${h}h`}
                      />
                    );
                  })}
                  {blocks
                    .filter((b) => b.date === d && b.start_hour >= H0 && b.start_hour < H1)
                    .map((b) => {
                      const style = {
                        top: `calc(${b.start_hour - H0} * var(--rh) + 2px)`,
                        height: `calc(${Math.min(b.duration, H1 - b.start_hour)} * var(--rh) - 4px)`,
                        '--c': team ? b.artist?.color || '#6fcf9f' : profile.color,
                      };
                      if (!b.own) {
                        return (
                          <div key={b.id} className="ev other" style={style}>
                            <span className="t">{hrs(b.start_hour, b.duration)}</span>
                            <b>Reservado</b>
                          </div>
                        );
                      }
                      return (
                        <Link key={b.id} href={`${base}&sessao=${b.id}`} scroll={false} className={`ev ${b.status === 'pendente' ? 'pend' : ''}`} style={style}>
                          <span className="t">{hrs(b.start_hour, b.duration)}</span>
                          <b>{team ? b.artist?.stage_name || b.artist?.name : b.service_name}</b>
                          <span>
                            {team ? b.service_name : b.status === 'pendente' ? 'Aguardando aprovação' : b.note || 'Estúdio'}
                            {team && b.engineer ? ` · ${b.engineer.name.split(' ')[0]}` : ''}
                          </span>
                        </Link>
                      );
                    })}
                  {d === today && showNow ? <div className="nowline" style={{ top: `calc(${nowH - H0} * var(--rh))` }} /> : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="legend">
        {team ? (
          <span>Cor = artista · tracejado = aguardando aprovação · nome no fim = técnico</span>
        ) : (
          <>
            <span>
              <i className="dot" style={{ '--c': profile.color }} />
              Suas sessões
            </span>
            <span>
              <i className="dot" style={{ '--c': 'var(--line2)' }} />
              Horário de outro artista
            </span>
            <span>Tracejado = aguardando aprovação</span>
          </>
        )}
        <span>
          Funcionamento: {pad(H0)}h às {pad(H1)}h
        </span>
      </div>

      {detailModal}
    </NewSession>
  );
}
