"use client";

import ProtectedPage from "@/components/ProtectedPage";
import SupportPlansClient from "@/app/(protected)/SupportPlans/SupportPlansClient"

export default function SupportPlansPage() {
  return (
    <ProtectedPage>
      <SupportPlansClient/>
    </ProtectedPage>
  );
}