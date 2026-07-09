const { createClient } = require('@supabase/supabase-js');

// Use Service Role Key for administrative deletion
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function cleanup() {
  console.log("Starting administrative cleanup of 'FLAT 4'...");

  // 1. Find the property
  const { data: properties, error: pFetchError } = await supabase
    .from('properties')
    .select('*')
    .eq('Name', 'FLAT 4');

  if (pFetchError) {
    console.error("Error fetching properties:", pFetchError);
    return;
  }

  console.log(`Found ${properties?.length || 0} properties matching 'FLAT 4'`);

  for (const prop of (properties || [])) {
    const propId = prop.ID || prop.id;
    const propName = prop.Name || prop.name;

    console.log(`Cleaning up property: ${propName} (${propId})`);

    // List of tables and how they link to property by ID
    const tablesById = [
        'accommodations',
        'repairs',
        'residents',
        'allocated_residents',
        'incidents',
        'Utilities',
        'property_purchases',
        'work_bookings'
    ];

    for (const table of tablesById) {
      const { error } = await supabase
        .from(table)
        .delete()
        .or(`"Property ID".eq.${propId},property_id.eq.${propId}`);
      console.log(`Deleted from ${table}: ${error ? error.message : 'Success'}`);
    }

    // Tables that use exact Name
    const { error: raError } = await supabase
      .from('room_assignments')
      .delete()
      .eq('Property Name', propName);
    console.log(`Room assignments deletion: ${raError ? raError.message : 'Success'}`);

    // Delete property itself
    const { error: pDeleteError } = await supabase
      .from('properties')
      .delete()
      .eq('ID', propId);
    console.log(`Property deletion: ${pDeleteError ? pDeleteError.message : 'Success'}`);
  }

  // 2. Extra room_assignments cleanup for name match (case sensitive)
  const { error: raExtraError } = await supabase
    .from('room_assignments')
    .delete()
    .eq('Property Name', 'FLAT 4');
  console.log(`Extra room assignments cleanup: ${raExtraError ? raExtraError.message : 'Success'}`);

  console.log("Cleanup finished.");
}

cleanup();
