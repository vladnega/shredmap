import { promises as fs } from 'node:fs';
import readline from 'node:readline';
import crypto from 'node:crypto';
import path from 'node:path';

function question(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) =>
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans);
    })
  );
}

async function getNeonDatabaseUrl(): Promise<string> {
  console.log(
    'Database (Neon):\n' +
      'Paste a connection string from https://console.neon.tech → your project → Connection details.\n' +
      'The app uses Neon\'s HTTP driver (`@neondatabase/serverless` + `drizzle-orm/neon-http`).'
  );
  const url = (await question('POSTGRES_URL or DATABASE_URL: ')).trim();
  if (!url) {
    console.error('A database URL is required.');
    process.exit(1);
  }
  return url;
}

function generateWorkOsCookiePassword(): string {
  return crypto.randomBytes(32).toString('base64url');
}

async function writeEnvFile(envVars: Record<string, string>) {
  const envContent = Object.entries(envVars)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  await fs.writeFile(path.join(process.cwd(), '.env'), envContent);
  console.log('.env written.');
}

async function main() {
  const POSTGRES_URL = await getNeonDatabaseUrl();
  const BASE_URL = 'http://localhost:3000';
  const WORKOS_COOKIE_PASSWORD = generateWorkOsCookiePassword();
  const OPENAI_API_KEY = await question(
    'OpenAI API key (optional, press Enter to skip): '
  );

  console.log(
    '\nAdd WORKOS_API_KEY and WORKOS_CLIENT_ID from https://dashboard.workos.com (AuthKit).'
  );

  await writeEnvFile({
    POSTGRES_URL,
    BASE_URL,
    WORKOS_COOKIE_PASSWORD,
    WORKOS_API_KEY: '',
    WORKOS_CLIENT_ID: '',
    NEXT_PUBLIC_WORKOS_REDIRECT_URI: `${BASE_URL}/callback`,
    ...(OPENAI_API_KEY.trim()
      ? { OPENAI_API_KEY: OPENAI_API_KEY.trim() }
      : {}),
  });

  console.log('Setup complete. Run: pnpm db:migrate && pnpm db:seed && pnpm dev');
}

main().catch(console.error);
