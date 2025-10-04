import '../styles/globals.css';

import type { Metadata } from 'next';
import { Geist } from 'next/font/google';

import { type FC, type PropsWithChildren } from 'react';

import { cn } from '@/utilities/cn';
import * as env from '@/utilities/env';

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
  weight: ['300', '400', '500', '600'],
});

export const metadata: Metadata = {
  title: 'knm',
  description: '',
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
        </head>
      )}

      <body className={cn(geist.className, 'bg-')}>{children}</body>
    </html>
  );
};

export default RootLayout;
