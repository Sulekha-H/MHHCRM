import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, Clock, AlertTriangle, Play, Pause, CheckCircle2, Circle, Lock } from "lucide-react";
import { format, differenceInSeconds, isPast } from "date-fns";
import { parseTaskMetadata } from "@/lib/utils";
import { WEEKLY_ROUTINES, ROUTINE_TITLES, QUICK_TASKS } from "@/lib/constants/routines";

export default function TaskCard({
  task,
  onEdit,
  onViewDetails,
  onDelete,
  onStartTask,
  onPauseTask,
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
  const deadline = metadata?.deadline || dueDate;

  const isCompleted = status === 'completed' || status === 'Completed';
  const isInProgress = status === 'in_progress' || status === 'In Progress';
  const isOverdue = !isCompleted && deadline && isPast(new Date(deadline));

  // A task is expired if the deadline is past, it's not completed, and it's NOT currently running.
  // Exception: Leticia can always override.
  const userFullName = (currentUser?.["Full Name"] || currentUser?.full_name || "").trim().toLowerCase();
  const isAdmin = userFullName === 'leticia' || userFullName === 'admin';
  const isExpired = isOverdue && !isInProgress && !isAdmin;

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
          setTimeLeft(secondsElapsed + (durationTaken || 0));
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

  const formatTimeLeft = (seconds, forcePositive = false) => {
    const isNegative = !forcePositive && seconds < 0;
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

  const isRoutineInternal = isRoutine || ROUTINE_TITLES.some(t => t.trim().toLowerCase() === (title || "").trim().toLowerCase());

  // Robust header detection using titles from WEEKLY_ROUTINES
  const allHeaders = React.useMemo(() => {
    return Object.values(WEEKLY_ROUTINES)
      .flat()
      .filter(r => r.isHeader)
      .map(r => r.title.trim().toLowerCase());
  }, []);

  const isHeader = task.isHeader || allHeaders.includes(title?.trim().toLowerCase());

  const isQuickTask = React.useMemo(() => {
    const t = title?.toLowerCase() || "";
    return QUICK_TASKS.includes(t.trim());
  }, [title]);

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
          {isOverdue && !isCompleted && (
            <Badge variant="outline" className={`border-none h-4 px-1.5 text-[10px] uppercase font-bold ${isExpired ? 'bg-slate-100 text-slate-500' : 'bg-red-100 text-red-700'}`}>
              {isExpired ? 'Locked' : 'Overdue'}
            </Badge>
          )}
        </div>
        
        {/* Sub-info */}
        <div className="flex items-center gap-3 mt-0.5 text-[11px] text-slate-500">
          {!isRoutineInternal && priority && (
            <span className={`px-1.5 py-0.5 rounded ${getPriorityColor(priority)}`}>
              {priority}
            </span>
          )}
          {dueDate && !isRoutineInternal && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {format(new Date(dueDate), 'MMM d, HH:mm')}
            </span>
          )}
          {assignedUserName && !isRoutineInternal && (
            <span className="flex items-center gap-1 truncate max-w-[100px]">
              <User className="w-3 h-3" />
              {assignedUserName}
            </span>
          )}
          {(isInProgress || (durationTaken > 0 && !isCompleted)) && (
            <span className={`flex items-center gap-1 font-mono ${isInProgress ? (isOverDuration ? 'text-red-500 font-bold' : 'text-indigo-600 font-bold') : 'text-slate-500'}`}>
              <Clock className="w-3 h-3" />
              {isInProgress ? (timeLeft !== null ? formatTimeLeft(timeLeft) : 'In Progress') : formatTimeLeft(durationTaken, true)}
            </span>
          )}
          {isCompleted && durationTaken > 0 && (
            <span className="flex items-center gap-1 font-mono text-slate-400">
              <Clock className="w-3 h-3" />
              Took {formatTimeLeft(durationTaken, true)}
            </span>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        {!isCompleted && !isExpired && (
          <>
            {/* Start/Pause Button - Hidden for quick tasks */}
            {!isQuickTask && (
              isInProgress ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 text-amber-600 border-amber-200 bg-amber-50 hover:bg-amber-100 hover:text-amber-700 font-bold text-xs gap-1"
                  disabled={(assignedToUserId || "").trim().toLowerCase() !== (currentUser?.["Full Name"] || currentUser?.full_name || "").trim().toLowerCase()}
                  onClick={(e) => {
                    e.stopPropagation();
                    onPauseTask(task);
                  }}
                >
                  <Pause className="w-3 h-3 fill-current" />
                  Pause Task
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 text-indigo-600 border-indigo-200 bg-indigo-50 hover:bg-indigo-100 hover:text-indigo-700 font-bold text-xs gap-1"
                  disabled={(assignedToUserId || "").trim().toLowerCase() !== (currentUser?.["Full Name"] || currentUser?.full_name || "").trim().toLowerCase()}
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartTask(task);
                  }}
                >
                  <Play className="w-3 h-3 fill-current" />
                  Start Task
                </Button>
              )
            )}

            {/* Complete Button */}
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 text-green-600 border-green-200 bg-green-50 hover:bg-green-100 hover:text-green-700 font-bold text-xs gap-1"
              disabled={(assignedToUserId || "").trim().toLowerCase() !== (currentUser?.["Full Name"] || currentUser?.full_name || "").trim().toLowerCase()}
              onClick={(e) => {
                e.stopPropagation();
                onCompleteTask(task);
              }}
            >
              <CheckCircle2 className="w-3 h-3" />
              Complete
            </Button>
          </>
        )}

        {isCompleted && (
          <div className="flex items-center gap-1 text-green-600 font-bold text-xs px-2">
            <CheckCircle2 className="w-4 h-4" />
            Finished
          </div>
        )}

        {isExpired && !isCompleted && (
          <Badge variant="secondary" className="bg-slate-100 text-slate-500 border-none gap-1">
            <Lock className="w-3 h-3" /> Locked
          </Badge>
        )}
      </div>
    </div>
  );
}
