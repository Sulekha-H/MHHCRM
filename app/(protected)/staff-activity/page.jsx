"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { useClerkSupabaseClient } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, History, Filter, Download, User as UserIcon, Calendar as CalendarIcon, ShieldAlert, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { ACTIONS, ENTITIES, logActivity } from "@/lib/activityUtils";
import { cn } from "@/lib/utils";
import { isAdmin } from "@/lib/permissions";

export default function StaffActivityPage() {
  const { user } = useUser();
  const supabase = useClerkSupabaseClient();
  const [activities, setActivities] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [entityFilter, setEntityFilter] = useState("all");
  const [userFilter, setUserFilter] = useState("all");
  const [uniqueUsers, setUniqueUsers] = useState([]);

  const isAuthorized = useCallback(() => {
    return isAdmin(user);
  }, [user]);

  const [error, setError] = useState(null);

  const loadActivities = useCallback(async () => {
    if (!supabase || !isAuthorized()) {
      console.log("Staff Activity: Not authorized or Supabase not ready", {
        hasSupabase: !!supabase,
        isAuthorized: isAuthorized(),
        email: user?.primaryEmailAddress?.emailAddress
      });
      return;
    }

    setLoading(true);
    setError(null);
    try {
      console.log("Staff Activity: Fetching logs...");

      const { data, error: fetchError, count } = await supabase
        .from('staff_activity')
        .select('*', { count: 'exact' })
        .order('"Date Time"', { ascending: false });

      if (fetchError) {
        console.error("Staff Activity: Supabase fetch error:", fetchError);
        setError(`Failed to fetch logs: ${fetchError.message}`);

        // Try without ordering as a fallback
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('staff_activity')
          .select('*');

        if (fallbackError) {
          console.error("Staff Activity: Fallback fetch also failed:", fallbackError);
        } else {
          console.log("Staff Activity: Fallback fetch succeeded, ordering might be the issue.", fallbackData?.length);
          setActivities(fallbackData || []);

          // Extract unique users for filtering
          const users = [...new Set((fallbackData || []).map(a => a["User Name"] || a["User Email"]))].filter(Boolean).sort();
          setUniqueUsers(users);

          setError(null);
          return;
        }
        throw fetchError;
      }

      console.log(`Staff Activity: Successfully retrieved ${data?.length || 0} records. Total count: ${count}`);
      setActivities(data || []);

      // Extract unique users for filtering
      const users = [...new Set((data || []).map(a => a["User Name"] || a["User Email"]))].filter(Boolean).sort();
      setUniqueUsers(users);
    } catch (err) {
      console.error("Error loading activities:", err);
    } finally {
      setLoading(false);
    }
  }, [supabase, isAuthorized, user]);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  useEffect(() => {
    let filtered = [...activities];

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(a =>
        (a.Description || "").toLowerCase().includes(search) ||
        (a["User Name"] || "").toLowerCase().includes(search) ||
        (a["User Email"] || "").toLowerCase().includes(search) ||
        (a["Entity Type"] || "").toLowerCase().includes(search)
      );
    }

    if (actionFilter !== "all") {
      filtered = filtered.filter(a => a["Action Type"] === actionFilter);
    }

    if (entityFilter !== "all") {
      filtered = filtered.filter(a => a["Entity Type"] === entityFilter);
    }

    if (userFilter !== "all") {
      filtered = filtered.filter(a => (a["User Name"] || a["User Email"]) === userFilter);
    }

    setFilteredActivities(filtered);
  }, [activities, searchTerm, actionFilter, entityFilter, userFilter]);

  const exportToCSV = () => {
    const headers = ["Date Time", "User", "Action", "Entity", "Description"];
    const rows = filteredActivities.map(a => {
      let formattedDate = "";
      try {
        formattedDate = a["Date Time"] ? format(new Date(a["Date Time"]), 'yyyy-MM-dd HH:mm:ss') : "N/A";
      } catch (e) {
        formattedDate = "Invalid Date";
      }

      return [
        formattedDate,
        a["User Name"] || a["User Email"] || "Unknown",
        a["Action Type"],
        a["Entity Type"] || "N/A",
        a.Description || ""
      ];
    });

    const escape = (v) => {
      const s = String(v ?? "");
      return (s.includes(',') || s.includes('"') || s.includes('\n')) ? `"${s.replace(/"/g, '""')}"` : s;
    };

    const csvContent = [
      headers.map(escape).join(','),
      ...rows.map(row => row.map(escape).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `staff_activity_export_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    // Log activity
    logActivity(supabase, {
      userName: user.fullName || user.username || "Unknown",
      userEmail: user.primaryEmailAddress?.emailAddress,
      actionType: ACTIONS.EXPORT,
      entityType: ENTITIES.OFFICE_LOG,
      description: `Exported staff activity logs to CSV`
    });

    link.click();
  };

  if (!isAuthorized()) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
          <ShieldAlert className="w-10 h-10 text-red-600" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Access Denied</h1>
        <p className="text-slate-600 max-w-md">
          You do not have permission to view the Staff Activity logs. This page is restricted to administrators only.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
            <History className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Staff Activity</h1>
            <p className="text-sm text-slate-600">Monitor system changes, logs made, and staff logins</p>
          </div>
        </div>
        <Button
          onClick={exportToCSV}
          variant="outline"
          className="flex items-center gap-2"
          disabled={loading || filteredActivities.length === 0}
        >
          <Download className="w-4 h-4" />
          Export to CSV
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search activity..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger>
                <Filter className="w-4 h-4 mr-2 text-slate-400" />
                <SelectValue placeholder="All Actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {Object.values(ACTIONS).map(action => (
                  <SelectItem key={action} value={action}>{action}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={entityFilter} onValueChange={setEntityFilter}>
              <SelectTrigger>
                <Filter className="w-4 h-4 mr-2 text-slate-400" />
                <SelectValue placeholder="All Entities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Entities</SelectItem>
                {Object.values(ENTITIES).map(entity => (
                  <SelectItem key={entity} value={entity}>{entity}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={userFilter} onValueChange={setUserFilter}>
              <SelectTrigger>
                <UserIcon className="w-4 h-4 mr-2 text-slate-400" />
                <SelectValue placeholder="All Staff" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Staff</SelectItem>
                {uniqueUsers.map(u => (
                  <SelectItem key={u} value={u}>{u}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Date & Time</TableHead>
                  <TableHead className="w-[150px]">Staff Member</TableHead>
                  <TableHead className="w-[120px]">Action</TableHead>
                  <TableHead className="w-[120px]">Entity</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-slate-500">
                      <div className="flex flex-col items-center gap-2">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                        <span>Loading staff activity...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-red-500">
                      <div className="flex flex-col items-center gap-2">
                        <AlertTriangle className="w-8 h-8" />
                        <span className="font-semibold">Error Loading Activity</span>
                        <p className="text-sm max-w-md mx-auto">{error}</p>
                        <Button variant="outline" size="sm" onClick={loadActivities} className="mt-2">
                          Retry
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredActivities.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-slate-500 italic">
                      {activities.length === 0
                        ? "No activity has been logged yet."
                        : "No activity found matching your filters."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredActivities.map((activity) => (
                    <TableRow key={activity.ID}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span className="text-sm">
                            {activity["Date Time"] ? (
                              (() => {
                                try {
                                  return format(new Date(activity["Date Time"]), 'dd MMM yyyy');
                                } catch (e) {
                                  return 'Invalid Date';
                                }
                              })()
                            ) : 'N/A'}
                          </span>
                          <span className="text-xs text-slate-500">
                            {activity["Date Time"] ? (
                              (() => {
                                try {
                                  return format(new Date(activity["Date Time"]), 'HH:mm:ss');
                                } catch (e) {
                                  return '';
                                }
                              })()
                            ) : ''}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">{activity["User Name"] || "Unknown"}</span>
                          <span className="text-[10px] text-slate-500 truncate max-w-[140px]">{activity["User Email"]}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          activity["Action Type"] === ACTIONS.DELETE ? "destructive" :
                          activity["Action Type"] === ACTIONS.UPDATE ? "default" :
                          activity["Action Type"] === ACTIONS.LOGIN ? "outline" : "secondary"
                        } className={cn(
                          "capitalize",
                          activity["Action Type"] === ACTIONS.CREATE && "bg-green-100 text-green-800 border-green-200"
                        )}>
                          {activity["Action Type"]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium text-slate-600">{activity["Entity Type"] || "-"}</span>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-slate-700">{activity.Description}</p>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
