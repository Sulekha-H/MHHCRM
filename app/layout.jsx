"use client"

import "./global.css"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ClerkProvider, useUser, SignInButton, UserButton } from "@clerk/nextjs"

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
  Building,
  Bed,
  Shield,
} from "lucide-react"

function AppShell({ children }) {
  const pathname = usePathname()
  const { user, isLoaded, isSignedIn } = useUser()

  // ⏳ Clerk still loading
  if (!isLoaded) {
    return <div className="p-6">Loading…</div>
  }

  // 🔒 Not signed in
  if (!isSignedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <SignInButton mode="modal">
          <button className="px-4 py-2 rounded bg-black text-white">
            Sign in
          </button>
        </SignInButton>
      </div>
    )
  }

  // 🧠 ROLE CHECKS (email-based like your old logic)
  const email = user.primaryEmailAddress?.emailAddress?.toLowerCase()

  const isAdmin = email === "amaani@myhopehousing.org.uk"
  const isLandlord = [
    "amaani@myhopehousing.org.uk",
    "burton@myhopehousing.org.uk",
  ].includes(email)

  const navItem = (name, href, icon) => ({
    name,
    href,
    icon,
    active: pathname === href,
  })

  const mainNav = [
    navItem("Dashboard", "/dashboard", Home),
    navItem("Residents", "/residents", Users),
    navItem("Properties", "/properties", Building),
    navItem("Accommodations", "/accommodations", Bed),
  ]

  if (isAdmin) {
    mainNav.push(navItem("Admin", "/admin", Shield))
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-slate-50">

        {/* SIDEBAR (persistent) */}
        <Sidebar className="border-r bg-white">
          <SidebarHeader className="p-6 border-b flex items-center justify-between">
            <span className="font-bold">My Hope Housing</span>
            <UserButton />
          </SidebarHeader>

          <SidebarContent className="px-4">
            <SidebarGroup>
              <SidebarGroupLabel>Main</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {mainNav.map((item) => (
                    <SidebarMenuItem key={item.name}>
                      <SidebarMenuButton asChild isActive={item.active}>
                        <Link
                          href={item.href}
                          className="flex items-center gap-3 px-3 py-2"
                        >
                          <item.icon className="w-5 h-5" />
                          {item.name}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        {/* MAIN CONTENT */}
        <div className="flex-1 flex flex-col min-w-0">
          <header className="border-b bg-white px-6 py-4 flex items-center gap-4">
            <SidebarTrigger className="md:hidden" />
            <h1 className="font-semibold capitalize">
              {pathname.replace("/", "")}
            </h1>
          </header>

          <main className="flex-1 p-6 overflow-auto">
            {children}
          </main>
        </div>

      </div>
    </SidebarProvider>
  )
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ClerkProvider>
          <AppShell>{children}</AppShell>
        </ClerkProvider>
      </body>
    </html>
  )
}

