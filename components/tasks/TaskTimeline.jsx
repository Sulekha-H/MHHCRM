import React, { useEffect, useState } from 'react';
import { format, addMinutes, isSameDay, startOfDay, setHours, setMinutes, isAfter, isBefore, isEqual, differenceInMinutes, isPast } from 'date-fns';
import {
  Mail, Building, Sun, Wind, MoveHorizontal, Home, Phone, DoorOpen,
  Layout, Users, Thermometer, Wrench, HardHat, Video, Utensils,
  Receipt, FileText, Sparkles, Lock, Repeat, Coffee, CheckCircle2,
  Play, Pause, Clock, AlertCircle, HelpCircle, Inbox, Send, Camera,
  MessageSquare
} from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { parseTaskMetadata } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { QUICK_TASKS } from "@/lib/constants/routines";

const CATEGORY_COLORS = {
  communication: {
    bg: 'bg-blue-50',
    border: 'border-blue-100',
    text: 'text-blue-700',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600'
  },
  facility: {
    bg: 'bg-amber-50',
    border: 'border-amber-100',
    text: 'text-amber-700',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600'
  },
  people: {
    bg: 'bg-purple-50',
    border: 'border-purple-100',
    text: 'text-purple-700',
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600'
  },
  maintenance: {
    bg: 'bg-orange-50',
    border: 'border-orange-100',
    text: 'text-orange-700',
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600'
  },
  security: {
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    text: 'text-slate-700',
    iconBg: 'bg-slate-200',
    iconColor: 'text-slate-600'
  },
  cleaning: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-100',
    text: 'text-emerald-700',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600'
  },
  personal: {
    bg: 'bg-pink-50',
    border: 'border-pink-100',
    text: 'text-pink-700',
    iconBg: 'bg-pink-100',
    iconColor: 'text-pink-600'
  },
  admin: {
    bg: 'bg-indigo-50',
    border: 'border-indigo-100',
    text: 'text-indigo-700',
    iconBg: 'bg-indigo-100',
    iconColor: 'text-indigo-600'
  },
  default: {
    bg: 'bg-white',
    border: 'border-slate-200',
    text: 'text-slate-700',
    iconBg: 'bg-slate-100',
    iconColor: 'text-slate-600'
  }
};

const KEYWORD_MAP = {
  email: { icon: Mail, category: 'communication' },
  chat: { icon: Send, category: 'communication' },
  whatsapp: { icon: MessageSquare, category: 'communication' },
  phone: { icon: Phone, category: 'communication' },
  mobile: { icon: Phone, category: 'communication' },

  office: { icon: Building, category: 'facility' },
  blind: { icon: Sun, category: 'facility' },
  window: { icon: Wind, category: 'facility' },
  sign: { icon: MoveHorizontal, category: 'facility' },
  door: { icon: DoorOpen, category: 'facility' },

  shaila: { icon: Users, category: 'people' },
  amaani: { icon: Users, category: 'people' },
  staff: { icon: Users, category: 'people' },
  resident: { icon: Home, category: 'people' },
  uasc: { icon: Users, category: 'people' },

  nest: { icon: Thermometer, category: 'maintenance' },
  heating: { icon: Thermometer, category: 'maintenance' },
  repair: { icon: Wrench, category: 'maintenance' },
  fixiit: { icon: Wrench, category: 'maintenance' },
  contractor: { icon: HardHat, category: 'maintenance' },

  camera: { icon: Video, category: 'security' },
  ring: { icon: Video, category: 'security' },
  hik: { icon: Video, category: 'security' },
  alarm: { icon: Lock, category: 'security' },
  lock: { icon: Lock, category: 'security' },

  clean: { icon: Sparkles, category: 'cleaning' },
  rubbish: { icon: Sparkles, category: 'cleaning' },
  bin: { icon: Sparkles, category: 'cleaning' },

  lunch: { icon: Utensils, category: 'personal' },
  coffee: { icon: Coffee, category: 'personal' },
  break: { icon: Coffee, category: 'personal' },

  note: { icon: FileText, category: 'admin' },
  drive: { icon: FileText, category: 'admin' },
  file: { icon: FileText, category: 'admin' },
  uc: { icon: Camera, category: 'admin' },
  "universal credit": { icon: Camera, category: 'admin' },
};

