"use client";

import ProtectedPage from "@/components/ProtectedPage";
import CustomSectionsDetailClient from "@/app/(protected)/CustomSectionDetail/CustomSectionsDetailClient"

export default function CustomSectionDetailPage() {
  return (
    <ProtectedPage>
      <CustomSectionsDetailClient/>
    </ProtectedPage>
  );
}