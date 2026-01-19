"use client";

import ProtectedPage from "@/components/ProtectedPage";
import PropertyOnBoardingClient from "@/app/(protected)/PropertyOnBoarding/PropertyOnBoardingClient"

export default function PropertyOnBoardingPage() {
  return (
    <ProtectedPage>
      <PropertyOnBoardingClient/>
    </ProtectedPage>
  );
}