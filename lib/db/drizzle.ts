import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import dotenv from 'dotenv';

dotenv.config();

/** Default matches `pnpm db:setup` local Docker port so `next build` works without a .env file. */
const defaultLocalUrl =
  'postgresql://postgres:postgres@127.0.0.1:54322/postgres';

const url = process.env.POSTGRES_URL ?? defaultLocalUrl;

if (!process.env.POSTGRES_URL) {
  console.warn(
    '[db] POSTGRES_URL is not set; using local Docker default. Create .env for real databases.'
  );
}

export const client = postgres(url);
export const db = drizzle(client, { schema });
