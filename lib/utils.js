import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// For Next.js, you typically don't need createPageUrl
// But if you want it for consistency:
export function createPageUrl(pageName) {
  const urlMap = {
    'Dashboard': '/dashboard',
    'Residents': '/residents',
    'Incidents': '/incidents',
    'OfficeLogs': '/office-logs',
    'Tasks': '/tasks',
    'Properties': '/properties',
    'Accommodations': '/accommodations',
    'ServiceCharges': '/service-charges',
    'Repairs': '/repairs',
    'Benefits': '/benefits',
    'Referrals': '/referrals',
    'Compliance': '/compliance',
    'SupportPlans': '/support-plans',
    'Documents': '/documents',
    'WeeklySWDocs': '/weekly-sw-docs',
    'Settings': '/settings',
    'LandlordPortal': '/landlord-portal',
    'LandlordEnquiries': '/landlord-enquiries',
    'PropertyOnboarding': '/property-onboarding',
    'CustomSections': '/custom-sections'
  };

  return urlMap[pageName] || `/${pageName.toLowerCase()}`;
}
