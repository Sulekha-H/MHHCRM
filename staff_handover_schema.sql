-- SQL to create the staff_handover table in Supabase

CREATE TABLE IF NOT EXISTS "staff_handover" (
    "ID" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "User ID" TEXT NOT NULL, -- Clerk user id (sub)
    "User Email" TEXT NOT NULL,
    "Handover Date" DATE NOT NULL,
    "Content" TEXT,
    "Late Reason" TEXT,
    "Created At" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "Updated At" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE("User ID", "Handover Date")
);

-- Enable Row Level Security
ALTER TABLE "staff_handover" ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to view handovers
CREATE POLICY "Allow authenticated select"
ON "staff_handover"
FOR SELECT
TO authenticated
USING (true);

-- Allow users to insert their own handovers
CREATE POLICY "Allow individual insert"
ON "staff_handover"
FOR INSERT
TO authenticated
WITH CHECK (auth.jwt() ->> 'sub' = "User ID");

-- Allow users to update their own handovers
CREATE POLICY "Allow individual update"
ON "staff_handover"
FOR UPDATE
TO authenticated
USING (auth.jwt() ->> 'sub' = "User ID")
WITH CHECK (auth.jwt() ->> 'sub' = "User ID");
