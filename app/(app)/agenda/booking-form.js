'use client';

import { useActionState, useState } from 'react';
import { createBooking } from '@/lib/actions/agenda';
import { brl, pad } from '@/lib/dates';

export default function BookingForm({ team, artists, staff, services, date, start, today, openHour, closeHour, onClose }) {
  const [state, action, pending] = useActionState(createBooking, null);
  const [serviceId, setServiceId] = useState(services[0]?.id || '');
  const [duration, setDuration] = useState(2);

  const svc = services.find((s) => s.id === serviceId);
  const total = (Number(svc?.price_per_hour) || 0) * duration;
  const hours = [];
  for (let h = openHour; h < closeHour; h++) hours.push(h);

  return (
    <form action={action} className="form">
      {team ? (
        <div className="field full">
          <label htmlFor="bf-artist">Artista</label>
          <select id="bf-artist" name="artist_id" required defaultValue="">
            <option value="" disabled>
              Escolha o artista
            </option>
            {artists.map((a) => (
              <option key={a.id} value={a.id}>
                {a.stage_name || a.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div className="field">
        <label htmlFor="bf-service">Serviço</label>
        <select id="bf-service" name="service_id" value={serviceId} onChange={(e) => setServiceId(e.target.value)} required>
          {services.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} · {brl(s.price_per_hour)}/h
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="bf-date">Data</label>
        <input id="bf-date" type="date" name="date" defaultValue={date} min={team ? undefined : today} required />
      </div>

      <div className="field">
        <label htmlFor="bf-start">Início</label>
        <select id="bf-start" name="start_hour" defaultValue={String(start)}>
          {hours.map((h) => (
            <option key={h} value={h}>
              {pad(h)}:00
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="bf-dur">Duração</label>
        <select id="bf-dur" name="duration" value={duration} onChange={(e) => setDuration(Number(e.target.value))}>
          {[1, 2, 3, 4, 5, 6, 8].map((h) => (
            <option key={h} value={h}>
              {h} hora{h > 1 ? 's' : ''}
            </option>
          ))}
        </select>
      </div>

      {team ? (
        <div className="field full">
          <label htmlFor="bf-eng">Técnico responsável</label>
          <select id="bf-eng" name="engineer_id" defaultValue="">
            <option value="">A definir</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div className="field full">
        <label htmlFor="bf-note">O que vai rolar (opcional)</label>
        <input id="bf-note" name="note" maxLength={300} placeholder="Ex.: vozes da faixa 2" />
      </div>

      <div className="estimate full">
        <span className="muted">Valor estimado</span>
        <b>{brl(total)}</b>
      </div>

      {state?.error ? <p className="err full">{state.error}</p> : null}

      <div className="mact full">
        <button type="button" className="btn ghost" onClick={onClose}>
          Cancelar
        </button>
        <button className="btn pri" disabled={pending}>
          {pending ? 'Salvando…' : team ? 'Marcar sessão' : 'Enviar pedido'}
        </button>
      </div>
    </form>
  );
}
