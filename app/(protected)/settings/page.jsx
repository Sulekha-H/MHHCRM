"use client";

import { useUser } from "@clerk/nextjs";
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings as SettingsIcon, Users, List } from "lucide-react";

import StaffManagement_Supabase from "@/components/settings/StaffManagementSupabase";
import DropdownSettings_Supabase from "@/components/settings/DropDownSettingsSupabase";

export default function Settings() {
  const { user } = useUser();
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  const checkAccess = (user) => {
    // Allow access on localhost for development
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      return true;
    }
    
    if (!user?.email) return false;
    const authorizedUsers = ['amaani@myhopehousing.org.uk'];
    return authorizedUsers.includes(user.email.toLowerCase());
  };

  useEffect(() => {
    const loadUserAndCheckAccess = async () => {
      try {
        console.log("🔄 Loading user and checking access...");
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          console.log("✅ Auth user found:", user.email);
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('Email', user.email)
            .single();
          
          if (userError) {
            console.error("❌ Error fetching user data:", userError);
          } else {
            console.log("✅ User data loaded:", userData?.["Full Name"]);
            setCurrentUser(userData);
            setHasAccess(checkAccess(userData));
            console.log("🔐 Access granted:", checkAccess(userData));
          }
        } else {
          console.log("⚠️ No authenticated user");
          // Still check if we're on localhost
          setHasAccess(checkAccess(null));
        }
      } catch (error) {
        console.error("❌ Error loading user:", error);
        // Still check if we're on localhost
        setHasAccess(checkAccess(null));
      } finally {
        setLoading(false);
      }
    };
    loadUserAndCheckAccess();
  }, []);

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