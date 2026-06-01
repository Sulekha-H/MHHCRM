import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Calendar, User, Clock, AlertTriangle, Trash2, Play, CheckCircle2 } from "lucide-react";
import { format, differenceInSeconds } from "date-fns";

export default function TaskCard({ task, onEdit, onViewDetails, onDelete, onStartTask, onCompleteTask, assignedUser, assignedUserName, currentUser, isRoutine }) {
  const [timeLeft, setTimeLeft] = useState(null);
  const [isOverDuration, setIsOverDuration] = useState(false);

  // Handle both Supabase and base44 field formats

  // Handle both Supabase and base44 field formats
  let title = task.Title || task.title;
  if (title === "Fiixit / CRM" || title === "Monday.com / CRM") {
    title = `- ${title}`;
  }
  const description = task.Description || task.description;
  const dueDate = task["Due Date"] || task.due_date;
  const status = task.Status || task.status;
  const priority = task.Priority || task.priority;
  const assignedToUserId = task["Assigned To User ID"] || task.assigned_to_user_id;
  const loggedBy = task["Logged By"] || task.logged_by;
  const targetDuration = task["Target Duration"] || task.target_duration;
  const actualStartTime = task["Actual Start Time"] || task.actual_start_time;

  useEffect(() => {
    let interval;
    if (status === "In Progress" && actualStartTime && targetDuration) {
      const updateTimer = () => {
        const start = new Date(actualStartTime);
        const now = new Date();
        const secondsElapsed = differenceInSeconds(now, start);
        const targetSeconds = parseInt(targetDuration) * 60;
        const remaining = targetSeconds - secondsElapsed;

        setTimeLeft(remaining);

        if (remaining <= 0 && !isOverDuration) {
          setIsOverDuration(true);
        } else if (remaining > 0) {
          setIsOverDuration(false);
        }
      };

      updateTimer();
      interval = setInterval(updateTimer, 1000);
    } else {
      setTimeLeft(null);
      setIsOverDuration(false);
    }

    return () => clearInterval(interval);
  }, [status, actualStartTime, targetDuration, title, isOverDuration]);

  const formatTimeLeft = (seconds) => {
    const absSeconds = Math.abs(seconds);
    const h = Math.floor(absSeconds / 3600);
    const m = Math.floor((absSeconds % 3600) / 60);
    const s = absSeconds % 60;
    const timeStr = `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return seconds < 0 ? `-${timeStr}` : timeStr;
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
    return colors[priority] || colors.medium || colors.Medium;
  };

  const getStatusColor = (status) => {
    const colors = {
      to_do: "bg-gray-100 text-gray-800",
      "To Do": "bg-gray-100 text-gray-800",
      in_progress: "bg-indigo-100 text-indigo-800",
      "In Progress": "bg-indigo-100 text-indigo-800",
      completed: "bg-green-100 text-green-800",
      Completed: "bg-green-100 text-green-800",
      overdue: "bg-pink-100 text-pink-800",
      Overdue: "bg-pink-100 text-pink-800"
    };
    return colors[status] || colors.to_do || colors["To Do"];
  };
  
  const dueDateObj = dueDate ? new Date(dueDate) : null;
  const isOverdue = dueDateObj && dueDateObj < new Date() && status !== 'completed' && status !== 'Completed';
  const isDueSoon = !isOverdue && dueDateObj && status !== 'completed' && status !== 'Completed' &&
                    dueDateObj.getTime() - new Date().getTime() < 3600000; // 1 hour
  const isCompleted = status === 'completed' || status === 'Completed';
  const finalAssignedUserName = assignedUserName || assignedToUserId || "Unassigned";
  const userColor = assignedUser?.display_color || assignedUser?.["Display Color"];

  const cardBorderStyle = {
    borderLeftWidth: '4px',
    borderLeftColor: isOverdue ? '#ef4444' : (userColor || '#06b6d4'),
    opacity: isCompleted ? 0.7 : 1
  };

  return (
    <Card 
      className={`hover:shadow-md transition-shadow duration-200 cursor-pointer overflow-hidden ${isOverDuration ? 'animate-pulse border-red-500' : ''} ${isRoutine ? 'bg-white' : 'bg-white'}`}
      style={cardBorderStyle}
      onClick={() => onViewDetails(task)}
    >
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 mr-2">
            <h3 className={`font-semibold text-slate-900 text-lg line-clamp-2 ${isCompleted ? 'line-through text-slate-400' : ''}`}>
              {title}
            </h3>
          </div>
          <div className="flex gap-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(task);
              }}
              className="text-slate-400 hover:text-slate-600"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(task);
              }}
              className="text-slate-400 hover:text-red-600"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 p-4">
        {/* Status and Priority */}
        <div className="flex gap-2 flex-wrap items-center">
          <Badge className={`${getStatusColor(status)} text-[10px] uppercase tracking-wider font-bold h-5 px-2`}>
            {status?.replace(/_/g, ' ')}
          </Badge>
          {!isRoutine && (
            <Badge className={`${getPriorityColor(priority)} text-[10px] uppercase tracking-wider font-bold h-5 px-2`}>
              {priority}
            </Badge>
          )}
          {isOverdue && (
            <Badge variant="destructive" className="text-[10px] uppercase tracking-wider font-bold h-5 px-2">
              <AlertTriangle className="w-2.5 h-2.5 mr-1" />
              Overdue
            </Badge>
          )}
          {isDueSoon && (
            <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-[10px] uppercase tracking-wider font-bold h-5 px-2">
              <Clock className="w-2.5 h-2.5 mr-1" />
              Due Soon
            </Badge>
          )}
          {targetDuration && (
            <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500 ml-auto">
              <Clock className="w-3 h-3" />
              {targetDuration} MIN
            </div>
          )}
        </div>
        
        {/* Description */}
        {description && (
          <div className="pt-3 border-t">
            <p className="text-sm text-slate-700 line-clamp-3">
              {description}
            </p>
          </div>
        )}

        {/* Due Date, Assignee, and Logged By - Prominent Section */}
        <div className={`pt-2 border-t space-y-1 ${isRoutine ? '' : 'bg-slate-50 rounded-lg p-2'}`}>
          {!isRoutine && (
            <div className="flex items-center gap-2 text-xs">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-500">
                Due: {dueDate ? format(new Date(dueDate), 'MMM d, HH:mm') : 'No date'}
              </span>
            </div>
          )}
          {assignedToUserId && !isRoutine && (
            <div className="flex items-center gap-2 text-xs">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-500 truncate">
                {finalAssignedUserName}
              </span>
            </div>
          )}
          {loggedBy && !isRoutine && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[10px] font-bold text-cyan-600 bg-cyan-50 px-1.5 py-0.5 rounded uppercase">By {loggedBy}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {(assignedToUserId === currentUser?.["Full Name"]) && (
          <div className="pt-2 flex gap-2">
            {status === "To Do" && (
              <Button
                size="sm"
                className="w-full bg-indigo-600 hover:bg-indigo-700"
                onClick={(e) => {
                  e.stopPropagation();
                  onStartTask(task);
                }}
              >
                <Play className="w-3 h-3 mr-2" />
                Start Task
              </Button>
            )}
            {status === "In Progress" && (
              <div className="w-full space-y-2">
                <div className={`flex items-center justify-between p-2 rounded ${isOverDuration ? 'bg-red-100 text-red-700 font-bold' : 'bg-indigo-50 text-indigo-700 font-mono'}`}>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span className="text-xs uppercase font-sans">Time Left:</span>
                  </div>
                  <span>{timeLeft !== null ? formatTimeLeft(timeLeft) : '--:--'}</span>
                </div>
                <Button
                  size="sm"
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCompleteTask(task);
                  }}
                >
                  <CheckCircle2 className="w-3 h-3 mr-2" />
                  Complete Task
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}