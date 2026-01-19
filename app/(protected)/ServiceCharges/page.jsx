"use client";

import ProtectedPage from "@/components/ProtectedPage";
import ServiceChargesClient from "@/app/(protected)/ServiceCharges/ServiceChargesClient"

export default function ServiceChargesPage() {
  return (
    <ProtectedPage>
      <ServiceChargesClient/>
    </ProtectedPage>
  );
}