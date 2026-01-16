"use client";

import ProtectedPage from "@/components/ProtectedPage";
import DashboardClient from "@/app/(protected)/Dashboard/DashboardClient"

export default function BenefitsPage() {
  return (
    <ProtectedPage>
      <DashboardClient />
    </ProtectedPage>
  );
}
