
const { createClient } = require('@supabase/supabase-client');
require('dotenv').config();

// Note: In this environment, we should use the existing supabase client pattern if possible,
// but since this is a one-off script, I'll provide instructions or a component-based way to run it.

async function migrateRepairs(supabase) {
  console.log("Starting migration of existing repairs...");

  const { data: repairs, error } = await supabase
    .from('repairs')
    .select('ID, Title')
    .or('"Deleted".is.null,"Deleted".eq.false');

  if (error) {
    console.error("Error fetching repairs:", error);
    return;
  }

  const complianceRepairs = repairs.filter(r =>
    r.Title && r.Title.startsWith("Repair from Compliance Check:")
  );

  console.log(`Found ${complianceRepairs.length} repairs from compliance checks.`);

  for (const repair of complianceRepairs) {
    console.log(`Updating repair: ${repair.Title}`);
    const { error: updateError } = await supabase
      .from('repairs')
      .update({ "Logged Via": "Compliance Check" })
      .eq('ID', repair.ID);

    if (updateError) {
      console.error(`Error updating repair ${repair.ID}:`, updateError);
    }
  }

  console.log("Migration completed.");
}
