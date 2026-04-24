CREATE TABLE "bike_park_requests" (
	"id" uuid PRIMARY KEY NOT NULL,
	"request_type" varchar(24) NOT NULL,
	"status" varchar(24) DEFAULT 'pending' NOT NULL,
	"requester_user_id" integer NOT NULL,
	"target_park_id" uuid,
	"proposed_patch" jsonb NOT NULL,
	"reviewed_by_user_id" integer,
	"reviewed_at" timestamp,
	"reviewer_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bike_park_requests" ADD CONSTRAINT "bike_park_requests_requester_user_id_users_id_fk" FOREIGN KEY ("requester_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "bike_park_requests" ADD CONSTRAINT "bike_park_requests_target_park_id_bike_parks_id_fk" FOREIGN KEY ("target_park_id") REFERENCES "public"."bike_parks"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "bike_park_requests" ADD CONSTRAINT "bike_park_requests_reviewed_by_user_id_users_id_fk" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
