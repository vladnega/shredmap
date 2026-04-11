import { promises as fs } from 'node:fs';
import readline from 'node:readline';
import crypto from 'node:crypto';
import path from 'node:path';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

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

async function getPostgresURL(): Promise<string> {
  console.log('Step 1: Postgres');
  const dbChoice = await question(
    'Local Postgres with Docker (L) or remote URL (R)? (L/R): '
  );

  if (dbChoice.toLowerCase() === 'l') {
    console.log('Setting up local Postgres with Docker...');
    await setupLocalPostgres();
    return 'postgres://postgres:postgres@localhost:54322/postgres';
  }

  console.log(
    'Find managed Postgres: https://vercel.com/docs/storage/vercel-postgres'
  );
  return await question('Enter your POSTGRES_URL: ');
}

async function setupLocalPostgres() {
  try {
    await execAsync('docker --version');
  } catch {
    console.error('Docker is required for the local option.');
    process.exit(1);
  }

  const dockerComposeContent = `
services:
  postgres:
    image: postgres:16.4-alpine
    container_name: full_product_starter_postgres
    environment:
      POSTGRES_DB: postgres
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "54322:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
`;

  await fs.writeFile(
    path.join(process.cwd(), 'docker-compose.yml'),
    dockerComposeContent
  );

  try {
    await execAsync('docker compose up -d');
  } catch {
    console.error('Failed to start Docker Compose.');
    process.exit(1);
  }
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
  const POSTGRES_URL = await getPostgresURL();
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
