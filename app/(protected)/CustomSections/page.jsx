"use client";

import ProtectedPage from "@/components/ProtectedPage";
import CustomSectionsClient from "@/app/(protected)/CustomSections/CustomSectionsClient"

export default function CustomSectionsPage() {
  return (
    <ProtectedPage>
      <CustomSectionsClient/>
    </ProtectedPage>
  );
}