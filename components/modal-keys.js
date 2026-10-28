'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ModalKeys({ closeHref }) {
  const router = useRouter();
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') router.push(closeHref, { scroll: false });
    };
    document.addEventListener('keydown', onKey);
    document.body.classList.add('modal-open');
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.classList.remove('modal-open');
    };
  }, [closeHref, router]);
  return null;
}
