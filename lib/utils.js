import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Map page names to their lowercase route paths
export function createPageUrl(pageName) {
  const urlMap = {
    'Dashboard': '/dashboard',
    'Residents': '/residents',
    'Incidents': '/incidents',
    'OfficeLogs': '/officelogs',
    'Tasks': '/tasks',
    'Properties': '/properties',
    'Accommodations': '/accommodations',
    'ServiceCharges': '/servicecharges',
    'Repairs': '/repairs',
    'Benefits': '/benefits',
    'Referrals': '/referrals',
    'Compliance': '/compliance',
    'SupportPlans': '/supportplans',
    'Documents': '/documents',
    'WeeklySWDocs': '/weeklyswdocs',
    'Settings': '/settings',
    'LandlordPortal': '/landlordportal',
    'LandlordEnquiries': '/landlordenquiries',
    'PropertyOnboarding': '/propertyonboarding',
    'CustomSections': '/customsections'
  };

  // Default to lowercase if not in map
  return urlMap[pageName] || `/${pageName.toLowerCase()}`;
}
