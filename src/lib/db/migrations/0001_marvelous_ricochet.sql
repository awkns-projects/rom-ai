CREATE TABLE IF NOT EXISTS "Avatar" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"personality" text,
	"characterNames" text,
	"type" varchar(50) DEFAULT 'rom-unicorn' NOT NULL,
	"romUnicornType" varchar(50),
	"customType" varchar(50),
	"uploadedImage" text,
	"selectedStyle" varchar(50),
	"connectedWallet" varchar(255),
	"selectedNFT" varchar(255),
	"unicornParts" json,
	"isActive" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Avatar" ADD CONSTRAINT "Avatar_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
