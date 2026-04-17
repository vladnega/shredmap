'use client';

import Image from 'next/image';
import Link from 'next/link';
import { X, ExternalLink, MapPin, Pencil } from 'lucide-react';
import useSWR from 'swr';
import { TrailDifficultyIcon } from '@/components/bike-parks/trail-difficulty-icon';
import { Button } from '@/components/ui/button';
import { ParkReviewSummaryHeader } from '@/components/reviews/park-review-summary-header';
import { ParkReviewsSection } from '@/components/reviews/park-reviews-section';
import type { BikePark } from '@/lib/db/schema';
import { BIKE_PARK_STAFF_ROLE_SLUGS } from '@/lib/auth/bike-park-staff-roles';
import { useAppUser } from '@/lib/hooks/use-app-user';
import { MAP_UI_LAYER_Z } from '@/lib/map/map-ui-layers';
import {
  BIKE_PARK_FACILITY_LABELS,
  isBikeParkFacilitySlug,
} from '@/lib/bike-parks/facilities';
import {
  TRAIL_DIFFICULTY_LABELS,
  TRAIL_DIFFICULTY_LEVELS,
} from '@/lib/bike-parks/trail-difficulties';

type WorkOsRolesPayload = { roles: string[] };

function rolesFetcher(url: string): Promise<WorkOsRolesPayload> {
  return fetch(url).then((r) => {
    if (!r.ok) throw new Error(String(r.status));
    return r.json() as Promise<WorkOsRolesPayload>;
  });
}

function isBikeParkStaffFromRoles(roles: string[] | undefined): boolean {
  if (!roles?.length) return false;
  const set = new Set(roles);
  return BIKE_PARK_STAFF_ROLE_SLUGS.some((slug) => set.has(slug));
}

function amenityList(amenities: Record<string, boolean> | null | undefined) {
  if (!amenities) return [];
  return Object.entries(amenities).flatMap(([key, enabled]) => {
    if (!enabled) return [];
    return [
      isBikeParkFacilitySlug(key)
        ? BIKE_PARK_FACILITY_LABELS[key]
        : key.replace(/_/g, ' '),
    ];
  });
}

const orderedDays = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

function formatOpeningHours(
  openingHours: BikePark['openingHours'],
): Array<{ label: string; hours: string }> {
  if (!openingHours || typeof openingHours !== 'object' || Array.isArray(openingHours)) {
    return [];
  }
  const entries = Object.entries(openingHours)
    .filter(([, value]) => typeof value === 'string' && value.trim().length > 0)
    .map(([day, value]) => ({
      day,
      hours: value.trim(),
    }));
  if (entries.length === 0) {
    return [];
  }
  const orderIndex = new Map<string, number>(
    orderedDays.map((day, index) => [day, index]),
  );
  entries.sort((a, b) => {
    const aIndex = orderIndex.get(a.day.toLowerCase()) ?? Number.MAX_SAFE_INTEGER;
    const bIndex = orderIndex.get(b.day.toLowerCase()) ?? Number.MAX_SAFE_INTEGER;
    if (aIndex !== bIndex) return aIndex - bIndex;
    return a.day.localeCompare(b.day);
  });
  return entries.map(({ day, hours }) => ({
    label: day.charAt(0).toUpperCase() + day.slice(1),
    hours,
  }));
}

