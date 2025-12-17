import React from "react";
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
import { createPageUrl } from "@lib/utils";
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
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [authError, setAuthError] = React.useState(null);

  React.useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        setAuthError(null);
      } catch (error) {
        console.error("Error loading user:", error);
        setAuthError(error.message || "Authentication failed");
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  // Access control functions
  const hasPropertyLandlordAccess = (user) => {
    if (!user?.email) return false;
    const authorizedUsers = [
      'amaani@myhopehousing.org.uk',
      'burton@myhopehousing.org.uk'
    ].map(email => email.toLowerCase());
    const userEmail = user.email?.trim().toLowerCase();
    return authorizedUsers.includes(userEmail);
  };

  const hasAdminAccess = (user) => {
    if (!user?.email) return false;
    const adminUsers = ['amaani@myhopehousing.org.uk'].map(email => email.toLowerCase());
    const userEmail = user.email?.trim().toLowerCase();
    return adminUsers.includes(userEmail);
  };

  // Show loading state
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

  // Show authentication error
  if (authError && !user) {
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
                onClick={() => base44.auth.redirectToLogin()} 
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
    { name: "Weekly SW Docs", href: createPageUrl("WeeklySWDocs"), icon: FileStack, current: currentPageName === "WeeklySWDocs" },
    { name: "Benefits", href: createPageUrl("Benefits"), icon: Gift, current: currentPageName === "Benefits" },
    { name: "Referrals", href: createPageUrl("Referrals"), icon: ArrowRightLeft, current: currentPageName === "Referrals" },
  ];

  const complianceNav = [
    { name: "Service Charges", href: createPageUrl("ServiceCharges"), icon: PoundSterling, current: currentPageName === "ServiceCharges" },
    { name: "Compliance", href: createPageUrl("Compliance"), icon: Shield, current: currentPageName === "Compliance" },
    { name: "Documents", href: createPageUrl("Documents"), icon: Folder, current: currentPageName === "Documents" },
  ];

  // Property/Landlord section - Only Amaani and Burton
  const propertyLandlordNav = [
    { name: "Landlord Enquiries", href: createPageUrl("LandlordEnquiries"), icon: Users, current: currentPageName === "LandlordEnquiries" },
    { name: "Property Onboarding", href: createPageUrl("PropertyOnboarding"), icon: Building, current: currentPageName === "PropertyOnboarding" }
  ];

  // Administration section - Only Amaani
  const adminNav = [
    { name: "Custom Sections", href: createPageUrl("CustomSections"), icon: Settings, current: currentPageName === "CustomSections" },
    { name: "Landlord Portal", href: createPageUrl("LandlordPortal"), icon: Settings, current: currentPageName === "LandlordPortal" },
    { name: "Settings", href: createPageUrl("Settings"), icon: Settings, current: currentPageName === "Settings" },
    { name: "Deleted Entries", href: createPageUrl("DeletedEntries"), icon: Trash2, current: currentPageName === "DeletedEntries" }
  ];

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-slate-50">
        <Sidebar className="border-r border-slate-200 bg-white">
          <SidebarHeader className="border-b border-slate-200 p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm overflow-hidden">
                <img 
                  src="https://myhopehousing.org.uk/wp-content/uploads/2024/02/My-Hope-Housing-CIC.jpg" 
                  alt="My Hope Housing Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 text-lg">My Hope Housing</h2>
                <p className="text-xs text-slate-500"></p>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent className="px-4">
            
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Main
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigation.map((item) => (
                    <SidebarMenuItem key={item.name}>
                      <SidebarMenuButton asChild isActive={item.current}>
                        <a href={item.href} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors">
                          <item.icon className="w-5 h-5" />
                          {item.name}
                        </a>
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
                        <a href={item.href} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors">
                          <item.icon className="w-5 h-5" />
                          {item.name}
                        </a>
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
                        <a href={item.href} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors">
                          <item.icon className="w-5 h-5" />
                          {item.name}
                        </a>
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
                        <a href={item.href} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors">
                          <item.icon className="w-5 h-5" />
                          {item.name}
                        </a>
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
                          <a href={item.href} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors">
                            <item.icon className="w-5 h-5" />
                            {item.name}
                          </a>
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
                          <a href={item.href} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors">
                            <item.icon className="w-5 h-5" />
                            {item.name}
                          </a>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}
          </SidebarContent>
        </Sidebar>

        <div className="flex-1 flex flex-col min-w-0 w-full">
          <header className="bg-white border-b border-slate-200 px-6 py-4 flex-shrink-0">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="md:hidden" />
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold text-slate-900 capitalize">
                  {currentPageName === "OfficeLogs" ? "Office Logs" : 
                   currentPageName === "ServiceCharges" ? "Service Charges" :
                   currentPageName === "SupportPlans" ? "Support Plans" :
                   currentPageName === "WeeklySWDocs" ? "Weekly SW Docs" :
                   currentPageName === "LandlordPortal" ? "Landlord Portal" :
                   currentPageName === "LandlordEnquiries" ? "Landlord Enquiries" :
                   currentPageName === "PropertyOnboarding" ? "Property Onboarding" :
                   currentPageName === "CustomSections" ? "Custom Sections" :
                   currentPageName === "DeletedEntries" ? "Deleted Entries" :
                   currentPageName}
                </h1>
              </div>
            </div>
          </header>

          <main className="flex-1 w-full min-w-0 overflow-x-auto p-6">
            <div className="w-full h-full">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}