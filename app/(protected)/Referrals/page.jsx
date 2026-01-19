"use client";

import ProtectedPage from "@/components/ProtectedPage";
import ReferralsClient from "@/app/(protected)/Referrals/ReferralsClient"

export default function ReferralsPage() {
  return (
    <ProtectedPage>
      <ReferralsClient/>
    </ProtectedPage>
  );
}