'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

const MESSAGES = {
  sessao_marcada: 'Sessão marcada.',
  pedido: 'Pedido enviado. O estúdio vai confirmar.',
  aprovada: 'Sessão aprovada.',
  recusada: 'Pedido recusado.',
  cancelada: 'Sessão cancelada.',
  tecnico: 'Técnico atualizado.',
  perfil: 'Perfil salvo.',
  senha: 'Senha salva.',
  acesso: 'Acesso atualizado.',
  config: 'Configurações salvas.',
  servico: 'Serviço salvo.',
};

// Mostra um aviso rápido quando a URL traz ?msg=... ou ?erro=...
export default function Flash() {
  const sp = useSearchParams();
  const router = useRouter();
  const path = usePathname();
  const [toast, setToast] = useState(null);

  const code = sp.get('msg');
  const erro = sp.get('erro');

  useEffect(() => {
    if (!code && !erro) return;
    const text = erro || MESSAGES[code];
    if (text) setToast({ text, bad: Boolean(erro) });
    const params = new URLSearchParams(sp.toString());
    params.delete('msg');
    params.delete('erro');
    const qs = params.toString();
    router.replace(qs ? `${path}?${qs}` : path, { scroll: false });
  }, [code, erro]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3800);
    return () => clearTimeout(t);
  }, [toast]);

  if (!toast) return null;
  return (
    <div className={`toast ${toast.bad ? 'bad' : ''}`} role="status">
      {toast.text}
    </div>
  );
}
