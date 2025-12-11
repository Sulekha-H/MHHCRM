import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';
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
  Menu,
  X,
  FileStack,
  Settings,
  Trash2,
  Lock
} from 'lucide-react';

export default function AppLayout({ children }) {
  console.log("🔵 AppLayout is rendering!");
  
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) {
          setAuthError(error.message);
        } else if (!user) {
          setAuthError('Please log in to access this application');
        } else {
          setUser(user);
          setAuthError(null);
        }
      } catch (error) {
        setAuthError('Authentication failed');
      } finally {
        setLoading(false);
      }
    };
    getUser();
  }, []);

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Residents", href: "/Residents", icon: Users },
    { name: "Properties", href: "/Properties", icon: Building },
    { name: "Accommodations", href: "/accommodations", icon: Bed },
  ];

  const operationsNav = [
    { name: "Tasks", href: "/Tasks", icon: CheckSquare },
    { name: "Incidents", href: "/Incidents", icon: AlertTriangle },
    { name: "Office Logs", href: "/OfficeLogs", icon: FileText },
    { name: "Repairs", href: "/Repairs", icon: Wrench },
  ];

  const supportNav = [
    { name: "Support Plans", href: "/SupportPlans", icon: Heart },
    { name: "Weekly SW Docs", href: "/WeeklySWDocs", icon: FileStack },
    { name: "Benefits", href: "/Benefits", icon: Gift },
    { name: "Referrals", href: "/Referrals", icon: ArrowRightLeft },
  ];

  const complianceNav = [
    { name: "Service Charges", href: "/ServiceCharges", icon: PoundSterling },
    { name: "Compliance", href: "/Compliance", icon: Shield },
    { name: "Documents", href: "/Documents", icon: Folder },
  ];

  // Property/Landlord section
  const propertyLandlordNav = [
    { name: "Landlord Enquiries", href: "/LandlordEnquiries", icon: Users },
    { name: "Property Onboarding", href: "/PropertyOnboarding", icon: Building }
  ];

  // Administration section
  const adminNav = [
    { name: "Custom Sections", href: "/CustomSections", icon: Settings },
    { name: "Landlord Portal", href: "/LandlordPortal", icon: Settings },
    { name: "Settings", href: "/Settings", icon: Settings },
    { name: "Deleted Entries", href: "/DeletedEntries", icon: Trash2 }
  ];

  const isActive = (href) => router.pathname === href;

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show authentication error and login button
  if (authError || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 p-6">
        <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Required</h2>
          <p className="text-gray-600 mb-6">
            {authError || 'Please log in to access this application'}
          </p>
          <div className="space-y-3">
            <button
              onClick={() => router.push('/login')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Log In
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-white hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-lg border border-gray-300 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm overflow-hidden">
              <img
                src="https://myhopehousing.org.uk/wp-content/uploads/2024/02/My-Hope-Housing-CIC.jpg"
                alt="My Hope Housing Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-lg">My Hope Housing</h2>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Main Navigation */}
          <div>
            <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Main
            </h3>
            <div className="space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Operations */}
          <div>
            <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Operations
            </h3>
            <div className="space-y-1">
              {operationsNav.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Support & Care */}
          <div>
            <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Support & Care
            </h3>
            <div className="space-y-1">
              {supportNav.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Compliance & Documents */}
          <div>
            <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Compliance & Documents
            </h3>
            <div className="space-y-1">
              {complianceNav.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Property/Landlords - NO RESTRICTIONS */}
          <div>
            <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Property/Landlords
            </h3>
            <div className="space-y-1">
              {propertyLandlordNav.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Administration - NO RESTRICTIONS */}
          <div>
            <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Administration
            </h3>
            <div className="space-y-1">
              {adminNav.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden h-16 bg-white border-b border-gray-200 flex items-center px-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-500 hover:text-gray-700"
          >
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="ml-4 text-lg font-semibold text-gray-900">My Hope Housing</h1>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}