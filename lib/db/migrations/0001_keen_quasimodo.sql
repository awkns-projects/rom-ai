ALTER TABLE "User" ADD COLUMN "openaiApiKey" text;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "xaiApiKey" text;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "createdAt" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "updatedAt" timestamp DEFAULT now() NOT NULL;