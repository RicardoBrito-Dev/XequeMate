// Só aceita caminhos internos (evita redirecionar para outro site)
export function safeNext(value, fallback = '/painel') {
  const v = typeof value === 'string' ? value : '';
  return v.startsWith('/') && !v.startsWith('//') && !v.startsWith('/\\') ? v : fallback;
}

export function withParam(path, key, value) {
  const [base, hash] = path.split('#');
  const sep = base.includes('?') ? '&' : '?';
  return `${base}${sep}${key}=${encodeURIComponent(value)}${hash ? '#' + hash : ''}`;
}

// Erros do login traduzidos
export function authError(error) {
  const m = (error?.message || '').toLowerCase();
  const code = error?.code || '';
  if (code === 'invalid_credentials' || m.includes('invalid login credentials')) return 'E-mail ou senha incorretos.';
  if (code === 'email_not_confirmed' || m.includes('email not confirmed')) return 'Confirme o seu e-mail pelo link que enviamos.';
  if (code === 'same_password' || m.includes('should be different')) return 'A nova senha precisa ser diferente da atual.';
  if (code === 'weak_password' || m.includes('password should')) return 'Senha fraca. Use pelo menos 8 caracteres, misturando letras e números.';
  if (code.includes('rate_limit') || m.includes('rate limit') || m.includes('security purposes')) return 'Muitas tentativas seguidas. Espere alguns minutos e tente de novo.';
  if (code === 'user_banned') return 'Esta conta está bloqueada. Fale com o estúdio.';
  return 'Não deu certo. Confira os dados e tente de novo.';
}

// Erros do banco: as regras da agenda já mandam a mensagem em português
export function dbError(error) {
  const m = error?.message || '';
  if (m.toLowerCase().includes('row-level security')) return 'Você não tem permissão para fazer isso.';
  if (['23514', '23P01', '42501'].includes(error?.code) && m) return m;
  return 'Não deu para salvar. Tente de novo.';
}
