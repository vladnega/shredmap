import { rejectMateInvitation, requireSignedInUser } from '@/lib/social/queries';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireSignedInUser();
  if (!auth.ok) {
    return auth.response;
  }

  const { id } = await params;
  const invitationId = Number.parseInt(id, 10);
  if (!Number.isFinite(invitationId)) {
    return Response.json({ error: 'Invalid id' }, { status: 400 });
  }

  const result = await rejectMateInvitation(invitationId, auth.user.id);
  if (!result.ok) {
    if (result.code === 'not_found') {
      return Response.json({ error: 'Not found' }, { status: 404 });
    }
    if (result.code === 'forbidden') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    return Response.json({ error: 'Invite is no longer pending.' }, { status: 409 });
  }

  return Response.json({ ok: true });
}
