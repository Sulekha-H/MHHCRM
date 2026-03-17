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

  const loadAllData = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);

    try {
      // Load current user
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const { data: userData } = await supabase.from('users').select('*').eq('ID', authUser.id).single();
        setCurrentUser(userData);
      }

      // Load tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .or('Deleted.is.null,Deleted.eq.false')
        .order('Created Date', { ascending: false });
      if (tasksError) throw tasksError;

      // Load users
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .or('Is Active.is.null,Is Active.eq.true');
      if (usersError) throw usersError;

      const activeUsers = (usersData || []).filter(u => {
        const name = u?.["Full Name"]?.trim() || '';
        return name &&
          !['Tair', 'Iveta lobinate', 'amit noach'].includes(name) &&
          !name.toLowerCase().includes('test') &&
          u.Email && u.ID;
      });

      // Load residents
      const { data: residentsData, error: residentsError } = await supabase
        .from('residents')
        .select('*')
        .or('Deleted.is.null,Deleted.eq.false');
      if (residentsError) throw residentsError;

      // Load properties
      const { data: propertiesData, error: propertiesError } = await supabase
        .from('properties')
        .select('*')
        .or('Deleted.is.null,Deleted.eq.false');
      if (propertiesError) throw propertiesError;

      const allTasks = tasksData || [];

      // Apply filters
      const now = new Date();
      let filtered = [...allTasks];

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
          (t["Assigned To User ID"] || "").toLowerCase().includes(searchTerm) ||
          (t["Created By"] || "").toLowerCase().includes(searchTerm)
        );
      }

      // Sort
      filtered.sort((a, b) => {
        if (sortOrder === "newest") {
          return new Date(b["Created Date"] || 0) - new Date(a["Created Date"] || 0);
        } else if (sortOrder === "oldest") {
          return new Date(a["Created Date"] || 0) - new Date(b["Created Date"] || 0);
        } else {
          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
          const diff = (priorityOrder[(b.Priority || b.priority || "medium").toLowerCase()] || 0) -
                       (priorityOrder[(a.Priority || a.priority || "medium").toLowerCase()] || 0);
          if (diff !== 0) return diff;
          return new Date(a["Due Date"] || 0) - new Date(b["Due Date"] || 0);
        }
      });

      setTasks(allTasks);
      setFilteredTasks(filtered);
      setUsers(activeUsers);
      setResidents(residentsData || []);
      setProperties(propertiesData || []);

    } catch (error) {
      console.error("❌ Error loading data:", error);
      setTasks([]);
      setUsers([]);
      setResidents([]);
      setProperties([]);
      setFilteredTasks([]);
    } finally {
      setLoading(false);
    }
  }, [supabase, filters, sortOrder]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const handleSubmit = async (taskData) => {
    try {
      if (!taskData["Logged By"] && currentUser?.["Full Name"]) {
        taskData["Logged By"] = currentUser["Full Name"];
      }

      if (taskData["Assigned To User ID"] === "all_team_members") {
        await Promise.all(users.map(u =>
          supabase.from('tasks').insert([{
            ...taskData,
            ID: crypto.randomUUID(),
            "Assigned To User ID": u["Full Name"],
            "Created Date": new Date().toISOString(),
            "Updated Date": new Date().toISOString(),
            "Created By": currentUser?.Email || "Unknown"
          }])
        ));
      } else if (editingTask?.ID) {
        const { error } = await supabase.from('tasks').update({ ...taskData, "Updated Date": new Date().toISOString() }).eq('ID', editingTask.ID);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('tasks').insert([{
          ...taskData,
          ID: crypto.randomUUID(),
          "Created Date": new Date().toISOString(),
          "Updated Date": new Date().toISOString(),
          "Created By": currentUser?.Email || "Unknown"
        }]);
        if (error) throw error;
      }

      setShowForm(false);
      setEditingTask(null);
      setViewingTask(null);
      loadAllData();
    } catch (error) {
      console.error("❌ Error saving task:", error);
      alert("Error saving task: " + error.message);
    }
  };

  const handleEdit = (task) => { setViewingTask(null); setEditingTask(task); setShowForm(true); };
  const handleViewDetails = (task) => { setViewingTask(task); };

  const handleDelete = async (task) => {
    if (window.confirm(`Are you sure you want to delete "${task.Title}"?`)) {
      try {
        const { error } = await supabase.from('tasks').update({
          Deleted: true,
          "Deleted Date": new Date().toISOString(),
          "Deleted By": currentUser?.["Full Name"] || "Unknown"
        }).eq('ID', task.ID);
        if (error) throw error;
        loadAllData();
      } catch (error) {
        console.error("❌ Error deleting task:", error);
        alert("Error deleting task: " + error.message);
      }
    }
  };

  const exportToCSV = () => {
    const formatDateTime = (d) => { try { return d ? format(new Date(d), 'yyyy-MM-dd HH:mm:ss') : ""; } catch { return d || ""; } };
    const statusMap = { 'To Do': 'To Do', 'to_do': 'To Do', 'In Progress': 'In Progress', 'in_progress': 'In Progress', 'Completed': 'Completed', 'completed': 'Completed' };
    const priorityMap = { low: 'Low', medium: 'Medium', high: 'High', urgent: 'Urgent' };
    const entityMap = { resident: 'Resident', property: 'Property', support_plan: 'Support Plan', incident: 'Incident', none: 'None' };

    const headers = ["ID","Title","Description","Due Date","Status","Priority","Assigned To User ID","Related Entity","Related Entity ID","Logged By","Created Date","Updated Date","Created By"];
    const rows = filteredTasks.map(t => [
      t.ID || "", t.Title || "", t.Description || "", formatDateTime(t["Due Date"]),
      statusMap[t.Status || t.status] || "", priorityMap[(t.Priority || t.priority || "").toLowerCase()] || "",
      t["Assigned To User ID"] || "", entityMap[(t["Related Entity"] || t.related_entity || "").toLowerCase().replace(/ /g, '_')] || "",
      t["Related Entity ID"] || t.related_entity_id || "", t["Logged By"] || t.logged_by || "",
      formatDateTime(t["Created Date"] || t.created_date), formatDateTime(t["Updated Date"] || t.updated_date),
      t["Created By"] || t.created_by || ""
    ]);

    const escapeCSV = (v) => { const s = String(v ?? ''); return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s; };
    const csv = [headers, ...rows].map(r => r.map(escapeCSV).join(',')).join('\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    link.download = `tasks_export_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.csv`;
    link.click();
  };

  const getTaskCounts = () => {
    const now = new Date();
    return {
      total: tasks.length,
      overdue: tasks.filter(t => (t.Status || t.status || '').toLowerCase() !== 'completed' && t["Due Date"] && new Date(t["Due Date"]) < now).length,
      to_do: tasks.filter(t => (t.Status || t.status || '').toLowerCase().replace(/ /g, '_') === 'to_do').length,
      in_progress: tasks.filter(t => (t.Status || t.status || '').toLowerCase().replace(/ /g, '_') === 'in_progress').length,
      completed: tasks.filter(t => (t.Status || t.status || '').toLowerCase() === 'completed').length,
      myTasks: tasks.filter(t => t["Assigned To User ID"] === currentUser?.["Full Name"] && (t.Status || t.status || '').toLowerCase() !== 'completed').length
    };
  };

  const taskCounts = getTaskCounts();

  const groupedTasks = filteredTasks.reduce((acc, task) => {
    const assignee = task["Assigned To User ID"] || 'Unassigned';
    if (!acc[assignee]) acc[assignee] = [];
    acc[assignee].push(task);
    return acc;
  }, {});

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Task Management</h1>
          <p className="text-slate-600">Track and manage tasks for your team</p>
          {currentUser && <p className="text-xs text-slate-400 mt-1">Logged in as: {currentUser.Email}</p>}
        </div>
        <div className="flex gap-2">
          <Button onClick={exportToCSV} variant="outline" className="flex items-center gap-2" disabled={loading || filteredTasks.length === 0}>
            <Download className="w-4 h-4" /> Export to CSV
          </Button>
          <Button onClick={() => setShowForm(true)} className="bg-cyan-600 hover:bg-cyan-700 shadow-sm">
            <Plus className="w-4 h-4 mr-2" /> Add New Task
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-red-50 to-orange-50 border-red-200 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilters(p => ({ ...p, status: "overdue", assignee: "all" }))}>
          <CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-xs font-medium text-red-700">Overdue</p><p className="text-2xl font-bold text-red-900 mt-1">{taskCounts.overdue}</p></div><AlertTriangle className="w-8 h-8 text-red-600" /></div></CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilters(p => ({ ...p, status: "to_do", assignee: "all" }))}>
          <CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-xs font-medium text-blue-700">To Do</p><p className="text-2xl font-bold text-blue-900 mt-1">{taskCounts.to_do}</p></div><ListTodo className="w-8 h-8 text-blue-600" /></div></CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilters(p => ({ ...p, status: "in_progress", assignee: "all" }))}>
          <CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-xs font-medium text-yellow-700">In Progress</p><p className="text-2xl font-bold text-yellow-900 mt-1">{taskCounts.in_progress}</p></div><Clock className="w-8 h-8 text-yellow-600" /></div></CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilters(p => ({ ...p, status: "completed", assignee: "all" }))}>
          <CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-xs font-medium text-green-700">Completed</p><p className="text-2xl font-bold text-green-900 mt-1">{taskCounts.completed}</p></div><CheckCircle2 className="w-8 h-8 text-green-600" /></div></CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 cursor-pointer hover:shadow-md transition-shadow" onClick={() => { if (currentUser?.["Full Name"]) setFilters(p => ({ ...p, assignee: currentUser["Full Name"], status: "all" })); }}>
          <CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-xs font-medium text-purple-700">My Tasks</p><p className="text-2xl font-bold text-purple-900 mt-1">{taskCounts.myTasks}</p></div><div className="w-8 h-8 bg-purple-200 rounded-full flex items-center justify-center"><span className="text-purple-700 font-bold text-sm">ME</span></div></div></CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <Input placeholder="Search tasks..." value={filters.search} onChange={(e) => setFilters(p => ({ ...p, search: e.target.value }))} className="pl-10" />
            </div>
            <div className="w-full md:w-48">
              <Select value={sortOrder} onValueChange={setSortOrder}>
                <SelectTrigger><SelectValue placeholder="Sort by..." /></SelectTrigger>
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
          <Tabs value={filters.status} onValueChange={(v) => setFilters(p => ({ ...p, status: v, assignee: "all" }))}>
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
          <Tabs value={filters.priority} onValueChange={(v) => setFilters(p => ({ ...p, priority: v, assignee: "all" }))}>
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
        <TaskForm_Supabase
          task={editingTask}
          users={users}
          residents={residents}
          properties={properties}
          onSubmit={handleSubmit}
          onCancel={() => { setShowForm(false); setEditingTask(null); }}
        />
      )}

      {viewingTask && (
        <TaskDetailModal
          task={viewingTask}
          assignedUser={users.find(u => u["Full Name"] === viewingTask["Assigned To User ID"])}
          onClose={() => setViewingTask(null)}
          onEdit={(task) => { setViewingTask(null); handleEdit(task); }}
        />
      )}

      {loading ? (
        <div className="text-center py-12"><p className="text-slate-500">Loading tasks...</p></div>
      ) : filteredTasks.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <ListTodo className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No tasks found</h3>
            <p className="text-slate-500 mb-4">{filters.search ? "Try adjusting your search terms" : "Get started by adding your first task"}</p>
            {!filters.search && <Button onClick={() => setShowForm(true)} className="bg-cyan-600 hover:bg-cyan-700"><Plus className="w-4 h-4 mr-2" />Add First Task</Button>}
            <div className="mt-4 text-xs text-slate-400">Total tasks in system: {tasks.length}</div>
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
                  {assignee === currentUser?.["Full Name"] && '⭐ '}{assignee}
                  <span className="ml-3 text-base font-normal text-slate-500">({groupedTasks[assignee].length} {groupedTasks[assignee].length === 1 ? 'task' : 'tasks'})</span>
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupedTasks[assignee].map(task => (
                  <TaskCard
                    key={task.ID}
                    task={task}
                    onEdit={handleEdit}
                    onViewDetails={handleViewDetails}
                    onDelete={handleDelete}
                    assignedUser={users.find(u => u["Full Name"] === task["Assigned To User ID"])}
                    assignedUserName={task["Assigned To User ID"]}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
