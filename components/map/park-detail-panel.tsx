'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { X, Bike, Users } from 'lucide-react';
import useSWR from 'swr';
import { BikeParkReadOnlyBody } from '@/components/bike-parks/bike-park-read-only-body';
import { Button } from '@/components/ui/button';
import { ParkReviewSummaryHeader } from '@/components/reviews/park-review-summary-header';
import { ParkReviewsSection } from '@/components/reviews/park-reviews-section';
import type { BikePark } from '@/lib/db/schema';
import { BIKE_PARK_STAFF_ROLE_SLUGS } from '@/lib/auth/bike-park-staff-roles';
import { useAppUser } from '@/lib/hooks/use-app-user';
import { MAP_UI_LAYER_Z } from '@/lib/map/map-ui-layers';
import { formatLocalCalendarDay } from '@/lib/date/local-calendar-day';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RideDayCalendar } from '@/components/social/ride-day-calendar';

type WorkOsRolesPayload = { roles: string[] };

type ParkRidersPayload = {
  riders: Array<{
    userId: number;
    name: string | null;
    email: string;
    rideOn: string;
    isViewer: boolean;
  }>;
};

function rolesFetcher(url: string): Promise<WorkOsRolesPayload> {
  return fetch(url).then((r) => {
    if (!r.ok) throw new Error(String(r.status));
    return r.json() as Promise<WorkOsRolesPayload>;
  });
}

async function jsonFetcher<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(String(res.status));
  return res.json() as Promise<T>;
}

function isBikeParkStaffFromRoles(roles: string[] | undefined): boolean {
  if (!roles?.length) return false;
  const set = new Set(roles);
  return BIKE_PARK_STAFF_ROLE_SLUGS.some((slug) => set.has(slug));
}

