CREATE UNIQUE INDEX "park_reviews_bike_park_user_unique"
ON "park_reviews" USING btree ("bike_park_id", "user_id");
