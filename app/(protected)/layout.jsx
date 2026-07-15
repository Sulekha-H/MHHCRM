"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import IdleTimer from "@/components/IdleTimer";
import { isRestrictedStaff } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";

export default function ProtectedLayout({ children }) {
  const { isLoaded, userId } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoaded && !userId) {
      router.push("/sign-in");
    }
  }, [isLoaded, userId, router]);

  const isSCStaff = isRestrictedStaff(user);
  const allowedPaths = ["/dashboard", "/servicecharges", "/staff-handover", "/calendar", "/api/rotacloud", "/api/microsoft-calendar", "/api/webhooks/clerk", "/api/createProfile", "/api/invite"];

  // Basic guard for SC staff
  const isAccessDenied = isSCStaff &&
    !allowedPaths.some(path => pathname.startsWith(path)) &&
    pathname !== "/";

  if (!isLoaded || !userId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (isAccessDenied) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-8">
            You do not have permission to access this page. Please contact an administrator if you believe this is an error.
          </p>
          <Button
            onClick={() => router.push("/dashboard")}
            className="w-full bg-indigo-600 hover:bg-indigo-700"
          >
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <IdleTimer timeout={30 * 60 * 1000} />
      {children}
    </>
  );
}
