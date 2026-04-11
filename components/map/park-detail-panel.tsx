'use client';

import Image from 'next/image';
import Link from 'next/link';
import { X, ExternalLink, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { BikePark } from '@/lib/db/schema';

const AMENITY_LABELS: Record<string, string> = {
  bike_rental: 'Bike rental',
  bike_mechanic: 'Mechanic',
  food_drink: 'Food & drink',
  toilets: 'Toilets',
  showers: 'Showers',
  bike_wash: 'Bike wash',
  first_aid: 'First aid',
  coaching: 'Coaching',
  parking: 'Parking',
  uplift_chair: 'Uplift (chair)',
  uplift_gondola: 'Uplift (gondola)',
  uplift_shuttle: 'Uplift (shuttle)',
  ebike_allowed: 'E-bike allowed',
  accommodation: 'Accommodation',
  shop: 'Shop',
};

function amenityList(amenities: Record<string, boolean> | null | undefined) {
  if (!amenities) return [];
  return Object.entries(amenities)
    .filter(([, v]) => v)
    .map(([k]) => AMENITY_LABELS[k] ?? k.replace(/_/g, ' '));
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
  const facilities = amenityList(park.amenities ?? undefined);

  const shell =
    layout === 'mobile'
      ? 'fixed inset-0 z-50 flex flex-col bg-zinc-950/98 backdrop-blur-md animate-in fade-in duration-200'
      : 'h-full w-full max-w-md border-l border-zinc-800 bg-zinc-950/95 backdrop-blur-md shadow-2xl animate-in slide-in-from-right duration-300';

  return (
    <aside className={shell}>
      <div
        className={`flex items-start justify-between gap-3 p-4 border-b border-zinc-800/80 ${
          layout === 'mobile' ? 'pt-[max(1rem,env(safe-area-inset-top))]' : ''
        }`}
      >
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-bold tracking-tight text-white leading-tight">
            {park.name}
          </h2>
          {park.ratingScore != null && (
            <p className="mt-1 text-sm text-amber-400 font-medium">
              {park.ratingScore.toFixed(1)} / 5
              {park.ratingVoteCount != null && park.ratingVoteCount > 0 && (
                <span className="text-zinc-500 font-normal">
                  {' '}
                  · {park.ratingVoteCount} votes
                </span>
              )}
            </p>
          )}
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
        {park.logoUrl && (
          <div className="relative mt-4 aspect-square w-28 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-lg shadow-orange-500/10">
            <Image
              src={park.logoUrl}
              alt=""
              fill
              className="object-contain p-2"
              sizes="112px"
              unoptimized
            />
          </div>
        )}

        {park.description && (
          <div
            className="prose prose-invert prose-sm mt-4 max-w-none text-zinc-300 [&_p]:leading-relaxed"
            dangerouslySetInnerHTML={{ __html: park.description }}
          />
        )}

        <dl className="mt-6 space-y-3 text-sm">
          {park.trailCount != null && (
            <div className="flex justify-between gap-4 border-b border-zinc-800/60 pb-2">
              <dt className="text-zinc-500">Trails</dt>
              <dd className="text-zinc-200 font-medium">{park.trailCount}</dd>
            </div>
          )}
          {park.totalTrailLengthKm != null && (
            <div className="flex justify-between gap-4 border-b border-zinc-800/60 pb-2">
              <dt className="text-zinc-500">Trail length</dt>
              <dd className="text-zinc-200 font-medium">
                {park.totalTrailLengthKm} km
              </dd>
            </div>
          )}
          {park.payment && (
            <div className="flex justify-between gap-4 border-b border-zinc-800/60 pb-2">
              <dt className="text-zinc-500">Pricing</dt>
              <dd className="text-zinc-200 font-medium capitalize">
                {park.payment.replace(/_/g, ' ')}
              </dd>
            </div>
          )}
          {park.openingHours != null && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3">
              <dt className="text-zinc-500 text-xs uppercase tracking-wider">
                Opening hours
              </dt>
              <dd className="mt-1 text-zinc-200 text-sm">
                {typeof park.openingHours === 'object'
                  ? JSON.stringify(park.openingHours)
                  : String(park.openingHours)}
              </dd>
            </div>
          )}
        </dl>

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

        <div className="mt-8 flex flex-col gap-2 sm:flex-row">
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
          {park.sourceUrl && (
            <Button asChild variant="outline" className="rounded-full border-zinc-700">
              <a href={park.sourceUrl} target="_blank" rel="noreferrer">
                More information
              </a>
            </Button>
          )}
        </div>

        <p className="mt-6 flex items-center gap-2 text-xs text-zinc-600">
          <MapPin className="h-3.5 w-3.5" />
          {park.latitude.toFixed(4)}, {park.longitude.toFixed(4)}
        </p>

        <p className="mt-4 text-xs text-zinc-600">
          Community reviews and edits require an account.{' '}
          <Link href="/sign-in" className="text-orange-400 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </aside>
  );
}
