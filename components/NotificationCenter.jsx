"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useUser } from "@clerk/nextjs";
import { useClerkSupabaseClient } from "@/lib/supabaseClient";
import {
  Bell,
  Clock,
  X,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { differenceInSeconds } from "date-fns";
import Link from 'next/link';

export default function NotificationCenter() {
  const supabase = useClerkSupabaseClient();
  const { isLoaded, isSignedIn, user } = useUser();
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [dismissedTaskIds, setDismissedTaskIds] = useState(new Set());
  const [currentUser, setCurrentUser] = useState(null);

  const loadCurrentUser = useCallback(async () => {
    if (!supabase || !user) return;
    const userEmail = user.primaryEmailAddress?.emailAddress;
    if (userEmail) {
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('Email', userEmail)
        .single();
      setCurrentUser(data);
    }
  }, [supabase, user]);

  useEffect(() => {
    loadCurrentUser();
  }, [loadCurrentUser]);

  const checkDurationExceeded = useCallback(async () => {
    // Note: Duration-based alerts are disabled because Target Duration and Actual Start Time
    // columns are not present in the current database schema.
    return;

    if (!supabase || !currentUser) return;

    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('Status', 'In Progress')
      .eq('Assigned To User ID', currentUser["Full Name"])
      .or('Deleted.is.null,Deleted.eq.false');

    if (error) {
      console.error("Error fetching tasks for notifications:", error);
      return;
    }

    const now = new Date();
    const newAlerts = tasks.filter(task => {
      const startTime = task["Actual Start Time"] || task.actual_start_time;
      const targetDuration = task["Target Duration"] || task.target_duration;

      if (!startTime || !targetDuration) return false;

      const secondsElapsed = differenceInSeconds(now, new Date(startTime));
      const targetSeconds = parseInt(targetDuration) * 60;

      return secondsElapsed >= targetSeconds;
    });

    setActiveAlerts(newAlerts);
  }, [supabase, currentUser]);

  useEffect(() => {
    checkDurationExceeded();
    const interval = setInterval(checkDurationExceeded, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [checkDurationExceeded]);

  const handleDismiss = (taskId) => {
    setDismissedTaskIds(prev => new Set([...prev, taskId]));
  };

  const visibleAlerts = activeAlerts.filter(alert => !dismissedTaskIds.has(alert.ID));

  if (!isLoaded || !isSignedIn) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full bg-slate-50 border border-slate-200">
          <Bell className="h-5 w-5 text-slate-600" />
          {visibleAlerts.length > 0 && (
            <Badge
              className="absolute -top-1 -right-1 px-1.5 py-0.5 min-w-[1.25rem] h-5 flex items-center justify-center bg-red-500 hover:bg-red-600 border-2 border-white text-[10px] font-bold"
            >
              {visibleAlerts.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 mr-4" align="end">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h4 className="font-semibold text-slate-900 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Duration Alerts
          </h4>
          <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
            {visibleAlerts.length} Active
          </Badge>
        </div>

        <ScrollArea className="h-[300px]">
          {visibleAlerts.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Bell className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-sm text-slate-500">No active duration alerts</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {visibleAlerts.map((task) => {
                const title = task.Title || task.title;
                const startTime = task["Actual Start Time"] || task.actual_start_time;
                const targetDuration = task["Target Duration"] || task.target_duration;
                const overdueMinutes = startTime ? Math.floor(differenceInSeconds(new Date(), new Date(startTime)) / 60) - (targetDuration || 0) : 0;

                return (
                  <div key={task.ID || task.id} className="p-4 hover:bg-slate-50 transition-colors group relative">
                    <div className="flex justify-between items-start mb-1 pr-6">
                      <h5 className="font-medium text-sm text-slate-900 line-clamp-1">
                        {title}
                      </h5>
                      <button
                        onClick={() => handleDismiss(task.ID || task.id)}
                        className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 mb-3 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Duration exceeded by {overdueMinutes}m
                    </p>
                    <div className="flex items-center gap-2">
                      <Link href="/tasks" className="w-full">
                        <Button size="sm" variant="outline" className="w-full text-xs h-8 flex items-center justify-center gap-2 border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:border-amber-300">
                          <ExternalLink className="w-3 h-3" />
                          View Task
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
        {visibleAlerts.length > 0 && (
          <div className="p-2 border-t border-slate-100 bg-slate-50/50">
            <p className="text-[10px] text-center text-slate-400 italic">
              Dismissing hides the alert until the next refresh.
            </p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
