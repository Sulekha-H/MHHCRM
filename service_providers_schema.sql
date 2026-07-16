-- SQL code to create the service_providers table in Supabase

CREATE TABLE service_providers (
    "ID" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "Name" TEXT NOT NULL,
    "Category" TEXT NOT NULL, -- Cleaner, Tradesman, Gardener, etc.
    "Contact Number" TEXT,
    "Email" TEXT,
    "Default Hourly Rate" DECIMAL(10, 2) DEFAULT 0.00,
    "Notes" TEXT,
    "Unavailable Dates" JSONB DEFAULT '[]'::jsonb, -- Array of date strings: ["YYYY-MM-DD", ...]
    "Created Date" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "Updated Date" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "Deleted" BOOLEAN DEFAULT FALSE,
    "Deleted Date" TIMESTAMP WITH TIME ZONE,
    "Deleted By" TEXT
);

-- Add indexes
CREATE INDEX idx_service_providers_category ON service_providers("Category");
CREATE INDEX idx_service_providers_deleted ON service_providers("Deleted");
