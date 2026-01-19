"use client";

import ProtectedPage from "@/components/ProtectedPage";
import TasksClient from "@/app/(protected)/Tasks/TasksClient"

export default function TasksPage() {
  return (
    <ProtectedPage>
      <TasksClient/>
    </ProtectedPage>
  );
}