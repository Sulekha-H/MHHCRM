"use client"

import React, { useState, useEffect, useCallback } from "react";
import { useClerkSupabaseClient } from "@/lib/supabaseClient";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Plus,
  Search,
  ClipboardCheck,
  Calendar,
  Home,
  Filter,
  ChevronRight,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Eye
} from "lucide-react";
import ComplianceCheckForm from "@/components/compliance-checks/ComplianceCheckForm";
import ComplianceCheckDetailModal from "@/components/compliance-checks/ComplianceCheckDetailModal";
import { format, startOfWeek, endOfWeek, isWithinInterval, parseISO } from 'date-fns';
import { Input } from "@/components/ui/input";

export default function ComplianceChecksPage() {
  const supabase = useClerkSupabaseClient();
  const { user } = useUser();
  const [logs, setLogs] = useState([]);
  const [properties, setProperties] = useState([]);
  const [accommodations, setAccommodations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [editingLog, setEditingLog] = useState(null);
  const [selectedLog, setSelectedLog] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPropertyFilter, setSelectedPropertyFilter] = useState("all");

  const loadData = useCallback(async () => {
    if (!supabase) return;
    try {
      setLoading(true);
      const [logsRes, propertiesRes, accommodationsRes] = await Promise.all([
        supabase.from('compliance_checks').select('*').eq('Deleted', false).order('Week Ending Date', { ascending: false }),
        supabase.from('properties').select('*').or('Deleted.is.null,Deleted.eq.false').eq('Status', 'Active'),
        supabase.from('accommodations').select('*').or('Deleted.is.null,Deleted.eq.false')
      ]);

      if (logsRes.error) throw logsRes.error;
      if (propertiesRes.error) throw propertiesRes.error;
      if (accommodationsRes.error) throw accommodationsRes.error;

      setLogs(logsRes.data || []);
      setProperties(propertiesRes.data || []);
      setAccommodations(accommodationsRes.data || []);
    } catch (error) {
      console.error("Error loading compliance logs:", error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmit = async (supabaseData) => {
    try {
      const checks = supabaseData["Checks"] || supabaseData.checks || [];
      const updatedChecks = [...checks];

      // Process auto-logging repairs
      for (let i = 0; i < updatedChecks.length; i++) {
        const check = updatedChecks[i];

        // Only proceed if it's an issue and "Auto-Log" is checked
        // Note: we still check reported_on_repairs to maintain idempotency,
        // but the form now sets this to true by default for all issues.
        if (!check.no_issues && check.reported_on_repairs) {
          // Map compliance location to Repair Common Area format
          const locationMapping = {
            "Front Door": "Front Door",
            "Front of property (outside)": "Front Garden",
            "Downstairs hallway": "Hall Way",
            "Living room": "General Property",
            "Kitchen": "Communal Kitchen",
            "Communal bathroom": "Communal Bathroom",
            "Garden": "Back Garden"
          };

          const commonArea = (!check.is_room && !check.is_ensuite)
            ? (locationMapping[check.location] || "General Property")
            : null;

          const repairData = {
            Title: `Repair from Compliance Check: ${check.location}`,
            "Property ID": supabaseData["Property ID"],
            "Accommodation ID": check.room_id || null,
            "Common Area": commonArea,
            "Repair Type": "Other",
            Priority: check.priority || "Medium",
            Status: check.date_fixed ? "Completed" : "Reported",
            Description: check.issue_details,
            "Reported By": supabaseData["Logged By"],
            "Reported By Type": "Staff",
            "Logged By": supabaseData["Logged By"],
            "Logged Via": "Compliance Check",
            "Reported on Fiixit": "No",
            "Fiixit Updated": "No",
            "Reported Date": new Date().toISOString(),
            "Date Fixed": check.date_fixed ? new Date(check.date_fixed).toISOString() : null,
            "Updated Date": new Date().toISOString()
          };

          if (check.repair_id) {
            // Update existing repair
            const { error: updateError } = await supabase
              .from('repairs')
              .update(repairData)
              .eq('"ID"', check.repair_id);
            if (updateError) console.error("Error updating auto-logged repair:", updateError);
          } else {
            // Create new repair
            const newRepairId = crypto.randomUUID();
            repairData["ID"] = newRepairId;
            repairData["Created Date"] = new Date().toISOString();
            repairData["Created By"] = user?.primaryEmailAddress?.emailAddress || "System";

            const { error: insertError } = await supabase
              .from('repairs')
              .insert([repairData]);

            if (insertError) {
              console.error("Error creating auto-logged repair:", insertError);
            } else {
              updatedChecks[i].repair_id = newRepairId;
            }
          }
        } else if (check.no_issues && check.repair_id) {
          // If issue was cleared, we might want to cancel the repair?
          // For now, let's just leave it or mark as cancelled if that's desired.
          // User didn't specify, so we'll leave existing repairs alone to avoid accidental data loss.
        }
      }

      // Finalize data with updated repair IDs
      const finalData = { ...supabaseData, "Checks": updatedChecks };

      if (editingLog) {
        const { error } = await supabase.from('compliance_checks').update(finalData).eq('"ID"', editingLog.ID);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('compliance_checks').insert([finalData]);
        if (error) throw error;
      }
      setShowForm(false);
      setEditingLog(null);
      loadData();
    } catch (error) {
      console.error("Error saving compliance log:", error);
      alert("Error saving log: " + error.message);
    }
  };

  const handleDelete = async (log) => {
    if (window.confirm(`Are you sure you want to delete the log for ${log["Property Name"]} (Week Ending: ${log["Week Ending Date"]})?`)) {
      try {
        const { error } = await supabase.from('compliance_checks').update({ Deleted: true }).eq('"ID"', log.ID);
        if (error) throw error;
        loadData();
      } catch (error) {
        console.error("Error deleting log:", error);
      }
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch =
      log["Property Name"]?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log["Logged By"]?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProperty = selectedPropertyFilter === "all" || log["Property ID"] === selectedPropertyFilter;
    return matchesSearch && matchesProperty;
  });

  const getStatusBadge = (log) => {
    if (log["Weekly Check Not Completed"]) {
      return <Badge className="bg-red-100 text-red-800 border-red-200">Check Not Completed</Badge>;
    }

    const checks = log["Checks"] || [];
    const hasIssues = checks.some(c => !c.no_issues);

    if (hasIssues) {
      return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Issues Identified</Badge>;
    }
    return <Badge className="bg-green-100 text-green-800 border-green-200">All Clear</Badge>;
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12">
      <div className="bg-white border-b border-slate-200 mb-8">
        <div className="max-w-[1600px] mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 text-indigo-600 mb-1">
                <ClipboardCheck className="w-5 h-5" />
                <span className="text-sm font-semibold uppercase tracking-wider">Property Operations</span>
              </div>
              <h1 className="text-3xl font-bold text-slate-900">Weekly Compliance Logs</h1>
              <p className="text-slate-500 mt-1">Track and manage weekly property safety and maintenance checks</p>
            </div>
            <Button
              onClick={() => {
                setEditingLog(null);
                setShowForm(true);
              }}
              className="bg-indigo-600 hover:bg-indigo-700 shadow-md transition-all hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Weekly Log
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 space-y-6">
        {showForm ? (
          <div className="animate-in fade-in slide-in-from-top-4 duration-300">
            <ComplianceCheckForm
              log={editingLog}
              properties={properties}
              accommodations={accommodations}
              currentUser={{ full_name: user?.fullName, email: user?.primaryEmailAddress?.emailAddress }}
              onSubmit={handleSubmit}
              onCancel={() => {
                setShowForm(false);
                setEditingLog(null);
              }}
            />
          </div>
        ) : (
          <>
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder="Search by property or staff name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 h-11 border-slate-200"
                    />
                  </div>
                  <div className="w-full md:w-[250px]">
                    <Select value={selectedPropertyFilter} onValueChange={setSelectedPropertyFilter}>
                      <SelectTrigger className="h-11 border-slate-200">
                        <div className="flex items-center gap-2">
                          <Filter className="w-4 h-4 text-slate-400" />
                          <span>Filter Property</span>
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Properties</SelectItem>
                        {properties.map(p => (
                          <SelectItem key={p.ID} value={p.ID}>{p.Name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                <Clock className="w-12 h-12 animate-spin mb-4 opacity-20" />
                <p className="font-medium">Loading compliance logs...</p>
              </div>
            ) : filteredLogs.length === 0 ? (
              <Card className="border-dashed border-2 py-16 text-center bg-white/50">
                <CardContent>
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ClipboardCheck className="w-8 h-8 text-slate-300" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">No logs found</h3>
                  <p className="text-slate-500 max-w-sm mx-auto mt-1">
                    {searchTerm || selectedPropertyFilter !== "all"
                      ? "No records match your current filters. Try adjusting them."
                      : "Start tracking weekly property compliance by creating your first log entry."}
                  </p>
                  {!searchTerm && selectedPropertyFilter === "all" && (
                    <Button
                      variant="outline"
                      className="mt-6"
                      onClick={() => setShowForm(true)}
                    >
                      <Plus className="w-4 h-4 mr-2" /> Create First Log
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredLogs.map((log) => (
                  <Card
                    key={log.ID}
                    className={`group hover:shadow-lg transition-all duration-300 border-slate-200 overflow-hidden ${log["Weekly Check Not Completed"] ? 'bg-red-50/50 border-red-200' : 'bg-white'}`}
                  >
                    <div className={`h-1.5 w-full ${log["Weekly Check Not Completed"] ? 'bg-red-500' : log["Checks"]?.some(c => !c.no_issues) ? 'bg-amber-400' : 'bg-green-400'}`} />
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start mb-2">
                        {getStatusBadge(log)}
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-indigo-600"
                            onClick={() => {
                              setSelectedLog(log);
                              setShowDetail(true);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-indigo-600"
                            onClick={() => {
                              setEditingLog(log);
                              setShowForm(true);
                            }}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-red-600"
                            onClick={() => handleDelete(log)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <CardTitle className="text-xl font-bold text-slate-900 line-clamp-1">
                        {log["Property Name"]}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Week Ending</span>
                          <div className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            {log["Week Ending Date"] ? format(parseISO(log["Week Ending Date"]), 'MMM d, yyyy') : 'N/A'}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Logged By</span>
                          <div className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                            <div className="w-5 h-5 bg-indigo-50 rounded-full flex items-center justify-center">
                              <span className="text-[10px] text-indigo-600 font-bold">{log["Logged By"]?.[0]?.toUpperCase()}</span>
                            </div>
                            <span className="truncate">{log["Logged By"]}</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-100">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-slate-500">Check Summary</span>
                          <span className="text-xs font-bold text-slate-900">
                            {log["Checks"]?.filter(c => c.no_issues).length} / {log["Checks"]?.length} OK
                          </span>
                        </div>
                        <div className="flex gap-1">
                          {log["Checks"]?.map((check, idx) => (
                            <div
                              key={idx}
                              title={check.location}
                              className={`h-1.5 flex-1 rounded-full ${check.no_issues ? 'bg-green-100' : 'bg-red-400'}`}
                            />
                          ))}
                        </div>
                      </div>

                      {log["Materials Required"] && (
                        <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Purchases Required</span>
                          <p className="text-xs text-slate-600 line-clamp-2">{log["Materials Required"]}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <ComplianceCheckDetailModal
        log={selectedLog}
        isOpen={showDetail}
        onClose={() => {
          setShowDetail(false);
          setSelectedLog(null);
        }}
      />
    </div>
  );
}
