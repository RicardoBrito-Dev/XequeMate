'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { sendPasswordReset } from '@/lib/actions/auth';

export default function ForgotForm() {
  const [state, action, pending] = useActionState(sendPasswordReset, null);
  return (
    <form action={action} className="stack">
      <div className="field">
        <label htmlFor="email">E-mail</label>
        <input id="email" name="email" type="email" autoComplete="email" required defaultValue={state?.email || ''} />
      </div>
      {state?.error ? <p className="err">{state.error}</p> : null}
      {state?.ok ? <p className="note ok">{state.ok}</p> : null}
      <button className="btn pri wide" disabled={pending}>
        {pending ? 'Enviando…' : 'Enviar link'}
      </button>
      <Link href="/login" className="linkbtn center">
        Voltar para o login
      </Link>
    </form>
  );
}
