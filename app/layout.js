import './globals.css';
import BlobsGate from './BlobsGate';
import FooterGate from './FooterGate';
import AggiornamentoAuto from './AggiornamentoAuto';

export const metadata = {
  title: 'Maisola',
  description: 'Una missione a settimana, con il tuo gruppo.',
  manifest: '/manifest.json',
};

export const viewport = {
  themeColor: '#0D0A1E',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="it">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@700;800&family=Manrope:wght@500;700;800&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body>
        <AggiornamentoAuto />
        <BlobsGate />
        <div className="wrap">
          {children}
          <FooterGate />
        </div>
      </body>
    </html>
  );
}
