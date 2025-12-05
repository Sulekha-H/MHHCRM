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
    'Residents': '/Residents',
    'Incidents': '/Incidents',
    'OfficeLogs': '/OfficeLogs',
    'Tasks': '/Tasks',
    'Properties': '/properties',
    'Accommodations': '/accommodations',
    'ServiceCharges': '/ServiceCharges',
    'Repairs': '/Repairs',
    'Benefits': '/Benefits',
    'Referrals': '/Referrals',
    'Compliance': '/Compliance',
    'SupportPlans': '/SupportPlans',
    'Documents': '/Documents',
    'WeeklySWDocs': '/weekly-sw-docs',
    'Settings': '/settings',
    'LandlordPortal': '/landlord-portal',
    'LandlordEnquiries': '/landlord-enquiries',
    'PropertyOnboarding': '/property-onboarding',
    'CustomSections': '/custom-sections'
  };

  return urlMap[pageName] || `/${pageName.toLowerCase()}`;
}
