"use client";

import ProtectedPage from "@/components/ProtectedPage";
import DashboardClient from "@/app/(protected)/Dashboard/dashboardClient"

export default function BenefitsPage() {
  return (
    <ProtectedPage>
      <DashboardClient />
    </ProtectedPage>
  );
}
