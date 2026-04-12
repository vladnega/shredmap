import { neon } from '@neondatabase/serverless';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-http';
import { drizzle as drizzlePg } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import dotenv from 'dotenv';

dotenv.config();

/** Default matches `pnpm db:setup` local Docker port so `next build` works without a .env file. */
const defaultLocalUrl =
  'postgresql://postgres:postgres@127.0.0.1:54322/postgres';

function resolveExplicitDatabaseUrl(): string | undefined {
  const fromPostgres = process.env.POSTGRES_URL?.trim();
  const fromDatabase = process.env.DATABASE_URL?.trim();
  return fromPostgres || fromDatabase || undefined;
}

function resolveDatabaseUrl(): string {
  return resolveExplicitDatabaseUrl() ?? defaultLocalUrl;
}

/** Neon connection strings use `*.neon.tech` hosts; use HTTP driver (fits Vercel serverless). */
function isNeonConnectionString(url: string): boolean {
  try {
    const normalized = url
      .replace(/^postgresql:/i, 'https:')
      .replace(/^postgres:/i, 'https:');
    return new URL(normalized).hostname.endsWith('neon.tech');
  } catch {
    return false;
  }
}

const databaseUrl = resolveDatabaseUrl();

if (!resolveExplicitDatabaseUrl()) {
  console.warn(
    '[db] Neither POSTGRES_URL nor DATABASE_URL is set; using local Docker default. Create .env for remote databases.'
  );
}

export const db = isNeonConnectionString(databaseUrl)
  ? drizzleNeon(neon(databaseUrl), { schema })
  : drizzlePg(postgres(databaseUrl), { schema });
