"use client";

import { useUser } from "@clerk/nextjs";
import React, { useState, useEffect } from "react";
import { useClerkSupabaseClient } from "@/lib/supabaseClient";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings as SettingsIcon, Users, List } from "lucide-react";

import StaffManagement_Supabase from "@/components/settings/StaffManagementSupabase";
import DropdownSettings_Supabase from "@/components/settings/DropDownSettingsSupabase";

export default function Settings() {
  const { user } = useUser();
  const client = useClerkSupabaseClient();
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  const checkAccess = (clerkUser) => {
    // Allow access on localhost for development
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      return true;
    }
    
    const email = clerkUser?.emailAddresses?.[0]?.emailAddress?.toLowerCase();
    if (!email) return false;

    const authorizedUsers = ['amaani@myhopehousing.org.uk'];
    return authorizedUsers.includes(email);
  };

  useEffect(() => {
    const loadUserAndCheckAccess = async () => {
      if (!user) {
        if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
          setHasAccess(true);
        } else {
          setHasAccess(false);
        }
        setLoading(false);
        return;
      }

      try {
        console.log("🔄 Checking access for Clerk user:", user.primaryEmailAddress?.emailAddress);

        // Match Clerk user with Supabase users table if needed for other data
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('Email', user.primaryEmailAddress?.emailAddress)
          .single();
        
        if (userError) {
          console.warn("⚠️ User data not found in Supabase users table:", userError.message);
        } else {
          console.log("✅ Supabase user data loaded:", userData?.["Full Name"]);
          setCurrentUser(userData);
        }

        const access = checkAccess(user);
        setHasAccess(access);
        console.log("🔐 Access granted:", access);

      } catch (error) {
        console.error("❌ Error loading user access:", error);
      } finally {
        setLoading(false);
      }
    };

    loadUserAndCheckAccess();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-slate-600">Verifying access...</div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-6">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <SettingsIcon className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Access Restricted</h2>
            <p className="text-slate-600">
              You do not have permission to view the Settings page.
            </p>
            {currentUser && (
              <p className="text-xs text-slate-400 mt-2">Logged in as: {currentUser.Email}</p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Settings</h1>
          <p className="text-slate-600">Manage application-wide configurations and master data</p>
          {currentUser && (
            <p className="text-xs text-slate-400 mt-1">Logged in as: {currentUser.Email}</p>
          )}
        </div>
      </div>

      <Tabs defaultValue="staff" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
          <TabsTrigger value="staff">
            <Users className="w-4 h-4 mr-2" /> Staff Management
          </TabsTrigger>
          <TabsTrigger value="dropdowns">
            <List className="w-4 h-4 mr-2" /> Dropdown Fields
          </TabsTrigger>
        </TabsList>
        <TabsContent value="staff" className="mt-4">
          <StaffManagement_Supabase currentUser={currentUser} />
        </TabsContent>
        <TabsContent value="dropdowns" className="mt-4">
          <DropdownSettings_Supabase currentUser={currentUser} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
