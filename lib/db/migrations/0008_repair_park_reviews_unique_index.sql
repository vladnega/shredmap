DELETE FROM "park_reviews" a
USING "park_reviews" b
WHERE a.id < b.id
  AND a.bike_park_id = b.bike_park_id
  AND a.user_id = b.user_id;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "park_reviews_bike_park_user_unique"
ON "park_reviews" USING btree ("bike_park_id", "user_id");
