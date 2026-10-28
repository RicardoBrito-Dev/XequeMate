// Datas como texto 'AAAA-MM-DD', sempre no horário de Brasília
const TZ = 'America/Sao_Paulo';

export const DOW = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
export const MES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
export const MESF = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

export const pad = (n) => String(n).padStart(2, '0');

export function todaySP() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

export function nowHourSP() {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
  const h = Number(parts.find((p) => p.type === 'hour')?.value || 0);
  const m = Number(parts.find((p) => p.type === 'minute')?.value || 0);
  return h + m / 60;
}

export const isDay = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);

export function parseDay(s) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}
export const dayKey = (d) => d.toISOString().slice(0, 10);

export function addDays(s, n) {
  const d = parseDay(s);
  d.setUTCDate(d.getUTCDate() + n);
  return dayKey(d);
}

export const dowIndex = (s) => (parseDay(s).getUTCDay() + 6) % 7;
export const weekStart = (s) => addDays(s, -dowIndex(s));
export const weekOffset = (from, to) => Math.round((parseDay(weekStart(to)) - parseDay(weekStart(from))) / (7 * 864e5));
export const daysBetween = (from, to) => Math.round((parseDay(to) - parseDay(from)) / 864e5);
export const monthStart = (s) => s.slice(0, 8) + '01';
export function monthEnd(s) {
  const d = parseDay(monthStart(s));
  d.setUTCMonth(d.getUTCMonth() + 1);
  d.setUTCDate(0);
  return dayKey(d);
}

export function fmtDay(s) {
  const d = parseDay(s);
  return `${DOW[dowIndex(s)]}, ${d.getUTCDate()} ${MES[d.getUTCMonth()]}`;
}
export function fmtLong(s) {
  const d = parseDay(s);
  return `${d.getUTCDate()} de ${MESF[d.getUTCMonth()]}`;
}

export const hrs = (start, dur) => `${pad(start)}:00–${pad(start + dur)}:00`;

export function brl(n) {
  return Number(n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
}
