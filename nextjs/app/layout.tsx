import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { AuthProvider } from '@/components/AuthProvider';
import DebugOverlay from '@/components/DebugOverlay';

const inter = localFont({
  src: '../public/fonts/InterVariable.woff2',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'StarGaze | Thai Stars Photo Gallery',
  description: 'StarGaze - 发现你喜爱的泰国艺人',
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <AuthProvider>
          {children}
          <DebugOverlay />
        </AuthProvider>
      </body>
    </html>
  );
}
