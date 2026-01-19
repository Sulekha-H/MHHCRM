"use client";

import ProtectedPage from "@/components/ProtectedPage";
import CustomSectionDetailClient from "@/app/(protected)/CustomSectionDetail/CustomSectionDetailClient"

export default function CustomSectionDetailPage() {
  return (
    <ProtectedPage>
      <CustomSectionDetailClient/>
    </ProtectedPage>
  );
}