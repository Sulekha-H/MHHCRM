/*
  SQL Schema for Office Routines

  Run this in your Supabase SQL Editor to create the necessary table.

  CREATE TABLE IF NOT EXISTS office_routines (
    "ID" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "Date" DATE NOT NULL,
    "Logged By" TEXT NOT NULL,
    "Checklist" JSONB NOT NULL DEFAULT '[]'::jsonb,
    "Created Date" TIMESTAMPTZ DEFAULT now(),
    "Updated Date" TIMESTAMPTZ DEFAULT now(),
    "Created By" TEXT,
    "Deleted" BOOLEAN DEFAULT false
  );

  -- Add an index for faster lookups by date
  CREATE INDEX IF NOT EXISTS idx_office_routines_date ON office_routines ("Date");

  -- Enable RLS (adjust policies as needed for your application's security model)
  ALTER TABLE office_routines ENABLE ROW LEVEL SECURITY;

  -- Example policy: allow all authenticated users to read and write
  CREATE POLICY "Allow authenticated users to read and write" ON office_routines
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
*/
