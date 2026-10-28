'use client';

import { useActionState, useEffect, useMemo, useState } from 'react';
import Icon from '@/components/icon';
import PageTop from '@/components/page-top';
import { saveEvent, deleteEvent } from '@/lib/actions/eventos';
import { DOW, addDays, brl, fmtDay, pad, parseDay } from '@/lib/dates';

export const KINDS = { Show: '#6fcf9f', Ensaio: '#d8b765', Entrevista: '#8fb8d8', Lançamento: '#b3a2db', Viagem: '#d98b6f', Outro: '#8a9e94' };

const byTime = (a, b) => (a.time || '').localeCompare(b.time || '');
const name = (a) => a?.stage_name || a?.name || '';

export default function Eventos({ team, today, monthStart, gridStart, weeks, who, meId, artists, events, sessions, upcoming, toolbar, title, subtitle }) {
  const all = who === 'todos';
  const [modal, setModal] = useState(null); // { type: 'new'|'edit'|'view', ... }
  const close = () => setModal(null);

  useEffect(() => {
    if (!modal) return;
    const onKey = (e) => e.key === 'Escape' && setModal(null);
    document.addEventListener('keydown', onKey);
    document.body.classList.add('modal-open');
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.classList.remove('modal-open');
    };
  }, [modal]);

  const color = (e) => (all ? e.artist?.color || '#6fcf9f' : KINDS[e.kind]);
  const monthKey = monthStart.slice(0, 7);

  const cells = useMemo(
    () =>
      Array.from({ length: weeks * 7 }, (_, i) => {
        const date = addDays(gridStart, i);
        const items = [
          ...events.filter((e) => e.date === date).map((e) => ({ t: 'ev', e, time: e.time })),
          ...sessions.filter((b) => b.date === date).map((b) => ({ t: 'sess', b, time: b.time })),
        ].sort(byTime);
        return { date, items };
      }),
    [events, sessions, gridStart, weeks]
  );

  const monthShows = events.filter((e) => e.kind === 'Show' && e.date.startsWith(monthKey));
  const fees = monthShows.reduce((s, e) => s + (e.fee || 0), 0);

  const next = [
    ...upcoming.events.map((e) => ({ t: 'ev', e, date: e.date, time: e.time })),
    ...upcoming.sessions.map((b) => ({ t: 'sess', b, date: b.date, time: b.time })),
  ]
    .sort((a, b) => a.date.localeCompare(b.date) || byTime(a, b))
    .slice(0, 8);

  const defaultArtist = !all ? who : artists[0]?.id || '';

  return (
    <>
      <PageTop title={title} subtitle={subtitle}>
        <button type="button" className="btn pri" onClick={() => setModal({ type: 'new', date: today, n: Date.now() })}>
          <Icon name="plus" size={16} />
          Novo compromisso
        </button>
      </PageTop>
      {toolbar}

      <div className="ag-layout" style={{ marginTop: 16 }}>
        <div>
          <div className="month">
            <div className="m-head">
              {DOW.map((d) => (
                <div key={d}>{d}</div>
              ))}
            </div>
            <div className="m-grid">
              {cells.map(({ date, items }) => {
                const d = parseDay(date);
                const out = !date.startsWith(monthKey);
                return (
                  <div key={date} className={`m-cell ${out ? 'out' : ''} ${date === today ? 'today' : ''}`} onClick={() => setModal({ type: 'new', date, n: Date.now() })}>
                    <span className="d">{d.getUTCDate()}</span>
                    {items.slice(0, 3).map((it) =>
                      it.t === 'ev' ? (
                        <button
                          key={it.e.id}
                          type="button"
                          className={`chip-ev ${it.e.status === 'a confirmar' ? 'tbc' : ''}`}
                          style={{ '--c': color(it.e) }}
                          title={`${it.e.kind}: ${it.e.title}`}
                          onClick={(ev) => {
                            ev.stopPropagation();
                            setModal({ type: 'view', id: it.e.id });
                          }}
                        >
                          {it.e.time ? <span className="t">{it.e.time.replace(':00', 'h')}</span> : null}
                          <span className="lbl">
                            {all ? `${name(it.e.artist)} · ` : ''}
                            {it.e.title}
                          </span>
                        </button>
                      ) : (
                        <span key={it.b.id} className="chip-ev sess" style={{ '--c': 'var(--dim)' }} title="Sessão no estúdio">
                          <span className="t">{pad(it.b.start_hour)}h</span>
                          <span className="lbl">Estúdio · {it.b.service_name}</span>
                        </span>
                      )
                    )}
                    {items.length > 3 ? <span className="more">+{items.length - 3}</span> : null}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="kind-legend">
            {all ? (
              artists.map((a) => (
                <span key={a.id}>
                  <i className="dot" style={{ '--c': a.color }} />
                  {name(a)}
                </span>
              ))
            ) : (
              <>
                {Object.entries(KINDS).map(([k, c]) => (
                  <span key={k}>
                    <i className="dot" style={{ '--c': c }} />
                    {k}
                  </span>
                ))}
                <span>
                  <i className="dot" style={{ '--c': 'transparent', outline: '1px dashed var(--muted)' }} />
                  Sessão no estúdio
                </span>
              </>
            )}
          </div>
        </div>

        <div className="ag-side">
          <div className="card kpi">
            <span className="label">Neste mês</span>
            <div style={{ display: 'flex', gap: 24, marginTop: 4 }}>
              <div className="kpi">
                <span className="v" style={{ fontSize: 26 }}>{monthShows.length}</span>
                <span className="s">show{monthShows.length === 1 ? '' : 's'}</span>
              </div>
              <div className="kpi">
                <span className="v" style={{ fontSize: 26 }}>{brl(fees)}</span>
                <span className="s">em cachês</span>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="card-h">
              <h2>Próximos compromissos</h2>
            </div>
            <div className="list">
              {next.length ? (
                next.map((x) =>
                  x.t === 'ev' ? (
                    <button key={x.e.id} type="button" className="row click" onClick={() => setModal({ type: 'view', id: x.e.id })}>
                      <span className="dot" style={{ '--c': color(x.e) }} />
                      <div className="grow">
                        <b>{x.e.title}</b>
                        <span>
                          {all ? `${name(x.e.artist)} · ` : ''}
                          {x.e.kind}
                          {x.e.place ? ` · ${x.e.place}` : ''}
                          {x.e.status === 'a confirmar' ? ' · a confirmar' : ''}
                        </span>
                      </div>
                      <div className="when">
                        <b>{x.date === today ? 'Hoje' : fmtDay(x.date)}</b>
                        {x.e.time}
                        {x.e.fee ? (
                          <>
                            <br />
                            <span className="fee">{brl(x.e.fee)}</span>
                          </>
                        ) : null}
                      </div>
                    </button>
                  ) : (
                    <div key={x.b.id} className="row">
                      <span className="dot" style={{ '--c': 'var(--dim)' }} />
                      <div className="grow">
                        <b>{x.b.service_name}</b>
                        <span>Sessão no estúdio{x.b.status === 'pendente' ? ' · aguardando aprovação' : ''}</span>
                      </div>
                      <div className="when">
                        <b>{x.date === today ? 'Hoje' : fmtDay(x.date)}</b>
                        {x.time}
                      </div>
                    </div>
                  )
                )
              ) : (
                <p className="empty">Nada marcado. Clique num dia do calendário para adicionar.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {modal ? (
        <div className="mback">
          <div className="mback-close" onClick={close} aria-hidden="true" />
          <div className="modal" role="dialog" aria-modal="true">
            {modal.type === 'view' ? (
              <Detail
                ev={[...events, ...upcoming.events].find((e) => e.id === modal.id)}
                team={team}
                onEdit={(e) => setModal({ type: 'edit', ev: e, n: Date.now() })}
                onClose={close}
              />
            ) : (
              <EventForm key={modal.n} ev={modal.ev} date={modal.date} team={team} artists={artists} defaultArtist={defaultArtist} onClose={close} />
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}

function Detail({ ev, team, onEdit, onClose }) {
  const [confirming, setConfirming] = useState(false);
  const [state, action, pending] = useActionState(deleteEvent, null);
  useEffect(() => {
    if (state?.ok) onClose();
  }, [state]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!ev) {
    return (
      <>
        <p className="muted">Este compromisso não existe mais.</p>
        <div className="mact">
          <button type="button" className="btn ghost" onClick={onClose}>Fechar</button>
        </div>
      </>
    );
  }
  return (
    <>
      <div className="m-head">
        <span className="dot" style={{ '--c': KINDS[ev.kind], width: 12, height: 12 }} />
        <div>
          <span className="label">
            {ev.kind}
            {team ? ` · ${name(ev.artist)}` : ''}
          </span>
          <h2>{ev.title}</h2>
        </div>
      </div>
      <dl className="kv">
        <dt>Quando</dt>
        <dd>
          {fmtDay(ev.date)}
          {ev.time ? <> · <span className="mono">{ev.time}</span></> : null}
        </dd>
        {ev.place || ev.city ? (
          <>
            <dt>Onde</dt>
            <dd>{[ev.place, ev.city].filter(Boolean).join(' · ')}</dd>
          </>
        ) : null}
        <dt>Situação</dt>
        <dd>{ev.status === 'a confirmar' ? <span className="pill warn">A confirmar</span> : <span className="pill ok">Confirmado</span>}</dd>
        {ev.fee ? (
          <>
            <dt>Cachê</dt>
            <dd className="mono">{brl(ev.fee)}</dd>
          </>
        ) : null}
        {ev.notes ? (
          <>
            <dt>Obs.</dt>
            <dd>{ev.notes}</dd>
          </>
        ) : null}
      </dl>
      {state?.error ? <p className="err">{state.error}</p> : null}
      {confirming ? (
        <div className="confirm">
          <span>Excluir este compromisso?</span>
          <div className="row-actions">
            <button type="button" className="btn ghost sm" onClick={() => setConfirming(false)}>Voltar</button>
            <form action={action}>
              <input type="hidden" name="id" value={ev.id} />
              <button className="btn bad sm" disabled={pending}>{pending ? 'Excluindo…' : 'Sim, excluir'}</button>
            </form>
          </div>
        </div>
      ) : (
        <div className="mact">
          <button type="button" className="btn bad" onClick={() => setConfirming(true)}>Excluir</button>
          <button type="button" className="btn" onClick={() => onEdit(ev)}>
            <Icon name="edit" size={16} />
            Editar
          </button>
          <button type="button" className="btn ghost" onClick={onClose}>Fechar</button>
        </div>
      )}
    </>
  );
}

function EventForm({ ev, date, team, artists, defaultArtist, onClose }) {
  const [state, action, pending] = useActionState(saveEvent, null);
  useEffect(() => {
    if (state?.ok) onClose();
  }, [state]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <h2>{ev ? 'Editar compromisso' : 'Novo compromisso'}</h2>
      <form action={action} className="form">
        {ev ? <input type="hidden" name="id" value={ev.id} /> : null}
        {team ? (
          <div className="field full">
            <label htmlFor="ev-artist">Artista</label>
            <select id="ev-artist" name="artist_id" required defaultValue={ev?.artist_id || defaultArtist}>
              {!artists.length ? <option value="">Nenhum artista cadastrado</option> : null}
              {artists.map((a) => (
                <option key={a.id} value={a.id}>{name(a)}</option>
              ))}
            </select>
          </div>
        ) : null}
        <div className="field">
          <label htmlFor="ev-kind">Tipo</label>
          <select id="ev-kind" name="kind" defaultValue={ev?.kind || 'Show'}>
            {Object.keys(KINDS).map((k) => (
              <option key={k}>{k}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="ev-status">Situação</label>
          <select id="ev-status" name="status" defaultValue={ev?.status || 'confirmado'}>
            <option value="confirmado">Confirmado</option>
            <option value="a confirmar">A confirmar</option>
          </select>
        </div>
        <div className="field full">
          <label htmlFor="ev-title">Título</label>
          <input id="ev-title" name="title" defaultValue={ev?.title || ''} placeholder="Ex.: Show no Baile da Praça" maxLength={120} required />
        </div>
        <div className="field">
          <label htmlFor="ev-date">Data</label>
          <input id="ev-date" type="date" name="date" defaultValue={ev?.date || date} required />
        </div>
        <div className="field">
          <label htmlFor="ev-time">Horário</label>
          <input id="ev-time" type="time" name="time" defaultValue={ev ? ev.time : '21:00'} />
        </div>
        <div className="field">
          <label htmlFor="ev-place">Local</label>
          <input id="ev-place" name="place" defaultValue={ev?.place || ''} placeholder="Casa de show, rádio…" maxLength={120} />
        </div>
        <div className="field">
          <label htmlFor="ev-city">Cidade</label>
          <input id="ev-city" name="city" defaultValue={ev?.city || ''} maxLength={80} />
        </div>
        <div className="field">
          <label htmlFor="ev-fee">Cachê (R$, opcional)</label>
          <input id="ev-fee" name="fee" type="number" min="0" step="50" defaultValue={ev?.fee ?? ''} />
        </div>
        <div className="field full">
          <label htmlFor="ev-notes">Observações</label>
          <input id="ev-notes" name="notes" defaultValue={ev?.notes || ''} placeholder="Passagem de som, contato do contratante…" maxLength={300} />
        </div>
        {state?.error ? <p className="err full">{state.error}</p> : null}
        <div className="mact full">
          <button type="button" className="btn ghost" onClick={onClose}>Cancelar</button>
          <button className="btn pri" disabled={pending}>{pending ? 'Salvando…' : ev ? 'Salvar' : 'Adicionar'}</button>
        </div>
      </form>
    </>
  );
}
