-- SQL code to create the property_purchases table in Supabase

CREATE TABLE property_purchases (
    "ID" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "Item Name" TEXT NOT NULL,
    "Purchase Date" DATE NOT NULL,
    "Cost" DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    "Property ID" UUID REFERENCES properties("ID"),
    "Supplier" TEXT,
    "Category" TEXT,
    "Status" TEXT DEFAULT 'Ordered', -- Suggested: Ordered, Pending, Delivered, Cancelled
    "Receipt Link" TEXT,
    "Notes" TEXT,
    "Logged By" TEXT,
    "Created Date" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "Updated Date" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "Deleted" BOOLEAN DEFAULT FALSE,
    "Deleted Date" TIMESTAMP WITH TIME ZONE,
    "Deleted By" TEXT
);

-- Add indexes for better performance when filtering by property or checking for deleted records
CREATE INDEX idx_property_purchases_property_id ON property_purchases("Property ID");
CREATE INDEX idx_property_purchases_deleted ON property_purchases("Deleted");
