'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ExternalLink, MapPin, Pencil } from 'lucide-react';
import { TrailDifficultyCountPills } from '@/components/bike-parks/trail-difficulty-count-pills';
import { Button } from '@/components/ui/button';
import { amenityList, formatOpeningHours } from '@/lib/bike-parks/park-display';
import { googleMapsEmbedUrl } from '@/lib/map/google-maps-embed';
import type { BikePark } from '@/lib/db/schema';
import {
  TRAIL_DIFFICULTY_LEVELS,
  type TrailDifficultyCounts,
} from '@/lib/bike-parks/trail-difficulties';

function hasAnyTrailCounts(counts: TrailDifficultyCounts | null | undefined): boolean {
  if (!counts) return false;
  return TRAIL_DIFFICULTY_LEVELS.some((level) => counts[level] > 0);
}

export function BikeParkReadOnlyBody({
  park,
  staffEditHref,
  showStaticLocationMap = false,
}: {
  park: BikePark;
  staffEditHref?: string | null;
  showStaticLocationMap?: boolean;
}) {
  const facilities = amenityList(park.amenities ?? undefined);
  const trailCounts = park.trailDifficultyCounts;
  const openingHours = formatOpeningHours(park.openingHours);
  const hasTrailCounts = hasAnyTrailCounts(trailCounts ?? undefined);
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    `${park.latitude},${park.longitude}`,
  )}`;

  return (
    <div>
      {(park.logoUrl || staffEditHref) && (
        <div className="relative mt-4 flex justify-center">
          {staffEditHref ? (
            <Button
              asChild
              variant="secondary"
              size="icon"
              className="absolute right-0 top-0 rounded-full border border-zinc-700"
            >
              <Link href={staffEditHref} aria-label="Edit park">
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

      {showStaticLocationMap ? (
        <div className="mt-4 overflow-hidden rounded-lg border border-zinc-700/80 bg-zinc-950">
          <iframe
            title={`Map of ${park.name}`}
            src={googleMapsEmbedUrl(park.latitude, park.longitude)}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="h-48 w-full border-0"
          />
        </div>
      ) : null}

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
            <dt className="text-xs uppercase tracking-wider text-zinc-500">Opening hours</dt>
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

      {hasTrailCounts && trailCounts ? <TrailDifficultyCountPills counts={trailCounts} /> : null}

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
    </div>
  );
}
