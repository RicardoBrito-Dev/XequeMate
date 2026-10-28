import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { envProblems, supabaseAnonKey, supabaseUrl } from '@/lib/env';

// Páginas que abrem sem login
const PUBLIC_PATHS = ['/login', '/esqueci-senha', '/auth/'];

export async function middleware(request) {
  // Chaves do Supabase faltando ou erradas: mostra o que corrigir em vez de quebrar
  const problems = envProblems();
  if (problems.length) return setupPage(problems);

  let response = NextResponse.next({ request });
  let user = null;

  try {
    const supabase = createServerClient(supabaseUrl(), supabaseAnonKey(), {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    });

    // Renova a sessão e confere quem está logado
    const { data } = await supabase.auth.getUser();
    user = data?.user || null;
  } catch (e) {
    console.error('[middleware] falha ao falar com o Supabase:', e?.message || e);
    return setupPage([
      'O site não conseguiu falar com o Supabase. Confira se a NEXT_PUBLIC_SUPABASE_URL é a Project URL certa e se o projeto não está pausado no painel do Supabase.',
    ]);
  }

  const path = request.nextUrl.pathname;
  const isPublic = PUBLIC_PATHS.some((p) => path === p || path.startsWith(p));

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.search = '';
    if (path !== '/' && path !== '/sair') url.searchParams.set('next', path);
    return redirectWithCookies(url, response);
  }

  if (user && (path === '/login' || path === '/esqueci-senha')) {
    const url = request.nextUrl.clone();
    url.pathname = '/painel';
    url.search = '';
    return redirectWithCookies(url, response);
  }

  return response;
}

function redirectWithCookies(url, from) {
  const res = NextResponse.redirect(url);
  from.cookies.getAll().forEach((c) => res.cookies.set(c));
  return res;
}

function setupPage(problems) {
  const items = problems.map((p) => `<li>${p.replace(/</g, '&lt;')}</li>`).join('');
  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Configuração do Xeque Mate</title>
<style>body{margin:0;background:#0b1310;color:#e6ede8;font:16px/1.55 system-ui,-apple-system,Segoe UI,sans-serif;display:grid;place-items:center;min-height:100vh;padding:24px}
main{max-width:620px;background:#101b17;border:1px solid #284036;border-radius:14px;padding:28px}h1{font-size:22px;margin:0 0 8px}p{color:#8a9e94;margin:0 0 16px}
li{margin:0 0 10px}code{background:#15231e;padding:2px 6px;border-radius:5px;font-size:14px}ol{padding-left:20px;color:#8a9e94}</style></head>
<body><main><h1>Falta terminar a configuração</h1><p>O site está no ar, mas as chaves do Supabase não estão certas:</p><ul>${items}</ul>
<p style="margin-top:20px">Como corrigir:</p><ol><li>Na Vercel, abra o projeto › <b>Settings › Environment Variables</b> e confira os nomes e valores (sem aspas e sem espaços).</li>
<li>Marque os ambientes <b>Production</b>, <b>Preview</b> e <b>Development</b>.</li><li>Vá em <b>Deployments</b>, clique em <b>⋯</b> no último deploy e escolha <b>Redeploy</b>. Variáveis novas só valem depois de um novo deploy.</li></ol></main></body></html>`;
  return new NextResponse(html, { status: 503, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } });
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icon.svg|apple-icon.png|icon-192.png|icon-512.png|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