function formatRidePlanDayLabel(ymd: string): string {
  const parts = ymd.split('-').map(Number);
  if (parts.length !== 3) return ymd;
  const [y, m, d] = parts;
  if (!y || !m || !d) return ymd;
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function ParkDetailPanel({
  park,
  onClose,
  layout,
  onRidePlanSaved,
}: {
  park: BikePark;
  onClose: () => void;
  layout: 'desktop' | 'mobile';
  onRidePlanSaved?: () => void;
}) {
  const { data: user } = useAppUser();
  const { data: roleData } = useSWR<WorkOsRolesPayload>(
    user ? '/api/workos/roles' : null,
    rolesFetcher,
    { revalidateOnFocus: false },
  );
  const isStaff = isBikeParkStaffFromRoles(roleData?.roles);
  const [ridePlanSaving, setRidePlanSaving] = useState(false);
  const [ridePickerOpen, setRidePickerOpen] = useState(false);
  const [planDay, setPlanDay] = useState(() => formatLocalCalendarDay(new Date()));

  const matesFromDay = formatLocalCalendarDay(new Date());
  const matesAtParkKey = user
    ? `/api/ride-plans/mates-at-park?bikeParkId=${encodeURIComponent(park.id)}&from=${encodeURIComponent(matesFromDay)}`
    : null;
  const { data: ridersPayload, mutate: mutateParkRiders } = useSWR<ParkRidersPayload>(
    matesAtParkKey,
    jsonFetcher,
    { revalidateOnFocus: true },
  );
  const ridersHere = ridersPayload?.riders ?? [];
  const [removingRideOn, setRemovingRideOn] = useState<string | null>(null);

  useEffect(() => {
    if (ridePickerOpen) {
      setPlanDay(formatLocalCalendarDay(new Date()));
    }
  }, [ridePickerOpen]);

  async function saveRidePlanForDate(ymd: string) {
    if (!user) return;
    setRidePlanSaving(true);
    try {
      const res = await fetch('/api/ride-plans', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: ymd,
          bikeParkId: park.id,
        }),
      });
      if (res.ok) {
        void mutateParkRiders();
        onRidePlanSaved?.();
      }
    } finally {
      setRidePlanSaving(false);
    }
  }

  async function removeRidePlanForDate(ymd: string) {
    if (!user) return;
    setRemovingRideOn(ymd);
    try {
      const res = await fetch(
        `/api/ride-plans?date=${encodeURIComponent(ymd)}`,
        { method: 'DELETE' },
      );
      if (res.ok) {
        void mutateParkRiders();
        onRidePlanSaved?.();
      }
    } finally {
      setRemovingRideOn(null);
    }
  }

  const shell =
    layout === 'mobile'
      ? 'fixed inset-0 flex flex-col bg-zinc-950/98 backdrop-blur-md animate-in fade-in duration-200'
      : 'h-full w-full max-w-md border-l border-zinc-800 bg-zinc-950/95 backdrop-blur-md shadow-2xl animate-in slide-in-from-right duration-300';

  return (
    <aside
      className={shell}
      style={
        layout === 'mobile'
          ? { zIndex: MAP_UI_LAYER_Z.mobileParkPanel }
          : undefined
      }
    >
      <div
        className={`flex items-start justify-between gap-3 p-4 border-b border-zinc-800/80 ${
          layout === 'mobile' ? 'pt-[max(1rem,env(safe-area-inset-top))]' : ''
        }`}
      >
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-bold tracking-tight text-white leading-tight">
            {park.name}
          </h2>
          <ParkReviewSummaryHeader bikeParkId={park.id} />
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800"
          onClick={onClose}
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <BikeParkReadOnlyBody
          park={park}
          staffEditHref={isStaff ? `/admin/bike-parks/${park.id}` : null}
        />

        {user ? (
          <div className="mt-6 rounded-xl border border-zinc-800/90 bg-zinc-900/40 p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 shrink-0 text-orange-400" aria-hidden />
              <h3 className="text-sm font-bold uppercase tracking-wide text-white">
                Mates riding here
              </h3>
            </div>
            <p className="mt-1 text-xs text-zinc-500">
              Upcoming ride plans at this park (today and later).
            </p>
            {ridersHere.length === 0 ? (
              <p className="mt-3 text-sm text-zinc-500">
                No upcoming rides listed yet. Add yourself below or invite mates to see them here.
              </p>
            ) : (
              <ul className="mt-3 space-y-2.5">
                {ridersHere.map((row) => (
                  <li key={`${row.userId}-${row.rideOn}`}>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="flex min-w-0 flex-1 items-baseline justify-between gap-3">
                        <span
                          className={
                            row.isViewer
                              ? 'font-semibold text-orange-200'
                              : 'min-w-0 font-medium text-white'
                          }
                        >
                          {row.isViewer ? 'You' : row.name?.trim() || row.email}
                        </span>
                        <span className="shrink-0 text-zinc-400 tabular-nums">
                          {formatRidePlanDayLabel(row.rideOn)}
                        </span>
                      </div>
                      {row.isViewer ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0 rounded-lg text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"
                          disabled={removingRideOn === row.rideOn}
                          aria-label={`Remove your ride plan for ${formatRidePlanDayLabel(row.rideOn)}`}
                          onClick={() => void removeRidePlanForDate(row.rideOn)}
                        >
                          {removingRideOn === row.rideOn ? (
                            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-zinc-500 border-t-transparent" />
                          ) : (
                            <X className="h-4 w-4" />
                          )}
                        </Button>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-4 flex justify-center border-t border-zinc-800/80 pt-4">
              <Popover open={ridePickerOpen} onOpenChange={setRidePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="secondary"
                    className="rounded-full border border-orange-500/40 bg-orange-500/15 font-semibold text-orange-100 hover:bg-orange-500/25"
                  >
                    <Bike className="mr-2 h-4 w-4" />
                    I&apos;m riding here
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[min(100vw-2rem,20rem)] p-4" align="center">
                  <p className="mb-3 text-center text-sm font-semibold text-white">
                    Choose ride day
                  </p>
                  <RideDayCalendar
                    value={planDay}
                    onChange={setPlanDay}
                    minDate={formatLocalCalendarDay(new Date())}
                  />
                  <Button
                    type="button"
                    disabled={ridePlanSaving}
                    className="mt-4 w-full rounded-full bg-orange-600 font-semibold text-white hover:bg-orange-500"
                    onClick={() => {
                      void (async () => {
                        await saveRidePlanForDate(planDay);
                        setRidePickerOpen(false);
                      })();
                    }}
                  >
                    {ridePlanSaving ? 'Saving…' : `Save for ${formatRidePlanDayLabel(planDay)}`}
                  </Button>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        ) : null}

        <ParkReviewsSection bikeParkId={park.id} />

        {user ? (
          <div className="mt-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Park Requests
            </p>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" className="rounded-full border-zinc-700">
                <Link href={`/bike-parks/${park.id}/park-request`}>
                  Propose changes to this park
                </Link>
              </Button>
            </div>
          </div>
        ) : null}

        {isStaff ? (
          <p className="mt-4 text-xs text-zinc-500">
            <Link
              href="/admin/bike-parks"
              className="font-medium text-orange-400 hover:underline"
            >
              Manage bike parks
            </Link>
          </p>
        ) : null}
      </div>
    </aside>
  );
}
