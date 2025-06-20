-- Create Agent table
CREATE TABLE IF NOT EXISTS "Agent" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"domain" varchar(100),
	"models" json DEFAULT '[]'::json NOT NULL,
	"enums" json DEFAULT '[]'::json NOT NULL,
	"actions" json DEFAULT '[]'::json NOT NULL,
	"userId" uuid NOT NULL,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL
);

-- Add foreign key constraint for userId
DO $$ BEGIN
 ALTER TABLE "Agent" ADD CONSTRAINT "Agent_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Add agentId column to Chat table
ALTER TABLE "Chat" ADD COLUMN IF NOT EXISTS "agentId" uuid;

-- Add foreign key constraint for agentId
DO $$ BEGIN
 ALTER TABLE "Chat" ADD CONSTRAINT "Chat_agentId_Agent_id_fk" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$; 