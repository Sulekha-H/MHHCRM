import React from 'react';
import { format, addMinutes, isSameDay, startOfDay, setHours, setMinutes, isAfter, isBefore, isEqual } from 'date-fns';
import {
  Mail, Building, Sun, Wind, MoveHorizontal, Home, Phone, DoorOpen,
  Layout, Users, Thermometer, Wrench, HardHat, Video, Utensils,
  Receipt, FileText, Sparkles, Lock, Repeat, Coffee, CheckCircle2,
  Play, Pause, Clock, AlertCircle, HelpCircle, Inbox, Send, Camera
} from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { parseTaskMetadata } from "@/lib/utils";

const ICON_MAP = {
  email: Mail,
  office: Building,
  blind: Sun,
  window: Wind,
  sign: MoveHorizontal,
  homeless: Home,
  phone: Phone,
  mobile: Phone,
  whatsapp: Phone,
  vacancy: DoorOpen,
  void: DoorOpen,
  "team up": Layout,
  whiteboard: Layout,
  shaila: Users,
  amaani: Users,
  staff: Users,
  nest: Thermometer,
  heating: Thermometer,
  repair: Wrench,
  fixiit: Wrench,
  contractor: HardHat,
  camera: Video,
  ring: Video,
  hik: Video,
  lunch: Utensils,
  "council tax": Receipt,
  note: FileText,
  "google drive": FileText,
  clean: Sparkles,
  rubbish: Sparkles,
  bin: Sparkles,
  alarm: Lock,
  lock: Lock,
  handover: Repeat,
  "move in": Inbox,
  uc: Camera,
  "universal credit": Camera,
  uasc: Users,
  "google chat": Send,
};

const getIconForTask = (title) => {
  const lowerTitle = title.toLowerCase();
  for (const [key, Icon] of Object.entries(ICON_MAP)) {
    if (lowerTitle.includes(key)) return <Icon className="w-4 h-4" />;
  }
  return <HelpCircle className="w-4 h-4" />;
};

const TimelineMarker = ({ time, isHour }) => (
  <div className="flex items-center gap-3 h-12">
    <div className={`text-[10px] font-bold w-10 text-right ${isHour ? 'text-slate-900' : 'text-slate-400'}`}>
      {time}
    </div>
    <div className={`flex-1 border-t ${isHour ? 'border-slate-300' : 'border-slate-100'}`} />
  </div>
);

export default function TaskTimeline({ routineTasks, selectedDate, onTaskClick, currentUser }) {
  const startTime = setMinutes(setHours(startOfDay(selectedDate), 9), 45);
  const endTime = setMinutes(setHours(startOfDay(selectedDate), 17), 0);

  // Generate 15-minute intervals
  const intervals = [];
  let current = startTime;
  while (current <= endTime) {
    intervals.push(new Date(current));
    current = addMinutes(current, 15);
  }

  // Scheduling Logic
  const scheduledTasks = React.useMemo(() => {
    let lastTime = startTime;
    const scheduled = [];

    routineTasks.forEach(item => {
      if (item.isHeader) {
        // Try to parse time from header like "10am-11am"
        const timeMatch = item.title.match(/(\d+)(?:\.(\d+))?\s*(am|pm)/i);
        if (timeMatch) {
          let hours = parseInt(timeMatch[1]);
          const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
          const period = timeMatch[3].toLowerCase();

          if (period === 'pm' && hours < 12) hours += 12;
          if (period === 'am' && hours === 12) hours = 0;

          const headerTime = setMinutes(setHours(startOfDay(selectedDate), hours), minutes);

          // Only jump forward to header time, don't go backwards if we're already ahead
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

  return (
    <div className="bg-white rounded-xl shadow-sm border p-4 h-[calc(100vh-250px)] flex flex-col">
      <div className="flex items-center justify-between mb-4 px-2">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <Clock className="w-4 h-4" /> Timeline
        </h2>
        <Badge variant="outline" className="text-[10px] border-slate-200">9:45 - 17:00</Badge>
      </div>

      <ScrollArea className="flex-1 pr-4">
        <div className="relative pl-12">
          {/* Vertical Line */}
          <div className="absolute left-[51px] top-0 bottom-0 w-0.5 border-l border-dashed border-slate-200" />

          {/* Time Markers */}
          <div className="space-y-0">
            {intervals.map((time, i) => {
              const isHour = time.getMinutes() === 0;
              const isScheduled = scheduledTasks.some(t =>
                (isEqual(time, t.startTime) || isAfter(time, t.startTime)) && isBefore(time, t.endTime)
              );

              return (
                <div key={i} className="flex items-start gap-4 h-12 relative group">
                  <div className={`text-[10px] font-bold w-10 text-right mt-[-6px] transition-colors ${isHour ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-600'}`}>
                    {format(time, 'HH:mm')}
                  </div>

                  {/* Horizontal Tick */}
                  <div className={`absolute left-[48px] top-0 w-2 h-0.5 rounded-full ${isHour ? 'bg-slate-400' : 'bg-slate-200'}`} />

                  {/* Free Time Marker */}
                  {!isScheduled && (
                    <div className="ml-8 text-[9px] text-slate-300 font-medium italic opacity-0 group-hover:opacity-100 transition-opacity">
                      Free time
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Task Bubbles */}
          <div className="absolute top-0 left-16 right-0">
            {scheduledTasks.map((task) => {
              const startOffset = (task.startTime - startTime) / (1000 * 60); // minutes
              const duration = (task.endTime - task.startTime) / (1000 * 60);

              const top = (startOffset / 15) * 48; // 48px per 15 mins
              const height = (duration / 15) * 48;

              const status = (task.Status || task.status || "").toLowerCase();
              const isCompleted = status === 'completed';
              const isInProgress = status === 'in progress';

              return (
                <div
                  key={task.ID}
                  onClick={() => onTaskClick(task)}
                  className={`absolute left-0 right-0 rounded-xl border p-2 cursor-pointer transition-all hover:scale-[1.02] hover:shadow-md z-10 overflow-hidden ${
                    isCompleted ? 'bg-slate-50 border-slate-200 opacity-60' :
                    isInProgress ? 'bg-indigo-50 border-indigo-200 ring-2 ring-indigo-500 ring-offset-1' :
                    'bg-white border-slate-200 shadow-sm'
                  }`}
                  style={{
                    top: `${top}px`,
                    height: `${height - 4}px`,
                    minHeight: '44px'
                  }}
                >
                  <div className="flex items-start gap-2 h-full">
                    <div className={`mt-0.5 p-1 rounded-lg ${
                      isCompleted ? 'bg-slate-200 text-slate-500' :
                      isInProgress ? 'bg-indigo-100 text-indigo-600' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {getIconForTask(task.Title || task.title)}
                    </div>
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <h4 className={`text-xs font-bold truncate ${isCompleted ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                        {task.Title || task.title}
                      </h4>
                      <p className="text-[10px] text-slate-500 font-medium">
                        {format(task.startTime, 'HH:mm')} - {format(task.endTime, 'HH:mm')} ({task.duration}m)
                      </p>
                    </div>
                    <div className="flex flex-col justify-between items-end h-full">
                      {isCompleted ? (
                        <CheckCircle2 className="w-3 h-3 text-green-500" />
                      ) : isInProgress ? (
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
