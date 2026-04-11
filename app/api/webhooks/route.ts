import { NextResponse } from 'next/server';

/**
 * Generic webhook receiver (payments, WorkOS, Slack, etc.).
 * Verify signatures before trusting the payload in production.
 */
export async function POST(request: Request) {
  const contentType = request.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    await request.json().catch(() => null);
  } else {
    await request.text().catch(() => null);
  }

  return NextResponse.json({ received: true });
}
