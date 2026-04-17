'use client';

import Link from 'next/link';
import { useState } from 'react';
import useSWR from 'swr';
import { Link2, Copy, MapPin, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { formatLocalCalendarDay } from '@/lib/date/local-calendar-day';

type FriendsPayload = {
  friends: Array<{
    id: number;
    name: string | null;
    email: string;
    friendsSince: string;
  }>;
};

type InviteLinkPayload = {
  linkUrl: string | null;
  expiresAt: string | null;
  needsRefresh?: boolean;
};

type MatesForDayPayload = {
  plans: Array<{
    mateId: number;
    name: string | null;
    email: string;
    bikeParkId: string;
    parkName: string;
  }>;
};

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(String(res.status));
  return res.json() as Promise<T>;
}

function formatViewDayLabel(ymd: string): string {
  const parts = ymd.split('-').map(Number);
  if (parts.length !== 3) return ymd;
  const [y, m, d] = parts;
  if (!y || !m || !d) return ymd;
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

export function MatesDashboard() {
  const [linkBusy, setLinkBusy] = useState(false);
  const [copyDone, setCopyDone] = useState(false);
  const [viewDay, setViewDay] = useState(() => formatLocalCalendarDay(new Date()));

  const { data: friendsData } = useSWR<FriendsPayload>('/api/friends', fetchJson);

  const { data: dayPlansData } = useSWR<MatesForDayPayload>(
    `/api/ride-plans/mates-for-day?date=${encodeURIComponent(viewDay)}`,
    fetchJson,
  );

  const { data: inviteLink, mutate: mutateInviteLink } = useSWR<InviteLinkPayload>(
    '/api/friends/invite-link',
    fetchJson,
  );

  async function createOrRefreshInviteLink() {
    setLinkBusy(true);
    setCopyDone(false);
    try {
      const res = await fetch('/api/friends/invite-link', { method: 'POST' });
      if (res.ok) {
        await mutateInviteLink();
      }
    } finally {
      setLinkBusy(false);
    }
  }

  async function copyInviteLink() {
    if (!inviteLink?.linkUrl) return;
    try {
      await navigator.clipboard.writeText(inviteLink.linkUrl);
      setCopyDone(true);
      window.setTimeout(() => setCopyDone(false), 2000);
    } catch {
      setCopyDone(false);
    }
  }

  const friends = friendsData?.friends ?? [];
  const planByMateId = new Map(
    (dayPlansData?.plans ?? []).map((p) => [p.mateId, p]),
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-white">Mates</h1>
        <p className="mt-1 text-sm text-zinc-400">
          See who you ride with, share your invite link, and show up on each other&apos;s map.
        </p>
      </div>

      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="text-white">Your mates</CardTitle>
              <CardDescription className="text-zinc-400">
                Where each mate plans to ride on{' '}
                <span className="font-medium text-zinc-300">{formatViewDayLabel(viewDay)}</span>.
              </CardDescription>
            </div>
            <label className="flex shrink-0 flex-col gap-1 sm:items-end">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                Day
              </span>
              <input
                type="date"
                value={viewDay}
                onChange={(e) => setViewDay(e.target.value)}
                className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-white [color-scheme:dark]"
              />
            </label>
          </div>
        </CardHeader>
        <CardContent>
          {friends.length === 0 ? (
            <p className="text-sm text-zinc-500">No mates yet — share your invite link below.</p>
          ) : (
            <ul className="space-y-2">
              {friends.map((f) => {
                const plan = planByMateId.get(f.id);
                return (
                  <li
                    key={f.id}
                    className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 px-4 py-3"
                  >
                    <p className="font-medium text-white">{f.name?.trim() || f.email}</p>
                    <p className="text-xs text-zinc-500">{f.email}</p>
                    <div className="mt-2 flex items-start gap-2 text-sm">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-orange-400" aria-hidden />
                      {plan ? (
                        <Link
                          href={`/?park=${encodeURIComponent(plan.bikeParkId)}`}
                          className="font-medium text-orange-300 hover:text-orange-200 hover:underline"
                        >
                          {plan.parkName}
                        </Link>
                      ) : (
                        <span className="text-zinc-500">No ride planned that day</span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Link2 className="h-5 w-5 text-orange-400" aria-hidden />
            Invite link
          </CardTitle>
          <CardDescription className="text-zinc-400">
            Anyone can open it — they can create an account or sign in, then you become mates.
            Good for WhatsApp and group chats.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {inviteLink?.linkUrl ? (
            <>
              <div className="break-all rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 font-mono text-xs text-zinc-300">
                {inviteLink.linkUrl}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="rounded-full border border-zinc-600"
                  onClick={() => void copyInviteLink()}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  {copyDone ? 'Copied' : 'Copy link'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-full border-zinc-600"
                  disabled={linkBusy}
                  onClick={() => void createOrRefreshInviteLink()}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {linkBusy ? 'Refreshing…' : 'New link'}
                </Button>
              </div>
              {inviteLink.expiresAt ? (
                <p className="text-xs text-zinc-500">
                  Expires{' '}
                  {new Date(inviteLink.expiresAt).toLocaleString(undefined, {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </p>
              ) : null}
            </>
          ) : (
            <>
              <p className="text-sm text-zinc-400">
                {inviteLink?.needsRefresh
                  ? 'Your previous link expired. Generate a new one.'
                  : 'Generate a personal link to share.'}
              </p>
              <Button
                type="button"
                disabled={linkBusy}
                className="rounded-full bg-orange-600 font-semibold text-white hover:bg-orange-500"
                onClick={() => void createOrRefreshInviteLink()}
              >
                {linkBusy ? 'Creating…' : 'Create invite link'}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
