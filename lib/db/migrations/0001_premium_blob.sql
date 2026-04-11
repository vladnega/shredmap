CREATE TABLE "bike_parks" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" varchar(512) NOT NULL,
	"description" text,
	"latitude" double precision NOT NULL,
	"longitude" double precision NOT NULL,
	"logo_url" text,
	"pin_logo_url" text,
	"amenities" jsonb,
	"trail_count" integer,
	"total_trail_length_km" double precision,
	"rating_score" double precision,
	"rating_vote_count" integer,
	"primary_cta_url" text,
	"primary_cta_type" varchar(64),
	"payment" varchar(64),
	"status" varchar(64),
	"gallery_image_urls" jsonb,
	"opening_hours" jsonb,
	"source_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "park_reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"bike_park_id" uuid NOT NULL,
	"user_id" integer NOT NULL,
	"rating" smallint NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "work_os_user_id" varchar(255);--> statement-breakpoint
ALTER TABLE "park_reviews" ADD CONSTRAINT "park_reviews_bike_park_id_bike_parks_id_fk" FOREIGN KEY ("bike_park_id") REFERENCES "public"."bike_parks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "park_reviews" ADD CONSTRAINT "park_reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_work_os_user_id_unique" UNIQUE("work_os_user_id");