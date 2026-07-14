-- SQL to create or update the self_referrals table in Supabase
--
-- Recommended Approach:
-- We keep core, queryable/searchable fields as standard columns, and serialize
-- the extensive 9-page physical form details into a structured JSONB "Form Data" column.
-- This keeps the schema clean, flexible, and handles complex structures like nested
-- tables (e.g., Address History, checklist arrays, risk assessment grids) seamlessly.

CREATE TABLE IF NOT EXISTS "self_referrals" (
    "ID" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "Referral Date" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "Referral Type" TEXT DEFAULT 'Self-Referral',
    "Referral From URL" TEXT, -- Google Drive / Link to physical document
    "Applicant Name" TEXT NOT NULL,
    "Applicant DOB" DATE,
    "Referral Reason" TEXT,
    "Status" TEXT DEFAULT 'Received', -- Received, Under Assessment, Awaiting Interview, Accepted, Rejected, Withdrawn
    "Priority" TEXT DEFAULT 'Medium', -- Low, Medium, High
    "Assigned To" TEXT, -- Staff member assigned (e.g. Amaani, Sulekha)
    "Accommodation Type Needed" TEXT DEFAULT 'single_room',
    "Assessment Date" DATE,
    "Decision Date" DATE,
    "Decision Reason" TEXT,
    "Notes" TEXT,
    "Logged By" TEXT,
    "Created Date" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "Created By" TEXT,
    "Updated Date" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "Deleted" BOOLEAN DEFAULT FALSE,
    "Deleted Date" TIMESTAMP WITH TIME ZONE,
    "Deleted By" TEXT,

    -- JSONB column containing all the detailed 9-page form fields:
    -- Personal details (Ni, gender, etc), Address history array, Physical/mental health details,
    -- Substance misuse detail, Offending history details, Support needs checklist,
    -- Risk assessments grids, Service user involvement declarations.
    "Form Data" JSONB DEFAULT '{}'::jsonb
);

-- Enable Row Level Security (RLS)
ALTER TABLE "self_referrals" ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to view referrals
CREATE POLICY "Allow authenticated select self_referrals"
ON "self_referrals"
FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to insert/update referrals
CREATE POLICY "Allow authenticated insert self_referrals"
ON "self_referrals"
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated update self_referrals"
ON "self_referrals"
FOR UPDATE
TO authenticated
USING (true);


--------------------------------------------------------------------------------
-- APPENDIX: Alternative Flat Column Mapping (If you prefer not using JSONB)
-- Below is a complete list of independent columns matching all fields in the 9-page form:
--------------------------------------------------------------------------------
/*
ALTER TABLE "self_referrals"
    ADD COLUMN "National Insurance Number" TEXT,
    ADD COLUMN "Gender" TEXT,
    ADD COLUMN "Pronouns" TEXT,
    ADD COLUMN "Phone Number" TEXT,
    ADD COLUMN "Email" TEXT,
    ADD COLUMN "Marital Status" TEXT,
    ADD COLUMN "Next of Kin Name" TEXT,
    ADD COLUMN "Next of Kin Relationship" TEXT,
    ADD COLUMN "Next of Kin Contact" TEXT,

    -- Address History (stored as serialized text or separate table, represented as text here)
    ADD COLUMN "Current Address" TEXT,
    ADD COLUMN "Current Housing Status" TEXT, -- Tenant, Homeless, Rough Sleeping, etc.
    ADD COLUMN "Address History 5 Years" TEXT,

    -- Physical / Mental Health & Support
    ADD COLUMN "Has GP" BOOLEAN,
    ADD COLUMN "GP Details" TEXT,
    ADD COLUMN "Medical Conditions" TEXT,
    ADD COLUMN "Medication Prescribed" TEXT,
    ADD COLUMN "Mental Health Diagnosis" TEXT,
    ADD COLUMN "Mental Health Team Details" TEXT,

    -- Substance Misuse
    ADD COLUMN "Uses Alcohol" BOOLEAN,
    ADD COLUMN "Alcohol Details" TEXT,
    ADD COLUMN "Uses Drugs" BOOLEAN,
    ADD COLUMN "Drug Details" TEXT,
    ADD COLUMN "In Treatment" BOOLEAN,

    -- Offending History
    ADD COLUMN "Has Offending History" BOOLEAN,
    ADD COLUMN "Offending Details" TEXT,
    ADD COLUMN "Has Active Probation" BOOLEAN,
    ADD COLUMN "Probation Officer Name" TEXT,
    ADD COLUMN "Probation Officer Contact" TEXT,

    -- Support Needs Checkboxes (Ticked counts)
    ADD COLUMN "Support Needs List" TEXT[], -- Array of selected support needs

    -- Risk Assessment (Yes/No flags)
    ADD COLUMN "Risk To Self" BOOLEAN,
    ADD COLUMN "Risk To Self Details" TEXT,
    ADD COLUMN "Risk To Others" BOOLEAN,
    ADD COLUMN "Risk To Others Details" TEXT,
    ADD COLUMN "Risk From Others" BOOLEAN,
    ADD COLUMN "Risk From Others Details" TEXT,
    ADD COLUMN "Risk To Children" BOOLEAN,
    ADD COLUMN "Risk To Children Details" TEXT,

    -- Declarations & Consents
    ADD COLUMN "Consent Service User Involvement" BOOLEAN,
    ADD COLUMN "Consent Data Storage" BOOLEAN,
    ADD COLUMN "Consent Info Sharing" BOOLEAN,
    ADD COLUMN "Applicant Signature" TEXT,
    ADD COLUMN "Signature Date" DATE;
*/
