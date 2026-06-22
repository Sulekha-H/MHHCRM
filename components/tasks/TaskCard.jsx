import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, Clock, AlertTriangle, Play, CheckCircle2, Circle } from "lucide-react";
import { format, differenceInSeconds } from "date-fns";
import { parseTaskMetadata } from "@/lib/utils";
import { WEEKLY_ROUTINES } from "@/lib/constants/routines";

export default function TaskCard({
  task,
  onEdit,
  onViewDetails,
  onDelete,
  onStartTask,
  onCompleteTask,
  assignedUser,
  assignedUserName,
  currentUser,
  isRoutine,
  isUpNext
}) {
  const [timeLeft, setTimeLeft] = useState(null);
  const [isOverDuration, setIsOverDuration] = useState(false);

  let title = task.Title || task.title;
  const description = task.Description || task.description;
  const dueDate = task["Due Date"] || task.due_date;
  const status = task.Status || task.status;
  const priority = task.Priority || task.priority;
  const assignedToUserId = task["Assigned To User ID"] || task.assigned_to_user_id || task.assigned_to;
  const loggedBy = task["Logged By"] || task.logged_by;

  // Use metadata from Description field
  const metadata = parseTaskMetadata(description);
  const targetDuration = metadata?.targetDuration;
  const actualStartTime = metadata?.actualStartTime;
  const durationTaken = metadata?.durationTaken;

  useEffect(() => {
    let interval;
    if (status === "In Progress" && actualStartTime) {
      const updateTimer = () => {
        const start = new Date(actualStartTime);
        const now = new Date();
        const secondsElapsed = differenceInSeconds(now, start);

        if (targetDuration) {
          const targetSeconds = parseInt(targetDuration) * 60;
          const remaining = targetSeconds - secondsElapsed;
          setTimeLeft(remaining);
          if (remaining <= 0 && !isOverDuration) {
            setIsOverDuration(true);
          } else if (remaining > 0) {
            setIsOverDuration(false);
          }
        } else {
          // If no target, just show elapsed time
          setTimeLeft(secondsElapsed);
        }
      };

      updateTimer();
      interval = setInterval(updateTimer, 1000);
    } else {
      setTimeLeft(null);
      setIsOverDuration(false);
    }

    return () => clearInterval(interval);
  }, [status, actualStartTime, targetDuration, isOverDuration]);

  const formatTimeLeft = (seconds) => {
    const isNegative = seconds < 0;
    const absSeconds = Math.abs(seconds);
    const h = Math.floor(absSeconds / 3600);
    const m = Math.floor((absSeconds % 3600) / 60);
    const s = absSeconds % 60;
    const timeStr = `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

    if (targetDuration) {
      return isNegative ? `-${timeStr}` : timeStr;
    }
    return timeStr; // Elapsed time
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: "bg-blue-100 text-blue-800",
      Low: "bg-blue-100 text-blue-800",
      medium: "bg-yellow-100 text-yellow-800",
      Medium: "bg-yellow-100 text-yellow-800",
      high: "bg-orange-100 text-orange-800",
      High: "bg-orange-100 text-orange-800",
      urgent: "bg-red-100 text-red-800",
      Urgent: "bg-red-100 text-red-800"
    };
    return colors[priority] || colors.medium;
  };

  const isCompleted = status === 'completed' || status === 'Completed';
  const isInProgress = status === 'in_progress' || status === 'In Progress';
  const isOverdue = !isCompleted && dueDate && new Date(dueDate) < new Date();

  // Robust header detection using titles from WEEKLY_ROUTINES
  const allHeaders = React.useMemo(() => {
    return Object.values(WEEKLY_ROUTINES)
      .flat()
      .filter(r => r.isHeader)
      .map(r => r.title.trim().toLowerCase());
  }, []);

  const isHeader = task.isHeader || allHeaders.includes(title?.trim().toLowerCase());

  if (isHeader) {
    return (
      <div className="bg-slate-50 px-4 py-3 border-y border-slate-200 mt-4 first:mt-0">
        <h3 className="text-xs font-bold text-slate-600 uppercase tracking-widest">
          {title}
        </h3>
      </div>
    );
  }

  return (
    <div
      onClick={() => onViewDetails(task)}
      className={`group flex items-center gap-4 p-3 bg-white border-b hover:bg-slate-50 transition-colors cursor-pointer relative ${isUpNext ? 'bg-cyan-50/30 border-l-4 border-l-cyan-500' : 'border-l-4 border-l-transparent'} ${isCompleted ? 'opacity-60' : ''}`}
    >
      {/* Checkbox Icon */}
      <div
        className="flex-shrink-0"
        onClick={(e) => {
          e.stopPropagation();
          onCompleteTask(task);
        }}
      >
        {isCompleted ? (
          <CheckCircle2 className="w-5 h-5 text-green-500" />
        ) : (
          <Circle className="w-5 h-5 text-slate-300 group-hover:text-cyan-500 transition-colors" />
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className={`text-sm font-medium truncate ${isCompleted ? 'line-through text-slate-400' : 'text-slate-900'}`}>
            {title}
          </h3>
          {isUpNext && (
            <Badge className="bg-cyan-100 text-cyan-700 hover:bg-cyan-100 border-none text-[10px] h-4 px-1.5 font-bold uppercase tracking-tight">
              Up Next
            </Badge>
          )}
          {isOverdue && (
            <AlertTriangle className="w-3 h-3 text-red-500" />
          )}
        </div>
        
        {/* Sub-info */}
        <div className="flex items-center gap-3 mt-0.5 text-[11px] text-slate-500">
          {!isRoutine && priority && (
            <span className={`px-1.5 py-0.5 rounded ${getPriorityColor(priority)}`}>
              {priority}
            </span>
          )}
          {dueDate && !isRoutine && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {format(new Date(dueDate), 'MMM d, HH:mm')}
            </span>
          )}
          {assignedUserName && !isRoutine && (
            <span className="flex items-center gap-1 truncate max-w-[100px]">
              <User className="w-3 h-3" />
              {assignedUserName}
            </span>
          )}
          {isInProgress && (
            <span className={`flex items-center gap-1 font-mono ${isOverDuration ? 'text-red-500 font-bold' : 'text-indigo-600'}`}>
              <Clock className="w-3 h-3" />
              {timeLeft !== null ? formatTimeLeft(timeLeft) : 'In Progress'}
            </span>
          )}
          {isCompleted && durationTaken && (
            <span className="flex items-center gap-1 font-mono text-slate-400">
              <Clock className="w-3 h-3" />
              Took {formatTimeLeft(durationTaken)}
            </span>
          )}
        </div>
      </div>

      {/* Action Buttons (Visible on hover or if in progress) */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {!isCompleted && !isInProgress && (assignedToUserId || "").trim().toLowerCase() === (currentUser?.["Full Name"] || currentUser?.full_name || "").trim().toLowerCase() && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
            onClick={(e) => {
              e.stopPropagation();
              onStartTask(task);
            }}
          >
            <Play className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
