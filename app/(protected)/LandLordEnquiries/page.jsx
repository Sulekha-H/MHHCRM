"use client";

import ProtectedPage from "@/components/ProtectedPage";
import LandlordEnquiriesClient from "@/app/(protected)/LandLordEnquiries/LandlordEnquiriesClient"

export default function LandlordEnquiriesPage() {
  return (
    <ProtectedPage>
      <LandlordEnquiriesClient />
    </ProtectedPage>
  );
}