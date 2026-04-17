import { appBaseUrlFromRequest } from '@/lib/app/request-base-url';
import {
  getMateInviteLinkForInviter,
  requireSignedInUser,
  upsertMateInviteLink,
} from '@/lib/social/queries';

function joinPath(token: string): string {
  return `/mates/join/${token}`;
}

export async function GET(request: Request) {
  const auth = await requireSignedInUser();
  if (!auth.ok) {
    return auth.response;
  }

  const base = appBaseUrlFromRequest(request);
  const row = await getMateInviteLinkForInviter(auth.user.id);
  if (!row) {
    return Response.json({ linkUrl: null, expiresAt: null, needsRefresh: false });
  }

  const expired = row.expiresAt.getTime() <= Date.now();
  if (expired) {
    return Response.json({
      linkUrl: null,
      expiresAt: row.expiresAt.toISOString(),
      needsRefresh: true,
    });
  }

  return Response.json({
    linkUrl: `${base}${joinPath(row.token)}`,
    expiresAt: row.expiresAt.toISOString(),
    needsRefresh: false,
  });
}

export async function POST(request: Request) {
  const auth = await requireSignedInUser();
  if (!auth.ok) {
    return auth.response;
  }

  const base = appBaseUrlFromRequest(request);
  const { token, expiresAt } = await upsertMateInviteLink(auth.user.id);

  return Response.json({
    linkUrl: `${base}${joinPath(token)}`,
    expiresAt: expiresAt.toISOString(),
    needsRefresh: false,
  });
}
