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
    { name: "Office Logs", href: "/officelogs", icon: FileText, current: pathname === "/officelogs" },
    { name: "Repairs", href: "/repairs", icon: Wrench, current: pathname === "/repairs" },
  ];

  const supportNav = [
    { name: "Support Plans", href: "/supportplans", icon: Heart, current: pathname === "/supportplans" },
    { name: "Weekly SW Docs", href: "/weeklyswdocs", icon: FileStack, current: pathname === "/weeklyswdocs" },
    { name: "Support Plans", href: "/supportplans", icon: Heart, current: pathname === "/supportplans" },
    { name: "Referrals", href: "/referrals", icon: ArrowRightLeft, current: pathname === "/referrals" },
  ];


  const  allocatedResidentNav= [
  { name: "Support Plans", href: "/supportplans", icon: Heart, current: pathname === "/supportplans" },
  { name: "Support Plans", href: "/supportplans", icon: Heart, current: pathname === "/supportplans" },
  ];

  const complianceNav = [
    { name: "Service Charges", href: "/servicecharges", icon: PoundSterling, current: pathname === "/servicecharges" },
    { name: "Compliance", href: "/compliance", icon: Shield, current: pathname === "/compliance" },
    { name: "Documents", href: "/documents", icon: Folder, current: pathname === "/documents" },
  ];

  const propertyLandlordNav = [
    { name: "Landlord Enquiries", href: "/landlordenquiries", icon: Users, current: pathname === "/landlordenquiries" },
    { name: "Property Onboarding", href: "/propertyonboarding", icon: Building, current: pathname === "/propertyonboarding" }
  ];

  const adminNav = [
    { name: "Custom Sections", href: "/customsections", icon: Settings, current: pathname === "/customsections" },
    { name: "Landlord Portal", href: "/landlordportal", icon: Settings, current: pathname === "/landlordportal" },
    { name: "Settings", href: "/settings", icon: Settings, current: pathname === "/settings" },
    { name: "Deleted Entries", href: "/deletedentries", icon: Trash2, current: pathname === "/deletedentries" }
  ];

  const groupLabelClass = "mb-1 px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500";
  const linkClass = "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium transition-colors";
  const iconClass = "h-4 w-4 shrink-0";

  return (
    <>
      <SidebarGroup className="p-1.5">
        <SidebarGroupLabel className={groupLabelClass}>
          Main
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu className="gap-0.5">
            {navigation.map((item) => (
              <SidebarMenuItem key={item.name}>
                <SidebarMenuButton asChild isActive={item.current}>
                  <Link href={item.href} className={linkClass}>
                    <item.icon className={iconClass} />
                    {item.name}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <SidebarGroup className="p-1.5">
        <SidebarGroupLabel className={groupLabelClass}>
          Operations
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu className="gap-0.5">
            {operationsNav.map((item) => (
              <SidebarMenuItem key={item.name}>
                <SidebarMenuButton asChild isActive={item.current}>
                  <Link href={item.href} className={linkClass}>
                    <item.icon className={iconClass} />
                    {item.name}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <SidebarGroup className="p-1.5">
        <SidebarGroupLabel className={groupLabelClass}>
          Support & Care
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu className="gap-0.5">
            {supportNav.map((item) => (
              <SidebarMenuItem key={item.name}>
                <SidebarMenuButton asChild isActive={item.current}>
                  <Link href={item.href} className={linkClass}>
                    <item.icon className={iconClass} />
                    {item.name}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
      
      <SidebarGroup className="p-1.5">
        <SidebarGroupLabel className={groupLabelClass}>
          Allocated Residents
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu className="gap-0.5">
            {allocatedResidentNav.map((item) => (
              <SidebarMenuItem key={item.name}>
                <SidebarMenuButton asChild isActive={item.current}>
                  <Link href={item.href} className={linkClass}>
                    <item.icon className={iconClass} />
                    {item.name}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>


      <SidebarGroup className="p-1.5">
        <SidebarGroupLabel className={groupLabelClass}>
          Compliance & Documents
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu className="gap-0.5">
            {complianceNav.map((item) => (
              <SidebarMenuItem key={item.name}>
                <SidebarMenuButton asChild isActive={item.current}>
                  <Link href={item.href} className={linkClass}>
                    <item.icon className={iconClass} />
                    {item.name}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      {hasPropertyLandlordAccess(user) && (
        <SidebarGroup className="p-1.5">
          <SidebarGroupLabel className={groupLabelClass}>
            Property/Landlords
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {propertyLandlordNav.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton asChild isActive={item.current}>
                    <Link href={item.href} className={linkClass}>
                      <item.icon className={iconClass} />
                      {item.name}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      )}

      {hasAdminAccess(user) && (
        <SidebarGroup className="p-1.5">
          <SidebarGroupLabel className={groupLabelClass}>
            Administration
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {adminNav.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton asChild isActive={item.current}>
                    <Link href={item.href} className={linkClass}>
                      <item.icon className={iconClass} />
                      {item.name}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      )}

    </>
  );
}
