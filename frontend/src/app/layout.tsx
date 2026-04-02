import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { Toaster } from 'react-hot-toast';
import { TestCredentials } from '@/components/TestCredentials';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
});

const playfair = Playfair_Display({ 
  subsets: ['latin'],
  variable: '--font-playfair',
});

export const metadata: Metadata = {
  title: 'Ideal Weddings - Wedding Planning Made Perfect',
  description: 'Connect with the perfect vendors for your dream wedding. Get quotes, manage guests, and plan your special day with ease.',
  keywords: 'wedding planning, wedding vendors, wedding quotes, guest management, wedding services',
  authors: [{ name: 'Ideal Weddings Team' }],
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  themeColor: '#ed7519',
  manifest: '/manifest.json',
  icons: {
    icon: '/icons/icon-192x192.png',
    apple: '/icons/icon-192x192.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="font-sans antialiased bg-gray-50">
          <Providers>
              {children}
              <TestCredentials />
              <Toaster
                  position="top-right"
                  toastOptions={{
                      duration: 4000,
                      style: {
                          background: '#363636',
                          color: '#fff',
                      },
                  }}
              />
          </Providers>
      </body>
    </html>
  );
} 