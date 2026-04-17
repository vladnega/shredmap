import { listAcceptedFriends, requireSignedInUser } from '@/lib/social/queries';

export async function GET() {
  const auth = await requireSignedInUser();
  if (!auth.ok) {
    return auth.response;
  }

  const friends = await listAcceptedFriends(auth.user.id);
  return Response.json({ friends });
}
