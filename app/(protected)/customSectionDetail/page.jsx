"use client";

import ProtectedPage from "@/components/ProtectedPage";
import CustomsectionDetailClient from "@/app/(protected)/CustomsectionDetail/CustomSectionDetailClient"

export default function CustomSectionDetailPage() {
  return (
    <ProtectedPage>
      <CustomsectionDetailClient/>
    </ProtectedPage>
  );
}