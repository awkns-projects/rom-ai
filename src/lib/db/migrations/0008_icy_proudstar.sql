ALTER TABLE "Document" DROP CONSTRAINT "Document_id_pk";--> statement-breakpoint
ALTER TABLE "Document" ADD CONSTRAINT "Document_id_createdAt_pk" PRIMARY KEY("id","createdAt");