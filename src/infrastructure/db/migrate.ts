import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/neon-http';
import { migrate } from 'drizzle-orm/neon-http/migrator';

import { logger } from '../logger';

const isProduction = process.argv.includes('--production');

config({ path: isProduction ? '.env.production' : '.env' });

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

const main = async () => {
  try {
    logger.info('Starting migration...');

    await migrate(db, { migrationsFolder: './src/infrastructure/db/migrations' });

    logger.info('Migration completed');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error during migration:', error);
    logger.error({ error }, 'Migration failed');

    process.exit(1);
  }
};

main();
