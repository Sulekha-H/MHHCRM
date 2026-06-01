"use client"

import { useSession, useUser } from "@clerk/nextjs";
import React, { useState, useEffect, useCallback } from "react";
import { useClerkSupabaseClient } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Plus, Search, Download, AlertTriangle, Clock, CheckCircle2, ListTodo } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, startOfDay, isSameDay } from "date-fns";
import { injectRoutineTasks } from "@/lib/taskUtils";
import { ROUTINE_TITLES } from "@/lib/constants/routines";
import TaskForm_Supabase from "@/components/tasks/TaskForm";
import TaskCard from "@/components/tasks/TaskCard";
import TaskDetailModal from "@/components/tasks/TaskDetailModal";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export default function TasksPage() {
  const [mounted, setMounted] = useState(false);
  const supabase = useClerkSupabaseClient()

  useEffect(() => {
    setMounted(true);
  }, []);
  const {session} = useSession();
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

useEffect(() => {
  if (!supabase || !user) return;
  loadTasks();
}, [supabase, user]);


useEffect(() => {
  let filtered = Array.isArray(tasks) ? [...tasks] : [];
  const now = new Date();

  if (filters.assignee !== "all") {
    filtered = filtered.filter(
      t => (t["Assigned To User ID"] || "Unassigned") === filters.assignee
    );
  }

  if (filters.status === "overdue") {
    filtered = filtered.filter(t => {
      const status = (t.Status || t.status || "").toLowerCase();
      const dueDate = t["Due Date"] || t.due_date;
      return status !== "completed" && dueDate && new Date(dueDate) < now;
    });
  } else if (filters.status !== "all") {
    const filterStatusLower = filters.status.toLowerCase().replace(/ /g, "_");
    filtered = filtered.filter(t => {
      const taskStatus = (t.Status || t.status || "").toLowerCase().replace(/ /g, "_");
      return taskStatus === filterStatusLower;
    });
  }

  if (filters.priority !== "all_priority") {
    filtered = filtered.filter(
      t => ((t.Priority || t.priority || "").toLowerCase()) === filters.priority.toLowerCase()
    );
  }

  if (filters.search) {
    const searchTerm = filters.search.toLowerCase();
    filtered = filtered.filter(t => {
      const title = t.Title || t.title || "";
      const desc = t.Description || t.description || "";
      const assigned = t["Assigned To User ID"] || "unassigned";
      const createdBy = t["Created By"] || t.created_by || "";
      return (
        title.toLowerCase().includes(searchTerm) ||
        desc.toLowerCase().includes(searchTerm) ||
        assigned.toLowerCase().includes(searchTerm) ||
        createdBy.toLowerCase().includes(searchTerm)
      );
    });
  }

  filtered.sort((a, b) => {
    // Status-based priority: Completed always at the bottom
    const statusA = (a.Status || a.status || "").toLowerCase();
    const statusB = (b.Status || b.status || "").toLowerCase();

    if (statusA === "completed" && statusB !== "completed") return 1;
    if (statusA !== "completed" && statusB === "completed") return -1;

    if (sortOrder === "newest") {
      const dateA = a["Created Date"] ? new Date(a["Created Date"]) : new Date(0);
      const dateB = b["Created Date"] ? new Date(b["Created Date"]) : new Date(0);
      return dateB - dateA;
    } else if (sortOrder === "oldest") {
      const dateA = a["Created Date"] ? new Date(a["Created Date"]) : new Date(0);
      const dateB = b["Created Date"] ? new Date(b["Created Date"]) : new Date(0);
      return dateA - dateB;
    } else {
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      const aPriority = (a.Priority || a.priority || "medium").toLowerCase();
      const bPriority = (b.Priority || b.priority || "medium").toLowerCase();
      const diff = (priorityOrder[bPriority] || 0) - (priorityOrder[aPriority] || 0);
      if (diff !== 0) return diff;
      const dueA = a["Due Date"] ? new Date(a["Due Date"]) : new Date(0);
      const dueB = b["Due Date"] ? new Date(b["Due Date"]) : new Date(0);
      return dueA - dueB;
    }
  });

  setFilteredTasks(filtered);
}, [tasks, filters, sortOrder]);



  
  const loadTasks = async () => {
    setLoading(true);
    console.log("🔄 [SUPABASE] Starting to load tasks...");
    
    try {
      // Load current user
      const userEmail = user?.primaryEmailAddress?.emailAddress;
      if (userEmail) {
        const { data: userData } = await supabase.from('users').select('*').eq('Email', userEmail).single();
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
      
      //console.log(`✅ [SUPABASE] Active users: ${activeUsers.length}`);

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
      
      const fetchedTasks = Array.isArray(tasksData) ? tasksData : [];
      setTasks(fetchedTasks);
      setUsers(Array.isArray(activeUsers) ? activeUsers : []);
      setResidents(Array.isArray(residentsData) ? residentsData : []);
      setProperties(Array.isArray(propertiesData) ? propertiesData : []);

      // Inject routine tasks if needed
      if (userEmail && activeUsers.length > 0) {
        const currentUserData = activeUsers.find(u => u.Email === userEmail);
        if (currentUserData) {
          const injected = await injectRoutineTasks(supabase, currentUserData, fetchedTasks);
          if (injected) {
            // Reload tasks if new ones were injected
            const { data: updatedTasks } = await supabase
              .from('tasks')
              .select('*')
              .or('Deleted.is.null,Deleted.eq.false')
              .order('Created Date', { ascending: false });
            setTasks(updatedTasks || []);
          }
        }
      }
      
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

  const handleStartTask = async (task) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          Status: "In Progress",
          "Actual Start Time": new Date().toISOString(),
          "Updated Date": new Date().toISOString()
        })
        .eq('ID', task.ID);

      if (error) throw error;
      loadTasks();
    } catch (error) {
      console.error("Error starting task:", error);
      alert("Error starting task: " + error.message);
    }
  };

  const handleCompleteTask = async (task) => {
    try {
      const startTime = task["Actual Start Time"];
      const endTime = new Date();
      let durationTaken = null;

      if (startTime) {
        const start = new Date(startTime);
        durationTaken = Math.round((endTime - start) / (1000 * 60)); // in minutes
      }

      const { error } = await supabase
        .from('tasks')
        .update({
          Status: "Completed",
          "Actual End Time": endTime.toISOString(),
          "Duration Taken": durationTaken,
          "Updated Date": new Date().toISOString()
        })
        .eq('ID', task.ID);

      if (error) throw error;
      loadTasks();
    } catch (error) {
      console.error("Error completing task:", error);
      alert("Error completing task: " + error.message);
    }
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

  const sortTasks = (taskList) => {
    return [...taskList].sort((a, b) => {
      const statusA = (a.Status || a.status || "").toLowerCase();
      const statusB = (b.Status || b.status || "").toLowerCase();

      // Completed always at bottom
      if (statusA === "completed" && statusB !== "completed") return 1;
      if (statusA !== "completed" && statusB === "completed") return -1;

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
  };

  const displayAssignee = filters.assignee === "all" ? currentUser?.["Full Name"] : filters.assignee;

  // Split tasks into routine and miscellaneous
  const routineList = Array.isArray(ROUTINE_TITLES) ? ROUTINE_TITLES : [];

  const routineTasks = sortTasks(filteredTasks.filter(t =>
    routineList.includes(t.Title) && t["Assigned To User ID"] === displayAssignee
  ));

  const miscellaneousTasks = sortTasks(filteredTasks.filter(t =>
    !routineList.includes(t.Title) && (filters.assignee === "all" || t["Assigned To User ID"] === filters.assignee)
  ));

  const routineSummary = routineTasks.reduce((acc, t) => {
    if (t.Status === "Completed" || t.status === "Completed") acc.completed++;
    acc.total++;
    return acc;
  }, { completed: 0, total: 0 });

  if (!mounted) return null;

  return (
    <div className="space-y-6 p-6 max-w-[1600px] mx-auto bg-slate-50 min-h-screen">
      {/* Header with Date */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{format(new Date(), 'EEEE, do MMMM')}</h1>
          <p className="text-slate-500 mt-1">Manage your routines and miscellaneous tasks</p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={exportToCSV}
            variant="outline"
            className="flex items-center gap-2 border-slate-200 text-slate-600 hover:bg-slate-50"
            disabled={loading || filteredTasks.length === 0}
          >
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button
            onClick={() => setShowForm(true)}
            className="bg-cyan-600 hover:bg-cyan-700 shadow-sm text-white font-medium px-6"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Task
          </Button>
        </div>
      </div>

      {/* Staff Selection Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
        <button
          onClick={() => setFilters(prev => ({ ...prev, assignee: "all" }))}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
            filters.assignee === "all"
              ? "bg-cyan-600 text-white border-cyan-600 shadow-md"
              : "bg-white text-slate-600 border-slate-200 hover:border-cyan-300 hover:bg-cyan-50"
          }`}
        >
          Team Overview
        </button>
        {users.map((u) => (
          <button
            key={u.ID}
            onClick={() => setFilters(prev => ({ ...prev, assignee: u["Full Name"] }))}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border truncate ${
              filters.assignee === u["Full Name"]
                ? "bg-cyan-600 text-white border-cyan-600 shadow-md"
                : "bg-white text-slate-600 border-slate-200 hover:border-cyan-300 hover:bg-cyan-50"
            }`}
          >
            {u["Full Name"]}
          </button>
        ))}
      </div>

      {/* Main Content Layout: Routine vs Miscellaneous */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-4">
        {/* Left Column: Routine Tasks (Timeline Style) */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Clock className="w-5 h-5 text-cyan-600" />
              Routine Tasks
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{routineSummary.completed}/{routineSummary.total} Done</span>
              <Badge variant="secondary" className="bg-cyan-50 text-cyan-700 border-cyan-100">
                {routineTasks.length} Scheduled
              </Badge>
            </div>
          </div>

          <div className="relative pl-8 space-y-4 before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-200">
            {routineTasks.length === 0 ? (
              <div className="bg-white rounded-xl border border-dashed border-slate-300 p-8 text-center ml-[-2rem] pl-8">
                <p className="text-slate-400 italic">No routine tasks found for today</p>
              </div>
            ) : (
              routineTasks.map((task) => (
                <div key={task.ID} className="relative">
                  <div className="absolute left-[-25px] top-4 w-4 h-4 rounded-full bg-cyan-600 border-4 border-white shadow-sm z-10"></div>
                  <TaskCard
                    task={task}
                    onEdit={handleEdit}
                    onViewDetails={handleViewDetails}
                    onDelete={handleDelete}
                    onStartTask={handleStartTask}
                    onCompleteTask={handleCompleteTask}
                    assignedUser={users.find(u => u["Full Name"] === task["Assigned To User ID"])}
                    assignedUserName={task["Assigned To User ID"]}
                    currentUser={currentUser}
                    isRoutine={true}
                  />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Miscellaneous Stuff (List Style) */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <ListTodo className="w-5 h-5 text-purple-600" />
              Miscellaneous Stuff
            </h2>
            <Badge variant="secondary" className="bg-purple-50 text-purple-700 border-purple-100">
              {miscellaneousTasks.length} Total
            </Badge>
          </div>

          <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search misc tasks..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10 bg-slate-50 border-none h-9 text-sm focus-visible:ring-cyan-500"
                />
              </div>
              <div className="w-32">
                <Select value={sortOrder} onValueChange={setSortOrder}>
                  <SelectTrigger className="h-9 text-sm border-slate-200">
                    <SelectValue placeholder="Sort" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="priority">Priority</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {miscellaneousTasks.length === 0 ? (
              <div className="bg-white rounded-xl border border-dashed border-slate-300 p-8 text-center">
                <p className="text-slate-400 italic">No miscellaneous tasks found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {miscellaneousTasks.map((task) => (
                  <TaskCard
                    key={task.ID}
                    task={task}
                    onEdit={handleEdit}
                    onViewDetails={handleViewDetails}
                    onDelete={handleDelete}
                    onStartTask={handleStartTask}
                    onCompleteTask={handleCompleteTask}
                    assignedUser={users.find(u => u["Full Name"] === task["Assigned To User ID"])}
                    assignedUserName={task["Assigned To User ID"]}
                    currentUser={currentUser}
                  />
                ))}
              </div>
            )}
          </div>
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
          onStartTask={handleStartTask}
          onCompleteTask={handleCompleteTask}
          onDelete={handleDelete}
          currentUser={currentUser}
        />
      )}

      {loading && (
        <div className="fixed inset-0 bg-slate-900/10 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl flex items-center gap-4">
            <div className="w-6 h-6 border-4 border-cyan-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="font-medium text-slate-700">Loading your workspace...</p>
          </div>
        </div>
      )}
    </div>
  );
}
