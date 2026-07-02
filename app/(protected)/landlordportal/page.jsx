"use client";

import { useUser } from "@clerk/nextjs";
import React, { useState, useEffect, useCallback } from "react";
import { useClerkSupabaseClient } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Plus, Search, HandCoins, CheckCircle, PlusCircle, Download, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import BenefitLogForm_Supabase from "@/components/Benefits/BenefitLogForm";
import BenefitLogDetailModal from "@/components/Benefits/BenefitLogDetailModal";
import { logActivity, ACTIONS, ENTITIES } from "@/lib/activityUtils";
import { format, startOfWeek, addDays, addWeeks, isBefore, isAfter, isSameWeek } from "date-fns";

// Helper function to normalize Supabase data to snake_case for the modal/form
const normalizeLogData = (log) => {
  if (!log) return null;
  
  console.log("🔄 Normalizing log data:", log);
  
  const normalized = {
    id: log.ID || log.id,
    created_date: log["Created Date"] || log.created_date,
    updated_date: log["Updated Date"] || log.updated_date,
    created_by: log["Created By"] || log.created_by,
    resident_id: log["Resident ID"] || log.resident_id,
    benefit_type: log["Benefit Type"] || log.benefit_type,
    log_type: log["Log Type"] || log.log_type,
    title: log.Title || log.title,
    description: log.Description || log.description,
    log_date: log["Log Date"] || log.log_date,
    status: log.Status || log.status,
    amount: log.Amount || log.amount,
    application_date: log["Application Date"] || log.application_date,
    staff_member: log["Staff Member"] || log.staff_member,
    follow_up_action: log["Follow Up Action"] || log.follow_up_action,
    follow_up_completed: log["Follow Up Completed"] !== undefined ? log["Follow Up Completed"] : log.follow_up_completed,
    sanctions: log.Sanctions !== undefined ? log.Sanctions : log.sanctions,
    sanction_date: log["Sanction Date"] || log.sanction_date,
    sanction_amount: log["Sanction Amount"] || log.sanction_amount,
    date_resolved: log["Date Resolved"] || log.date_resolved,
    logged_by: log["Logged By"] || log.logged_by,
    notes: log.Notes || log.notes,
    deleted: log.Deleted !== undefined ? log.Deleted : log.deleted,
    deleted_date: log["Deleted Date"] || log.deleted_date,
    deleted_by: log["Deleted By"] || log.deleted_by
  };
  
  console.log("✅ Normalized log data:", normalized);
  return normalized;
};

