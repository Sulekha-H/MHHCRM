// components/SidebarNavigation.jsx
"use client";

import { useUser } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
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
  Trash2
} from "lucide-react";

export default function SidebarNavigation() {
  const { user } = useUser();
  const pathname = usePathname();

  // Access control functions
  const hasPropertyLandlordAccess = (user) => {
    if (!user?.emailAddresses?.[0]?.emailAddress) return false;
    const authorizedUsers = [
      'amaani@myhopehousing.org.uk',
      'burton@myhopehousing.org.uk'
    ].map(email => email.toLowerCase());
    const userEmail = user.emailAddresses[0].emailAddress?.trim().toLowerCase();
    return authorizedUsers.includes(userEmail);
  };

  const hasAdminAccess = (user) => {
    if (!user?.emailAddresses?.[0]?.emailAddress) return false;
    const adminUsers = ['amaani@myhopehousing.org.uk'].map(email => email.toLowerCase());
    const userEmail = user.emailAddresses[0].emailAddress?.trim().toLowerCase();
    return adminUsers.includes(userEmail);
  };

  const navigation = [
    { name: "Dashboard", href: "/", icon: Home, current: pathname === "/" },
    { name: "Residents", href: "/residents", icon: Users, current: pathname === "/residents" },
    { name: "Properties", href: "/properties", icon: Building, current: pathname === "/properties" },
    { name: "Accommodations", href: "/accommodations", icon: Bed, current: pathname === "/accommodations" },
  ];

  const operationsNav = [
    { name: "Tasks", href: "/tasks", icon: CheckSquare, current: pathname === "/tasks" },
    { name: "Incidents", href: "/incidents", icon: AlertTriangle, current: pathname === "/incidents" },
    { name: "Office Logs", href: "/office-logs", icon: FileText, current: pathname === "/office-logs" },
    { name: "Repairs", href: "/repairs", icon: Wrench, current: pathname === "/repairs" },
  ];

  const supportNav = [
    { name: "Support Plans", href: "/support-plans", icon: Heart, current: pathname === "/support-plans" },
    { name: "Weekly SW Docs", href: "/weekly-sw-docs", icon: FileStack, current: pathname === "/weekly-sw-docs" },
    { name: "Benefits", href: "/benefits", icon: Gift, current: pathname === "/benefits" },
    { name: "Referrals", href: "/referrals", icon: ArrowRightLeft, current: pathname === "/referrals" },
  ];

  const complianceNav = [
    { name: "Service Charges", href: "/service-charges", icon: PoundSterling, current: pathname === "/service-charges" },
    { name: "Compliance", href: "/compliance", icon: Shield, current: pathname === "/compliance" },
    { name: "Documents", href: "/documents", icon: Folder, current: pathname === "/documents" },
  ];

  const personalNav = [
    { name: "Personal Notes", href: "/personal-notes", icon: FileText, current: pathname === "/personal-notes" }
  ];

  // Property/Landlord section - Only Amaani and Burton
  const propertyLandlordNav = [
    { name: "Landlord Enquiries", href: "/landlord-enquiries", icon: Users, current: pathname === "/landlord-enquiries" },
    { name: "Property Onboarding", href: "/property-onboarding", icon: Building, current: pathname === "/property-onboarding" }
  ];

  // Administration section - Only Amaani
  const adminNav = [
    { name: "Custom Sections", href: "/custom-sections", icon: Settings, current: pathname === "/custom-sections" },
    { name: "Landlord Portal", href: "/landlord-portal", icon: Settings, current: pathname === "/landlord-portal" },
    { name: "Settings", href: "/settings", icon: Settings, current: pathname === "/settings" },
    { name: "Deleted Entries", href: "/deleted-entries", icon: Trash2, current: pathname === "/deleted-entries" }
  ];

  return (
    <>
      <SidebarGroup>
        <SidebarGroupLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
          Main
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {navigation.map((item) => (
              <SidebarMenuItem key={item.name}>
                <SidebarMenuButton asChild isActive={item.current}>
                  <Link href={item.href} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors">
                    <item.icon className="w-5 h-5" />
                    {item.name}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <SidebarGroup>
        <SidebarGroupLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
          Operations
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {operationsNav.map((item) => (
              <SidebarMenuItem key={item.name}>
                <SidebarMenuButton asChild isActive={item.current}>
                  <Link href={item.href} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors">
                    <item.icon className="w-5 h-5" />
                    {item.name}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <SidebarGroup>
        <SidebarGroupLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
          Support & Care
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {supportNav.map((item) => (
              <SidebarMenuItem key={item.name}>
                <SidebarMenuButton asChild isActive={item.current}>
                  <Link href={item.href} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors">
                    <item.icon className="w-5 h-5" />
                    {item.name}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <SidebarGroup>
        <SidebarGroupLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
          Compliance & Documents
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {complianceNav.map((item) => (
              <SidebarMenuItem key={item.name}>
                <SidebarMenuButton asChild isActive={item.current}>
                  <Link href={item.href} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors">
                    <item.icon className="w-5 h-5" />
                    {item.name}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      {/* Property/Landlord section - Only Amaani and Burton */}
      {hasPropertyLandlordAccess(user) && (
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Property/Landlords
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {propertyLandlordNav.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton asChild isActive={item.current}>
                    <Link href={item.href} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors">
                      <item.icon className="w-5 h-5" />
                      {item.name}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      )}

      {/* Administration section - Only Amaani */}
      {hasAdminAccess(user) && (
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Administration
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminNav.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton asChild isActive={item.current}>
                    <Link href={item.href} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors">
                      <item.icon className="w-5 h-5" />
                      {item.name}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      )}

      {/* Personal section */}
      <SidebarGroup>
        <SidebarGroupLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
          Personal
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {personalNav.map((item) => (
              <SidebarMenuItem key={item.name}>
                <SidebarMenuButton asChild isActive={item.current}>
                  <Link href={item.href} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors">
                    <item.icon className="w-5 h-5" />
                    {item.name}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </>
  );
}

