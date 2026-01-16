"use client";

import ProtectedPage from "@/components/ProtectedPage";
import residentsClient from "@/app/(protected)/residents/ResidentsClient"

export default function ResidentsPage() {
  return (
    <ProtectedPage>
      <residentsClient />
    </ProtectedPage>
  );
}
