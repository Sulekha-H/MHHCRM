"use client";

import { usePathname } from "next/navigation";

const pathToTitle = {
  "/": "Dashboard",
  "/dashboard": "Dashboard",
  "/residents": "Residents",
  "/properties": "Properties",
  "/accommodations": "Accommodations",
  "/tasks": "Tasks",
  "/incidents": "Incidents",
  "/officelogs": "Office Logs",
  "/office-logs": "Office Logs",
  "/repairs": "Repairs",
  "/supportplans": "Support Plans",
  "/support-plans": "Support Plans",
  "/weeklyswdocs": "Weekly SW Docs",
  "/weekly-sw-docs": "Weekly SW Docs",
  "/benefits": "Benefits",
  "/referrals": "Referrals",
  "/servicecharges": "Service Charges",
  "/service-charges": "Service Charges",
  "/compliance": "Compliance",
  "/documents": "Documents",
  "/landlordenquiries": "Landlord Enquiries",
  "/landlord-enquiries": "Landlord Enquiries",
  "/propertyonboarding": "Property Onboarding",
  "/property-onboarding": "Property Onboarding",
  "/customsections": "Custom Sections",
  "/custom-sections": "Custom Sections",
  "/landlordportal": "Landlord Portal",
  "/landlord-portal": "Landlord Portal",
  "/settings": "Settings",
  "/deletedentries": "Deleted Entries",
  "/deleted-entries": "Deleted Entries",
  "/personalnotes": "Personal Notes",
  "/personal-notes": "Personal Notes",
};

export default function PageTitle() {
  const pathname = usePathname();
  const displayTitle =
    pathToTitle[pathname] ??
    (pathname?.slice(1)
      ? pathname.slice(1).charAt(0).toUpperCase() + pathname.slice(2).replace(/-/g, " ")
      : "");

  if (!displayTitle) return null;

  return (
    <h1 className="text-xl font-semibold text-slate-900">
      {displayTitle}
    </h1>
  );
}
