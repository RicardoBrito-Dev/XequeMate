'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { loginWithPassword, sendMagicLink } from '@/lib/actions/auth';

export default function LoginForm({ next, notice }) {
  const [mode, setMode] = useState('senha');
  const [pState, pAction, pPending] = useActionState(loginWithPassword, null);
  const [mState, mAction, mPending] = useActionState(sendMagicLink, null);

  return (
    <div className="stack">
      {notice ? <p className="note warn">{notice}</p> : null}

      <div className="seg" role="tablist" aria-label="Como entrar">
        <button type="button" role="tab" aria-selected={mode === 'senha'} className={mode === 'senha' ? 'on' : ''} onClick={() => setMode('senha')}>
          Com senha
        </button>
        <button type="button" role="tab" aria-selected={mode === 'link'} className={mode === 'link' ? 'on' : ''} onClick={() => setMode('link')}>
          Link por e-mail
        </button>
      </div>

      {mode === 'senha' ? (
        <form action={pAction} className="stack">
          <input type="hidden" name="next" value={next} />
          <div className="field">
            <label htmlFor="email">E-mail</label>
            <input id="email" name="email" type="email" autoComplete="email" required defaultValue={pState?.email || ''} />
          </div>
          <div className="field">
            <label htmlFor="password">Senha</label>
            <input id="password" name="password" type="password" autoComplete="current-password" required />
          </div>
          {pState?.error ? <p className="err">{pState.error}</p> : null}
          <button className="btn pri wide" disabled={pPending}>
            {pPending ? 'Entrando…' : 'Entrar'}
          </button>
          <Link href="/esqueci-senha" className="linkbtn center">
            Esqueci a senha
          </Link>
        </form>
      ) : (
        <form action={mAction} className="stack">
          <p className="muted small">Mandamos um link para o seu e-mail. É só clicar para entrar, sem senha.</p>
          <div className="field">
            <label htmlFor="email-link">E-mail</label>
            <input id="email-link" name="email" type="email" autoComplete="email" required defaultValue={mState?.email || ''} />
          </div>
          {mState?.error ? <p className="err">{mState.error}</p> : null}
          {mState?.ok ? <p className="note ok">{mState.ok}</p> : null}
          <button className="btn pri wide" disabled={mPending}>
            {mPending ? 'Enviando…' : 'Enviar link de acesso'}
          </button>
        </form>
      )}

      <p className="muted small center">Ainda não tem conta? Peça para o estúdio te convidar.</p>
    </div>
  );
}
