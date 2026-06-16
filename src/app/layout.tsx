import type { Metadata, Viewport } from 'next';
import { ToastProvider } from '@/components/ui/Toast';
import { DeviceRedirect } from '@/components/DeviceRedirect';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'GUM Internships — Learn by doing', template: '%s' },
  description: 'Real-world internships for India: learn, build weekly projects, get mentor reviews and a verifiable certificate.',
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <html lang="en">
      <head>
        {/* Runtime Google Fonts (Latin + Devanagari + Gujarati). Swap to next/font in CI builds with network access. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Poppins:wght@600;700;800&family=Noto+Sans:wght@400;500;700&family=Noto+Sans+Devanagari:wght@400;600&family=Noto+Sans+Gujarati:wght@400;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <DeviceRedirect />
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
