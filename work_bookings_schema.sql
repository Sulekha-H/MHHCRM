-- SQL code to create the work_bookings table in Supabase

CREATE TABLE work_bookings (
    "ID" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "Service Provider ID" UUID REFERENCES service_providers("ID"),
    "Property ID" UUID REFERENCES properties("ID"),
    "Accommodation ID" UUID REFERENCES accommodations("ID"),
    "Area" TEXT, -- Lounge, Kitchen, Hallway, Garden, Bathroom, Bedroom, General Property
    "Date" DATE NOT NULL,
    "Duration Hours" INTEGER DEFAULT 0,
    "Duration Minutes" INTEGER DEFAULT 0,
    "Hourly Rate" DECIMAL(10, 2) DEFAULT 0.00,
    "Total Pay" DECIMAL(10, 2) DEFAULT 0.00,
    "Payment Status" TEXT DEFAULT 'Pending', -- Paid, Pending
    "Work Status" TEXT DEFAULT 'Scheduled', -- Scheduled, Completed, Cancelled
    "Invoice Number" TEXT,
    "Invoice File URL" TEXT,
    "Description of Work" TEXT,
    "Notes" TEXT,
    "Logged By" TEXT,
    "Created Date" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "Updated Date" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "Deleted" BOOLEAN DEFAULT FALSE,
    "Deleted Date" TIMESTAMP WITH TIME ZONE,
    "Deleted By" TEXT
);

-- Add indexes
CREATE INDEX idx_work_bookings_service_provider_id ON work_bookings("Service Provider ID");
CREATE INDEX idx_work_bookings_property_id ON work_bookings("Property ID");
CREATE INDEX idx_work_bookings_date ON work_bookings("Date");
CREATE INDEX idx_work_bookings_deleted ON work_bookings("Deleted");
