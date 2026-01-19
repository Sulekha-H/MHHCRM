"use client";

import ProtectedPage from "@/components/ProtectedPage";
import PropertiesClient from "@/app/(protected)/Properties/PropertiesClient"

export default function PropertiesPage() {
  return (
    <ProtectedPage>
      <PropertiesClient/>
    </ProtectedPage>
  );
}