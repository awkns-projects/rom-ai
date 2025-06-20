-- Remove foreign key constraint from Chat table
ALTER TABLE "Chat" DROP CONSTRAINT IF EXISTS "Chat_agentId_Agent_id_fk";

-- Remove agentId column from Chat table
ALTER TABLE "Chat" DROP COLUMN IF EXISTS "agentId";

-- Drop Agent table
DROP TABLE IF EXISTS "Agent"; 