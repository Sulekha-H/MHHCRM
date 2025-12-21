// components/ProtectedPage.jsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";

export default function ProtectedPage({ children }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error("Supabase getSession error:", error.message);
        router.replace("/login");
        return;
      } 

      if (!session) {
        router.replace("/login");
        return;
      }

      if (isMounted) setLoading(false);
    };

    checkSession();

    return () => {
      isMounted = false;
    };
  }, [router]);

  if (loading) return null; // you can show a spinner here

  return <>{children}</>;
}
