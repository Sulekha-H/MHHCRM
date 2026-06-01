"use client"

import { useSession, useUser } from "@clerk/nextjs";
import React, { useState, useEffect } from "react";
import { useClerkSupabaseClient } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Plus, Download, Clock, ListTodo, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { format, addDays, subDays, isSameDay } from "date-fns";
import { injectRoutineTasks } from "@/lib/taskUtils";
import { ROUTINE_TITLES, WEEKLY_ROUTINES } from "@/lib/constants/routines";
import TaskForm_Supabase from "@/components/tasks/TaskForm";
import TaskCard from "@/components/tasks/TaskCard";
import TaskDetailModal from "@/components/tasks/TaskDetailModal";

export default function TasksPage() {
  const [mounted, setMounted] = useState(false);
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
  const [viewingTask, setViewingTask] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filters, setFilters] = useState({ assignee: "all", search: "" });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!supabase || !user) return;
    loadTasks();
  }, [supabase, user, selectedDate, filters.assignee]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const userEmail = user?.primaryEmailAddress?.emailAddress;
      let currentUserData = null;
      if (userEmail) {
        const { data: userData } = await supabase.from('users').select('*').eq('Email', userEmail).single();
        currentUserData = userData;
        setCurrentUser(userData);
      }

      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .or('Deleted.is.null,Deleted.eq.false')
        .order('Created Date', { ascending: false });

      if (tasksError) throw tasksError;

      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .or('Is Active.is.null,Is Active.eq.true');

      if (usersError) throw usersError;

      const activeUsers = Array.isArray(usersData) ? usersData.filter(u => {
        const name = u?.["Full Name"]?.trim() || '';
        return name && !['Tair', 'Iveta lobinate', 'amit noach'].includes(name) && !name.toLowerCase().includes('test');
      }) : [];

      const { data: residentsData } = await supabase.from('residents').select('*').or('Deleted.is.null,Deleted.eq.false');
      const { data: propertiesData } = await supabase.from('properties').select('*').or('Deleted.is.null,Deleted.eq.false');

      setTasks(tasksData || []);
      setUsers(activeUsers);
      setResidents(residentsData || []);
      setProperties(propertiesData || []);

      // Routine Injection Logic
      const assigneeName = filters.assignee === "all" ? currentUserData?.["Full Name"] : filters.assignee;
      const targetUser = activeUsers.find(u => u["Full Name"] === assigneeName);
      
      if (targetUser) {
        const injected = await injectRoutineTasks(supabase, targetUser, tasksData || [], selectedDate);
        if (injected) {
          const { data: updatedTasks } = await supabase.from('tasks').select('*').or('Deleted.is.null,Deleted.eq.false');
          setTasks(updatedTasks || []);
        }
      }
    } catch (error) {
      console.error("Error loading tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = [...tasks];

    // Filter by date
    filtered = filtered.filter(t => {
      const dueDate = t["Due Date"] || t.due_date;
      if (!dueDate) return false;
      return isSameDay(new Date(dueDate), selectedDate);
    });

    // Filter by assignee
    if (filters.assignee !== "all") {
      filtered = filtered.filter(t => t["Assigned To User ID"] === filters.assignee);
    }

    // Search filter
    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(t =>
        (t.Title || "").toLowerCase().includes(search) ||
        (t.Description || "").toLowerCase().includes(search)
      );
    }

    setFilteredTasks(filtered);
  }, [tasks, selectedDate, filters]);

  const handleSubmit = async (taskData) => {
    try {
      if (!taskData["Logged By"] && currentUser?.["Full Name"]) {
        taskData["Logged By"] = currentUser["Full Name"];
      }

      if (editingTask) {
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
      loadTasks();
    } catch (error) {
      alert("Error saving task: " + error.message);
    }
  };

  const handleStartTask = async (task) => {
    await supabase.from('tasks').update({ Status: "In Progress", "Actual Start Time": new Date().toISOString() }).eq('ID', task.ID);
    loadTasks();
  };

  const handleCompleteTask = async (task) => {
    const startTime = task["Actual Start Time"];
    let durationTaken = null;
    if (startTime) {
      durationTaken = Math.round((new Date() - new Date(startTime)) / (1000 * 60));
    }
    await supabase.from('tasks').update({ Status: "Completed", "Actual End Time": new Date().toISOString(), "Duration Taken": durationTaken }).eq('ID', task.ID);
    loadTasks();
  };

  const handleDelete = async (task) => {
    if (confirm("Delete this task?")) {
      await supabase.from('tasks').update({ Deleted: true, "Deleted Date": new Date().toISOString(), "Deleted By": currentUser?.["Full Name"] }).eq('ID', task.ID);
      loadTasks();
    }
  };

  const exportToCSV = () => {
    const headers = "ID,Title,Status,Priority,Assigned To\n";
    const rows = filteredTasks.map(t => `${t.ID},"${t.Title}",${t.Status},${t.Priority},"${t["Assigned To User ID"]}"`).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tasks_${format(selectedDate, 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  // Sorting Logic
  const getPriorityScore = (p) => {
    const scores = { 'Urgent': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
    return scores[p] || 0;
  };

  const dayName = format(selectedDate, 'EEEE');
  const routineTemplates = WEEKLY_ROUTINES[dayName] || [];
  const routineOrder = routineTemplates.map(r => r.title);

  const sortTasks = (list, type) => {
    return [...list].sort((a, b) => {
      // Completed at bottom
      const aComp = (a.Status || "").toLowerCase() === "completed";
      const bComp = (b.Status || "").toLowerCase() === "completed";
      if (aComp && !bComp) return 1;
      if (!aComp && bComp) return -1;

      if (type === 'routine') {
        const idxA = routineOrder.indexOf(a.Title);
        const idxB = routineOrder.indexOf(b.Title);
        return idxA - idxB;
      } else {
        // Sort misc by priority
        const pA = getPriorityScore(a.Priority);
        const pB = getPriorityScore(b.Priority);
        if (pB !== pA) return pB - pA;
        return new Date(b["Created Date"]) - new Date(a["Created Date"]);
      }
    });
  };

  const routineTasks = sortTasks(filteredTasks.filter(t => ROUTINE_TITLES.includes(t.Title)), 'routine');
  const miscTasks = sortTasks(filteredTasks.filter(t => !ROUTINE_TITLES.includes(t.Title)), 'misc');

  const upNextId = routineTasks.find(t => (t.Status || "").toLowerCase() === "to do")?.ID;

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header & Date Navigation */}
        <div className="bg-white rounded-xl shadow-sm border p-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setSelectedDate(subDays(selectedDate, 1))}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div className="text-center md:text-left min-w-[200px]">
              <h1 className="text-2xl font-bold text-slate-900">
                {isSameDay(selectedDate, new Date()) ? 'Today' : format(selectedDate, 'EEEE')}
              </h1>
              <p className="text-slate-500 font-medium">{format(selectedDate, 'do MMMM yyyy')}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setSelectedDate(addDays(selectedDate, 1))}>
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={exportToCSV} variant="outline" size="sm" className="hidden md:flex gap-2">
              <Download className="w-4 h-4" /> Export
            </Button>
            <Button onClick={() => setShowForm(true)} className="bg-cyan-600 hover:bg-cyan-700 gap-2">
              <Plus className="w-4 h-4 mr-1" /> New Task
            </Button>
          </div>
        </div>

        {/* Staff Selection Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
          <Button
            variant={filters.assignee === "all" ? "default" : "outline"}
            className={filters.assignee === "all" ? "bg-cyan-600" : ""}
            onClick={() => setFilters(f => ({ ...f, assignee: "all" }))}
            size="sm"
          >
            All Staff
          </Button>
          {users.map(u => (
            <Button
              key={u.ID}
              variant={filters.assignee === u["Full Name"] ? "default" : "outline"}
              className={filters.assignee === u["Full Name"] ? "bg-cyan-600" : ""}
              onClick={() => setFilters(f => ({ ...f, assignee: u["Full Name"] }))}
              size="sm"
            >
              {u["Full Name"].split(' ')[0]}
            </Button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search tasks..."
            className="pl-10 bg-white"
            value={filters.search}
            onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
          />
        </div>

        {/* Routine Tasks Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4" /> Routine Tasks
            </h2>
            <Badge variant="secondary" className="bg-slate-200 text-slate-600 border-none">
              {routineTasks.filter(t => (t.Status || "").toLowerCase() === "completed").length}/{routineTasks.length} Done
            </Badge>
          </div>
          <div className="bg-white rounded-xl shadow-sm border divide-y overflow-hidden">
            {routineTasks.length > 0 ? routineTasks.map(task => (
              <TaskCard
                key={task.ID}
                task={task}
                onEdit={setEditingTask}
                onViewDetails={setViewingTask}
                onDelete={handleDelete}
                onStartTask={handleStartTask}
                onCompleteTask={handleCompleteTask}
                currentUser={currentUser}
                assignedUserName={task["Assigned To User ID"]}
                isRoutine={true}
                isUpNext={task.ID === upNextId}
              />
            )) : (
              <div className="p-8 text-center text-slate-400 italic text-sm">No routines scheduled for this day</div>
            )}
          </div>
        </div>

        {/* Miscellaneous Tasks Section */}
        <div className="space-y-3 pt-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <ListTodo className="w-4 h-4" /> Miscellaneous Stuff
            </h2>
          </div>
          <div className="bg-white rounded-xl shadow-sm border divide-y overflow-hidden">
            {miscTasks.length > 0 ? miscTasks.map(task => (
              <TaskCard
                key={task.ID}
                task={task}
                onEdit={setEditingTask}
                onViewDetails={setViewingTask}
                onDelete={handleDelete}
                onStartTask={handleStartTask}
                onCompleteTask={handleCompleteTask}
                currentUser={currentUser}
                assignedUserName={task["Assigned To User ID"]}
              />
            )) : (
              <div className="p-8 text-center text-slate-400 italic text-sm">No miscellaneous tasks</div>
            )}
          </div>
        </div>

      </div>

      {(showForm || editingTask) && (
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
          onEdit={(t) => { setViewingTask(null); setEditingTask(t); }}
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
            <p className="font-medium text-slate-700">Loading...</p>
          </div>
        </div>
      )}
    </div>
  );
}
