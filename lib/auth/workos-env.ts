const REQUIRED_ENV = [
  'WORKOS_API_KEY',
  'WORKOS_CLIENT_ID',
  'WORKOS_COOKIE_PASSWORD',
  'NEXT_PUBLIC_WORKOS_REDIRECT_URI',
] as const;

/**
 * Throws at runtime if WorkOS AuthKit env is incomplete. Required for all environments
 * — there is no legacy email/password login.
 */
export function assertWorkOsConfigured(): void {
  const missing = REQUIRED_ENV.filter((key) => !process.env[key]?.trim());
  if (missing.length > 0) {
    throw new Error(
      `WorkOS AuthKit is required but missing environment variables: ${missing.join(', ')}. ` +
        'Set them in .env (see .env.example).'
    );
  }
}
