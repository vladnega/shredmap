import { getMateInviteLinkPreview } from '@/lib/social/queries';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token')?.trim() ?? '';
  if (token.length < 32) {
    return Response.json({ ok: false, code: 'invalid' as const });
  }

  const preview = await getMateInviteLinkPreview(token);
  if (!preview.ok) {
    return Response.json({ ok: false, code: preview.code });
  }

  return Response.json({ ok: true, inviterLabel: preview.inviterLabel });
}
