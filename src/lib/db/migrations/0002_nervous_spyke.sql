ALTER TABLE "Avatar" ADD COLUMN "documentId" uuid;--> statement-breakpoint
ALTER TABLE "Avatar" ADD COLUMN "documentCreatedAt" timestamp;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Avatar" ADD CONSTRAINT "Avatar_documentId_documentCreatedAt_Document_id_createdAt_fk" FOREIGN KEY ("documentId","documentCreatedAt") REFERENCES "public"."Document"("id","createdAt") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
