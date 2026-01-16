"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * ProtectedPage component
 * Wraps any page or component that requires authentication.
 */
export default function ProtectedPage({ children }) {
  const { isSignedIn, isLoaded } = useUser(); // Clerk hook to get user state
  const router = useRouter();

  useEffect(() => {
    // Redirect to /sign-in if user is not signed in
    if (isLoaded && !isSignedIn) {
      router.push("/sign-in");
    }
  }, [isLoaded, isSignedIn, router]);

  // While the auth state is loading, show a loading indicator
  if (!isLoaded || !isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  // If user is signed in, render the children (the protected page)
  return <>{children}</>;
}
