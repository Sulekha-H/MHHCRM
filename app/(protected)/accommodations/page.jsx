"use client";

import ProtectedPage from "@/components/ProtectedPage";
import AccommodationsClient from "@/app/(protected)/accommodations/AccommodationsClient"

export default function LandlordPortalPage() {
  return (
    <ProtectedPage>
      <AccommodationsClient/>
    </ProtectedPage>
  );
}