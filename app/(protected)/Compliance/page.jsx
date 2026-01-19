"use client";

import ProtectedPage from "@/components/ProtectedPage";
import ComplianceClient from "@/app/(protected)/Compliance/ComplianceClient"

export default function CompliancePage() {
  return (
    <ProtectedPage>
      <ComplianceClient/>
    </ProtectedPage>
  );
}