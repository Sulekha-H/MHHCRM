"use client";

import ProtectedPage from "@/components/ProtectedPage";
import DocumentsClient from "@/app/(protected)/Documents/DocumentsClient"

export default function DocumentsPage() {
  return (
    <ProtectedPage>
      <DocumentsClient />
    </ProtectedPage>
  );
}