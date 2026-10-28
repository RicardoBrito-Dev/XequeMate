// Lê as chaves do Supabase e corrige erros comuns de colagem
// (espaços, aspas, barra no final, "/rest/v1" colado junto).
const clean = (v) =>
  String(v || '')
    .trim()
    .replace(/^['"]+|['"]+$/g, '')
    .trim();

export function supabaseUrl() {
  return clean(process.env.NEXT_PUBLIC_SUPABASE_URL)
    .replace(/\/rest\/v1\/?$/i, '')
    .replace(/\/+$/, '');
}

export function supabaseAnonKey() {
  return clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function supabaseServiceKey() {
  return clean(process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function jwtRole(key) {
  try {
    const part = key.split('.')[1];
    if (!part) return null;
    const json = atob(part.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(part.length / 4) * 4, '='));
    return JSON.parse(json).role || null;
  } catch {
    return null;
  }
}

// Lista o que falta ou está errado (só nomes, nunca valores)
export function envProblems() {
  const problems = [];
  const url = supabaseUrl();
  if (!url) problems.push('NEXT_PUBLIC_SUPABASE_URL está vazia.');
  else if (!/^https:\/\/[^\s/]+$/i.test(url))
    problems.push('NEXT_PUBLIC_SUPABASE_URL não está no formato certo. Use a Project URL, ex.: https://abcdefgh.supabase.co');
  const key = supabaseAnonKey();
  if (!key) problems.push('NEXT_PUBLIC_SUPABASE_ANON_KEY está vazia.');
  else if (key.startsWith('sb_secret_') || jwtRole(key) === 'service_role')
    problems.push('NEXT_PUBLIC_SUPABASE_ANON_KEY recebeu a chave secreta. Use a chave pública (anon ou publishable).');
  return problems;
}
