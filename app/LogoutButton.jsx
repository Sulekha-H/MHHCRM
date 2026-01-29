"use client";

import { useClerk } from "@clerk/nextjs";
import { LogOut } from "lucide-react";

export default function LogoutButton() {
  const { signOut } = useClerk();

  return (
    <button
      onClick={() => signOut({ redirectUrl: "/sign-in" })}
      className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
      title="Log out"
    >
      <LogOut className="h-3.5 w-3.5" />
      <span>Log out</span>
    </button>
  );
}
