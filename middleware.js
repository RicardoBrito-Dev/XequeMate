import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// Páginas que abrem sem login
const PUBLIC_PATHS = ['/login', '/esqueci-senha', '/auth/'];

export async function middleware(request) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
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
    }
  );

  // Renova a sessão e confere quem está logado
  const {
    data: { user },
  } = await supabase.auth.getUser();

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

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icon.svg|apple-icon.png|icon-192.png|icon-512.png|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
