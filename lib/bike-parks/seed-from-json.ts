import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { sql } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { bikeParks, type NewBikePark } from '@/lib/db/schema';

const SEED_RELATIVE = join('data', 'bike-parks.seed.json');

function loadRows(): NewBikePark[] {
  const path = join(process.cwd(), SEED_RELATIVE);
  if (!existsSync(path)) {
    return [];
  }
  const raw = readFileSync(path, 'utf-8');
  const parsed = JSON.parse(raw) as unknown;
  if (!Array.isArray(parsed)) {
    throw new Error(`${SEED_RELATIVE} must be a JSON array of bike park objects.`);
  }
  return parsed as NewBikePark[];
}

/**
 * Upserts bike parks from `data/bike-parks.seed.json` (array of rows matching `bike_parks`).
 * If the file is missing, returns 0 — populate it from your own one-off data export.
 */
export async function seedBikeParksFromJsonFile(): Promise<number> {
  const rows = loadRows();
  if (rows.length === 0) {
    return 0;
  }

  await db.insert(bikeParks).values(rows).onConflictDoUpdate({
    target: bikeParks.id,
    set: {
      name: sql`excluded.name`,
      description: sql`excluded.description`,
      latitude: sql`excluded.latitude`,
      longitude: sql`excluded.longitude`,
      logoUrl: sql`excluded.logo_url`,
      pinLogoUrl: sql`excluded.pin_logo_url`,
      amenities: sql`excluded.amenities`,
      trailCount: sql`excluded.trail_count`,
      totalTrailLengthKm: sql`excluded.total_trail_length_km`,
      ratingScore: sql`excluded.rating_score`,
      ratingVoteCount: sql`excluded.rating_vote_count`,
      primaryCtaUrl: sql`excluded.primary_cta_url`,
      primaryCtaType: sql`excluded.primary_cta_type`,
      payment: sql`excluded.payment`,
      status: sql`excluded.status`,
      galleryImageUrls: sql`excluded.gallery_image_urls`,
      openingHours: sql`excluded.opening_hours`,
      sourceUrl: sql`excluded.source_url`,
      updatedAt: sql`now()`,
    },
  });

  return rows.length;
}
