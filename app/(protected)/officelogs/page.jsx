
"use client"
import { useUser } from "@clerk/nextjs";
import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, FileText, Download, CheckCircle, AlertCircle, Timer } from "lucide-react";
import { format } from "date-fns";
import OfficeLogForm from "@/components/office-logs/OfficeLogForm";
import OfficeLogCard from "@/components/office-logs/OfficeLogCard";

export default function OfficeLogsSupabase() {
  const { user } = useUser();
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingLog, setEditingLog] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [activeStatusTab, setActiveStatusTab] = useState("all_status");
  const [sortOrder, setSortOrder] = useState("newest");
  const [users, setUsers] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const filterLogs = useCallback(() => {
    let filtered = logs;

    // Filter by status tab - Handle both PostgreSQL format (with spaces) and base44 format
    if (activeStatusTab !== "all_status") {
      filtered = filtered.filter(log => {
        const status = (log["Status"] || log.status || "").toString().trim().toLowerCase().replace(/ /g, '_');
        const compareStatus = activeStatusTab.toLowerCase().replace(/ /g, '_');
        return status === compareStatus;
      });
    }

    // Filter by log type/tab - Handle both PostgreSQL format (with spaces) and base44 format
    if (activeTab !== "all") {
      filtered = filtered.filter(log => {
        const logType = (log["Log Type"] || log.log_type || "").toString().trim().toLowerCase().replace(/ /g, '_');
        const compareType = activeTab.toLowerCase().replace(/ /g, '_');
        return logType === compareType;
      });
    }

    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(log => {
        const title = (log["Title"] || log.title || "").toLowerCase();
        const description = (log["Description"] || log.description || "").toLowerCase();
        const personInvolved = (log["Person Involved"] || log.person_involved || "").toLowerCase();
        const staffMember = (log["Staff Member"] || log.staff_member || "").toLowerCase();
        
        return title.includes(searchLower) ||
               description.includes(searchLower) ||
               personInvolved.includes(searchLower) ||
               staffMember.includes(searchLower);
      });
    }

    // Sort by date
    filtered = [...filtered].sort((a, b) => {
      const dateA = new Date(a["Date Time"] || a.date_time);
      const dateB = new Date(b["Date Time"] || b.date_time);
      
      if (sortOrder === "newest") {
        return dateB.getTime() - dateA.getTime();
      } else {
        return dateA.getTime() - dateB.getTime();
      }
    });

    setFilteredLogs(filtered);
  }, [logs, searchTerm, activeTab, activeStatusTab, sortOrder]);

  useEffect(() => {
    filterLogs();
  }, [filterLogs]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load current user
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('email', authUser.email)
          .single();
        
        const isTestUser = (userData?.full_name && 
          (['tair', 'iveta lobinate', 'amit noach'].includes(userData.full_name.trim().toLowerCase()) || 
           userData.full_name.trim().toLowerCase().includes('test'))
        );
        
        setUser(isTestUser ? null : userData);
      }

      // Load office logs - using PostgreSQL column names with spaces, filter out deleted
      const { data: logsData, error: logsError } = await supabase
        .from('office_logs')
        .select('*')
        .or('Deleted.is.null,Deleted.eq.false')
        .order('"Date Time"', { ascending: false });

      if (logsError) throw logsError;
      console.log(`✅ Loaded ${logsData?.length || 0} office logs from Supabase`);

      // Load users
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*');

      if (usersError) throw usersError;

      const activeUsers = usersData.filter(u => {
        const name = u?.full_name?.trim().toLowerCase() || u?.["Full Name"]?.trim().toLowerCase() || '';
        const excludeNames = ['tair', 'iveta lobinate', 'iveta lobinaite', 'amit noach', 'pilar'];
        return u.is_active !== false && !excludeNames.includes(name) && !name.includes('test');
      });

      setLogs(logsData || []);
      setUsers(activeUsers);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (logData) => {
    try {
      if (!logData.staff_member) {
        logData.staff_member = user?.full_name || 'Unknown';
      }

      // Transform form values to match Supabase check constraints
      const transformLogType = (type) => {
        const typeMap = {
          'enquiry': 'Enquiry',
          'office_order_purchase': 'Office Order Purchase',
          'visitor': 'Visitor',
          'phone_call': 'Phone Call',
          'maintenance': 'Maintenance',
          'delivery': 'Delivery',
          'meeting': 'Meeting',
          'appliance_purchase': 'Appliance Purchase',
          'window_cleaning': 'Window Cleaning',
          'general': 'General'
        };
        return typeMap[type] || type;
      };

      const transformPriority = (priority) => {
        const priorityMap = {
          'low': 'Low',
          'normal': 'Normal',
          'high': 'High',
          'urgent': 'Urgent'
        };
        return priorityMap[priority] || priority;
      };

      const transformStatus = (status) => {
        const statusMap = {
          'pending': 'Pending',
          'in_progress': 'In Progress',
          'completed': 'Completed'
        };
        return statusMap[status] || status;
      };

      // Convert to PostgreSQL format with proper capitalization
      const formattedLogData = {
        "Log Type": transformLogType(logData.log_type),
        "Title": logData.title,
        "Description": logData.description,
        "Date Time": logData.date_time,
        "Person Involved": logData.person_involved,
        "Staff Member": logData.staff_member,
        "Priority": transformPriority(logData.priority),
        "Action Required": logData.action_required,
        "Action Due Date": logData.action_due_date,
        "Status": transformStatus(logData.status),
        "Follow-up By User ID": logData.follow_up_by_user_id,
        "Follow-up Completed": logData.follow_up_completed,
        "Follow-up Comments": logData.follow_up_comments
      };

      if (!editingLog) {
        formattedLogData["ID"] = crypto.randomUUID();
      }
      
      console.log("📝 Submitting log data:", formattedLogData);

      if (editingLog) {
        const { error } = await supabase
          .from('office_logs')
          .update(formattedLogData)
          .eq('"ID"', editingLog["ID"] || editingLog.id);
        
        if (error) throw error;
        console.log("✅ Office log updated successfully");
      } else {
        // Add ID for new logs
        if (logData.ID) {
          formattedLogData.ID = logData.ID;
        }
        
        const { error } = await supabase
          .from('office_logs')
          .insert([formattedLogData]);
        
        if (error) throw error;
        console.log("✅ Office log created successfully");
      }
      
      setShowForm(false);
      setEditingLog(null);
      loadData();
    } catch (error) {
      console.error("Error saving log:", error);
      alert("Error saving office log: " + error.message);
    }
  };

  const handleEdit = (log) => {
    // Convert PostgreSQL format to form format (lowercase with underscores)
    const formattedLog = {
      id: log["ID"] || log.id,
      log_type: log["Log Type"] || log.log_type,
      title: log["Title"] || log.title,
      description: log["Description"] || log.description,
      date_time: log["Date Time"] || log.date_time,
      person_involved: log["Person Involved"] || log.person_involved,
      staff_member: log["Staff Member"] || log.staff_member,
      priority: log["Priority"] || log.priority,
      action_required: log["Action Required"] || log.action_required,
      action_due_date: log["Action Due Date"] || log.action_due_date,
      status: log["Status"] || log.status,
      follow_up_by_user_id: log["Follow-up By User ID"] || log.follow_up_by_user_id,
      follow_up_completed: log["Follow-up Completed"] || log.follow_up_completed,
      follow_up_comments: log["Follow-up Comments"] || log.follow_up_comments
    };
    
    setEditingLog(formattedLog);
    setShowForm(true);
  };

  const handleDelete = async (log) => {
    const logTitle = log["Title"] || log.title;
    if (window.confirm(`Are you sure you want to delete "${logTitle}"?`)) {
      try {
        const { error } = await supabase
          .from('office_logs')
          .update({
            "Deleted": true,
            "Deleted Date": new Date().toISOString(),
            "Deleted By": user?.email || user?.Email || "Unknown"
          })
          .eq('"ID"', log["ID"] || log.id);

        if (error) throw error;
        
        console.log(`Office log ${log["ID"] || log.id} soft deleted successfully.`);
        await loadData();
      } catch (error) {
        console.error("Error deleting office log:", error);
        alert("Error deleting office log: " + error.message);
      }
    }
  };

  const exportToCSV = () => {
    const formatDate = (dateString) => {
      if (!dateString) return "";
      try {
        return format(new Date(dateString), 'yyyy-MM-dd');
      } catch {
        return dateString;
      }
    };

    const formatDateTime = (dateString) => {
      if (!dateString) return "";
      try {
        return format(new Date(dateString), 'yyyy-MM-dd HH:mm:ss');
      } catch {
        return dateString;
      }
    };

    // Transform log_type for Supabase format
    const formatLogType = (type) => {
      const typeMap = {
        'enquiry': 'Enquiry',
        'office_order_purchase': 'Office Order Purchase',
        'visitor': 'Visitor',
        'phone_call': 'Phone Call',
        'maintenance': 'Maintenance',
        'delivery': 'Delivery',
        'meeting': 'Meeting',
        'appliance_purchase': 'Appliance Purchase',
        'window_cleaning': 'Window Cleaning',
        'general': 'General'
      };
      return typeMap[type] || type;
    };

    // Transform priority for Supabase format
    const formatPriority = (priority) => {
      const priorityMap = {
        'low': 'Low',
        'normal': 'Normal',
        'high': 'High',
        'urgent': 'Urgent'
      };
      return priorityMap[priority] || priority;
    };

    // Transform status for Supabase format
    const formatStatus = (status) => {
      const statusMap = {
        'pending': 'Pending',
        'in_progress': 'In Progress',
        'completed': 'Completed'
      };
      return statusMap[status] || status;
    };

    const headers = [
      "ID",
      "Log Type",
      "Title",
      "Description",
      "Date Time",
      "Person Involved",
      "Staff Member",
      "Priority",
      "Action Required",
      "Action Due Date",
      "Status",
      "Follow-up By User ID",
      "Follow-up Completed",
      "Follow-up Comments",
      "Created Date",
      "Updated Date",
      "Created By",
      "Deleted",
      "Deleted Date",
      "Deleted By"
    ];

    const rows = filteredLogs.map(log => [
      log["ID"] || log.id || "",
      formatLogType(log["Log Type"] || log.log_type),
      log["Title"] || log.title || "",
      log["Description"] || log.description || "",
      formatDateTime(log["Date Time"] || log.date_time),
      log["Person Involved"] || log.person_involved || "",
      log["Staff Member"] || log.staff_member || "",
      formatPriority(log["Priority"] || log.priority),
      (log["Action Required"] || log.action_required) ? "Yes" : "No",
      formatDate(log["Action Due Date"] || log.action_due_date),
      formatStatus(log["Status"] || log.status),
      log["Follow-up By User ID"] || log.follow_up_by_user_id || "",
      (log["Follow-up Completed"] || log.follow_up_completed) ? "Yes" : "No",
      log["Follow-up Comments"] || log.follow_up_comments || "",
      formatDateTime(log["Created Date"] || log.created_date),
      formatDateTime(log["Updated Date"] || log.updated_date),
      log["Created By"] || log.created_by || "",
      (log["Deleted"] || log.deleted) ? "Yes" : "No",
      formatDateTime(log["Deleted Date"] || log.deleted_date),
      log["Deleted By"] || log.deleted_by || ""
    ]);

    const escapeCSV = (value) => {
      if (value === null || value === undefined) return '';
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    const csvContent = [
      headers.map(escapeCSV).join(','),
      ...rows.map(row => row.map(escapeCSV).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `office_logs_export_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: "bg-green-100 text-green-800 border-green-200",
      normal: "bg-blue-100 text-blue-800 border-blue-200",
      high: "bg-orange-100 text-orange-800 border-orange-200",
      urgent: "bg-red-100 text-red-800 border-red-200"
    };
    return colors[priority?.toLowerCase()] || colors.normal;
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      in_progress: "bg-blue-100 text-blue-800 border-blue-200",
      completed: "bg-green-100 text-green-800 border-green-200"
    };
    return colors[status?.toLowerCase().replace(/ /g, '_')] || colors.completed;
  };

  const getStatusCounts = () => {
    console.log("🔍 Calculating status counts, total logs:", logs.length);
    
    const pendingLogs = logs.filter(log => {
      const status = (log["Status"] || log.status || "").toString().trim().toLowerCase().replace(/ /g, '_');
      const isPending = status === 'pending';
      if (isPending) {
        console.log("✅ Found pending log:", log.ID || log.id, "Status:", log["Status"] || log.status);
      }
      return isPending;
    });

    const inProgressLogs = logs.filter(log => {
      const status = (log["Status"] || log.status || "").toString().trim().toLowerCase().replace(/ /g, '_');
      const isInProgress = status === 'in_progress';
      if (isInProgress) {
        console.log("✅ Found in_progress log:", log.ID || log.id, "Status:", log["Status"] || log.status);
      }
      return isInProgress;
    });

    const completedLogs = logs.filter(log => {
      const status = (log["Status"] || log.status || "").toString().trim().toLowerCase().replace(/ /g, '_');
      const isCompleted = status === 'completed';
      if (isCompleted) {
        console.log("✅ Found completed log:", log.ID || log.id, "Status:", log["Status"] || log.status);
      }
      return isCompleted;
    });

    // Log any logs that don't match any status
    const unmatchedLogs = logs.filter(log => {
      const status = (log["Status"] || log.status || "").toString().trim().toLowerCase().replace(/ /g, '_');
      return status !== 'pending' && status !== 'in_progress' && status !== 'completed';
    });

    if (unmatchedLogs.length > 0) {
      console.warn("⚠️ Found logs with unmatched status:", unmatchedLogs.map(log => ({
        id: log.ID || log.id,
        rawStatus: log["Status"] || log.status,
        normalizedStatus: (log["Status"] || log.status || "").toString().trim().toLowerCase().replace(/ /g, '_')
      })));
    }

    console.log("📊 Status counts - Pending:", pendingLogs.length, "In Progress:", inProgressLogs.length, "Completed:", completedLogs.length);

    return {
      pending: pendingLogs.length,
      in_progress: inProgressLogs.length,
      completed: completedLogs.length
    };
  };

  const statusCounts = getStatusCounts();

  // Group logs by log_type within the filtered results
  const groupedLogs = filteredLogs.reduce((acc, log) => {
    const type = (log["Log Type"] || log.log_type || 'general').toString().trim().toLowerCase().replace(/ /g, '_');
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(log);
    return acc;
  }, {});

  const logTypeLabels = {
    enquiry: "Enquiries",
    office_order_purchase: "Office Orders & Purchases",
    visitor: "Visitors",
    phone_call: "Phone Calls",
    maintenance: "Maintenance",
    delivery: "Deliveries",
    meeting: "Meetings",
    appliance_purchase: "Appliance Purchases",
    window_cleaning: "Window Cleaning",
    general: "General Logs"
  };

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-slate-900">Office Logs</h1>
          <p className="text-lg text-slate-600">Track and manage daily office activities and events</p>
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
            className="bg-purple-600 hover:bg-purple-700 shadow-lg px-6 py-3 text-base font-medium"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Log Entry
          </Button>
        </div>
      </div>

      {/* Status Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveStatusTab('pending')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-700">Pending</p>
                <p className="text-3xl font-bold text-yellow-900 mt-1">{statusCounts.pending}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-200 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-yellow-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveStatusTab('in_progress')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">In Progress</p>
                <p className="text-3xl font-bold text-blue-900 mt-1">{statusCounts.in_progress}</p>
              </div>
              <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center">
                <Timer className="w-6 h-6 text-blue-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveStatusTab('completed')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Completed</p>
                <p className="text-3xl font-bold text-green-900 mt-1">{statusCounts.completed}</p>
              </div>
              <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Sort Section */}
      <Card className="shadow-sm">
        <CardContent className="p-8">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-900">Search and Sort Logs</h2>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-4 w-5 h-5 text-slate-400" />
                <Input
                  placeholder="Search logs by title, description, person, or staff member..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 py-3 text-base"
                />
              </div>
              <div className="w-full md:w-48">
                <Select value={sortOrder} onValueChange={setSortOrder}>
                  <SelectTrigger className="py-3">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Tabs */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-slate-900">Filter by Status</h2>
        <Tabs value={activeStatusTab} onValueChange={setActiveStatusTab}>
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4">
            <TabsTrigger value="all_status">All Logs</TabsTrigger>
            <TabsTrigger value="pending">Pending ({statusCounts.pending})</TabsTrigger>
            <TabsTrigger value="in_progress">In Progress ({statusCounts.in_progress})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({statusCounts.completed})</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Log Type Tabs */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-slate-900">Filter by Type</h2>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex h-auto flex-wrap justify-start gap-1 p-1">
            <TabsTrigger value="all" className="px-4 py-2 text-sm font-medium">All Types</TabsTrigger>
            <TabsTrigger value="enquiry" className="px-4 py-2 text-sm font-medium">Enquiries</TabsTrigger>
            <TabsTrigger value="office_order_purchase" className="px-4 py-2 text-sm font-medium">Office Orders</TabsTrigger>
            <TabsTrigger value="visitor" className="px-4 py-2 text-sm font-medium">Visitors</TabsTrigger>
            <TabsTrigger value="phone_call" className="px-4 py-2 text-sm font-medium">Calls</TabsTrigger>
            <TabsTrigger value="maintenance" className="px-4 py-2 text-sm font-medium">Maintenance</TabsTrigger>
            <TabsTrigger value="delivery" className="px-4 py-2 text-sm font-medium">Deliveries</TabsTrigger>
            <TabsTrigger value="meeting" className="px-4 py-2 text-sm font-medium">Meetings</TabsTrigger>
            <TabsTrigger value="appliance_purchase" className="px-4 py-2 text-sm font-medium">Appliances</TabsTrigger>
            <TabsTrigger value="window_cleaning" className="px-4 py-2 text-sm font-medium">Window Cleaning</TabsTrigger>
            <TabsTrigger value="general" className="px-4 py-2 text-sm font-medium">General</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Log Form */}
      {showForm && (
        <div className="mb-8">
          <OfficeLogForm
            log={editingLog}
            currentUser={user}
            users={users}
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowForm(false);
              setEditingLog(null);
            }}
          />
        </div>
      )}

      {/* Logs Section - Grouped by Type */}
      <div className="space-y-8">
        {activeTab === "all" ? (
          <>
            {Object.keys(groupedLogs).length > 0 ? (
              Object.keys(groupedLogs).sort().map(logType => (
                <div key={logType} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-slate-900">
                      {logTypeLabels[logType] || logType.replace(/_/g, ' ')}
                      <span className="ml-3 text-lg font-normal text-slate-500">
                        ({groupedLogs[logType].length} {groupedLogs[logType].length === 1 ? 'log' : 'logs'})
                      </span>
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {groupedLogs[logType].map((log) => (
                      <OfficeLogCard
                        key={log["ID"] || log.id}
                        log={log}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        getPriorityColor={getPriorityColor}
                        getStatusColor={getStatusColor}
                      />
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <Card className="shadow-sm">
                <CardContent className="p-12 text-center space-y-4">
                  <FileText className="w-16 h-16 text-slate-400 mx-auto" />
                  <div className="space-y-2">
                    <h3 className="text-2xl font-semibold text-slate-900">No logs found</h3>
                    <p className="text-lg text-slate-500 max-w-md mx-auto">
                      {searchTerm ? "Try adjusting your search terms" : "No office activities have been logged yet"}
                    </p>
                  </div>
                  {!searchTerm && (
                    <Button onClick={() => setShowForm(true)} className="bg-purple-600 hover:bg-purple-700 px-6 py-3 text-base font-medium">
                      <Plus className="w-5 h-5 mr-2" />
                      Add First Log Entry
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-slate-900">
                {logTypeLabels[activeTab] || activeTab.replace(/_/g, ' ')}
                {filteredLogs.length > 0 && (
                  <span className="ml-3 text-lg font-normal text-slate-500">
                    ({filteredLogs.length} {filteredLogs.length === 1 ? 'log' : 'logs'})
                  </span>
                )}
              </h2>
            </div>
            {filteredLogs.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredLogs.map((log) => (
                  <OfficeLogCard
                    key={log["ID"] || log.id}
                    log={log}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    getPriorityColor={getPriorityColor}
                    getStatusColor={getStatusColor}
                  />
                ))}
              </div>
            ) : (
              <Card className="shadow-sm">
                <CardContent className="p-12 text-center space-y-4">
                  <FileText className="w-16 h-16 text-slate-400 mx-auto" />
                  <div className="space-y-2">
                    <h3 className="text-2xl font-semibold text-slate-900">No logs found</h3>
                    <p className="text-lg text-slate-500 max-w-md mx-auto">
                      No logs match your current filters
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}