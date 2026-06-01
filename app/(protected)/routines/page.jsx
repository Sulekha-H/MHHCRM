"use client"

import { useUser } from "@clerk/nextjs";
import React, { useState, useEffect, useCallback } from "react";
import { useClerkSupabaseClient } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { format, addDays, subDays, isSameDay } from "date-fns";
import { ChevronLeft, ChevronRight, ClipboardCheck, Save, Loader2, CheckCircle2 } from "lucide-react";
import { OFFICE_ROUTINE_TEMPLATE } from "@/lib/constants/officeRoutines";

export default function OfficeRoutinesPage() {
  const { user } = useUser();
  const supabase = useClerkSupabaseClient();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [routineLog, setRoutineLog] = useState(null);
  const [checklist, setChecklist] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  const loadUserData = useCallback(async () => {
    if (!supabase || !user) return;
    const userEmail = user?.primaryEmailAddress?.emailAddress;
    if (userEmail) {
      const { data } = await supabase.from('users').select('*').eq('Email', userEmail).single();
      setCurrentUser(data);
    }
  }, [supabase, user]);

  const loadRoutine = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('office_routines')
        .select('*')
        .eq('Date', dateStr)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setRoutineLog(data);
        setChecklist(data.Checklist || []);
      } else {
        // Initialize from template
        const initialChecklist = OFFICE_ROUTINE_TEMPLATE.flatMap(cat =>
          cat.items.map(item => ({
            ...item,
            category: cat.category,
            completed: false,
            completedAt: null
          }))
        );
        setRoutineLog(null);
        setChecklist(initialChecklist);
      }
    } catch (error) {
      console.error("Error loading routine:", error);
    } finally {
      setLoading(false);
    }
  }, [supabase, selectedDate]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  useEffect(() => {
    loadRoutine();
  }, [loadRoutine]);

  const handleToggleItem = (itemId) => {
    setChecklist(prev => prev.map(item => {
      if (item.id === itemId) {
        const isNowCompleted = !item.completed;
        return {
          ...item,
          completed: isNowCompleted,
          completedAt: isNowCompleted ? new Date().toISOString() : null
        };
      }
      return item;
    }));
  };

  const handleSave = async () => {
    if (!supabase || !currentUser) return;
    setSaving(true);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const payload = {
        Date: dateStr,
        "Logged By": currentUser["Full Name"] || currentUser.full_name,
        Checklist: checklist,
        "Updated Date": new Date().toISOString()
      };

      if (routineLog) {
        const { error } = await supabase
          .from('office_routines')
          .update(payload)
          .eq('ID', routineLog.ID);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('office_routines')
          .insert([{
            ...payload,
            ID: crypto.randomUUID(),
            "Created Date": new Date().toISOString(),
            "Created By": currentUser.Email
          }]);
        if (error) throw error;
      }

      // Reload to get the ID if it was a new record
      await loadRoutine();
      alert("Routine saved successfully!");
    } catch (error) {
      console.error("Error saving routine:", error);
      alert("Error saving routine: " + error.message + ". Make sure the 'office_routines' table exists in the database.");
    } finally {
      setSaving(false);
    }
  };

  const completedCount = checklist.filter(i => i.completed).length;
  const totalCount = checklist.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const groupedChecklist = checklist.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border p-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setSelectedDate(subDays(selectedDate, 1))}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div className="text-center md:text-left min-w-[200px]">
              <h1 className="text-2xl font-bold text-slate-900">
                {isSameDay(selectedDate, new Date()) ? 'Today\'s Routine' : format(selectedDate, 'EEEE')}
              </h1>
              <p className="text-slate-500 font-medium">{format(selectedDate, 'do MMMM yyyy')}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setSelectedDate(addDays(selectedDate, 1))}>
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>

          <Button
            onClick={handleSave}
            disabled={saving || loading}
            className="bg-cyan-600 hover:bg-cyan-700 gap-2 min-w-[120px]"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Progress
          </Button>
        </div>

        {/* Progress Bar */}
        <Card className="overflow-hidden border-none shadow-sm">
          <div className="h-2 bg-slate-200 w-full">
            <div
              className="h-full bg-cyan-500 transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <CardContent className="p-4 flex justify-between items-center bg-white">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-cyan-600" />
              <span className="font-semibold text-slate-700">{progressPercent}% Complete</span>
            </div>
            <Badge variant="secondary" className="bg-slate-100 text-slate-600 font-medium">
              {completedCount} of {totalCount} tasks done
            </Badge>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-dashed">
            <Loader2 className="w-10 h-10 text-cyan-600 animate-spin mb-4" />
            <p className="text-slate-500 font-medium">Loading your routine...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedChecklist).map(([category, items]) => (
              <Card key={category} className="shadow-sm overflow-hidden border-slate-200">
                <CardHeader className="bg-slate-50 py-3 px-6 border-b">
                  <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500">
                    {category}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 divide-y">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className={`flex items-start gap-4 p-4 transition-colors hover:bg-slate-50/50 ${item.completed ? 'bg-slate-50/30' : ''}`}
                    >
                      <Checkbox
                        id={item.id}
                        checked={item.completed}
                        onCheckedChange={() => handleToggleItem(item.id)}
                        className="mt-0.5 border-slate-300 data-[state=checked]:bg-cyan-600 data-[state=checked]:border-cyan-600"
                      />
                      <div className="flex-1 min-w-0">
                        <label
                          htmlFor={item.id}
                          className={`text-sm font-medium cursor-pointer leading-relaxed ${item.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}
                        >
                          {item.label}
                        </label>
                        {item.completed && item.completedAt && (
                          <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-400">
                            <CheckCircle2 className="w-3 h-3 text-green-500" />
                            Completed at {format(new Date(item.completedAt), 'HH:mm')}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {routineLog && (
          <div className="text-center text-xs text-slate-400 pb-8">
            Last updated by {routineLog["Logged By"]} on {format(new Date(routineLog["Updated Date"]), 'PPp')}
          </div>
        )}
      </div>
    </div>
  );
}
