import React from "react";
import { Link, useLocation } from "react-router-dom";
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
import { createPageUrl } from "@/utils";
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
  const location = useLocation();
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [authError, setAuthError] = React.useState(null);

  // Pages that don't require authentication
  const publicPages = ['PrivacyPolicy', 'TermsOfService', 'set-password', 'login'];
  const isPublicPage = publicPages.includes(currentPageName);

  React.useEffect(() => {
    // Skip auth check for public pages
    if (isPublicPage) {
      setLoading(false);
      return;
    }

    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        setAuthError(null);
      } catch (error) {
        console.error("Error loading user:", error);
        setAuthError(error.message || "Authentication failed");
        
        // Don't auto-redirect, let user click the login button
        // This prevents infinite redirect loops
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, [isPublicPage]);

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

  // If it's a public page, render without authentication
  if (isPublicPage) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex-shrink-0">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
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
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button 
                onClick={() => window.location.href = createPageUrl("PrivacyPolicy")}
                variant="ghost"
                className="text-slate-600"
              >
                Privacy Policy
              </Button>
              <Button 
                onClick={() => window.location.href = createPageUrl("TermsOfService")}
                variant="ghost"
                className="text-slate-600"
              >
                Terms of Service
              </Button>
              <Button 
                onClick={() => base44.auth.redirectToLogin()} 
                className="bg-blue-600 hover:bg-blue-700"
              >
                Log In
              </Button>
            </div>
          </div>
        </header>
        <main className="flex-grow w-full max-w-7xl mx-auto p-6">
          {children}
        </main>
        <footer className="bg-white border-t border-slate-200 py-6 px-6 mt-12 flex-shrink-0">
          <div className="max-w-7xl mx-auto text-center text-sm text-slate-600">
            <p>© {new Date().getFullYear()} My Hope Housing CIC. All rights reserved.</p>
            <div className="flex justify-center gap-4 mt-2">
              <a href={createPageUrl("PrivacyPolicy")} className="hover:text-blue-600">Privacy Policy</a>
              <span>•</span>
              <a href={createPageUrl("TermsOfService")} className="hover:text-blue-600">Terms of Service</a>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  // Show loading state while checking authentication
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

  // Show authentication error with helpful actions
  if (authError && !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 p-6">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Authentication Required</h2>
            <p className="text-slate-600 mb-6">
              {authError.includes("private") 
                ? "This app is private. Please log in to access it."
                : authError.includes("not authenticated")
                ? "Your session has expired. Please log in again."
                : "Unable to authenticate. Please try logging in."}
            </p>
            <div className="space-y-3">
              <Button 
                onClick={() => {
                  // Clear any stale auth state and redirect
                  window.location.href = '/api/auth/login';
                }} 
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
            <p className="text-xs text-slate-500 mt-6">
              Error details: {authError}
            </p>
            <p className="text-xs text-slate-500 mt-2">
              If you continue to have issues, please contact your administrator.
            </p>
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
                        <Link to={item.href} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors">
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
                        <Link to={item.href} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors">
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
                        <Link to={item.href} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors">
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
                        <Link to={item.href} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors">
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
                          <Link to={item.href} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors">
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
                          <Link to={item.href} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors">
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