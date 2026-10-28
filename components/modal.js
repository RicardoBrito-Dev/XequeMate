import Link from 'next/link';
import ModalKeys from './modal-keys';

// Janela por cima da página. Fecha pelo link, pelo fundo ou pela tecla Esc.
export default function Modal({ closeHref, label, wide = false, children }) {
  return (
    <div className="mback">
      <Link href={closeHref} className="mback-close" aria-label="Fechar" scroll={false} />
      <div className={`modal ${wide ? 'wide' : ''}`} role="dialog" aria-modal="true" aria-label={label}>
        {children}
      </div>
      <ModalKeys closeHref={closeHref} />
    </div>
  );
}
