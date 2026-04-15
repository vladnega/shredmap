import { NextResponse } from 'next/server';
import { getWorkOS, saveSession } from '@workos-inc/authkit-nextjs';
import { syncWorkOsUserToDatabase } from '@/lib/auth/sync-workos-user';

/**
 * Test-only: establishes an AuthKit session via WorkOS password auth using
 * TEST_APP_USERNAME + TEST_APP_SECRET. Enable with ENABLE_E2E_TEST_AUTH=1.
 */
export async function POST(request: Request) {
  if (process.env.ENABLE_E2E_TEST_AUTH !== '1') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const email = process.env.TEST_APP_USERNAME?.trim();
  const password = process.env.TEST_APP_SECRET?.trim();
  const clientId = process.env.WORKOS_CLIENT_ID?.trim();

  if (!email || !password || !clientId) {
    return NextResponse.json(
      { error: 'Missing TEST_APP_USERNAME, TEST_APP_SECRET, or WORKOS_CLIENT_ID' },
      { status: 500 },
    );
  }

  const workos = getWorkOS();
  let authResponse;
  try {
    authResponse = await workos.userManagement.authenticateWithPassword({
      clientId,
      email,
      password,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Authentication failed';
    return NextResponse.json({ error: message }, { status: 401 });
  }

  await syncWorkOsUserToDatabase({
    id: authResponse.user.id,
    email: authResponse.user.email,
    firstName: authResponse.user.firstName,
    lastName: authResponse.user.lastName,
  });

  await saveSession(authResponse, request.url);

  return NextResponse.json({ ok: true, userId: authResponse.user.id });
}
