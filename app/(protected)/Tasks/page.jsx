"use client"

import { useUser } from "@clerk/nextjs";
import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Plus, Search, Download, AlertTriangle, Clock, CheckCircle2, ListTodo } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";

import TaskForm_Supabase from "@/components/tasks/TaskForm";
import TaskCard from "@/components/tasks/TaskCard";
import TaskDetailModal from "@/components/tasks/TaskDetailModal";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export default function TasksPage() {
  const { user } = useUser();
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [residents, setResidents] = useState([]);
  const [properties, setProperties] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [filters, setFilters] = useState({ status: "all", priority: "all_priority", search: "", assignee: "all" });
  const [viewingTask, setViewingTask] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [sortOrder, setSortOrder] = useState("newest");

  const filterTasks = useCallback(() => {
    let currentFiltered = Array.isArray(tasks) ? [...tasks] : [];
    const now = new Date();

    if (filters.assignee !== "all") {
      currentFiltered = currentFiltered.filter(task => (task["Assigned To User ID"] || "Unassigned") === filters.assignee);
    }

    if (filters.status === "overdue") {
      // Check for overdue: Status != completed AND Due Date is in the past
      currentFiltered = currentFiltered.filter(t => {
        const status = (t.Status || t.status || '').toLowerCase();
        const isNotCompleted = status !== 'completed';
        const dueDate = t["Due Date"] || t.due_date;
        const isDueDateSet = !!dueDate;
        const isPastDue = dueDate ? new Date(dueDate) < now : false;
        
        return isNotCompleted && isDueDateSet && isPastDue;
      });
    } else if (filters.status !== "all") {
      // Handle status filtering: Convert both to lowercase with underscores for comparison
      currentFiltered = currentFiltered.filter(task => {
        const taskStatus = (task.Status || task.status || '').toLowerCase().replace(/ /g, '_');
        const filterStatusLower = filters.status.toLowerCase().replace(/ /g, '_');
        return taskStatus === filterStatusLower;
      });
    }

    if (filters.priority !== "all_priority") {
      currentFiltered = currentFiltered.filter(task => {
        const taskPriority = (task.Priority || task.priority || '').toLowerCase();
        return taskPriority === filters.priority.toLowerCase();
      });
    }

    if (filters.search) {
      const lowercasedSearchTerm = filters.search.toLowerCase();
      currentFiltered = currentFiltered.filter(task => {
        const userName = task["Assigned To User ID"] || "unassigned";
        const title = task.Title || task.title || "";
        const description = task.Description || task.description || "";
        const createdBy = task["Created By"] || task.created_by || "";
        
        return title.toLowerCase().includes(lowercasedSearchTerm) ||
               description.toLowerCase().includes(lowercasedSearchTerm) ||
               userName.toLowerCase().includes(lowercasedSearchTerm) ||
               createdBy.toLowerCase().includes(lowercasedSearchTerm);
      });
    }

    currentFiltered = currentFiltered.sort((a, b) => {
      if (sortOrder === "newest") {
        const dateA = a["Created Date"] ? new Date(a["Created Date"]) : new Date(0);
        const dateB = b["Created Date"] ? new Date(b["Created Date"]) : new Date(0);
        return dateB.getTime() - dateA.getTime();
      } else if (sortOrder === "oldest") {
        const dateA = a["Created Date"] ? new Date(a["Created Date"]) : new Date(0);
        const dateB = b["Created Date"] ? new Date(b["Created Date"]) : new Date(0);
        return dateA.getTime() - dateB.getTime();
      } else {
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        const aPriority = (a.Priority || a.priority || 'medium').toLowerCase();
        const bPriority = (b.Priority || b.priority || 'medium').toLowerCase();
        const priorityDiff = (priorityOrder[bPriority] || 0) - (priorityOrder[aPriority] || 0);
        
        if (priorityDiff !== 0) return priorityDiff;
        
        const dueDateA = a["Due Date"] ? new Date(a["Due Date"]) : new Date(0);
        const dueDateB = b["Due Date"] ? new Date(b["Due Date"]) : new Date(0);
        return dueDateA.getTime() - dueDateB.getTime();
      }
    });

    setFilteredTasks(currentFiltered);
  }, [tasks, filters.search, filters.status, filters.priority, filters.assignee, sortOrder]);

  useEffect(() => {
    loadTasks();
  }, []);

  useEffect(() => {
    filterTasks();
  }, [filterTasks]);

  const loadTasks = async () => {
    setLoading(true);
    console.log("🔄 [SUPABASE] Starting to load tasks...");
    
    try {
      // Load current user
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: userData } = await supabase.from('users').select('*').eq('ID', user.id).single();
        setCurrentUser(userData);
        console.log("✅ [SUPABASE] Current user:", userData?.["Full Name"] || userData?.Email);
      }

      // Load tasks - First get all tasks to debug
      const { data: allTasksDebug, error: debugError } = await supabase
        .from('tasks')
        .select('*')
        .order('Created Date', { ascending: false });

      if (debugError) {
        console.error("Debug query error:", debugError);
      } else {
        console.log("🔍 [DEBUG] Total tasks in database (including deleted):", allTasksDebug?.length);
        console.log("🔍 [DEBUG] Sample task fields:", allTasksDebug?.[0] ? Object.keys(allTasksDebug[0]) : []);
        
        // Check for deleted tasks
        const deletedTasks = allTasksDebug?.filter(t => t.Deleted === true || t.deleted === true);
        console.log("🔍 [DEBUG] Tasks marked as deleted:", deletedTasks?.length);
        
        // Check status distribution
        const statusCountsDebug = allTasksDebug?.reduce((acc, task) => {
          const status = task.Status || task.status || 'Unknown';
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {});
        console.log("🔍 [DEBUG] Status distribution (including deleted tasks):", statusCountsDebug);
      }

      // Load tasks - EXCLUDE SOFT-DELETED TASKS
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .or('Deleted.is.null,Deleted.eq.false')
        .order('Created Date', { ascending: false });

      if (tasksError) throw tasksError;
      
      console.log(`✅ [SUPABASE] Loaded ${tasksData?.length || 0} non-deleted tasks`);

      // 🎯 DETAILED DEBUG: Analyze task statuses and overdue calculation
      const now = new Date();
      console.log("\n📊 [DEBUG] Analyzing Tasks for Count Discrepancy:");
      
      let overdueTasks = [];
      let toDoTasks = [];
      let inProgressTasks = [];
      let completedTasks = [];
      
      tasksData?.forEach((task, index) => {
        const status = (task.Status || task.status || '').toLowerCase();
        const statusNormalized = status.replace(/ /g, '_');
        const dueDate = task["Due Date"] || task.due_date;
        const dueDateObj = dueDate ? new Date(dueDate) : null;
        const isNotCompleted = status !== 'completed';
        const isPastDue = dueDateObj && dueDateObj < now;
        
        // Categorize tasks
        if (statusNormalized === 'to_do') {
          toDoTasks.push(task);
        } else if (statusNormalized === 'in_progress') {
          inProgressTasks.push(task);
        } else if (status === 'completed') {
          completedTasks.push(task);
        }
        
        // Check if overdue (not completed AND past due)
        if (isNotCompleted && isPastDue) {
          overdueTasks.push(task);
        }
        
        console.log(`\n📝 Task ${index + 1} - "${task.Title}":`, {
          rawStatus: task.Status || task.status,
          statusLowercase: status,
          statusNormalized: statusNormalized,
          dueDate: dueDate ? format(dueDateObj, 'yyyy-MM-dd HH:mm') : 'No due date',
          isPastDue: isPastDue ? '⏰ OVERDUE' : dueDateObj ? '✅ Future' : 'No date',
          isCompleted: status === 'completed' ? '✅ COMPLETED' : '⏳ Not completed',
          assignedTo: task["Assigned To User ID"] || "Unassigned",
          categorizedAs: overdueTasks.includes(task) ? 'OVERDUE' : 
                          toDoTasks.includes(task) ? 'TO DO' :
                          inProgressTasks.includes(task) ? 'IN PROGRESS' :
                          completedTasks.includes(task) ? 'COMPLETED' : 'OTHER'
        });
      });

      console.log("\n🎯 [DEBUG] Final Task Count Breakdown:");
      console.log("  📌 Total non-deleted tasks:", tasksData?.length);
      console.log("  ⏰ Overdue (Not completed && Past due):", overdueTasks.length);
      console.log("  📋 To Do (Status == 'to_do'):", toDoTasks.length);
      console.log("  🔄 In Progress (Status == 'in_progress'):", inProgressTasks.length);
      console.log("  ✅ Completed (Status == 'completed'):", completedTasks.length);
      
      // Load users - EXCLUDE INACTIVE USERS
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .or('Is Active.is.null,Is Active.eq.true');

      if (usersError) throw usersError;
      
      const activeUsers = Array.isArray(usersData) ? usersData.filter(user => {
        const name = user?.["Full Name"]?.trim() || '';
        return name && 
               !['Tair', 'Iveta lobinate', 'amit noach'].includes(name) &&
               !name.toLowerCase().includes('test') &&
               user.Email &&
               user.ID;
      }) : [];
      
      console.log(`✅ [SUPABASE] Active users: ${activeUsers.length}`);

      // Load residents - EXCLUDE DELETED RESIDENTS
      const { data: residentsData, error: residentsError } = await supabase
        .from('residents')
        .select('*')
        .or('Deleted.is.null,Deleted.eq.false');

      if (residentsError) throw residentsError;
      console.log(`✅ [SUPABASE] Loaded ${residentsData?.length || 0} non-deleted residents`);

      // Load properties - EXCLUDE DELETED PROPERTIES
      const { data: propertiesData, error: propertiesError } = await supabase
        .from('properties')
        .select('*')
        .or('Deleted.is.null,Deleted.eq.false');

      if (propertiesError) throw propertiesError;
      console.log(`✅ [SUPABASE] Loaded ${propertiesData?.length || 0} non-deleted properties`);
      
      setTasks(Array.isArray(tasksData) ? tasksData : []);
      setUsers(Array.isArray(activeUsers) ? activeUsers : []);
      setResidents(Array.isArray(residentsData) ? residentsData : []);
      setProperties(Array.isArray(propertiesData) ? propertiesData : []);
      
    } catch (error) {
      console.error("❌ [SUPABASE] Critical error loading data:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response,
        stack: error.stack
      });
      
      setTasks([]);
      setUsers([]);
      setResidents([]);
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (taskData) => {
    try {
      if (!taskData["Logged By"] && currentUser?.["Full Name"]) {
        taskData["Logged By"] = currentUser["Full Name"];
      }

      if (taskData["Assigned To User ID"] === "all_team_members") {
        const taskPromises = (Array.isArray(users) ? users : []).map(user => {
          const userTask = {
            ...taskData,
            ID: crypto.randomUUID(),
            "Assigned To User ID": user["Full Name"],
            "Created Date": new Date().toISOString(),
            "Updated Date": new Date().toISOString(),
            "Created By": currentUser?.Email || "Unknown"
          };
          return supabase.from('tasks').insert([userTask]);
        });
        
        await Promise.all(taskPromises);
        console.log(`✅ [SUPABASE] Created ${users.length} tasks for all team members`);
      } else if (editingTask && editingTask.ID) {
        const updateData = {
          ...taskData,
          "Updated Date": new Date().toISOString()
        };
        const { error } = await supabase
          .from('tasks')
          .update(updateData)
          .eq('ID', editingTask.ID);
        
        if (error) throw error;
      } else {
        const insertData = {
          ...taskData,
          ID: crypto.randomUUID(),
          "Created Date": new Date().toISOString(),
          "Updated Date": new Date().toISOString(),
          "Created By": currentUser?.Email || "Unknown"
        };
        const { error } = await supabase
          .from('tasks')
          .insert([insertData]);
        
        if (error) throw error;
      }
      
      setShowForm(false);
      setEditingTask(null);
      setViewingTask(null);
      loadTasks();
    } catch (error) {
      console.error("❌ [SUPABASE] Error saving task:", error);
      alert("Error saving task: " + error.message);
    }
  };

  const handleEdit = (task) => {
    setViewingTask(null);
    setEditingTask(task);
    setShowForm(true);
  };

  const handleViewDetails = (task) => {
    setViewingTask(task);
  };

  const handleDelete = async (task) => {
    if (window.confirm(`Are you sure you want to delete "${task.Title}"? This action cannot be undone.`)) {
      try {
        // SOFT DELETE: Mark as deleted instead of permanently removing
        const userWhoDeleted = currentUser?.["Full Name"] || "Unknown";
        const { error } = await supabase
          .from('tasks')
          .update({
            Deleted: true,
            "Deleted Date": new Date().toISOString(),
            "Deleted By": userWhoDeleted
          })
          .eq('ID', task.ID);
        
        if (error) throw error;
        console.log(`✅ [SUPABASE] Task ${task.ID} soft deleted successfully by ${userWhoDeleted}`);
        
        loadTasks();
      } catch (error) {
        console.error("❌ [SUPABASE] Error deleting task:", error);
        alert("Error deleting task: " + error.message);
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

    const formatStatus = (status) => {
      const statusMap = {
        'To Do': 'To Do',
        'to_do': 'To Do',
        'In Progress': 'In Progress',
        'in_progress': 'In Progress',
        'Completed': 'Completed',
        'completed': 'Completed',
        'Overdue': 'Overdue',
        'overdue': 'Overdue'
      };
      return statusMap[status] || statusMap[String(status).toLowerCase().replace(/ /g, '_')] || '';
    };

    const formatPriority = (priority) => {
      const priorityMap = {
        'Low': 'Low',
        'low': 'Low',
        'Medium': 'Medium',
        'medium': 'Medium',
        'High': 'High',
        'high': 'High',
        'Urgent': 'Urgent',
        'urgent': 'Urgent'
      };
      return priorityMap[priority] || priorityMap[String(priority).toLowerCase()] || '';
    };

    const formatRelatedEntity = (entity) => {
      const entityMap = {
        'Resident': 'Resident',
        'resident': 'Resident',
        'Property': 'Property',
        'property': 'Property',
        'Support Plan': 'Support Plan',
        'support_plan': 'Support Plan',
        'Incident': 'Incident',
        'incident': 'Incident',
        'None': 'None',
        'none': 'None'
      };
      return entityMap[entity] || entityMap[String(entity).toLowerCase().replace(/ /g, '_')] || '';
    };

    const headers = [
      "ID",
      "Title",
      "Description",
      "Due Date",
      "Status",
      "Priority",
      "Assigned To User ID",
      "Related Entity",
      "Related Entity ID",
      "Logged By",
      "Created Date",
      "Updated Date",
      "Created By"
    ];

    const rows = (Array.isArray(filteredTasks) ? filteredTasks : []).map(task => [
      task.ID || "",
      task.Title || "",
      task.Description || "",
      formatDateTime(task["Due Date"]),
      formatStatus(task.Status || task.status),
      formatPriority(task.Priority || task.priority),
      task["Assigned To User ID"] || "",
      formatRelatedEntity(task["Related Entity"] || task.related_entity),
      task["Related Entity ID"] || task.related_entity_id || "",
      task["Logged By"] || task.logged_by || "",
      formatDateTime(task["Created Date"] || task.created_date),
      formatDateTime(task["Updated Date"] || task.updated_date),
      task["Created By"] || task.created_by || ""
    ]);

    const escapeCSV = (value) => {
      if (value === null || value === undefined) return '';
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n') || stringValue.includes('\r')) {
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
    link.setAttribute('download', `tasks_export_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log("✅ [SUPABASE] Tasks CSV export completed successfully");
  };

  const getTaskCounts = () => {
    const now = new Date();
    const taskArray = Array.isArray(tasks) ? tasks : [];
    
    // Count overdue: Not completed AND due date is in the past
    const overdueCount = taskArray.filter(t => {
      const status = (t.Status || t.status || '').toLowerCase();
      const dueDate = t["Due Date"] || t.due_date;
      const dueDateObj = dueDate ? new Date(dueDate) : null;
      const isNotCompleted = status !== 'completed';
      const isPastDue = dueDateObj && dueDateObj < now;
      
      return isNotCompleted && isPastDue;
    }).length;
    
    // Count to_do
    const toDoCount = taskArray.filter(t => {
      const status = (t.Status || t.status || '').toLowerCase().replace(/ /g, '_');
      return status === 'to_do';
    }).length;
    
    // Count in_progress
    const inProgressCount = taskArray.filter(t => {
      const status = (t.Status || t.status || '').toLowerCase().replace(/ /g, '_');
      return status === 'in_progress';
    }).length;
    
    // Count completed
    const completedCount = taskArray.filter(t => {
      const status = (t.Status || t.status || '').toLowerCase();
      return status === 'completed';
    }).length;
    
    // Count myTasks: Assigned to current user AND not completed
    const myTasksCount = taskArray.filter(t => {
      const status = (t.Status || t.status || '').toLowerCase();
      const assignedTo = t["Assigned To User ID"];
      const currentUserName = currentUser?.["Full Name"];
      return assignedTo === currentUserName && status !== 'completed';
    }).length;
    
    console.log("\n🔢 [DEBUG] getTaskCounts() Results:", {
      total: taskArray.length,
      overdue: overdueCount,
      to_do: toDoCount,
      in_progress: inProgressCount,
      completed: completedCount,
      myTasks: myTasksCount
    });
    
    return {
      total: taskArray.length,
      overdue: overdueCount,
      to_do: toDoCount,
      in_progress: inProgressCount,
      completed: completedCount,
      myTasks: myTasksCount
    };
  };

  const taskCounts = getTaskCounts();

  const groupedTasks = (Array.isArray(filteredTasks) ? filteredTasks : []).reduce((acc, task) => {
    const assignee = task["Assigned To User ID"] || 'Unassigned';
    if (!acc[assignee]) {
      acc[assignee] = [];
    }
    acc[assignee].push(task);
    return acc;
  }, {});

  Object.keys(groupedTasks).forEach(assignee => {
    groupedTasks[assignee].sort((a, b) => {
      if (sortOrder === "newest") {
        const dateA = a["Created Date"] ? new Date(a["Created Date"]) : new Date(0);
        const dateB = b["Created Date"] ? new Date(b["Created Date"]) : new Date(0);
        return dateB.getTime() - dateA.getTime();
      } else if (sortOrder === "oldest") {
        const dateA = a["Created Date"] ? new Date(a["Created Date"]) : new Date(0);
        const dateB = b["Created Date"] ? new Date(b["Created Date"]) : new Date(0);
        return dateA.getTime() - dateB.getTime();
      } else {
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        const aPriority = (a.Priority || a.priority || 'medium').toLowerCase();
        const bPriority = (b.Priority || b.priority || 'medium').toLowerCase();
        const priorityDiff = (priorityOrder[bPriority] || 0) - (priorityOrder[aPriority] || 0);
        
        if (priorityDiff !== 0) return priorityDiff;
        
        const dueDateA = a["Due Date"] ? new Date(a["Due Date"]) : new Date(0);
        const dueDateB = b["Due Date"] ? new Date(b["Due Date"]) : new Date(0);
        return dueDateA.getTime() - dueDateB.getTime();
      }
    });
  });

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Task Management</h1>
          <p className="text-slate-600">Track and manage tasks for your team</p>
          {currentUser && (
            <p className="text-xs text-slate-400 mt-1">Logged in as: {currentUser.Email}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            onClick={exportToCSV}
            variant="outline"
            className="flex items-center gap-2"
            disabled={loading || filteredTasks.length === 0}
          >
            <Download className="w-4 h-4" />
            Export to CSV
          </Button>
          <Button
            onClick={() => setShowForm(true)}
            className="bg-cyan-600 hover:bg-cyan-700 shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Task
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-red-50 to-orange-50 border-red-200 cursor-pointer hover:shadow-md transition-shadow" 
          onClick={() => setFilters(prev => ({ ...prev, status: "overdue", assignee: "all" }))}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-red-700">Overdue</p>
                <p className="text-2xl font-bold text-red-900 mt-1">{taskCounts.overdue}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 cursor-pointer hover:shadow-md transition-shadow" 
          onClick={() => setFilters(prev => ({ ...prev, status: "to_do", assignee: "all" }))}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-blue-700">To Do</p>
                <p className="text-2xl font-bold text-blue-900 mt-1">{taskCounts.to_do}</p>
              </div>
              <ListTodo className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200 cursor-pointer hover:shadow-md transition-shadow" 
          onClick={() => setFilters(prev => ({ ...prev, status: "in_progress", assignee: "all" }))}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-yellow-700">In Progress</p>
                <p className="text-2xl font-bold text-yellow-900 mt-1">{taskCounts.in_progress}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 cursor-pointer hover:shadow-md transition-shadow" 
          onClick={() => setFilters(prev => ({ ...prev, status: "completed", assignee: "all" }))}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-green-700">Completed</p>
                <p className="text-2xl font-bold text-green-900 mt-1">{taskCounts.completed}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 cursor-pointer hover:shadow-md transition-shadow" 
          onClick={() => { 
            if (currentUser?.["Full Name"]) {
              setFilters(prev => ({ ...prev, assignee: currentUser["Full Name"], status: "all" }));
            }
          }}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-purple-700">My Tasks</p>
                <p className="text-2xl font-bold text-purple-900 mt-1">{taskCounts.myTasks}</p>
              </div>
              <div className="w-8 h-8 bg-purple-200 rounded-full flex items-center justify-center">
                <span className="text-purple-700 font-bold text-sm">ME</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search tasks by title, description, assignee, or creator..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-10"
              />
            </div>
            <div className="w-full md:w-48">
              <Select value={sortOrder} onValueChange={setSortOrder}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="priority">By Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-3">Filter by Status</h3>
          <Tabs value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value, assignee: "all" }))}>
            <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:grid-cols-5">
              <TabsTrigger value="all">All ({taskCounts.total})</TabsTrigger>
              <TabsTrigger value="to_do">To Do</TabsTrigger>
              <TabsTrigger value="in_progress">In Progress</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="overdue">Overdue</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-3">Filter by Priority</h3>
          <Tabs value={filters.priority} onValueChange={(value) => setFilters(prev => ({ ...prev, priority: value, assignee: "all" }))}>
            <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:grid-cols-5">
              <TabsTrigger value="all_priority">All Priority</TabsTrigger>
              <TabsTrigger value="urgent">Urgent</TabsTrigger>
              <TabsTrigger value="high">High</TabsTrigger>
              <TabsTrigger value="medium">Medium</TabsTrigger>
              <TabsTrigger value="low">Low</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {showForm && (
        <div>
          <TaskForm_Supabase
            task={editingTask}
            users={users}
            residents={residents}
            properties={properties}
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowForm(false);
              setEditingTask(null);
            }}
          />
        </div>
      )}
      
      {viewingTask && (
        <TaskDetailModal
          task={viewingTask}
          assignedUser={(Array.isArray(users) ? users : []).find(u => u["Full Name"] === viewingTask["Assigned To User ID"])}
          onClose={() => setViewingTask(null)}
          onEdit={(task) => {
            setViewingTask(null);
            handleEdit(task);
          }}
        />
      )}

      {loading ? (
        <div className="text-center py-12">
          <p className="text-slate-500">Loading tasks...</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <ListTodo className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No tasks found</h3>
            <p className="text-slate-500 mb-4">
              {filters.search ? "Try adjusting your search terms" : "Get started by adding your first task"}
            </p>
            {!filters.search && (
              <Button onClick={() => setShowForm(true)} className="bg-cyan-600 hover:bg-cyan-700">
                <Plus className="w-4 h-4 mr-2" />
                Add First Task
              </Button>
            )}
            <div className="mt-4 text-xs text-slate-400">
              Total tasks in system: {tasks.length}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {Object.keys(groupedTasks).sort((a, b) => {
            if (a === 'Unassigned') return 1;
            if (b === 'Unassigned') return -1;
            if (a === currentUser?.["Full Name"]) return -1;
            if (b === currentUser?.["Full Name"]) return 1;
            return a.localeCompare(b);
          }).map(assignee => (
            <div key={assignee} className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h3 className="text-xl font-semibold text-slate-900">
                  {assignee === currentUser?.["Full Name"] && '⭐ '}
                  {assignee}
                  <span className="ml-3 text-base font-normal text-slate-500">
                    ({groupedTasks[assignee].length} {groupedTasks[assignee].length === 1 ? 'task' : 'tasks'})
                  </span>
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupedTasks[assignee].map((task) => {
                  const assignedUser = (Array.isArray(users) ? users : []).find(u => u["Full Name"] === task["Assigned To User ID"]);
                  return (
                    <TaskCard
                      key={task.ID}
                      task={task}
                      onEdit={handleEdit}
                      onViewDetails={handleViewDetails}
                      onDelete={handleDelete}
                      assignedUser={assignedUser}
                      assignedUserName={task["Assigned To User ID"]}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}