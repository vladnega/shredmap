/**
 * Canonical public origin for absolute links (mate invite URLs, etc.).
 * Prefer `BASE_URL` in production; falls back to the incoming request origin.
 */
export function appBaseUrlFromRequest(request: Request): string {
  const fromEnv = process.env.BASE_URL?.trim();
  if (fromEnv) {
    return fromEnv.replace(/\/$/, '');
  }
  return new URL(request.url).origin;
}
