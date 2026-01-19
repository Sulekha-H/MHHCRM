"use client";

import ProtectedPage from "@/components/ProtectedPage";
import DeletedEntriesClient from "@/app/(protected)/DeletedEntries/DeletedEntrieslClient"

export default function DeletedEntriesPage() {
  return (
    <ProtectedPage>
      <DeletedEntriesClient/>
    </ProtectedPage>
  );
}