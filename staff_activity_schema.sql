-- SQL to create the staff_activity table in Supabase

CREATE TABLE IF NOT EXISTS "staff_activity" (
    "ID" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "Date Time" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "User Name" TEXT,
    "User Email" TEXT,
    "Action Type" TEXT,
    "Entity Type" TEXT,
    "Entity ID" TEXT,
    "Description" TEXT,
    "Metadata" JSONB
);

-- Enable Row Level Security
ALTER TABLE "staff_activity" ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to insert logs
CREATE POLICY "Allow authenticated inserts"
ON "staff_activity"
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow only Sulekha and Amaani to view logs
CREATE POLICY "Allow admin view only"
ON "staff_activity"
FOR SELECT
TO authenticated
USING (
    LOWER(auth.jwt() ->> 'email') IN ('sulekha@myhopehousing.org.uk', 'amaani@myhopehousing.org.uk')
);
