"use client";

import ProtectedPage from "@/components/ProtectedPage";
import TasksClient from "@/app/(protected)/Tasks/TasksClient"

export default function BenefitsPage() {
  return (
    <ProtectedPage>
      <TasksClient />
    </ProtectedPage>
  );
}
