/**
 * Utility for logging staff activity to Supabase
 */

export async function logActivity(supabase, {
  userName,
  userEmail,
  actionType,
  entityType,
  entityId,
  description,
  metadata = {}
}) {
  if (!supabase) {
    console.error("Supabase client not provided to logActivity");
    return;
  }

  try {
    const { error } = await supabase
      .from('staff_activity')
      .insert([{
        "User Name": userName,
        "User Email": userEmail,
        "Action Type": actionType,
        "Entity Type": entityType,
        "Entity ID": entityId,
        "Description": description,
        "Metadata": metadata,
        "Date Time": new Date().toISOString()
      }]);

    if (error) {
      console.error("Error logging staff activity:", error);
    }
  } catch (err) {
    console.error("Unexpected error logging staff activity:", err);
  }
}

/**
 * Common action types
 */
export const ACTIONS = {
  LOGIN: 'Login',
  CREATE: 'Create',
  UPDATE: 'Update',
  DELETE: 'Delete',
  RESTORE: 'Restore',
  EXPORT: 'Export'
};

/**
 * Common entity types
 */
export const ENTITIES = {
  RESIDENT: 'Resident',
  ALLOCATED_RESIDENT: 'Allocated Resident',
  PROPERTY: 'Property',
  ACCOMMODATION: 'Accommodation',
  TASK: 'Task',
  INCIDENT: 'Incident',
  OFFICE_LOG: 'Office Log',
  REPAIR: 'Repair',
  SUPPORT_PLAN: 'Support Plan',
  BENEFIT: 'Benefit',
  REFERRAL: 'Referral',
  COMPLIANCE: 'Compliance',
  UTILITY: 'Utility',
  SERVICE_CHARGE: 'Service Charge',
  PROPERTY_PURCHASE: 'Property Purchase',
  CUSTOM_SECTION: 'Custom Section',
  CUSTOM_SECTION_DATA: 'Custom Section Data',
  CALENDAR_EVENT: 'Calendar Event',
  SERVICE_PROVIDER: 'Service Provider',
  WORK_BOOKING: 'Work Booking',
  STAFF_HANDOVER: 'Staff Handover'
};
