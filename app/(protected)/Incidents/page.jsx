"use client";

import ProtectedPage from "@/components/ProtectedPage";
import IncidentsClient from "@/app/(protected)/Incidents/IncidentsClient"

export default function IncidentsPage() {
  return (
    <ProtectedPage>
      <IncidentsClient />
    </ProtectedPage>
  );
}