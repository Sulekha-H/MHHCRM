import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Calendar, User, Clock, AlertTriangle, Trash2 } from "lucide-react";
import { format } from "date-fns";

export default function TaskCard({ task, onEdit, onViewDetails, onDelete, assignedUser, assignedUserName }) {

  // Handle both Supabase and base44 field formats
  const title = task.Title || task.title;
  const description = task.Description || task.description;
  const dueDate = task["Due Date"] || task.due_date;
  const status = task.Status || task.status;
  const priority = task.Priority || task.priority;
  const assignedToUserId = task["Assigned To User ID"] || task.assigned_to_user_id;
  const loggedBy = task["Logged By"] || task.logged_by;

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
  
  const isOverdue = new Date(dueDate) < new Date() && status !== 'completed' && status !== 'Completed';
  const finalAssignedUserName = assignedUserName || assignedToUserId || "Unassigned";
  const userColor = assignedUser?.display_color || assignedUser?.["Display Color"];

  const cardBorderStyle = {
    borderLeftWidth: '4px',
    borderLeftColor: isOverdue ? '#ef4444' : (userColor || '#06b6d4')
  };

  return (
    <Card 
      className={`hover:shadow-md transition-shadow duration-200 cursor-pointer`}
      style={cardBorderStyle}
      onClick={() => onViewDetails(task)}
    >
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 mr-2">
            <h3 className="font-semibold text-slate-900 text-lg line-clamp-2">
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
      <CardContent className="space-y-4">
        {/* Status and Priority */}
        <div className="flex gap-2 flex-wrap">
          <Badge className={getStatusColor(status)}>
            {status?.replace(/_/g, ' ')}
          </Badge>
          <Badge className={getPriorityColor(priority)}>
            {priority} priority
          </Badge>
          {isOverdue && (
            <Badge variant="destructive">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Overdue
            </Badge>
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
        <div className="pt-3 border-t space-y-2 bg-slate-50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="text-slate-600 font-medium">
              Due: {dueDate ? format(new Date(dueDate), 'PPp') : 'No due date'}
            </span>
          </div>
          {assignedToUserId && (
            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-slate-400" />
              <span className="text-slate-600">
                Assigned to: {finalAssignedUserName}
              </span>
            </div>
          )}
          {loggedBy && (
            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-cyan-500" />
              <span className="font-medium text-slate-900">
                Logged by: <span className="text-cyan-700">{loggedBy}</span>
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}