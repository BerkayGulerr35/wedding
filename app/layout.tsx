import type { Metadata } from 'next';
import { Cormorant_Garamond, Inter, Caveat } from 'next/font/google';
import './globals.css';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const caveat = Caveat({
  subsets: ['latin'],
  variable: '--font-caveat',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Gizem & Berkay — Düğün Anıları',
  description: 'Bizimle bu anıları paylaş ❤️',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={`${cormorant.variable} ${inter.variable} ${caveat.variable}`}>
      <body>{children}</body>
    </html>
  );
}
