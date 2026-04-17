CREATE TABLE "friend_invitations" (
	"id" serial PRIMARY KEY NOT NULL,
	"inviter_user_id" integer NOT NULL,
	"invitee_user_id" integer NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"responded_at" timestamp,
	CONSTRAINT "friend_invitations_inviter_user_id_users_id_fk" FOREIGN KEY ("inviter_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action,
	CONSTRAINT "friend_invitations_invitee_user_id_users_id_fk" FOREIGN KEY ("invitee_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action,
	CONSTRAINT "friend_invitations_inviter_ne_invitee" CHECK ("inviter_user_id" <> "invitee_user_id")
);
--> statement-breakpoint
CREATE UNIQUE INDEX "friend_invitations_inviter_invitee_pending_unique" ON "friend_invitations" USING btree ("inviter_user_id","invitee_user_id") WHERE "status" = 'pending';
--> statement-breakpoint
CREATE TABLE "friendships" (
	"user_low_id" integer NOT NULL,
	"user_high_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "friendships_user_low_id_users_id_fk" FOREIGN KEY ("user_low_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action,
	CONSTRAINT "friendships_user_high_id_users_id_fk" FOREIGN KEY ("user_high_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action,
	CONSTRAINT "friendships_user_low_lt_high" CHECK ("user_low_id" < "user_high_id"),
	CONSTRAINT "friendships_user_low_id_user_high_id_pk" PRIMARY KEY("user_low_id","user_high_id")
);
--> statement-breakpoint
CREATE TABLE "ride_plans" (
	"user_id" integer NOT NULL,
	"ride_on" date NOT NULL,
	"bike_park_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ride_plans_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action,
	CONSTRAINT "ride_plans_bike_park_id_bike_parks_id_fk" FOREIGN KEY ("bike_park_id") REFERENCES "public"."bike_parks"("id") ON DELETE cascade ON UPDATE no action,
	CONSTRAINT "ride_plans_user_id_ride_on_pk" PRIMARY KEY("user_id","ride_on")
);
