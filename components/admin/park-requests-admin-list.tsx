'use client';

import Link from 'next/link';
import useSWR from 'swr';

type RequestListItem = {
  id: string;
  requestType: string;
  status: string;
  targetParkId: string | null;
  parkName: string | null;
  requesterName: string | null;
  requesterEmail: string;
  createdAt: string;
};

type ListPayload = { requests: RequestListItem[] };

function fetcher(url: string): Promise<ListPayload> {
  return fetch(url).then(async (res) => {
    if (!res.ok) {
      throw new Error(String(res.status));
    }
    return res.json() as Promise<ListPayload>;
  });
}

export function ParkRequestsAdminList() {
  const { data, error, isLoading, mutate } = useSWR<ListPayload>(
    '/api/admin/park-requests',
    fetcher,
  );

  if (isLoading) {
    return <p className="text-sm text-zinc-400">Loading Park Requests…</p>;
  }
  if (error) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-red-300">Failed to load Park Requests.</p>
        <button
          type="button"
          onClick={() => void mutate()}
          className="rounded-md border border-zinc-700 px-3 py-1 text-sm text-zinc-200"
        >
          Retry
        </button>
      </div>
    );
  }

  const requests = data?.requests ?? [];
  if (requests.length === 0) {
    return <p className="text-sm text-zinc-400">No Park Requests yet.</p>;
  }

  return (
    <div className="space-y-3">
      {requests.map((item) => (
        <Link
          key={item.id}
          href={`/admin/park-requests/${item.id}`}
          className="block rounded-lg border border-zinc-800 bg-zinc-900/60 p-4 transition hover:border-zinc-700"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-white">
                {item.requestType === 'new_park' ? 'New park proposal' : 'Park amendment'}
              </p>
              <p className="text-sm text-zinc-200">
                Park: <span className="font-medium text-white">{item.parkName ?? 'Unknown park'}</span>
              </p>
              <p className="text-xs text-zinc-400">
                by {item.requesterName?.trim() || item.requesterEmail}
              </p>
            </div>
            <span
              className={`inline-flex w-fit rounded-full px-2 py-1 text-xs font-semibold ${
                item.status === 'pending'
                  ? 'bg-amber-500/20 text-amber-200'
                  : item.status === 'approved'
                    ? 'bg-emerald-500/20 text-emerald-200'
                    : 'bg-red-500/20 text-red-200'
              }`}
            >
              {item.status}
            </span>
          </div>
          <p className="mt-2 text-xs text-zinc-500">
            Submitted {new Date(item.createdAt).toLocaleString()}
          </p>
        </Link>
      ))}
    </div>
  );
}
