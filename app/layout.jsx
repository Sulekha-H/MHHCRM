"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

import {
  Home,
  Users,
  AlertTriangle,
  FileText,
  Building,
  Bed,
  PoundSterling,
  CheckSquare,
  Wrench,
  Gift,
  ArrowRightLeft,
  Shield,
  Heart,
  Folder,
  Settings,
  Lock,
  FileStack,
  Trash2,
} from "lucide-react"

import { base44 } from "@/api/base44Client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function RootLayout({ children }) {
  const pathname = usePathname()

  const [user, setUser] = React.useState(null)
  const [loading, setLoading] = React.useState(true)
  const [authError, setAuthError] = React.useState(null)

  // 🔐 AUTH (same logic as Pages Router)
  React.useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me()
        setUser(currentUser)
        setAuthError(null)
      } catch (error) {
        setAuthError(error.message || "Authentication failed")
      } finally {
        setLoading(false)
      }
    }
    loadUser()
  }, [])

  const hasPropertyLandlordAccess = (user) => {
    if (!user?.email) return false
    return [
      "amaani@myhopehousing.org.uk",
      "burton@myhopehousing.org.uk",
    ].includes(user.email.toLowerCase())
  }

  const hasAdminAccess = (user) => {
    if (!user?.email) return false
    return ["amaani@myhopehousing.org.uk"].includes(user.email.toLowerCase())
  }

  // ⏳ Loading
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading…
      </div>
    )
  }

  // 🔒 Auth error
  if (authError && !user) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <Lock className="mx-auto mb-4 text-red-600" />
            <Button onClick={() => base44.auth.redirectToLogin()}>
              Log in
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 🔗 NAV CONFIG (same as before)
  const navItem = (name, href, icon) => ({
    name,
    href,
    icon,
    active: pathname === href,
  })

  const navigation = [
    navItem("Dashboard", "/dashboard", Home),
    navItem("Residents", "/residents", Users),
    navItem("Properties", "/properties", Building),
    navItem("Accommodations", "/accommodations", Bed),
  ]

  // (Repeat same arrays for operationsNav, supportNav, etc.)

  return (
    <html lang="en">
      <body>
        <SidebarProvider>
          <div className="flex min-h-screen w-full bg-slate-50">

            {/* SIDEBAR (persistent) */}
            <Sidebar className="border-r bg-white">
              <SidebarHeader className="p-6 border-b">
                <h2 className="font-bold text-lg">My Hope Housing</h2>
              </SidebarHeader>

              <SidebarContent className="px-4">
                <SidebarGroup>
                  <SidebarGroupLabel>Main</SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>

 
