"use client";

import { SignIn, SignedIn, SignedOut } from "@clerk/nextjs";
import { redirect } from "next/navigation";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <SignedIn>
        {redirect("/dashboard")}
      </SignedIn>

      <SignedOut>
        <SignIn
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
        />
      </SignedOut>
    </div>
  );
}
