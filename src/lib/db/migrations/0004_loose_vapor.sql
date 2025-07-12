ALTER TABLE "Avatar" DROP CONSTRAINT "Avatar_documentId_documentCreatedAt_Document_id_createdAt_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Avatar" ADD CONSTRAINT "Avatar_documentId_Document_id_fk" FOREIGN KEY ("documentId") REFERENCES "public"."Document"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "Avatar" DROP COLUMN IF EXISTS "documentCreatedAt";