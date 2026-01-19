"use client";

import ProtectedPage from "@/components/ProtectedPage";
import RepairsClient from "@/app/(protected)/Repairs/RepairsClient"

export default function RepairsPage() {
  return (
    <ProtectedPage>
      <RepairsClient/>
    </ProtectedPage>
  );
}