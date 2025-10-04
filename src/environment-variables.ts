import { createEnv } from '@t3-oss/env-nextjs';

import { vercel } from '@t3-oss/env-core/presets-zod';
import { z } from 'zod';

export const envVariables = createEnv({
  server: {
    DATABASE_URL: z.url(),
  },
  client: {
    NEXT_PUBLIC_VERCEL_ENV: z.enum(['production', 'preview', 'development']).optional(),
    NEXT_PUBLIC_OTP_BASE_URL: z.string().url(),
  },
  shared: {},
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,

    NEXT_PUBLIC_VERCEL_ENV: process.env.NEXT_PUBLIC_VERCEL_ENV,
    NEXT_PUBLIC_OTP_BASE_URL: process.env.NEXT_PUBLIC_OTP_BASE_URL,
  },
  extends: [vercel()],
});
