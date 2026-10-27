import type { Metadata, Viewport } from 'next';
import { Fredoka, Nunito } from 'next/font/google';
import '../styles/globals.css';
import { Providers } from '../components/Providers';

const display = Fredoka({ subsets: ['latin'], variable: '--font-display', display: 'swap' });
const body = Nunito({ subsets: ['latin'], variable: '--font-body', display: 'swap' });

export const metadata: Metadata = {
  title: { default: 'AquaBuddy: friendly hydration tracker', template: '%s · AquaBuddy' },
  description: 'Track your water, get playful reminders, and build a hydration habit that fits your day.',
  manifest: '/manifest.webmanifest',
  icons: { icon: '/icons/icon.svg', apple: '/icons/icon-192.png' },
  appleWebApp: { capable: true, title: 'AquaBuddy', statusBarStyle: 'default' },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#d6f6ff' },
    { media: '(prefers-color-scheme: dark)', color: '#07141c' },
  ],
  width: 'device-width',
  initialScale: 1,
};

// Applies the saved theme before first paint to avoid a light flash in dark mode.
const themeScript = `try{var s=JSON.parse(localStorage.getItem('aquabuddy:v1')||'{}'),p=s.prefs||{},t=p.theme||'system';
if(t==='dark'||(t==='system'&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark');
if(p.reducedMotion)document.documentElement.classList.add('reduce-motion')}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
