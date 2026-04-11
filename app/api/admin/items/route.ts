import { getUser } from '@/lib/db/queries';
import { NextResponse } from 'next/server';

/**
 * Placeholder for authenticated admin CRUD on catalog items.
 * Implement create/update/delete here and protect with role checks as your product requires.
 */
export async function POST() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json(
    {
      message:
        'Admin catalog API is a stub. Add Drizzle mutations and authorization for your project.',
    },
    { status: 501 }
  );
}
