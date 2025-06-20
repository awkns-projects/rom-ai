-- Add check constraint to ensure kind column only accepts valid values
ALTER TABLE "Document" ADD CONSTRAINT "Document_kind_check" CHECK (kind IN ('text', 'code', 'image', 'sheet', 'agent')); 