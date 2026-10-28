export function initials(p) {
  const name = (p?.stage_name || p?.name || '?').trim();
  const words = name.split(/\s+/).filter((w) => w.length > 2 || /^[A-ZÀ-Ú]/.test(w));
  return (words.length ? words : [name]).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

export default function Avatar({ p, size = '' }) {
  const color = p?.color || '#6fcf9f';
  if (p?.avatar_url) {
    return <img loading="lazy" decoding="async" className={`av ${size}`} src={p.avatar_url} alt="" style={{ '--c': color }} />;
  }
  return (
    <span className={`av ${size}`} style={{ '--c': color }} aria-hidden="true">
      {initials(p)}
    </span>
  );
}
