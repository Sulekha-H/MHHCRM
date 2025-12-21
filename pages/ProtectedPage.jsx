// components/ProtectedPage.jsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/lib/supabaseClient";

export default function ProtectedPage({ children }) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Supabase v2 method to get current session
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) {
          setAuthenticated(true);
        } else {
          router.replace("/login"); // Redirect if not authenticated
        }
      } catch (error) {
        console.error("Error checking session:", error);
        router.replace("/login");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  if (loading) {
    // Show a loading state until session is verified
    return <div className="p-6 text-center">Loading...</div>;
  }

  if (!authenticated) {
    // User is being redirected, do not render children
    return null;
  }

  return <>{children}</>;
}
