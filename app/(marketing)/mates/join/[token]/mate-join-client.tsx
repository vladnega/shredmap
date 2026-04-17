'use client';

import { useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { Button } from '@/components/ui/button';
import type { User } from '@/lib/db/schema';

type PreviewOk = { ok: true; inviterLabel: string };
type PreviewErr = { ok: false; code: string };
type PreviewResponse = PreviewOk | PreviewErr;

const userFetcher = (url: string) =>
  fetch(url).then((r) => r.json() as Promise<User | null>);

export function MateJoinClient({ token }: { token: string }) {
  const { data: preview, error: previewError } = useSWR<PreviewResponse>(
    `/api/friends/invite-link/preview?token=${encodeURIComponent(token)}`,
    (url: string) => fetch(url).then((r) => r.json() as Promise<PreviewResponse>),
  );

  const { data: user, mutate: mutateUser } = useSWR<User | null>(
    '/api/user',
    userFetcher,
  );

  const [redeemError, setRedeemError] = useState<string | null>(null);
  const [redeemBusy, setRedeemBusy] = useState(false);
  const [redeemDone, setRedeemDone] = useState(false);
  const [alreadyMates, setAlreadyMates] = useState(false);

  const returnPath = `/mates/join/${encodeURIComponent(token)}`;
  const authQuery = `?redirect=${encodeURIComponent(returnPath)}`;

  async function redeem() {
    setRedeemError(null);
    setRedeemBusy(true);
    try {
      const res = await fetch('/api/friends/invite-link/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        error?: string;
        alreadyMates?: boolean;
      };
      if (!res.ok) {
        setRedeemError(body.error ?? 'Something went wrong.');
        return;
      }
      setAlreadyMates(body.alreadyMates ?? false);
      setRedeemDone(true);
      await mutateUser();
    } finally {
      setRedeemBusy(false);
    }
  }

  if (previewError) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-8 text-center">
        <p className="text-zinc-300">Could not load this invite.</p>
        <Button asChild variant="link" className="mt-4 text-orange-400">
          <Link href="/">Back to map</Link>
        </Button>
      </div>
    );
  }

  if (!preview) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-12">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
        <p className="text-sm text-zinc-400">Loading invite…</p>
      </div>
    );
  }

  if (!preview.ok) {
    const msg =
      preview.code === 'expired'
        ? 'This invite link has expired. Ask your mate for a new one.'
        : 'This invite link is not valid.';
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-8 text-center">
        <p className="text-zinc-200">{msg}</p>
        <Button asChild variant="link" className="mt-4 text-orange-400">
          <Link href="/">Back to map</Link>
        </Button>
      </div>
    );
  }

  const inviterLabel = preview.inviterLabel;

  if (redeemDone) {
    return (
      <div className="rounded-2xl border border-orange-500/30 bg-zinc-900/80 p-8 text-center">
        <h1 className="text-xl font-bold text-white">
          {alreadyMates ? "You're already mates" : "You're mates!"}
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          {alreadyMates
            ? `You and ${inviterLabel} are already connected.`
            : `You and ${inviterLabel} can see each other on ride days.`}
        </p>
        <Button
          asChild
          className="mt-6 rounded-full bg-orange-600 font-semibold text-white hover:bg-orange-500"
        >
          <Link href="/mates">Open Mates</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-8">
      <h1 className="text-2xl font-black tracking-tight text-white">
        Join {inviterLabel} on shredmap
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-zinc-400">
        Create a free account or sign in — then you&apos;ll become mates and can see each
        other&apos;s ride plans on the map. No account needed before you open this link.
      </p>

      {!user ? (
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Button
            asChild
            className="rounded-full bg-gradient-to-r from-orange-600 to-red-600 font-bold text-white shadow-lg shadow-orange-600/30"
          >
            <Link href={`/sign-up${authQuery}`}>Create account</Link>
          </Button>
          <Button
            asChild
            variant="secondary"
            className="rounded-full border border-zinc-600 bg-zinc-800 text-white"
          >
            <Link href={`/sign-in${authQuery}`}>Sign in</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          <p className="text-sm text-zinc-300">
            Signed in as <span className="font-medium text-white">{user.email}</span>
          </p>
          {redeemError ? (
            <p className="text-sm text-red-400" role="alert">
              {redeemError}
            </p>
          ) : null}
          <Button
            type="button"
            disabled={redeemBusy}
            className="rounded-full bg-orange-600 font-semibold text-white hover:bg-orange-500"
            onClick={() => void redeem()}
          >
            {redeemBusy ? 'Connecting…' : `Become mates with ${inviterLabel}`}
          </Button>
        </div>
      )}

      <p className="mt-8 text-center text-xs text-zinc-600">
        <Link href="/" className="text-zinc-500 hover:text-zinc-400">
          Back to map
        </Link>
      </p>
    </div>
  );
}
