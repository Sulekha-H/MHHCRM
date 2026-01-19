"use client";

import ProtectedPage from "@/components/ProtectedPage";
import SettingsClient from "@/app/(protected)/Settings/SettingsClient"

export default function SettingsPage() {
  return (
    <ProtectedPage>
      <SettingsClient/>
    </ProtectedPage>
  );
}