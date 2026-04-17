import { friendInviteEmailBodySchema } from '@/lib/social/api-schemas';
import {
  createMateInvite,
  listIncomingInvitations,
  listOutgoingInvitations,
  requireSignedInUser,
} from '@/lib/social/queries';

export async function GET() {
  const auth = await requireSignedInUser();
  if (!auth.ok) {
    return auth.response;
  }

  const [incoming, outgoing] = await Promise.all([
    listIncomingInvitations(auth.user.id),
    listOutgoingInvitations(auth.user.id),
  ]);

  return Response.json({ incoming, outgoing });
}

export async function POST(request: Request) {
  const auth = await requireSignedInUser();
  if (!auth.ok) {
    return auth.response;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = friendInviteEmailBodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: 'Validation failed', issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const result = await createMateInvite(auth.user.id, parsed.data.email);
  if (!result.ok) {
    if (result.code === 'not_found') {
      return Response.json(
        {
          error:
            'No account with that email yet. They need to sign in once before you can invite them.',
        },
        { status: 422 },
      );
    }
    if (result.code === 'self') {
      return Response.json({ error: 'You cannot invite yourself.' }, { status: 400 });
    }
    if (result.code === 'already_mates') {
      return Response.json({ error: 'You are already mates.' }, { status: 409 });
    }
    if (result.code === 'pending_exists') {
      return Response.json(
        { error: 'There is already a pending invite between you and this person.' },
        { status: 409 },
      );
    }
    return Response.json({ error: 'Could not create invite.' }, { status: 500 });
  }

  return Response.json({ invitation: result.invitation });
}
