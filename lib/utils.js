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
    'incidents': '/incidents',
    'OfficeLogs': '/officelogs',
    'tasks': '/tasks',
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
    'LandlordPortal': '/landlordportal',
    'LandlordEnquiries': '/landlordenquiries',
    'PropertyOnboarding': '/propertyonboarding',
    'CustomSections': '/customsections'
  };

  // Default to lowercase if not in map
  return urlMap[pageName] || `/${pageName.toLowerCase()}`;
}

/**
 * Generates a robust UUID, falling back to a manual generator if crypto.randomUUID is unavailable
 * (e.g. in non-secure contexts like http or IP-based access).
 */
export function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback for non-secure contexts
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Parses task metadata from Description field
 */
export function parseTaskMetadata(description) {
  if (!description) return null;
  const match = description.match(/---METADATA---\n([\s\S]*?)\n---END METADATA---/);
  if (match) {
    try {
      return JSON.parse(match[1]);
    } catch (e) {
      console.error("Error parsing task metadata:", e);
    }
  }
  return null;
}

/**
 * Updates task metadata in Description field
 */
export function updateTaskMetadata(description, updates) {
  const currentMetadata = parseTaskMetadata(description) || {};
  const newMetadata = { ...currentMetadata, ...updates };
  const metadataString = `---METADATA---\n${JSON.stringify(newMetadata)}\n---END METADATA---`;

  if (description && description.includes('---METADATA---')) {
    return description.replace(/---METADATA---\n[\s\S]*?\n---END METADATA---/, metadataString);
  }

  return `${metadataString}\n${description || ''}`;
}
