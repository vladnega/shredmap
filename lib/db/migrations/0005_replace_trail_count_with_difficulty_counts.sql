ALTER TABLE "bike_parks"
ADD COLUMN "trail_difficulty_counts" jsonb;

ALTER TABLE "bike_parks"
DROP COLUMN "trail_count";
