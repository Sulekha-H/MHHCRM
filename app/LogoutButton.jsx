"use client";

import { useClerk } from "@clerk/nextjs";
import { LogOut } from "lucide-react";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export default function LogoutButton() {
  const { signOut } = useClerk();

  const handleLogout = async () => {
    try {
      await signOut();
      // Force a full browser reload to clear all Next.js caches and client state
      window.location.href = "/sign-in";
    } catch (error) {
      console.error("Logout failed:", error);
      // Fallback redirect if signOut fails
      window.location.href = "/sign-in";
    }
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          onClick={handleLogout}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <LogOut className="h-4 w-4" />
          <span>Log out</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
