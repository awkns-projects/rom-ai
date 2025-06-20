-- Remove the check constraint that might be causing issues
ALTER TABLE "Document" DROP CONSTRAINT IF EXISTS "Document_kind_check"; 