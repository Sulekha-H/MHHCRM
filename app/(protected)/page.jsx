"use client";

import ProtectedPage from "@/components/ProtectedPage";
import DashboardClient from "@/app/(protected)/Dashboard/DashboardClient"

export default function DashboardPage() {
  return (
    <ProtectedPage>
      <DashboardClient />
    </ProtectedPage>
  );
}
