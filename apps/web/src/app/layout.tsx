import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import AppNavbar from "../components/Navbar";

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Cricket Bidder',
  description: 'A modern cricket player auction platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-night-stadium text-white min-h-screen`}>
        <AppNavbar />
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}