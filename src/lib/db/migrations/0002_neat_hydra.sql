ALTER TABLE "Avatar" ADD COLUMN "documentId" uuid;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Avatar" ADD CONSTRAINT "Avatar_documentId_Document_id_fk" FOREIGN KEY ("documentId") REFERENCES "public"."Document"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
