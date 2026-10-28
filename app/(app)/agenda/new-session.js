'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import BookingForm from './booking-form';

const Ctx = createContext(() => {});

// A janela "Nova sessão" abre no próprio navegador, sem esperar o servidor.
// Os dados (serviços, artistas, técnicos) já vêm junto com a página.
export default function NewSession({ team, artists, staff, services, today, openHour, closeHour, defaultDate, defaultStart, initial, children }) {
  const sp = useSearchParams();
  const [state, setState] = useState(initial ? { ...initial, n: 0 } : null);

  const open = useCallback(
    (date, hour) => setState((s) => ({ date: date || defaultDate, start: Number.isInteger(hour) ? hour : defaultStart, n: (s?.n || 0) + 1 })),
    [defaultDate, defaultStart]
  );
  const close = useCallback(() => setState(null), []);

  // Depois de salvar, o servidor volta com ?msg=... : fecha a janela
  const saved = sp.get('msg');
  useEffect(() => {
    if (saved) setState(null);
  }, [saved]);

  useEffect(() => {
    if (!state) return;
    const onKey = (e) => e.key === 'Escape' && setState(null);
    document.addEventListener('keydown', onKey);
    document.body.classList.add('modal-open');
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.classList.remove('modal-open');
    };
  }, [state]);

  const label = team ? 'Nova sessão' : 'Pedir horário';

  return (
    <Ctx.Provider value={open}>
      {children}
      {state ? (
        <div className="mback">
          <div className="mback-close" onClick={close} aria-hidden="true" />
          <div className="modal" role="dialog" aria-modal="true" aria-label={label}>
            <h2>{label}</h2>
            {!team ? <p className="muted small">O pedido fica aguardando a confirmação do estúdio.</p> : null}
            {team && !artists.length ? <p className="note warn">Nenhum artista cadastrado ainda. Convide em Pessoas.</p> : null}
            <BookingForm
              key={state.n}
              team={team}
              artists={artists}
              staff={staff}
              services={services}
              date={state.date}
              start={state.start}
              today={today}
              openHour={openHour}
              closeHour={closeHour}
              onClose={close}
            />
          </div>
        </div>
      ) : null}
    </Ctx.Provider>
  );
}

// Link que abre a janela na hora. Sem JavaScript, cai no link normal.
export function NewLink({ date, hour, href, children, ...rest }) {
  const open = useContext(Ctx);
  return (
    <a
      href={href}
      onClick={(e) => {
        e.preventDefault();
        open(date, hour);
      }}
      {...rest}
    >
      {children}
    </a>
  );
}
