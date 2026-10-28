import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { safeNext } from '@/lib/messages';

// Destino dos links enviados por e-mail (convite, link de acesso, nova senha)
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type');
  const code = searchParams.get('code');

  let next = safeNext(searchParams.get('next'));
  if (type === 'invite') next = '/definir-senha?bemvindo=1';
  if (type === 'recovery') next = '/definir-senha';

  const supabase = await createClient();
  let error = new Error('link sem token');

  if (tokenHash && type) {
    ({ error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash }));
  } else if (code) {
    ({ error } = await supabase.auth.exchangeCodeForSession(code));
  }

  if (error) redirect('/login?erro=link');
  redirect(next);
}