export default function LandlordPortalSupabase() {
  const { user } = useUser();
  const supabase = useClerkSupabaseClient()
  const client = useClerkSupabaseClient();
  const [logs, setLogs] = useState([]);
  const [residents, setResidents] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingLog, setEditingLog] = useState(null);
  const [viewingLog, setViewingLog] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [logToDelete, setLogToDelete] = useState(null);
  const [users, setUsers] = useState([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const userEmail = user?.primaryEmailAddress?.emailAddress;
      let userData = null;
      
      if (userEmail) {
        const { data } = await supabase
          .from('users')
          .select('*')
          .eq('Email', userEmail)
          .single();
        userData = data;
      }

      const name = userData?.["Full Name"]?.trim()?.toLowerCase() || '';
      const testNames = ['tair', 'iveta lobinate', 'amit noach'];
      const isTestUser = testNames.includes(name) || name.includes('test');
      
      // Query from the dedicated 'landlord_portal' table
      const [
        { data: logsData, error: logsError },
        { data: residentsData, error: residentsError }
      ] = await Promise.all([
        supabase
          .from('landlord_portal')
          .select('*')
          .order('"Log Date"', { ascending: false }),
        supabase.from('residents').select('*')
      ]);
      
      if (logsError) {
        console.error("❌ Error loading logs:", logsError);
      } else {
        console.log("✅ Loaded logs from landlord_portal table:", logsData?.length || 0);
        if (logsData && logsData.length > 0) {
          console.log("📊 Sample log from DB:", logsData[0]);
        }
      }
      
      if (residentsError) {
        console.error("❌ Error loading residents:", residentsError);
      }
      
      setLogs(logsData || []);
      setResidents(residentsData || []);
      setCurrentUser(isTestUser ? null : userData);
    } catch (error) {
      console.error("❌ Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filterLogs = useCallback(() => {
    let filtered = logs;

    if (searchTerm) {
      filtered = filtered.filter(log =>
        log.Title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.Description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log["Staff Member"]?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredLogs(filtered);
  }, [logs, searchTerm]);

  useEffect(() => {
    filterLogs();
  }, [filterLogs]);

  const handleSubmit = async (logData) => {
    try {
      console.log("📤 Submitting log data:", logData);
      
      if (!logData["Logged By"] && currentUser) {
        logData["Logged By"] = currentUser["Full Name"];
      }
      
      // Ensure required fields
      if (!logData.ID) {
        logData.ID = crypto.randomUUID();
      }
      if (!logData["Created By"] && currentUser) {
        logData["Created By"] = currentUser.Email;
      }
      if (!logData["Created Date"]) {
        logData["Created Date"] = new Date().toISOString();
      }
      if (!logData["Updated Date"]) {
        logData["Updated Date"] = new Date().toISOString();
      }
      // Remove Deleted field - table has constraint preventing it
      delete logData["Deleted"];
      delete logData["Deleted Date"];
      delete logData["Deleted By"];
      
      console.log("📤 Final log data to save:", logData);
      
      if (editingLog && editingLog.ID) {
        const { error } = await supabase
          .from('landlord_portal')
          .update(logData)
          .eq('ID', editingLog.ID);
        
        if (error) {
          console.error("❌ Error updating log:", error);
          throw error;
        }

        await logActivity(supabase, {
          userName: user.fullName || user.username || "Unknown",
          userEmail: user.primaryEmailAddress?.emailAddress,
          actionType: ACTIONS.UPDATE,
          entityType: ENTITIES.BENEFIT,
          entityId: editingLog.ID,
          description: `Updated landlord portal check for ${format(new Date(logData["Log Date"]), 'dd/MM/yyyy')}`
        });

        console.log("✅ Updated log in landlord_portal table");
      } else {
        const { error } = await supabase
          .from('landlord_portal')
          .insert([logData]);
        
        if (error) {
          console.error("❌ Error creating log:", error);
          throw error;
        }

        await logActivity(supabase, {
          userName: user.fullName || user.username || "Unknown",
          userEmail: user.primaryEmailAddress?.emailAddress,
          actionType: ACTIONS.CREATE,
          entityType: ENTITIES.BENEFIT,
          entityId: logData.ID,
          description: `Logged new landlord portal check for ${format(new Date(logData["Log Date"]), 'dd/MM/yyyy')}`
        });

        console.log("✅ Created log in landlord_portal table");
      }
      
      setShowForm(false);
      setEditingLog(null);
      setViewingLog(null);
      await loadData();
    } catch (error) {
      console.error("❌ Error saving benefit log:", error);
      alert("Error saving log: " + error.message);
    }
  };

  const handleEdit = (log) => {
    console.log("🔧 Edit clicked - Raw log from DB:", log);
    
    setViewingLog(null);
    // Pass the raw Supabase log - the form will normalize it
    setEditingLog(log);
    setShowForm(true);
  };

  const handleViewDetails = (log) => {
    console.log("👁️ View details clicked - Raw log from DB:", log);
    
    setShowForm(false);
    setEditingLog(null);
    // Normalize the log for the modal
    setViewingLog(normalizeLogData(log));
  };

  const handleDelete = (log) => {
    setLogToDelete(log);
  };

  const confirmDelete = async () => {
    if (logToDelete) {
      try {
        const logId = logToDelete.ID || logToDelete.id;
        // Permanent delete - table has constraint on Deleted column
        const { error } = await supabase
          .from('landlord_portal')
          .delete()
          .eq('ID', logId);
        
        if (error) throw error;
        
        await logActivity(supabase, {
          userName: user.fullName || user.username || "Unknown",
          userEmail: user.primaryEmailAddress?.emailAddress,
          actionType: ACTIONS.DELETE,
          entityType: ENTITIES.BENEFIT,
          entityId: logId,
          description: `Permanently deleted landlord portal entry for ${format(new Date(logToDelete["Log Date"] || logToDelete.log_date), 'dd/MM/yyyy')}`
        });

        console.log(`✅ Landlord portal entry ${logId} permanently deleted.`);
        setLogToDelete(null);
        setViewingLog(null);
        loadData();
      } catch (error) {
        console.error("❌ Error deleting landlord portal entry:", error);
        alert("Error deleting entry: " + error.message);
      }
    }
  };

  const getResidentName = (residentId) => {
    if (!residentId) return "N/A";
    const resident = residents.find(r => r.ID === residentId);
    return resident ? `${resident["First Name"]} ${resident["Last Name"]}` : "Unknown";
  };

  const exportToCSV = () => {
    const formatDateTime = (dateString) => {
      if (!dateString) return null;
      try {
        return format(new Date(dateString), 'yyyy-MM-dd HH:mm:ss');
      } catch {
        return null;
      }
    };

    const formatDate = (dateString) => {
      if (!dateString) return null;
      try {
        return format(new Date(dateString), 'yyyy-MM-dd');
      } catch {
        return null;
      }
    };

    const formatBoolean = (value) => {
      if (value === true) return 'TRUE';
      if (value === false) return 'FALSE';
      return 'FALSE';
    };

    const formatStatus = (status) => {
      // Map any non-standard statuses to valid ones
      const validStatuses = [
        'No Updates Found',
        'Updates Found - Action Required',
        'Updates Found - In Progress',
        'Issue Found'
      ];
      
      // If status is already valid, return it
      if (validStatuses.includes(status)) return status;
      
      // Map common variations
      const statusLower = status?.toLowerCase() || '';
      if (statusLower.includes('completed') || statusLower.includes('complete')) {
        return 'No Updates Found';
      }
      if (statusLower.includes('pending') || statusLower.includes('progress')) {
        return 'Updates Found - In Progress';
      }
      if (statusLower.includes('issue') || statusLower.includes('error')) {
        return 'Issue Found';
      }
      if (statusLower.includes('action') || statusLower.includes('required')) {
        return 'Updates Found - Action Required';
      }
      
      // Default fallback
      return 'No Updates Found';
    };

    const headers = [
      "ID",
      "Created Date",
      "Updated Date",
      "Created By",
      "Resident ID",
      "Benefit Type",
      "Log Type",
      "Title",
      "Description",
      "Log Date",
      "Status",
      "Amount",
      "Application Date",
      "Staff Member",
      "Follow Up Action",
      "Follow Up Completed",
      "Sanctions",
      "Sanction Date",
      "Sanction Amount",
      "Date Resolved",
      "Logged By",
      "Deleted",
      "Deleted Date",
      "Deleted By"
    ];

    const formatBenefitType = (value) => {
      // Ensure Benefit Type is capitalized
      if (value === 'landlord_portal') return 'Landlord Portal';
      if (value === 'Landlord Portal') return 'Landlord Portal';
      return value || null;
    };

    const formatLogType = (value) => {
      // Ensure Log Type is capitalized
      if (value === 'portal_check') return 'Portal Check';
      if (value === 'Portal Check') return 'Portal Check';
      return value || null;
    };

    const rows = filteredLogs.map(log => [
      log.ID || null,
      formatDateTime(log["Created Date"]),
      formatDateTime(log["Updated Date"]),
      log["Created By"] || null,
      log["Resident ID"] || null,
      formatBenefitType(log["Benefit Type"]),
      formatLogType(log["Log Type"]),
      log.Title || null,
      log.Description || null,
      formatDateTime(log["Log Date"]),
      formatStatus(log.Status),
      log.Amount || null,
      formatDate(log["Application Date"]),
      log["Staff Member"] || null,
      log["Follow Up Action"] || null,
      formatBoolean(log["Follow Up Completed"]),
      formatBoolean(log.Sanctions),
      formatDate(log["Sanction Date"]),
      log["Sanction Amount"] || null,
      formatDate(log["Date Resolved"]),
      log["Logged By"] || null,
      formatBoolean(log.Deleted),
      formatDateTime(log["Deleted Date"]),
      log["Deleted By"] || null
    ]);

    const escapeCSV = (value) => {
      if (value === null || value === undefined) return '';
      if (typeof value === 'number') return String(value);
      if (value === 'TRUE' || value === 'FALSE') return value;
      if (value === '') return '';
      
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n') || stringValue.includes('\r')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      
      return stringValue;
    };

    const csvContent = [
      headers.map(h => `"${h}"`).join(','),
      ...rows.map(row => row.map(escapeCSV).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `landlord_portal_export_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    logActivity(supabase, {
      userName: user.fullName || user.username || "Unknown",
      userEmail: user.primaryEmailAddress?.emailAddress,
      actionType: ACTIONS.EXPORT,
      entityType: ENTITIES.BENEFIT,
      description: `Exported ${filteredLogs.length} landlord portal checks to CSV`
    });

    console.log("✅ Landlord Portal CSV export completed successfully");
  };

  const startDate = new Date('2026-01-05T00:00:00');
  const endDate = new Date('2026-12-31T23:59:59');

  const generateWeeks = (start, end) => {
    const weeks = [];
    let currentWeekStart = startOfWeek(start, { weekStartsOn: 1 });

    while (isBefore(currentWeekStart, end) || format(currentWeekStart, 'yyyy-MM-dd') === format(end, 'yyyy-MM-dd')) {
      const week = {
        weekCommencing: new Date(currentWeekStart),
        days: []
      };
      for (let i = 0; i < 5; i++) {
        const day = addDays(currentWeekStart, i);
        if (isAfter(day, end) && format(day, 'yyyy-MM-dd') !== format(end, 'yyyy-MM-dd')) {
          week.days.push(null);
        } else if (isBefore(day, start) && format(day, 'yyyy-MM-dd') !== format(start, 'yyyy-MM-dd')) {
          week.days.push(null);
        } else {
          week.days.push(day);
        }
      }
      weeks.push(week);
      currentWeekStart = addWeeks(currentWeekStart, 1);
    }
    return weeks;
  };

  const calendarWeeks = generateWeeks(startDate, endDate);

  const hasFollowUpNeeded = useCallback((log) => {
    return log["Follow Up Action"] && !log["Follow Up Completed"];
  }, []);

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Landlord Portal</h1>
          <p className="text-slate-600">Daily landlord portal checks and updates</p>
          {loading && <p className="text-xs text-slate-400 mt-1">Loading data...</p>}
          {!loading && <p className="text-xs text-slate-400 mt-1">{logs.length} checks loaded</p>}
        </div>
        <div className="flex gap-3">
          <Button
            onClick={exportToCSV}
            variant="outline"
            className="flex items-center gap-2"
            disabled={loading || filteredLogs.length === 0}
          >
            <Download className="w-4 h-4" />
            Export to CSV
          </Button>
          <Button
            onClick={() => setShowForm(true)}
            className="bg-purple-600 hover:bg-purple-700 shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Portal Check
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search portal checks by title, description, or staff member..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
        </CardContent>
      </Card>

      <Dialog open={showForm} onOpenChange={(open) => { if (!open) { setShowForm(false); setEditingLog(null); } }}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-0 sr-only">
            <DialogTitle>{editingLog ? 'Edit Portal Check' : 'Add Portal Check'}</DialogTitle>
            <DialogDescription>
              Enter the details for the landlord portal check below.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[90vh]">
            <div className="p-6">
              <BenefitLogForm_Supabase
                log={editingLog}
                residents={residents}
                currentUser={currentUser}
                activeBenefitType="landlord_portal"
                onSubmit={handleSubmit}
                onCancel={() => { setShowForm(false); setEditingLog(null); }}
                hideCard={true}
              />
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {viewingLog && (
        <BenefitLogDetailModal
          log={viewingLog}
          getResidentName={getResidentName}
          onClose={() => setViewingLog(null)}
          onEdit={(log) => {
            setViewingLog(null);
            // Find the original raw log from the list to pass to edit
            const rawLog = logs.find(l => (l.ID || l.id) === (log.id || log.ID));
            handleEdit(rawLog);
          }}
          onDelete={(log) => {
            // Find the original raw log from the list to pass to delete
            const rawLog = logs.find(l => (l.ID || l.id) === (log.id || log.ID));
            handleDelete(rawLog);
          }}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HandCoins className="w-5 h-5 text-purple-600" />
            Daily Landlord Portal Checks
          </CardTitle>
          <p className="text-slate-600">Log daily portal checks from 08/09/2025 to 31/12/2025. Click a cell to log or edit an entry.</p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>W/C</TableHead>
                  <TableHead className="text-center">Monday</TableHead>
                  <TableHead className="text-center">Tuesday</TableHead>
                  <TableHead className="text-center">Wednesday</TableHead>
                  <TableHead className="text-center">Thursday</TableHead>
                  <TableHead className="text-center">Friday</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {calendarWeeks.map((week) => {
                  const isCurrentWeek = isSameWeek(week.weekCommencing, new Date(), { weekStartsOn: 1 });
                  return (
                    <TableRow key={week.weekCommencing.toISOString()}>
                      <TableCell className={`font-medium ${isCurrentWeek ? 'bg-red-600 text-white font-bold' : ''}`}>
                        {format(week.weekCommencing, 'dd/MM/yyyy')}
                      </TableCell>
                    {week.days.map((day, index) => {
                      if (!day) {
                        return <TableCell key={index}></TableCell>;
                      }

                      const dayString = format(day, 'yyyy-MM-dd');
                      const logForDay = filteredLogs.find(log => 
                        format(new Date(log["Log Date"]), 'yyyy-MM-dd') === dayString
                      );
                      
                      const needsFollowUp = logForDay && hasFollowUpNeeded(logForDay);
                      
                      return (
                        <TableCell key={day.toISOString()} className="text-center p-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`w-full h-14 relative ${needsFollowUp ? 'border-2 border-orange-500 bg-orange-50' : ''}`}
                            onClick={() => {
                              if (logForDay) {
                                handleViewDetails(logForDay);
                              } else {
                                // Create a new log template with pre-filled date
                                const newLogTemplate = {
                                  "Benefit Type": 'landlord_portal',
                                  "Log Type": 'portal_check',
                                  "Log Date": new Date(day.setHours(12)).toISOString().slice(0, 16),
                                  "Staff Member": currentUser?.["Full Name"] || "",
                                  Status: 'No Updates Found',
                                  Title: `Portal Check - ${format(day, 'dd/MM/yyyy')}`,
                                  Description: ""
                                };
                                setEditingLog(newLogTemplate);
                                setShowForm(true);
                              }
                            }}
                          >
                            {logForDay ? (
                              <div className="flex flex-col items-center">
                                <CheckCircle className="w-5 h-5 text-green-500" />
                                <span className="text-xs text-slate-500 mt-1">{logForDay["Staff Member"]?.split(' ')[0]}</span>
                                {needsFollowUp && (
                                  <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full"></span>
                                )}
                              </div>
                            ) : (
                              <PlusCircle className="w-5 h-5 text-slate-400 hover:text-slate-600" />
                            )}
                          </Button>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                )})}
              </TableBody>
            </Table>

            {filteredLogs.length === 0 && !loading && (
              <div className="text-center py-8">
                <HandCoins className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">No landlord portal checks logged</h3>
                <p className="text-slate-500">Start by adding daily portal check entries.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!logToDelete} onOpenChange={(open) => !open && setLogToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Portal Check</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{logToDelete?.Title || logToDelete?.title}"? This action cannot be undone and will permanently remove all data associated with this landlord portal check entry.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete Check
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
