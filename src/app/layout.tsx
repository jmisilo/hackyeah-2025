import '../styles/globals.css';

import type { Metadata } from 'next';
import { Geist } from 'next/font/google';

import { type FC, type PropsWithChildren } from 'react';

import { Toaster } from 'sonner';

import { ModalContextProvider } from '@/ui/modal';
import { cn } from '@/utilities/cn';
import * as env from '@/utilities/env';

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
  weight: ['300', '400', '500', '600'],
});

export const metadata: Metadata = {
  title: 'Navio - Public Transport Navigator',
  description: 'Navigate Cracow public transport with ease and confidence.',
};

const RootLayout: FC<PropsWithChildren> = async ({ children }) => {
  return (
    <html
      lang="en"
      className="scrollbar-thin scrollbar-track-transparent scrollbar-thumb-black/30 scrollbar-track-rounded-full">
      {env.isDevelopment() && (
        <head>
          {/* eslint-disable-next-line */}
          <script crossOrigin="anonymous" src="//unpkg.com/react-scan/dist/auto.global.js" />
          <link rel="stylesheet" href="https://unpkg.com/maplibre-gl@3.6.1/dist/maplibre-gl.css" />
        </head>
      )}

      <body className={cn(geist.className, 'bg-')}>
        <ModalContextProvider>{children}</ModalContextProvider>

        <Toaster position="top-right" theme="light" closeButton richColors />
      </body>
    </html>
  );
};

export default RootLayout;
