"use client";

import ProtectedPage from "@/components/ProtectedPage";
import OfficeLogsClient from "@/app/(protected)/OfficeLogs/OfficeLogsClient"

export default function OfficeLogsClientPage() {
  return (
    <ProtectedPage>
      <OfficeLogsClient/>
    </ProtectedPage>
  );
}