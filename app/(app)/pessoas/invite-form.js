'use client';

import { useActionState, useState } from 'react';
import { inviteUser } from '@/lib/actions/pessoas';

export default function InviteForm() {
  const [state, action, pending] = useActionState(inviteUser, null);
  const [role, setRole] = useState('artist');
  const [copied, setCopied] = useState(false);
  const keep = state?.keep || {};

  async function copy(text) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  if (state?.ok) {
    const message = state.password
      ? `Oi, ${state.name.split(' ')[0]}! Seu acesso ao app do Xeque Mate Studio:\n${typeof window !== 'undefined' ? window.location.origin : ''}/login\nE-mail: ${state.email}\nSenha provisória: ${state.password}\nDepois de entrar, troque a senha em Meu perfil.`
      : '';
    return (
      <div className="card stack">
        <h2 className="h-card">Pronto!</h2>
        {state.password ? (
          <>
            <p className="muted small">
              A conta de <b>{state.email}</b> foi criada. Mande a mensagem abaixo para a pessoa pelo WhatsApp. A senha só aparece agora.
            </p>
            <pre className="copybox">{message}</pre>
            <div className="row-actions">
              <button type="button" className="btn sm" onClick={() => copy(message)}>
                {copied ? 'Copiado!' : 'Copiar mensagem'}
              </button>
              <a href="/pessoas" className="btn sm ghost">
                Convidar outra pessoa
              </a>
            </div>
          </>
        ) : (
          <>
            <p className="muted small">
              Enviamos o convite para <b>{state.email}</b>. A pessoa clica no link do e-mail e cria a própria senha.
            </p>
            <div className="row-actions">
              <a href="/pessoas" className="btn sm ghost">
                Convidar outra pessoa
              </a>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <form action={action} className="card form">
      <h2 className="h-card full">Convidar pessoa</h2>
      <div className="field">
        <label htmlFor="iv-role">Tipo de acesso</label>
        <select id="iv-role" name="role" value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="artist">Artista · vê só as próprias coisas</option>
          <option value="staff">Equipe · técnico ou produtor</option>
          <option value="admin">Admin · acesso total</option>
        </select>
      </div>
      <div className="field">
        <label htmlFor="iv-email">E-mail</label>
        <input id="iv-email" name="email" type="email" required defaultValue={keep.email || ''} />
      </div>
      <div className="field">
        <label htmlFor="iv-name">Nome</label>
        <input id="iv-name" name="name" required defaultValue={keep.name || ''} />
      </div>
      {role === 'artist' ? (
        <div className="field">
          <label htmlFor="iv-stage">Nome artístico</label>
          <input id="iv-stage" name="stage_name" defaultValue={keep.stage_name || ''} />
        </div>
      ) : (
        <div className="field">
          <label htmlFor="iv-title">Função</label>
          <input id="iv-title" name="title" placeholder="Ex.: Técnico de som" defaultValue={keep.title || ''} />
        </div>
      )}
      <fieldset className="field full radios">
        <legend>Como a pessoa recebe o acesso</legend>
        <label className="check">
          <input type="radio" name="mode" value="email" defaultChecked={keep.mode !== 'senha'} /> Convite por e-mail (ela cria a própria senha)
        </label>
        <label className="check">
          <input type="radio" name="mode" value="senha" defaultChecked={keep.mode === 'senha'} /> Senha provisória (você manda pelo WhatsApp)
        </label>
      </fieldset>
      {state?.error ? <p className="err full">{state.error}</p> : null}
      <div className="mact full">
        <button className="btn pri" disabled={pending}>
          {pending ? 'Criando…' : 'Criar acesso'}
        </button>
      </div>
    </form>
  );
}
