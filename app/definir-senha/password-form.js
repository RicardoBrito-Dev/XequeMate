'use client';

import { useActionState } from 'react';
import { updatePassword } from '@/lib/actions/auth';

export default function PasswordForm() {
  const [state, action, pending] = useActionState(updatePassword, null);
  return (
    <form action={action} className="stack">
      <div className="field">
        <label htmlFor="password">Nova senha</label>
        <input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
        <span className="hint">Pelo menos 8 caracteres.</span>
      </div>
      <div className="field">
        <label htmlFor="confirm">Repita a senha</label>
        <input id="confirm" name="confirm" type="password" autoComplete="new-password" minLength={8} required />
      </div>
      {state?.error ? <p className="err">{state.error}</p> : null}
      <button className="btn pri wide" disabled={pending}>
        {pending ? 'Salvando…' : 'Salvar senha e entrar'}
      </button>
    </form>
  );
}
