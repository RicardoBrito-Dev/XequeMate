// Campos de uma sessão com o artista e o técnico
export const BOOKING_SELECT =
  'id, date, start_hour, duration, status, price, note, service_name, artist_id, engineer_id, artist:profiles!bookings_artist_id_fkey(id, name, stage_name, color, avatar_url), engineer:profiles!bookings_engineer_id_fkey(id, name)';
