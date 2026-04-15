"use client"

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  Trash2
} from 'lucide-react';

export default function AppLayout({ children }) {
  console.log("🔵 AppLayout is rendering!");
  

  const pathname = usePathname();
  //const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Residents", href: "/residents", icon: Users },
    { name: "Properties", href: "/properties", icon: Building },
    { name: "Accommodations", href: "/accommodations", icon: Bed },
  ];

  const operationsNav = [
    { name: "tasks", href: "/tasks", icon: CheckSquare },
    { name: "Incidents", href: "/incidents", icon: AlertTriangle },
    { name: "Office Logs", href: "/officelogs", icon: FileText },
    { name: "Repairs", href: "/repairs", icon: Wrench },
  ];

  const supportNav = [
    { name: "Support Plans", href: "/supportplans", icon: Heart },
    { name: "Weekly SW Docs", href: "/weeklyswdocs", icon: FileStack },
    { name: "Benefits", href: "/benefits", icon: Gift },
    { name: "Referrals", href: "/referrals", icon: ArrowRightLeft },
  ];

  const AllocatedResidentNav = [
    { name: "Support Plans", href: "/supportplans", icon: Heart },
    { name: "Benefits", href: "/benefits", icon: Gift },
  ];

  const complianceNav = [
    { name: "Service Charges", href: "/servicecharges", icon: PoundSterling },
    { name: "Compliance", href: "/compliance", icon: Shield },
    { name: "Documents", href: "/documents", icon: Folder },
  ];

  // Property/Landlord section
  const propertyLandlordNav = [
    { name: "Landlord Enquiries", href: "/landlordenquiries", icon: Users },
    { name: "Property Onboarding", href: "/propertyonboarding", icon: Building }
  ];

  // Administration section
  const adminNav = [
    { name: "Custom Sections", href: "/customsections", icon: Settings },
    //{ name: "Custom Sections detail", href: "/customsectiondetail", icon: Settings },
    { name: "Landlord Portal", href: "/landlordportal", icon: Settings },
    { name: "Settings", href: "/settings", icon: Settings },
    { name: "Deleted Entries", href: "/deletedentries", icon: Trash2 }
  ];

     const isActive = (href) => {
       if (href === '/dashboard' && pathname === '/') return true;
       return pathname?.toLowerCase() === href.toLowerCase();
     };

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
        <div className="h-16 flex-shrink-0 flex items-center justify-between px-6 border-b border-gray-200">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center shadow-sm overflow-hidden bg-gray-50 border border-gray-100">
              <img
                src="https://myhopehousing.org.uk/wp-content/uploads/2024/02/My-Hope-Housing-CIC.jpg"
                alt="My Hope Housing Logo"
                className="w-full h-full object-contain"
                style={{ width: '40px', height: '40px' }}
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
  {/* Allocated Residents */}
          <div>
            <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Allocated Residents
            </h3>
            <div className="space-y-1">
              {allocatedResidentsNav.map((item) => (
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
          {/* Allocated Residents */}
          
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
        <main className="flex-1 overflow-auto p-0">
          {children}
        </main>
      </div>
    </div>
  );
}
