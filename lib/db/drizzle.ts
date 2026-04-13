import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';
import dotenv from 'dotenv';

dotenv.config();

function resolveDatabaseUrl(): string {
  const url =
    process.env.POSTGRES_URL?.trim() || process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error(
      '[db] Set POSTGRES_URL or DATABASE_URL to your Neon connection string (Neon dashboard → Connection details).'
    );
  }
  return url;
}

const databaseUrl = resolveDatabaseUrl();

export const db = drizzle(neon(databaseUrl), { schema });
