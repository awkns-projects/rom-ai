DROP TABLE "Agent";--> statement-breakpoint
ALTER TABLE "Chat" DROP CONSTRAINT "Chat_agentId_Agent_id_fk";
--> statement-breakpoint
ALTER TABLE "Chat" DROP COLUMN IF EXISTS "agentId";