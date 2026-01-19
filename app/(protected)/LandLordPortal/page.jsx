"use client";

import ProtectedPage from "@/components/ProtectedPage";
import LandLordPortalClient from "@/app/(protected)/LandLordPortal/LandLordPortalClient"

export default function LandlordPortalPage() {
  return (
    <ProtectedPage>
      <LandLordPortalClient/>
    </ProtectedPage>
  );
}