const getTaskStyling = (title) => {
  const lowerTitle = (title || "").toLowerCase();
  for (const [key, config] of Object.entries(KEYWORD_MAP)) {
    if (lowerTitle.includes(key)) {
      return {
        Icon: config.icon,
        colors: CATEGORY_COLORS[config.category]
      };
    }
  }
  return {
    Icon: HelpCircle,
    colors: CATEGORY_COLORS.default
  };
};

export default function TaskTimeline({
  routineTasks,
  selectedDate,
  onTaskClick,
  currentUser,
  onStartTask,
  onPauseTask,
  onCompleteTask,
  upNextId
}) {
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);
  const startTime = setMinutes(setHours(startOfDay(selectedDate), 9), 45);

  const scheduledItems = React.useMemo(() => {
    let lastTime = startTime;
    const scheduled = [];
    const activeTasks = [];

    routineTasks.forEach(item => {
      if (!item) return;

      if (item.isHeader) {
        // Robustly match time patterns like "10am", "11.00", "12:30pm", "13:30"
        const timeMatch = item.title.match(/(\d+)(?:[:.](\d+))?\s*(am|pm)?/i);
        if (timeMatch) {
          let hours = parseInt(timeMatch[1]);
          const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
          let period = timeMatch[3]?.toLowerCase();

          if (!period && hours < 12) {
            // Heuristic for office hours: 7am-11am are AM, others PM
            period = (hours >= 7 && hours <= 11) ? 'am' : 'pm';
          }

          if (period === 'pm' && hours < 12) hours += 12;
          if (period === 'am' && hours === 12) hours = 0;

          const headerTime = setMinutes(setHours(startOfDay(selectedDate), hours), minutes);
          // Always reset lastTime to the header time to prevent cumulative drift
          // and allow tasks to overlap if they exceed their time slot.
          lastTime = headerTime;
        }

        // Give header a synthetic duration so it doesn't overlap with the next task
        scheduled.push({ ...item, startTime: lastTime, isHeader: true });
        lastTime = addMinutes(lastTime, 15);
        return;
      }

      const metadata = parseTaskMetadata(item.Description || item.description);
      const duration = parseInt(metadata?.targetDuration || 15);
      const taskStartTime = lastTime;
      const taskEndTime = addMinutes(taskStartTime, duration);

      // Lane allocation for overlaps
      let lane = 0;
      // Remove tasks that ended before this one started
      for (let i = activeTasks.length - 1; i >= 0; i--) {
        if (isBefore(activeTasks[i].endTime, taskStartTime) || isEqual(activeTasks[i].endTime, taskStartTime)) {
          activeTasks.splice(i, 1);
        }
      }

      // Find smallest available lane
      while (activeTasks.some(t => t.lane === lane)) {
        lane++;
      }
      activeTasks.push({ endTime: taskEndTime, lane });

      scheduled.push({
        ...item,
        startTime: taskStartTime,
        endTime: taskEndTime,
        duration,
        lane
      });

      lastTime = taskEndTime;
    });

    return scheduled;
  }, [routineTasks, startTime, selectedDate]);

  const PIXELS_PER_MINUTE = 6; // 90px per 15 mins

  const timelineEndTime = React.useMemo(() => {
    const defaultEnd = setMinutes(setHours(startOfDay(selectedDate), 17), 0);
    if (scheduledItems.length === 0) return defaultEnd;

    let maxEnd = defaultEnd;
    scheduledItems.forEach(item => {
      const itemEnd = item.isHeader ? addMinutes(item.startTime, 15) : item.endTime;
      if (isAfter(itemEnd, maxEnd)) {
        maxEnd = itemEnd;
      }
    });

    return maxEnd;
  }, [scheduledItems, selectedDate]);

  const intervals = React.useMemo(() => {
    const items = [];
    let current = startTime;
    while (current <= timelineEndTime) {
      items.push(new Date(current));
      current = addMinutes(current, 15);
    }
    return items;
  }, [startTime, timelineEndTime]);

  const currentTimeTop = React.useMemo(() => {
    if (!isSameDay(now, selectedDate)) return null;
    if (isBefore(now, startTime) || isAfter(now, timelineEndTime)) return null;
    return differenceInMinutes(now, startTime) * PIXELS_PER_MINUTE;
  }, [now, selectedDate, startTime, timelineEndTime]);

  const totalHeight = differenceInMinutes(timelineEndTime, startTime) * PIXELS_PER_MINUTE;

  const userFullName = (currentUser?.["Full Name"] || currentUser?.full_name || "").trim().toLowerCase();
  const isAdmin = userFullName === 'leticia' || userFullName === 'admin';

  if (!mounted) return null;

  return (
    <div className="bg-white rounded-3xl shadow-sm border p-6 flex flex-col">
      <div className="flex items-center justify-between mb-8 px-2">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Clock className="w-5 h-5 text-slate-400" /> Routine Tasks
        </h2>
        <Badge variant="secondary" className="rounded-full bg-slate-100 text-slate-500 border-none px-3">
          9:45 - 17:00
        </Badge>
      </div>

      <div className="relative pt-4" style={{ height: `${totalHeight + 100}px` }}>
        {/* Vertical Line */}
        <div className="absolute left-[40px] top-0 bottom-0 w-[2px] bg-slate-100 rounded-full" />

        {/* Time Markers */}
        <div className="space-y-0 absolute inset-0">
          {intervals.map((time, i) => {
            const minutes = time.getMinutes();
            const isHour = minutes === 0;
            const isHalf = minutes === 30;

            return (
              <div key={i} className="flex items-start h-[90px] relative">
                {/* Time Label on the left - Narrowed */}
                <div className={cn(
                  "w-10 text-right pr-3 mt-[-8px] transition-colors",
                  isHour ? "text-[10px] font-bold text-slate-900" : "text-[9px] font-medium text-slate-300"
                )}>
                  {isHour ? format(time, 'HH:mm') : format(time, 'mm')}
                </div>

                {/* Horizontal Tick */}
                <div className={cn(
                  "absolute left-[38px] top-0 h-[2px] rounded-full z-10",
                  isHour ? "w-3 bg-slate-300" :
                  isHalf ? "w-2 bg-slate-200" :
                  "w-1.5 bg-slate-100"
                )} />
              </div>
            );
          })}
        </div>

        {/* Current Time Indicator */}
        {currentTimeTop !== null && (
          <div
            className="absolute left-0 right-0 z-50 flex items-center pointer-events-none"
            style={{ top: `${currentTimeTop}px` }}
          >
            <div className="w-10 text-right pr-3 text-[9px] font-bold text-red-500 bg-white/50">
              {format(now, 'HH:mm')}
            </div>
            <div className="relative flex-1 h-[2px] bg-red-500/50">
              <div className="absolute left-[-2px] top-[-3px] w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
            </div>
          </div>
        )}

        {/* Task Items */}
        <div className="absolute top-0 left-[56px] right-2">
          {scheduledItems.map((item) => {
            const startOffset = differenceInMinutes(item.startTime, startTime);
            const top = startOffset * PIXELS_PER_MINUTE;

            if (item.isHeader) {
              return (
                <div
                  key={item.ID}
                  className="absolute left-0 right-0 border-y border-slate-100 bg-slate-50/50 px-3 py-1.5 z-10"
                  style={{ top: `${top}px` }}
                >
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    {item.title}
                  </span>
                </div>
              );
            }

            const height = item.duration * PIXELS_PER_MINUTE;
            const status = (item.Status || item.status || "").toLowerCase();
            const isCompleted = status === 'completed';

            // If the user wants completed tasks at the bottom, we hide them from the timeline
            // to keep it focused on what's left to do.
            if (isCompleted && !item.isHeader) return null;

            const isInProgress = status === 'in progress';

            const metadata = parseTaskMetadata(item.Description || item.description);
            const deadline = metadata?.deadline || item["Due Date"] || item.due_date;
            const isOverdue = !isCompleted && deadline && isPast(new Date(deadline));
            const isExpired = isOverdue && !isInProgress && !isAdmin;
            const isQuickTask = QUICK_TASKS.includes((item.Title || item.title || "").toLowerCase().trim());

            const { Icon, colors } = getTaskStyling(item.Title || item.title);
            const assignedTo = (item["Assigned To User ID"] || item.assigned_to_user_id || "").trim().toLowerCase();
            const isOwnTask = assignedTo === userFullName;

            return (
              <div
                key={item.ID}
                onClick={() => onTaskClick(item)}
                className={cn(
                  "absolute rounded-2xl border p-3 cursor-pointer transition-all duration-300 hover:scale-[1.005] hover:shadow-md active:scale-[0.995] z-20 flex items-center gap-3 group overflow-hidden",
                  isCompleted ? 'bg-slate-50 border-slate-200 opacity-60' :
                  isInProgress ? 'bg-white border-indigo-500 ring-4 ring-indigo-50 shadow-indigo-100 shadow-lg' :
                  item.ID === upNextId ? 'bg-cyan-50/50 border-cyan-200 shadow-cyan-100 shadow-md ring-2 ring-cyan-100' :
                  `${colors.bg} ${colors.border} shadow-sm`
                )}
                style={{
                  top: `${top}px`,
                  height: `${height - 8}px`,
                  minHeight: '36px',
                  left: `${(item.lane || 0) * 24}px`,
                  right: `${(item.lane || 0) * 4}px`,
                  zIndex: 20 + (item.lane || 0)
                }}
              >
                {/* Category Icon */}
                <div className={cn(
                  "p-2 rounded-xl transition-transform group-hover:scale-110 shrink-0",
                  isCompleted ? 'bg-slate-200 text-slate-500' :
                  isInProgress ? 'bg-indigo-100 text-indigo-600' :
                  colors.iconBg + ' ' + colors.iconColor
                )}>
                  <Icon className="w-4 h-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className={cn(
                      "text-[13px] font-bold truncate transition-colors leading-tight",
                      isCompleted ? 'line-through text-slate-400' : 'text-slate-900',
                      isInProgress && 'text-indigo-900'
                    )}>
                      {item.Title || item.title}
                    </h4>
                    {item.ID === upNextId && !isCompleted && (
                      <Badge className="bg-cyan-100 text-cyan-700 hover:bg-cyan-100 border-none text-[9px] h-3.5 px-1.5 font-bold uppercase tracking-tighter shrink-0">
                        Next
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={cn(
                      "text-[9px] font-bold tracking-tight uppercase",
                      isCompleted ? 'text-slate-400' : colors.text
                    )}>
                      {item.duration} mins • {format(item.startTime, 'HH:mm')}
                    </span>
                    {isOverdue && !isCompleted && (
                      <Badge variant="outline" className={cn(
                        "border-none h-3.5 px-1.5 text-[8px] uppercase font-bold",
                        isExpired ? 'bg-slate-100 text-slate-500' : 'bg-red-100 text-red-700'
                      )}>
                        {isExpired ? 'Locked' : 'Overdue'}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
                  {!isCompleted && !isExpired && (
                    <>
                      {!isQuickTask && (
                        isInProgress ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-amber-600 border-amber-200 bg-amber-50 hover:bg-amber-100 text-[10px] font-bold gap-1"
                            disabled={!isOwnTask}
                            onClick={() => onPauseTask(item)}
                          >
                            <Pause className="w-3 h-3 fill-current" /> Pause
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-indigo-600 border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-[10px] font-bold gap-1"
                            disabled={!isOwnTask}
                            onClick={() => onStartTask(item)}
                          >
                            <Play className="w-3 h-3 fill-current" /> Start
                          </Button>
                        )
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 text-green-600 border-green-200 bg-green-50 hover:bg-green-100 text-[10px] font-bold gap-1"
                        disabled={!isOwnTask}
                        onClick={() => onCompleteTask(item)}
                      >
                        <CheckCircle2 className="w-3 h-3" /> Done
                      </Button>
                    </>
                  )}
                  {isCompleted && (
                    <div className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1 text-[10px] font-bold">
                      <CheckCircle2 className="w-3 h-3" /> Finished
                    </div>
                  )}
                  {isExpired && !isCompleted && (
                     <Lock className="w-3 h-3 text-slate-400" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
