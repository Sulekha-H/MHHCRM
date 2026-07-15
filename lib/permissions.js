/**
 * Utility for managing user roles and permissions
 */

export const OFFICE_STAFF_EMAILS = [
  'burton@myhopehousing.org.uk',
  'leticia@myhopehousing.org.uk',
  'amaani@myhopehousing.org.uk',
  'sulekha@myhopehousing.org.uk'
].map(email => email.toLowerCase());

export const ADMIN_EMAILS = [
  'amaani@myhopehousing.org.uk',
  'sulekha@myhopehousing.org.uk'
].map(email => email.toLowerCase());

export const SERVICE_CHARGE_STAFF_EMAILS = [
  's.khan@myhopehousing.org.uk'
].map(email => email.toLowerCase());

export const RESTRICTED_STAFF_EMAILS = [
  's.khan@myhopehousing.org.uk',
  'jessica@myhopehousing.org.uk',
  'hasib@myhopehousing.org.uk',
  'francesca@myhopehousing.org.uk'
].map(email => email.toLowerCase());

/**
 * Checks if a user has office staff permissions
 */
export function isOfficeStaff(user) {
  if (!user?.emailAddresses?.[0]?.emailAddress) return false;
  const userEmail = user.emailAddresses[0].emailAddress?.trim().toLowerCase();
  return OFFICE_STAFF_EMAILS.includes(userEmail);
}

/**
 * Checks if a user has admin permissions
 */
export function isAdmin(user) {
  if (!user?.emailAddresses?.[0]?.emailAddress) return false;
  const userEmail = user.emailAddresses[0].emailAddress?.trim().toLowerCase();
  return ADMIN_EMAILS.includes(userEmail);
}

/**
 * Checks if a user is restricted staff (e.g., service charge or support workers with limited dashboard access)
 */
export function isRestrictedStaff(user) {
  if (!user?.emailAddresses?.[0]?.emailAddress) return false;
  const userEmail = user.emailAddresses[0].emailAddress?.trim().toLowerCase();
  return RESTRICTED_STAFF_EMAILS.includes(userEmail);
}

/**
 * Checks if a user is Service Charge staff (Backward-compatible alias)
 */
export function isServiceChargeStaff(user) {
  return isRestrictedStaff(user);
}
