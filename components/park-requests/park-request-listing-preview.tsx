'use client';

import Image from 'next/image';
import { ExternalLink, MapPin } from 'lucide-react';
import { TrailDifficultyCountPills } from '@/components/bike-parks/trail-difficulty-count-pills';
import { Button } from '@/components/ui/button';
import {
  BIKE_PARK_FACILITY_OPTIONS,
  type BikeParkFacilitySlug,
} from '@/lib/bike-parks/facilities';
import { formatOpeningHours } from '@/lib/bike-parks/park-display';
import { googleMapsEmbedUrl } from '@/lib/map/google-maps-embed';
import type { TrailDifficultyCounts } from '@/lib/bike-parks/trail-difficulties';

function facilityLabel(slug: BikeParkFacilitySlug): string {
  return BIKE_PARK_FACILITY_OPTIONS.find((o) => o.slug === slug)?.label ?? slug;
}

export function ParkRequestListingPreview({
  name,
  descriptionPlain,
  latitude,
  longitude,
  logoUrl,
  website,
  buyTicketUrl,
  requiresPayment,
  openingHours,
  trailDifficultyCounts,
  facilitySlugs,
}: {
  name: string;
  descriptionPlain: string;
  latitude: number;
  longitude: number;
  logoUrl: string;
  website: string;
  buyTicketUrl: string;
  requiresPayment: boolean;
  openingHours: Record<string, string>;
  trailDifficultyCounts: TrailDifficultyCounts;
  facilitySlugs: BikeParkFacilitySlug[];
}) {
  const hoursRows = formatOpeningHours(openingHours);
  const paymentLabel = requiresPayment ? 'paid' : 'free';
  const websiteTrim = website.trim();
  const buyTicketTrim = buyTicketUrl.trim();
  const logoTrim = logoUrl.trim();
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    `${latitude},${longitude}`,
  )}`;

  return (
    <div className="mt-2 space-y-4">
      <div className="overflow-hidden rounded-lg border border-zinc-700/80 bg-zinc-950">
        <iframe
          title={name.trim() ? `Map of ${name.trim()}` : 'Proposed location'}
          src={googleMapsEmbedUrl(latitude, longitude)}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="h-48 w-full border-0"
        />
      </div>

      {logoTrim ? (
        <div className="flex justify-center">
          <div className="relative aspect-square w-28 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-lg shadow-orange-500/10">
            <Image
              src={logoTrim}
              alt=""
              fill
              className="object-contain p-2"
              sizes="112px"
              unoptimized
            />
          </div>
        </div>
      ) : null}

      <h2 className="text-lg font-bold tracking-tight text-white">
        {name.trim() || 'Untitled park'}
      </h2>

      {descriptionPlain.trim() ? (
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">
          {descriptionPlain.trim()}
        </p>
      ) : null}

      <div className="flex justify-between gap-4 border-b border-zinc-800/60 pb-2 text-sm">
        <span className="text-zinc-500">Pricing</span>
        <span className="font-medium capitalize text-zinc-200">{paymentLabel.replace(/_/g, ' ')}</span>
      </div>

      {hoursRows.length > 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3">
          <p className="text-xs uppercase tracking-wider text-zinc-500">Opening hours</p>
          <ul className="mt-2 space-y-1 text-sm">
            {hoursRows.map(({ label, hours }) => (
              <li key={label} className="flex items-start justify-between gap-4">
                <span className="text-zinc-400">{label}</span>
                <span className="text-right text-zinc-200">{hours}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <TrailDifficultyCountPills counts={trailDifficultyCounts} />

      {facilitySlugs.length > 0 ? (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
            Facilities
          </h3>
          <ul className="mt-2 flex flex-wrap gap-2">
            {facilitySlugs.map((slug) => (
              <li
                key={slug}
                className="rounded-full border border-orange-500/25 bg-orange-500/10 px-3 py-1 text-xs font-medium text-orange-200"
              >
                {facilityLabel(slug)}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
        {websiteTrim ? (
          <Button
            asChild
            className="rounded-full bg-gradient-to-r from-orange-600 to-red-600 font-semibold text-white shadow-lg shadow-orange-600/25 hover:from-orange-500 hover:to-red-500"
          >
            <a href={websiteTrim} target="_blank" rel="noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              Visit website
            </a>
          </Button>
        ) : null}
        {buyTicketTrim ? (
          <Button
            asChild
            className="rounded-full bg-gradient-to-r from-orange-600 to-red-600 font-semibold text-white shadow-lg shadow-orange-600/25 hover:from-orange-500 hover:to-red-500"
          >
            <a href={buyTicketTrim} target="_blank" rel="noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              Buy ticket
            </a>
          </Button>
        ) : null}
      </div>

      <div className="flex justify-center">
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
