// Aceita os nomes da integração Supabase ↔ Vercel (SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY…)
// e também os nomes clássicos (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY).
// Só a URL e a chave PÚBLICA vão para o navegador. A chave secreta nunca entra aqui.
const publicEnv = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY:
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY,
};

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  env: Object.fromEntries(Object.entries(publicEnv).filter(([, v]) => typeof v === 'string' && v.length > 0)),
};

export default nextConfig;
