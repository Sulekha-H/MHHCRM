"use client";

import ProtectedPage from "@/components/ProtectedPage";
import ResidentsClient from "@/app/(protected)/Residents/ResidentsClient"

export default function ResidentsPage() {
  return (
    <ProtectedPage>
      <ResidentsClient />
    </ProtectedPage>
  );
}
