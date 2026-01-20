"use client";

import ProtectedPage from "@/components/ProtectedPage";
import DeletedEntriesClient from "@/app/(protected)/DeletedEntries/DeletedEntriesClient"


export default function DeletedEntriesPage() {
  return (
    <ProtectedPage>
      <DeletedEntriesClient/>
    </ProtectedPage>
  );
}