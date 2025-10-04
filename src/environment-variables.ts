import { createEnv } from '@t3-oss/env-nextjs';

import { vercel } from '@t3-oss/env-core/presets-zod';
import { z } from 'zod';

export const envVariables = createEnv({
  server: {},
  client: {
    NEXT_PUBLIC_VERCEL_ENV: z.enum(['production', 'preview', 'development']).optional(),
  },
  shared: {},
  runtimeEnv: {
    NEXT_PUBLIC_VERCEL_ENV: process.env.NEXT_PUBLIC_VERCEL_ENV,
  },
  extends: [vercel()],
});
