"use client"
import { useSession, useUser } from "@clerk/nextjs";
import React, { useState, useEffect, useCallback } from "react";
import { useClerkSupabaseClient } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Plus, Search, Download, AlertTriangle, Clock, CheckCircle2, ListTodo } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import TaskForm_Supabase from "@/components/tasks/TaskForm";
import TaskCard from "@/components/tasks/TaskCard";
import TaskDetailModal from "@/components/tasks/TaskDetailModal";

export default function TasksPage() {
  const supabase = useClerkSupabaseClient();
  const { session } = useSession();
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

  // 1. COMPREHENSIVE DATA LOADING FUNCTION
  const loadTasks = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    console.log("🔄 [SUPABASE] Starting comprehensive data load...");
    
    try {
      // Fetch Current User Profile
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const { data: userData } = await supabase.from('users').select('*').eq('ID', authUser.id).single();
        setCurrentUser(userData);
      }

      // Fetch Tasks (excluding soft-deleted)
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .or('Deleted.is.null,Deleted.eq.false')
        .order('Created Date', { ascending: false });

      if (tasksError) throw tasksError;

      // Fetch Active Users
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .or('Is Active.is.null,Is Active.eq.true');

      if (usersError) throw usersError;
      
      const activeUsers = Array.isArray(usersData) ? usersData.filter(u => {
        const name = u?.["Full Name"]?.trim() || '';
        return name && 
               !['Tair', 'Iveta lobinate', 'amit noach'].includes(name) &&
               !name.toLowerCase().includes('test') &&
               u.Email && u.ID;
      }) : [];

      // Fetch Residents
      const { data: residentsData } = await supabase.from('residents').select('*').or('Deleted.is.null,Deleted.eq.false');
      
      // Fetch Properties
      const { data: propertiesData } = await supabase.from('properties').select('*').or('Deleted.is.null,Deleted.eq.false');

      // --- APPLY FILTERS & SORTING ---
      let filtered = Array.isArray(tasksData) ? [...tasksData] : [];
      const now = new Date();

      if (filters.assignee !== "all") {
        filtered = filtered.filter(t => (t["Assigned To User ID"] || "Unassigned") === filters.assignee);
      }

      if (filters.status === "overdue") {
        filtered = filtered.filter(t => {
          const status = (t.Status || t.status || "").toLowerCase();
          const dueDate = t["Due Date"] || t.due_date;
          return status !== "completed" && dueDate && new Date(dueDate) < now;
        });
      } else if (filters.status !== "all") {
        const filterStatusLower = filters.status.toLowerCase().replace(/ /g, "_");
        filtered = filtered.filter(t => (t.Status || t.status || "").toLowerCase().replace(/ /g, "_") === filterStatusLower);
      }

      if (filters.priority !== "all_priority") {
        filtered = filtered.filter(t => (t.Priority || t.priority || "").toLowerCase() === filters.priority.toLowerCase());
      }

      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        filtered = filtered.filter(t => 
          (t.Title || "").toLowerCase().includes(searchTerm) || 
          (t.Description || "").toLowerCase().includes(searchTerm) ||
          (t["Assigned To User ID"] || "").toLowerCase().includes(searchTerm)
        );
      }

      // Sorting Logic
      filtered.sort((a, b) => {
        if (sortOrder === "newest") return new Date(b["Created Date"] || 0) - new Date(a["Created Date"] || 0);
        if (sortOrder === "oldest") return new Date(a["Created Date"] || 0) - new Date(b["Created Date"] || 0);
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        const diff = (priorityOrder[(b.Priority || 'medium').toLowerCase()] || 0) - (priorityOrder[(a.Priority || 'medium').toLowerCase()] || 0);
        return diff !== 0 ? diff : new Date(a["Due Date"] || 0) - new Date(b["Due Date"] || 0);
      });

      // Update All States
      setTasks(tasksData || []);
      setFilteredTasks(filtered);
      setUsers(activeUsers);
      setResidents(residentsData || []);
      setProperties(propertiesData || []);
      
      console.log(`✅ Loaded ${activeUsers.length} users and ${tasksData?.length} tasks.`);
      
    } catch (error) {
      console.error("❌ Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }, [supabase, filters, sortOrder]);

  // 2. TRIGGER INITIAL LOAD & UPDATES
  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleSubmit = async (taskData) => {
    try {
      if (!taskData["Logged By"] && currentUser?.["Full Name"]) taskData["Logged By"] = currentUser["Full Name"];
      
      if (taskData["Assigned To User ID"] === "all_team_members") {
        const promises = users.map(u => supabase.from('tasks').insert([{ ...taskData, ID: crypto.randomUUID(), "Assigned To User ID": u["Full Name"], "Created By": currentUser?.Email || "Unknown" }]));
        await Promise.all(promises);
      } else if (editingTask?.ID) {
        await supabase.from('tasks').update({ ...taskData, "Updated Date": new Date().toISOString() }).eq('ID', editingTask.ID);
      } else {
        await supabase.from('tasks').insert([{ ...taskData, ID: crypto.randomUUID(), "Created Date": new Date().toISOString(), "Created By": currentUser?.Email || "Unknown" }]);
      }
      
      setShowForm(false);
      setEditingTask(null);
      loadTasks();
    } catch (error) {
      alert("Error saving task: " + error.message);
    }
  };

  const handleDelete = async (task) => {
    if (window.confirm(`Delete "${task.Title}"?`)) {
      await supabase.from('tasks').update({ Deleted: true, "Deleted Date": new Date().toISOString(), "Deleted By": currentUser?.["Full Name"] || "Unknown" }).eq('ID', task.ID);
      loadTasks();
    }
  };

  const getTaskCounts = () => {
    const now = new Date();
    return {
      total: tasks.length,
      overdue: tasks.filter(t => (t.Status || '').toLowerCase() !== 'completed' && t["Due Date"] && new Date(t["Due Date"]) < now).length,
      to_do: tasks.filter(t => (t.Status || '').toLowerCase().replace(/ /g, '_') === 'to_do').length,
      in_progress: tasks.filter(t => (t.Status || '').toLowerCase().replace(/ /g, '_') === 'in_progress').length,
      completed: tasks.filter(t => (t.Status || '').toLowerCase() === 'completed').length,
      myTasks: tasks.filter(t => t["Assigned To User ID"] === currentUser?.["Full Name"] && (t.Status || '').toLowerCase() !== 'completed').length
    };
  };

  const taskCounts = getTaskCounts();
  const groupedTasks = filteredTasks.reduce((acc, t) => {
    const assignee = t["Assigned To User ID"] || 'Unassigned';
    if (!acc[assignee]) acc[assignee] = [];
    acc[assignee].push(t);
    return acc;
  }, {});

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Task Management</h1>
          <p className="text-slate-600">Track and manage tasks for your team</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowForm(true)} className="bg-cyan-600 hover:bg-cyan-700 shadow-sm">
            <Plus className="w-4 h-4 mr-2" /> Add New Task
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Stat Cards */}
        {[
          { label: "Overdue", count: taskCounts.overdue, color: "red", icon: AlertTriangle, val: "overdue" },
          { label: "To Do", count: taskCounts.to_do, color: "blue", icon: ListTodo, val: "to_do" },
          { label: "In Progress", count: taskCounts.in_progress, color: "yellow", icon: Clock, val: "in_progress" },
          { label: "Completed", count: taskCounts.completed, color: "green", icon: CheckCircle2, val: "completed" }
        ].map(s => (
          <Card key={s.label} className={`bg-${s.color}-50 border-${s.color}-200 cursor-pointer hover:shadow-md`} onClick={() => setFilters(p => ({ ...p, status: s.val, assignee: "all" }))}>
            <CardContent className="p-4 flex items-center justify-between">
              <div><p className={`text-xs font-medium text-${s.color}-700`}>{s.label}</p><p className={`text-2xl font-bold text-${s.color}-900`}>{s.count}</p></div>
              <s.icon className={`w-8 h-8 text-${s.color}-600`} />
            </CardContent>
          </Card>
        ))}
        <Card className="bg-purple-50 border-purple-200 cursor-pointer" onClick={() => currentUser && setFilters(p => ({ ...p, assignee: currentUser["Full Name"], status: "all" }))}>
          <CardContent className="p-4 flex items-center justify-between">
            <div><p className="text-xs font-medium text-purple-700">My Tasks</p><p className="text-2xl font-bold text-purple-900">{taskCounts.myTasks}</p></div>
            <div className="w-8 h-8 bg-purple-200 rounded-full flex items-center justify-center text-purple-700 font-bold">ME</div>
          </CardContent>
        </Card>
      </div>

      <Card><CardContent className="p-6 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1"><Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" /><Input placeholder="Search tasks..." value={filters.search} onChange={e => setFilters(p => ({ ...p, search: e.target.value }))} className="pl-10" /></div>
        <Select value={sortOrder} onValueChange={setSortOrder}><SelectTrigger className="w-48"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="newest">Newest</SelectItem><SelectItem value="oldest">Oldest</SelectItem><SelectItem value="priority">Priority</SelectItem></SelectContent></Select>
      </CardContent></Card>

      <div className="space-y-4">
        <Tabs value={filters.status} onValueChange={v => setFilters(p => ({ ...p, status: v, assignee: "all" }))}>
          <TabsList className="w-full lg:w-auto"><TabsTrigger value="all">All ({taskCounts.total})</TabsTrigger><TabsTrigger value="to_do">To Do</TabsTrigger><TabsTrigger value="in_progress">In Progress</TabsTrigger><TabsTrigger value="completed">Completed</TabsTrigger><TabsTrigger value="overdue">Overdue</TabsTrigger></TabsList>
        </Tabs>
        <Tabs value={filters.priority} onValueChange={v => setFilters(p => ({ ...p, priority: v, assignee: "all" }))}>
          <TabsList className="w-full lg:w-auto"><TabsTrigger value="all_priority">All Priority</TabsTrigger><TabsTrigger value="urgent">Urgent</TabsTrigger><TabsTrigger value="high">High</TabsTrigger><TabsTrigger value="medium">Medium</TabsTrigger><TabsTrigger value="low">Low</TabsTrigger></TabsList>
        </Tabs>
      </div>

      {showForm && (
        <TaskForm_Supabase task={editingTask} users={users} residents={residents} properties={properties} onSubmit={handleSubmit} onCancel={() => { setShowForm(false); setEditingTask(null); }} />
      )}
      
      {viewingTask && (
        <TaskDetailModal task={viewingTask} assignedUser={users.find(u => u["Full Name"] === viewingTask["Assigned To User ID"])} onClose={() => setViewingTask(null)} onEdit={t => { setViewingTask(null); setEditingTask(t); setShowForm(true); }} />
      )}

      {loading ? <div className="text-center py-12 text-slate-500">Loading tasks...</div> : filteredTasks.length === 0 ? (
        <Card><CardContent className="p-12 text-center text-slate-500"><ListTodo className="w-12 h-12 mx-auto mb-4" /><h3>No tasks found</h3></CardContent></Card>
      ) : (
        <div className="space-y-8">
          {Object.keys(groupedTasks).map(assignee => (
            <div key={assignee} className="space-y-4">
              <h3 className="text-xl font-semibold text-slate-900 border-b pb-2">{assignee === currentUser?.["Full Name"] && '⭐ '}{assignee} ({groupedTasks[assignee].length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupedTasks[assignee].map(t => <TaskCard key={t.ID} task={t} onEdit={setEditingTask} onViewDetails={setViewingTask} onDelete={handleDelete} assignedUser={users.find(u => u["Full Name"] === t["Assigned To User ID"])} />)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
