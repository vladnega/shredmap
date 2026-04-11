import { NextResponse } from 'next/server';
import { getWorkOsSignInUrl } from '@/lib/auth/workos-redirect';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const returnTo = searchParams.get('redirect') ?? undefined;
  const url = await getWorkOsSignInUrl(returnTo);
  return NextResponse.redirect(url);
}