export function ParkDetailPanel({
  park,
  onClose,
  layout,
}: {
  park: BikePark;
  onClose: () => void;
  layout: 'desktop' | 'mobile';
}) {
  const { data: user } = useAppUser();
  const { data: roleData } = useSWR<WorkOsRolesPayload>(
    user ? '/api/workos/roles' : null,
    rolesFetcher,
    { revalidateOnFocus: false },
  );
  const isStaff = isBikeParkStaffFromRoles(roleData?.roles);

  const facilities = amenityList(park.amenities ?? undefined);
  const trailCounts = park.trailDifficultyCounts;
  const openingHours = formatOpeningHours(park.openingHours);
  const hasTrailCounts =
    trailCounts != null &&
    TRAIL_DIFFICULTY_LEVELS.some((level) => trailCounts[level] > 0);
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    `${park.latitude},${park.longitude}`,
  )}`;
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
        {(park.logoUrl || isStaff) && (
          <div className="relative mt-4 flex justify-center">
            {isStaff ? (
              <Button
                asChild
                variant="secondary"
                size="icon"
                className="absolute right-0 top-0 rounded-full border border-zinc-700"
              >
                <Link href={`/admin/bike-parks/${park.id}`} aria-label="Edit park">
                  <Pencil className="h-4 w-4" />
                </Link>
              </Button>
            ) : null}
            {park.logoUrl ? (
              <div className="relative aspect-square w-28 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-lg shadow-orange-500/10">
                <Image
                  src={park.logoUrl}
                  alt=""
                  fill
                  className="object-contain p-2"
                  sizes="112px"
                  unoptimized
                />
              </div>
            ) : null}
          </div>
        )}

        {park.description && (
          <div
            className="prose prose-invert prose-sm mt-4 max-w-none text-zinc-300 [&_p]:leading-relaxed"
            dangerouslySetInnerHTML={{ __html: park.description }}
          />
        )}

        <dl className="mt-6 space-y-3 text-sm">
          {park.payment && (
            <div className="flex justify-between gap-4 border-b border-zinc-800/60 pb-2">
              <dt className="text-zinc-500">Pricing</dt>
              <dd className="text-zinc-200 font-medium capitalize">
                {park.payment.replace(/_/g, ' ')}
              </dd>
            </div>
          )}
          {openingHours.length > 0 && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3">
              <dt className="text-zinc-500 text-xs uppercase tracking-wider">
                Opening hours
              </dt>
              <dd className="mt-2">
                <ul className="space-y-1 text-sm">
                  {openingHours.map(({ label, hours }) => (
                    <li key={label} className="flex items-start justify-between gap-4">
                      <span className="text-zinc-400">{label}</span>
                      <span className="text-right text-zinc-200">{hours}</span>
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
          )}
        </dl>

        {hasTrailCounts && trailCounts && (
          <div className="mt-6">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
              Trails
            </h3>
            <ul className="mt-2 flex flex-wrap gap-2">
              {TRAIL_DIFFICULTY_LEVELS.map((level) => (
                <li
                  key={level}
                  className="inline-flex items-center gap-2 rounded-full border border-zinc-800/70 bg-zinc-900/70 px-3 py-1.5"
                >
                  <span className="inline-flex items-center gap-1.5 text-sm text-zinc-200">
                    <TrailDifficultyIcon level={level} />
                    {TRAIL_DIFFICULTY_LABELS[level]}
                  </span>
                  <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs font-semibold text-zinc-100">
                    {trailCounts[level]}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {facilities.length > 0 && (
          <div className="mt-6">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
              Facilities
            </h3>
            <ul className="mt-2 flex flex-wrap gap-2">
              {facilities.map((label) => (
                <li
                  key={label}
                  className="rounded-full border border-orange-500/25 bg-orange-500/10 px-3 py-1 text-xs font-medium text-orange-200"
                >
                  {label}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-8 space-y-2">
          <div className="flex flex-wrap items-center justify-center gap-2">
            {park.primaryCtaUrl && (
              <Button
                asChild
                className="rounded-full bg-gradient-to-r from-orange-600 to-red-600 font-semibold text-white shadow-lg shadow-orange-600/25 hover:from-orange-500 hover:to-red-500"
              >
                <a href={park.primaryCtaUrl} target="_blank" rel="noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Visit website
                </a>
              </Button>
            )}
            {park.buyTicketUrl && (
              <Button
                asChild
                className="rounded-full bg-gradient-to-r from-orange-600 to-red-600 font-semibold text-white shadow-lg shadow-orange-600/25 hover:from-orange-500 hover:to-red-500"
              >
                <a href={park.buyTicketUrl} target="_blank" rel="noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Buy ticket
                </a>
              </Button>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          <Button asChild variant="outline" className="rounded-full border-zinc-700">
            <a href={directionsUrl} target="_blank" rel="noreferrer">
              <MapPin className="mr-2 h-3.5 w-3.5" />
              Directions
            </a>
          </Button>
        </div>

        <ParkReviewsSection bikeParkId={park.id} />

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
