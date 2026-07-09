-- 1. Add "Assigned To ID" and "Assigned To Email" columns to track who the handover is for
ALTER TABLE "staff_handover" ADD COLUMN IF NOT EXISTS "Assigned To ID" TEXT;
ALTER TABLE "staff_handover" ADD COLUMN IF NOT EXISTS "Assigned To Email" TEXT;

-- 2. Update existing records to set "Assigned To ID" to the "User ID" and "Assigned To Email" to "User Email" (self-assignment)
UPDATE "staff_handover"
SET "Assigned To ID" = "User ID",
    "Assigned To Email" = "User Email"
WHERE "Assigned To ID" IS NULL;

-- 3. Drop the old unique constraint that only allowed one entry per user per day
ALTER TABLE "staff_handover" DROP CONSTRAINT IF EXISTS staff_handover_User_ID_Handover_Date_key;

-- 4. Add a new unique constraint: A user can create one handover per day for themselves OR for a specific other person.
-- This prevents duplicate assignments.
ALTER TABLE "staff_handover" ADD CONSTRAINT staff_handover_creator_date_assignee_unique UNIQUE ("User ID", "Handover Date", "Assigned To ID");

-- 5. Create a table for back-and-forth comments
CREATE TABLE IF NOT EXISTS "handover_comments" (
    "ID" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "Handover ID" UUID REFERENCES "staff_handover"("ID") ON DELETE CASCADE,
    "User ID" TEXT NOT NULL, -- Clerk user id of the commenter
    "User Name" TEXT NOT NULL, -- Full name of the commenter
    "Content" TEXT NOT NULL,
    "Created At" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Enable Row Level Security on comments
ALTER TABLE "handover_comments" ENABLE ROW LEVEL SECURITY;

-- 7. Allow all authenticated users to view comments
CREATE POLICY "Allow authenticated select on comments"
ON "handover_comments"
FOR SELECT
TO authenticated
USING (true);

-- 8. Allow users to insert their own comments
CREATE POLICY "Allow individual insert on comments"
ON "handover_comments"
FOR INSERT
TO authenticated
WITH CHECK (auth.jwt() ->> 'sub' = "User ID");
