import React, { useEffect, useState } from 'react';
import { format, addMinutes, isSameDay, startOfDay, setHours, setMinutes, isAfter, isBefore, isEqual, differenceInMinutes } from 'date-fns';
import {
  Mail, Building, Sun, Wind, MoveHorizontal, Home, Phone, DoorOpen,
  Layout, Users, Thermometer, Wrench, HardHat, Video, Utensils,
  Receipt, FileText, Sparkles, Lock, Repeat, Coffee, CheckCircle2,
  Play, Pause, Clock, AlertCircle, HelpCircle, Inbox, Send, Camera,
  MessageSquare
} from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { parseTaskMetadata } from "@/lib/utils";
import { cn } from "@/lib/utils";

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
  const lowerTitle = title.toLowerCase();
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

export default function TaskTimeline({ routineTasks, selectedDate, onTaskClick, currentUser }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const startTime = setMinutes(setHours(startOfDay(selectedDate), 9), 45);
  const endTime = setMinutes(setHours(startOfDay(selectedDate), 17), 0);

  const intervals = [];
  let current = startTime;
  while (current <= endTime) {
    intervals.push(new Date(current));
    current = addMinutes(current, 15);
  }

  const scheduledTasks = React.useMemo(() => {
    let lastTime = startTime;
    const scheduled = [];

    routineTasks.forEach(item => {
      if (item.isHeader) {
        const timeMatch = item.title.match(/(\d+)(?:\.(\d+))?\s*(am|pm)/i);
        if (timeMatch) {
          let hours = parseInt(timeMatch[1]);
          const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
          const period = timeMatch[3].toLowerCase();

          if (period === 'pm' && hours < 12) hours += 12;
          if (period === 'am' && hours === 12) hours = 0;

          const headerTime = setMinutes(setHours(startOfDay(selectedDate), hours), minutes);
          if (isAfter(headerTime, lastTime)) {
            lastTime = headerTime;
          }
        }
        return;
      }

      const metadata = parseTaskMetadata(item.Description || item.description);
      if (!metadata || !metadata.targetDuration) return;

      const duration = parseInt(metadata.targetDuration);
      const taskStartTime = lastTime;
      const taskEndTime = addMinutes(taskStartTime, duration);

      scheduled.push({
        ...item,
        startTime: taskStartTime,
        endTime: taskEndTime,
        duration
      });

      lastTime = taskEndTime;
    });

    return scheduled;
  }, [routineTasks, startTime, selectedDate]);

  const PIXELS_PER_MINUTE = 3; // 45px per 15 mins

  const currentTimeTop = React.useMemo(() => {
    if (!isSameDay(now, selectedDate)) return null;
    if (isBefore(now, startTime) || isAfter(now, endTime)) return null;
    return differenceInMinutes(now, startTime) * PIXELS_PER_MINUTE;
  }, [now, selectedDate, startTime, endTime]);

  return (
    <div className="bg-white rounded-3xl shadow-sm border p-6 h-[calc(100vh-250px)] flex flex-col">
      <div className="flex items-center justify-between mb-6 px-2">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Clock className="w-5 h-5 text-slate-400" /> Timeline
        </h2>
        <Badge variant="secondary" className="rounded-full bg-slate-100 text-slate-500 border-none px-3">
          9:45 - 17:00
        </Badge>
      </div>

      <ScrollArea className="flex-1 pr-4">
        <div className="relative pt-4 pb-12">
          {/* Vertical Line */}
          <div className="absolute left-[64px] top-0 bottom-0 w-[2px] bg-slate-100 rounded-full" />

          {/* Time Markers */}
          <div className="space-y-0">
            {intervals.map((time, i) => {
              const minutes = time.getMinutes();
              const isHour = minutes === 0;
              const isQuarter = minutes === 15 || minutes === 45;
              const isHalf = minutes === 30;

              return (
                <div key={i} className="flex items-start h-[45px] relative">
                  {/* Time Label on the left */}
                  <div className={cn(
                    "w-12 text-right pr-4 mt-[-8px] transition-colors",
                    isHour ? "text-[11px] font-bold text-slate-900" : "text-[10px] font-medium text-slate-300"
                  )}>
                    {isHour ? format(time, 'HH:mm') : format(time, 'mm')}
                  </div>

                  {/* Horizontal Tick */}
                  <div className={cn(
                    "absolute left-[60px] top-0 h-[2px] rounded-full z-10",
                    isHour ? "w-3 bg-slate-400" :
                    isHalf ? "w-2 bg-slate-300" :
                    "w-1.5 bg-slate-200"
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
              <div className="w-12 text-right pr-4 text-[10px] font-bold text-red-500">
                {format(now, 'HH:mm')}
              </div>
              <div className="relative flex-1 h-[2px] bg-red-500/50">
                {/* Dot aligned with vertical line (64px from left of parent) */}
                {/* Since flex-1 starts after w-12 (48px), we need 64 - 48 = 16px */}
                <div className="absolute left-[16px] top-[-3px] w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
              </div>
            </div>
          )}

          {/* Task Bubbles */}
          <div className="absolute top-0 left-[84px] right-2">
            {scheduledTasks.map((task) => {
              const startOffset = differenceInMinutes(task.startTime, startTime);
              const top = startOffset * PIXELS_PER_MINUTE;
              const height = task.duration * PIXELS_PER_MINUTE;

              const status = (task.Status || task.status || "").toLowerCase();
              const isCompleted = status === 'completed';
              const isInProgress = status === 'in progress';

              const { Icon, colors } = getTaskStyling(task.Title || task.title);

              return (
                <React.Fragment key={task.ID}>
                  {/* Task Times on the left of vertical line */}
                  <div
                    className="absolute left-[-84px] w-12 text-right pr-4 flex flex-col justify-between z-20 pointer-events-none"
                    style={{ top: `${top}px`, height: `${height}px` }}
                  >
                    <span className="text-[10px] font-bold text-slate-600 bg-white/80 backdrop-blur-sm rounded px-1 -mt-1">
                      {format(task.startTime, 'HH:mm')}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 bg-white/80 backdrop-blur-sm rounded px-1 -mb-1">
                      {format(task.endTime, 'HH:mm')}
                    </span>
                  </div>

                  <div
                    onClick={() => onTaskClick(task)}
                    className={cn(
                      "absolute left-0 right-0 rounded-[24px] border p-4 cursor-pointer transition-all duration-300 hover:scale-[1.01] hover:shadow-lg active:scale-[0.99] z-10 flex items-center gap-4 group",
                      isCompleted ? 'bg-slate-50 border-slate-200 opacity-60' :
                      isInProgress ? 'bg-white border-indigo-300 ring-4 ring-indigo-50 shadow-indigo-100 shadow-xl' :
                      `${colors.bg} ${colors.border} shadow-sm`
                    )}
                    style={{
                      top: `${top}px`,
                      height: `${height - 4}px`,
                      minHeight: '41px'
                    }}
                  >
                    {/* Category Icon */}
                    <div className={cn(
                      "p-3 rounded-2xl transition-transform group-hover:scale-110",
                      isCompleted ? 'bg-slate-200 text-slate-500' :
                      isInProgress ? 'bg-indigo-100 text-indigo-600' :
                      colors.iconBg + ' ' + colors.iconColor
                    )}>
                      <Icon className="w-6 h-6" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className={cn(
                        "text-sm font-bold truncate transition-colors",
                        isCompleted ? 'line-through text-slate-400' : 'text-slate-900',
                        isInProgress && 'text-indigo-900'
                      )}>
                        {task.Title || task.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={cn(
                          "text-[10px] font-bold tracking-tight uppercase",
                          isCompleted ? 'text-slate-400' : colors.text
                        )}>
                          {task.duration} mins
                        </span>
                        {isInProgress && (
                          <Badge className="bg-indigo-500 text-[9px] h-4 px-1.5 rounded-full border-none animate-pulse">
                            Active
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col justify-center">
                      {isCompleted ? (
                        <div className="bg-green-100 p-1.5 rounded-full">
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                        </div>
                      ) : isInProgress ? (
                        <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-ping" />
                      ) : (
                        <div className="w-8 h-8 rounded-full border-2 border-slate-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Play className="w-3 h-3 text-slate-400 fill-slate-400" />
                        </div>
                      )}
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
