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
import { isAdmin, isOfficeStaff, isRestrictedStaff, isSupportWorker } from "@/lib/permissions";
import {
  Home,
  Calendar as CalendarIcon,
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
  Zap,
  ClipboardCheck,
  ShoppingCart,
  History
} from "lucide-react";

export default function SidebarNavigation() {
  const { user, isLoaded } = useUser();
  const pathname = usePathname();
  const isSCStaff = isRestrictedStaff(user);
  const isSW = isSupportWorker(user);

  if (!isLoaded) {
    return (
      <div className="flex flex-col gap-4 p-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-8 w-full animate-pulse rounded bg-slate-100" />
        ))}
      </div>
    );
  }

  const hasPropertyLandlordAccess = (user) => {
    if (!user?.emailAddresses?.[0]?.emailAddress) return false;
    const authorizedUsers = [
      'amaani@myhopehousing.org.uk',
      'burton@myhopehousing.org.uk'
    ].map(email => email.toLowerCase());
    const userEmail = user.emailAddresses[0].emailAddress?.trim().toLowerCase();
    return authorizedUsers.includes(userEmail);
  };

  const navigation = [
    { name: "Dashboard", href: "/", icon: Home, current: pathname === "/" },
    { name: "Staff Handover", href: "/staff-handover", icon: History, current: pathname === "/staff-handover" },
    { name: "TeamUp Calendar", href: "/calendar", icon: CalendarIcon, current: pathname === "/calendar" },
    { name: "RotaCloud", href: "/rotacloud", icon: CalendarIcon, current: pathname === "/rotacloud" },
    { name: "M365 Calendar", href: "/microsoft-calendar", icon: CalendarIcon, current: pathname === "/microsoft-calendar" },
    { name: "Standard Residents", href: "/residents", icon: Users, current: pathname === "/residents" },
    { name: "Room Breakdown", href: "/room-breakdown", icon: Bed, current: pathname === "/room-breakdown" },
    { name: "Properties", href: "/properties", icon: Building, current: pathname === "/properties" },
    { name: "Accommodations", href: "/accommodations", icon: Bed, current: pathname === "/accommodations" },
  ];

  const operationsNav = [
    { name: "Tasks", href: "/tasks", icon: CheckSquare, current: pathname === "/tasks" },
    { name: "Incidents", href: "/incidents", icon: AlertTriangle, current: pathname === "/incidents" },
    { name: "Office Logs", href: "/officelogs", icon: FileText, current: pathname === "/officelogs" },
    { name: "Repairs", href: "/repairs", icon: Wrench, current: pathname === "/repairs" },
    { name: "Property Purchases", href: "/property-purchases", icon: ShoppingCart, current: pathname === "/property-purchases" },
    { name: "Service Providers", href: "/service-providers", icon: Users, current: pathname === "/service-providers" },
    { name: "Work Bookings", href: "/work-bookings", icon: CalendarIcon, current: pathname === "/work-bookings" },
  ];

  const supportNav = [
    { name: "Support Plans", href: "/supportplans", icon: Heart, current: pathname === "/supportplans" },
    { name: "Weekly SW Docs", href: "/weeklyswdocs", icon: FileStack, current: pathname === "/weeklyswdocs" },
    { name: "Benefits", href: "/benefits", icon: Heart, current: pathname === "/benefits" },
    { name: "Referrals", href: "/referrals", icon: ArrowRightLeft, current: pathname === "/referrals" },
  ];


  const  allocatedResidentNav= [
    { name: "Allocated Residents", href: "/allocated-residents", icon: Users, current: pathname === "/allocated-residents" },
    { name: "Support Plans", href: "/allocated-support-plans", icon: Heart, current: pathname === "/allocated-support-plans" },
    { name: "Benefits", href: "/allocated-benefits", icon: Heart, current: pathname === "/allocated-benefits" },
  ];

  const complianceNav = [
    { name: "Service Charges", href: "/servicecharges", icon: PoundSterling, current: pathname === "/servicecharges" },
    { name: "Property Certs", href: "/compliance", icon: Shield, current: pathname === "/compliance" },
    { name: "Compliance Checks", href: "/compliance-checks", icon: ClipboardCheck, current: pathname === "/compliance-checks" },
    { name: "Utilities", href: "/utilities", icon: Zap, current: pathname === "/utilities" },
    { name: "Documents", href: "/documents", icon: Folder, current: pathname === "/documents" },
  ];

  const propertyLandlordNav = [
    { name: "Landlord Enquiries", href: "/landlordenquiries", icon: Users, current: pathname === "/landlordenquiries" },
    { name: "Property Onboarding", href: "/propertyonboarding", icon: Building, current: pathname === "/propertyonboarding" }
  ];

  const adminNav = [
    { name: "Staff Activity", href: "/staff-activity", icon: History, current: pathname === "/staff-activity" },
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
            {navigation
              .filter(item => {
                if (!isSCStaff) return true;
                const allowedNames = ["Dashboard", "Staff Handover", "TeamUp Calendar"];
                if (isSW) {
                  allowedNames.push("Standard Residents");
                }
                return allowedNames.includes(item.name);
              })
              .map((item) => (
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

      {!isSCStaff && (
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
      )}

      {(!isSCStaff || isSW) && (
        <SidebarGroup className="p-1.5">
          <SidebarGroupLabel className={groupLabelClass}>
            Support & Care
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {supportNav
                .filter(item => !isSCStaff || item.name === "Support Plans")
                .map((item) => (
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

      {(!isSCStaff || isSW) && (
        <SidebarGroup className="p-1.5">
          <SidebarGroupLabel className={groupLabelClass}>
            Allocated Residents
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {allocatedResidentNav
                .filter(item => !isSCStaff || ["Allocated Residents", "Support Plans"].includes(item.name))
                .map((item) => (
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


      <SidebarGroup className="p-1.5">
        <SidebarGroupLabel className={groupLabelClass}>
          Compliance & Documents
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu className="gap-0.5">
            {complianceNav
              .filter(item => !isSCStaff || item.name === "Service Charges")
              .map((item) => (
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

      {!isSCStaff && hasPropertyLandlordAccess(user) && (
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

      {!isSCStaff && isAdmin(user) && (
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
