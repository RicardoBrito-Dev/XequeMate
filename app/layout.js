import { Familjen_Grotesk, Instrument_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const display = Familjen_Grotesk({ subsets: ['latin'], variable: '--font-display', display: 'swap' });
const body = Instrument_Sans({ subsets: ['latin'], variable: '--font-body', display: 'swap' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' });

export const metadata = {
  title: { default: 'Xeque Mate Studio', template: '%s · Xeque Mate' },
  description: 'Agenda, artistas e projetos do Xeque Mate Studio.',
  applicationName: 'Xeque Mate',
  appleWebApp: { capable: true, title: 'Xeque Mate', statusBarStyle: 'black-translucent' },
  robots: { index: false, follow: false },
};

export const viewport = {
  themeColor: '#0b1310',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
