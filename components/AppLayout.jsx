import React from "react";
import { useRouter } from 'next/router';
import { supabase } from "../lib/supabaseClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";

// Sidebar imports (unchanged)
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
} from "@/components/ui/sidebar";
import { createPageUrl } from "@/lib/utils"
import {
  Home,
  Users,
  Building,
  Bed,
  CheckSquare,
  AlertTriangle,
  FileText,
  Wrench,
  Heart,
  Gift,
  ArrowRightLeft,
  Shield,
  Folder,
  Settings,
  Trash2
} from "lucide-react";

export default function Layout({ children, currentPageName }) {
  const router = useRouter();
  const publicPages = ['/set-password', '/login', '/privacypolicy', '/termsofservice'];
  const isPublicPage = router.asPath.startsWith('/set-password') || publicPages.includes(router.pathname);


  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(!isPublicPage);

  // Load Supabase session user only for non-public pages
  React.useEffect(() => {
    if (isPublicPage) return;

    const loadUser = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data?.session?.user || null);
      setLoading(false);
    };

    loadUser();
  }, [isPublicPage]);

  // Access control helpers
  const hasPropertyLandlordAccess = (user) => {
    if (!user?.email) return false;
    const authorizedUsers = ['amaani@myhopehousing.org.uk', 'burton@myhopehousing.org.uk'].map(email => email.toLowerCase());
    return authorizedUsers.includes(user.email.toLowerCase());
  };

  const hasAdminAccess = (user) => {
    if (!user?.email) return false;
    const adminUsers = ['amaani@myhopehousing.org.uk'].map(email => email.toLowerCase());
    return adminUsers.includes(user.email.toLowerCase());
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If page is protected and user is not authenticated
  if (!isPublicPage && !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 p-6">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Authentication Required</h2>
            <p className="text-slate-600 mb-6">Please log in to access this application.</p>
            <div className="space-y-3">
              <Button 
                onClick={() => router.push('/login')} 
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Log In
              </Button>
              <Button 
                onClick={() => window.location.reload()} 
                variant="outline"
                className="w-full"
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- Navigation setup ---
  const navigation = [
    { name: "Dashboard", href: createPageUrl("Dashboard"), icon: Home, current: currentPageName === "Dashboard" },
    { name: "Residents", href: createPageUrl("Residents"), icon: Users, current: currentPageName === "Residents" },
    { name: "Properties", href: createPageUrl("Properties"), icon: Building, current: currentPageName === "Properties" },
    { name: "Accommodations", href: createPageUrl("Accommodations"), icon: Bed, current: currentPageName === "Accommodations" },
  ];

  const operationsNav = [
    { name: "Tasks", href: createPageUrl("Tasks"), icon: CheckSquare, current: currentPageName === "Tasks" },
    { name: "Incidents", href: createPageUrl("Incidents"), icon: AlertTriangle, current: currentPageName === "Incidents" },
    { name: "Office Logs", href: createPageUrl("OfficeLogs"), icon: FileText, current: currentPageName === "OfficeLogs" },
    { name: "Repairs", href: createPageUrl("Repairs"), icon: Wrench, current: currentPageName === "Repairs" },
  ];

  const supportNav = [
    { name: "Support Plans", href: createPageUrl("SupportPlans"), icon: Heart, current: currentPageName === "SupportPlans" },
    { name: "Weekly SW Docs", href: createPageUrl("WeeklySWDocs"), icon: FileText, current: currentPageName === "WeeklySWDocs" },
    { name: "Benefits", href: createPageUrl("Benefits"), icon: Gift, current: currentPageName === "Benefits" },
    { name: "Referrals", href: createPageUrl("Referrals"), icon: ArrowRightLeft, current: currentPageName === "Referrals" },
  ];

  const complianceNav = [
    { name: "Service Charges", href: createPageUrl("ServiceCharges"), icon: Shield, current: currentPageName === "ServiceCharges" },
    { name: "Compliance", href: createPageUrl("Compliance"), icon: Shield, current: currentPageName === "Compliance" },
    { name: "Documents", href: createPageUrl("Documents"), icon: Folder, current: currentPageName === "Documents" },
  ];

  const propertyLandlordNav = [
    { name: "Landlord Enquiries", href: createPageUrl("LandlordEnquiries"), icon: Users, current: currentPageName === "LandlordEnquiries" },
    { name: "Property Onboarding", href: createPageUrl("PropertyOnboarding"), icon: Building, current: currentPageName === "PropertyOnboarding" }
  ];

  const adminNav = [
    { name: "Custom Sections", href: createPageUrl("CustomSections"), icon: Settings, current: currentPageName === "CustomSections" },
    { name: "Landlord Portal", href: createPageUrl("LandlordPortal"), icon: Settings, current: currentPageName === "LandlordPortal" },
    { name: "Settings", href: createPageUrl("Settings"), icon: Settings, current: currentPageName === "Settings" },
    { name: "Deleted Entries", href: createPageUrl("DeletedEntries"), icon: Trash2, current: currentPageName === "DeletedEntries" }
  ];

  // --- Render layout only for authenticated pages ---
  if (isPublicPage) {
    return <>{children}</>;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-slate-50">
        {/* Sidebar */}
        <Sidebar className="border-r border-slate-200 bg-white">
          <SidebarHeader className="border-b border-slate-200 p-6">
            <h2 className="font-bold text-slate-900 text-lg">My Hope Housing</h2>
          </SidebarHeader>
          <SidebarContent className="px-4">
            {/* Main navigation */}
            <SidebarGroup>
              <SidebarGroupLabel>Main</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigation.map((item) => (
                    <SidebarMenuItem key={item.name}>
                      <SidebarMenuButton asChild isActive={item.current}>
                        <a href={item.href} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium">
                          <item.icon className="w-5 h-5" />
                          {item.name}
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Add other nav groups (Operations, Support, Compliance, etc.) similarly */}
          </SidebarContent>
        </Sidebar>

        <div className="flex-1 flex flex-col min-w-0 w-full">
          <header className="bg-white border-b border-slate-200 px-6 py-4 flex-shrink-0">
            <h1 className="text-xl font-semibold text-slate-900 capitalize">{currentPageName}</h1>
          </header>
          <main className="flex-1 w-full min-w-0 overflow-x-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}