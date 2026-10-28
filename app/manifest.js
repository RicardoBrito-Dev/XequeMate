// Permite instalar o app na tela inicial do celular
export default function manifest() {
  return {
    name: 'Xeque Mate Studio',
    short_name: 'Xeque Mate',
    description: 'Agenda, artistas e projetos do Xeque Mate Studio.',
    start_url: '/painel',
    display: 'standalone',
    background_color: '#0b1310',
    theme_color: '#0b1310',
    lang: 'pt-BR',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
