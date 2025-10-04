import { drizzle } from 'drizzle-orm/neon-http';

import { envVariables } from '@/environment-variables';

import * as schema from './schema';

export const db = drizzle({
  schema,
  connection: envVariables.DATABASE_URL,
});
