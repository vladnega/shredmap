import { neon, type NeonQueryFunction } from '@neondatabase/serverless';
import { drizzle, type NeonHttpDatabase } from 'drizzle-orm/neon-http';
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

let _db: NeonHttpDatabase<typeof schema> | undefined;

/** Lazily initialised so importing this module during build (when env vars may be absent) does not throw. */
export function getDb(): NeonHttpDatabase<typeof schema> {
  if (!_db) {
    _db = drizzle(neon(resolveDatabaseUrl()) as NeonQueryFunction<false, false>, { schema });
  }
  return _db;
}

/**
 * Convenience re-export that keeps every call-site unchanged.
 * Access is proxied so the real connection is only created on first property access at runtime.
 */
export const db: NeonHttpDatabase<typeof schema> = new Proxy(
  {} as NeonHttpDatabase<typeof schema>,
  {
    get(_target, prop, receiver) {
      return Reflect.get(getDb(), prop, receiver);
    },
  },
);
