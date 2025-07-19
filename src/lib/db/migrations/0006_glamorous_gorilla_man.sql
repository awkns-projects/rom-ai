CREATE TABLE IF NOT EXISTS "OAuthConnection" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"avatarId" uuid,
	"provider" varchar NOT NULL,
	"providerUserId" varchar(255) NOT NULL,
	"username" varchar(255),
	"accessToken" text NOT NULL,
	"refreshToken" text,
	"encryptionIv" varchar(32),
	"expiresAt" timestamp,
	"scopes" json,
	"providerData" json,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "Avatar" ADD COLUMN "oauthConnections" json;--> statement-breakpoint
ALTER TABLE "Avatar" ADD COLUMN "shopifyStore" varchar(255);--> statement-breakpoint
ALTER TABLE "Avatar" ADD COLUMN "accessToken" text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "OAuthConnection" ADD CONSTRAINT "OAuthConnection_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "OAuthConnection" ADD CONSTRAINT "OAuthConnection_avatarId_Avatar_id_fk" FOREIGN KEY ("avatarId") REFERENCES "public"."Avatar"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
