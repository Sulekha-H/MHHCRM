"use client";

import ProtectedPage from "@/components/ProtectedPage";
import BenefitsClient from "@/app/(protected)/Benefits/BenefitsClient"

export default function BenefitsPage() {
  return (
    <ProtectedPage>
      <BenefitsClient />
    </ProtectedPage>
  );
}
