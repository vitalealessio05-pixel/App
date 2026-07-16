import './globals.css';

export const metadata = {
  title: 'Missio',
  description: 'Una missione a settimana, con il tuo gruppo.',
  manifest: '/manifest.json',
};

export const viewport = {
  themeColor: '#1B2A4A',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="it">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body>
        <div className="wrap">{children}</div>
      </body>
    </html>
  );
}
