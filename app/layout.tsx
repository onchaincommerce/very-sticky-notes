import '@coinbase/onchainkit/styles.css';
import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Very Sticky Notes',
  description: 'Decentralized sticky notes powered by XMTP',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0a0a0a] text-gray-100">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
