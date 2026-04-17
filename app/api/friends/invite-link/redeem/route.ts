import { z } from 'zod';
import { redeemMateInviteLink, requireSignedInUser } from '@/lib/social/queries';

const bodySchema = z.object({
  token: z.string().trim().min(32).max(64),
});

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

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: 'Validation failed', issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const result = await redeemMateInviteLink(parsed.data.token, auth.user.id);
  if (!result.ok) {
    if (result.code === 'invalid') {
      return Response.json({ error: 'Invalid link' }, { status: 404 });
    }
    if (result.code === 'expired') {
      return Response.json({ error: 'This link has expired' }, { status: 410 });
    }
    return Response.json({ error: 'You cannot use your own invite link' }, { status: 400 });
  }

  return Response.json({
    ok: true,
    alreadyMates: result.alreadyMates,
  });
}
