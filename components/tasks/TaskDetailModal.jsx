import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
    CheckSquare, Calendar, User, Clock, AlertTriangle, Edit, Info, Trash2, Play, Pause, CheckCircle2, Lock
} from 'lucide-react';
import { format, isPast } from 'date-fns';
import { parseTaskMetadata } from '@/lib/utils';
import { ROUTINE_TITLES, QUICK_TASKS } from '@/lib/constants/routines';

const DetailItem = ({ icon, label, children }) => (
  <div className="flex items-start gap-4">
    <div className="flex-shrink-0 w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
      {React.cloneElement(icon, { className: "w-5 h-5 text-slate-600" })}
    </div>
    <div>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <div className="text-md font-semibold text-slate-900">{children || <span className="text-sm font-normal text-slate-400">Not provided</span>}</div>
    </div>
  </div>
);

export default function TaskDetailModal({ task, assignedUser, onClose, onEdit, onDelete, onStartTask, onPauseTask, onCompleteTask, currentUser }) {
    if (!task) return null;

    // Handle both Supabase and base44 field formats
    const title = task.Title || task.title;
    const description = task.Description || task.description;
    const dueDate = task["Due Date"] || task.due_date;
    const status = task.Status || task.status;
    const priority = task.Priority || task.priority;
    const assignedToUserId = task["Assigned To User ID"] || task.assigned_to_user_id || task.assigned_to;
    const relatedEntity = task["Related Entity"] || task.related_entity;
    const relatedEntityId = task["Related Entity ID"] || task.related_entity_id;
    const loggedBy = task["Logged By"] || task.logged_by;
    const createdDate = task["Created Date"] || task.created_date;

    // Parse metadata from description
    const metadata = parseTaskMetadata(description);
    const targetDuration = metadata?.targetDuration;
    const actualStartTime = metadata?.actualStartTime;
    const actualEndTime = metadata?.actualEndTime;
    const durationTaken = metadata?.durationTaken;
    const deadlineMetadata = metadata?.deadline;

    const deadlineToUse = deadlineMetadata || dueDate;
    const isCompleted = status === 'completed' || status === 'Completed';
    const isInProgress = status === 'in_progress' || status === 'In Progress';
    const isOverdue = deadlineToUse && isPast(new Date(deadlineToUse)) && !isCompleted;

    const userFullName = (currentUser?.["Full Name"] || currentUser?.full_name || "").trim().toLowerCase();
    const isAdmin = userFullName === 'leticia' || userFullName === 'admin';
    const isExpired = isOverdue && !isInProgress && !isAdmin;

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

    const finalAssignedUserName = assignedToUserId || "Unassigned";

    const formatDuration = (seconds) => {
        if (!seconds) return null;
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h > 0 ? h + 'h ' : ''}${m > 0 ? m + 'm ' : ''}${s}s`;
    };

    const cleanDescription = description?.replace(/---METADATA---\n[\s\S]*?\n---END METADATA---\n?/, '') || '';

    const isRoutine = ROUTINE_TITLES.some(t => t.trim().toLowerCase() === (title || "").trim().toLowerCase());

    const isQuickTask = React.useMemo(() => {
        const t = title?.toLowerCase() || "";
        return QUICK_TASKS.includes(t.trim());
      }, [title]);

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl w-full p-0">
                <ScrollArea className="max-h-[80vh]">
                    <div className="p-6">
                        <DialogHeader className="mb-6">
                            <div className="flex items-start justify-between">
                                <div>
                                    <DialogTitle className="text-3xl font-bold text-slate-900 mb-2">{title}</DialogTitle>
                                    <div className="flex items-center gap-2 mt-2">
                                        <Badge className={getStatusColor(status)}>{status?.replace(/_/g, ' ')}</Badge>
                                        <Badge className={getPriorityColor(priority)}>{priority} priority</Badge>
                                        {isOverdue && (
                                            <Badge variant={isExpired ? "secondary" : "destructive"}>
                                                {isExpired ? <Lock className="w-3 h-3 mr-1" /> : <AlertTriangle className="w-3 h-3 mr-1" />}
                                                {isExpired ? "Locked" : "Overdue"}
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </DialogHeader>

                        {cleanDescription && (
                            <>
                                <h3 className="text-xl font-semibold text-slate-800 mb-4">Description</h3>
                                <p className="text-slate-700 whitespace-pre-wrap mb-6">{cleanDescription}</p>
                                <Separator className="my-6" />
                            </>
                        )}
                        
                        <h3 className="text-xl font-semibold text-slate-800 mb-4">Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <DetailItem icon={<Calendar />} label={deadlineMetadata ? "Deadline" : "Due Date"}>
                                {deadlineToUse ? format(new Date(deadlineToUse), 'dd MMMM yyyy, HH:mm') : 'No date set'}
                            </DetailItem>
                            <DetailItem icon={<User />} label="Assigned To">
                                {finalAssignedUserName}
                            </DetailItem>
                            <DetailItem icon={<Clock />} label="Created Date">
                                {createdDate ? format(new Date(createdDate), 'dd MMMM yyyy') : 'Unknown'}
                            </DetailItem>
                            {loggedBy && (
                                <DetailItem icon={<User />} label="Logged By">
                                    {loggedBy}
                                </DetailItem>
                            )}
                             {relatedEntity && relatedEntity !== 'none' && relatedEntity !== 'None' && (
                                <DetailItem icon={<Info />} label="Related To">
                                    <span className="capitalize">{relatedEntity.replace(/_/g, ' ')}</span>
                                    {relatedEntityId && <span className="text-xs text-slate-500 ml-2">(ID: {relatedEntityId})</span>}
                                </DetailItem>
                            )}
                            {targetDuration && (
                                <DetailItem icon={<Clock />} label="Target Duration">
                                    {targetDuration} minutes
                                </DetailItem>
                            )}
                            {actualStartTime && (
                                <DetailItem icon={<Clock />} label="Started At">
                                    {format(new Date(actualStartTime), 'HH:mm:ss')}
                                </DetailItem>
                            )}
                            {actualEndTime && (
                                <DetailItem icon={<Clock />} label="Completed At">
                                    {format(new Date(actualEndTime), 'HH:mm:ss')}
                                </DetailItem>
                            )}
                            {durationTaken && (
                                <DetailItem icon={<Clock />} label="Time Taken">
                                    {formatDuration(durationTaken)}
                                </DetailItem>
                            )}
                        </div>


                        <DialogFooter className="mt-8 flex flex-wrap gap-2 justify-between items-center">
                            <div className="flex gap-2">
                                {!isRoutine && (
                                    <>
                                        <Button
                                            variant="outline"
                                            onClick={() => onEdit(task)}
                                            className="text-slate-600 border-slate-200 hover:bg-slate-50"
                                        >
                                            <Edit className="w-4 h-4 mr-2" />
                                            Edit
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                onDelete(task);
                                                onClose();
                                            }}
                                            className="text-red-600 border-red-100 hover:bg-red-50 hover:text-red-700"
                                        >
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Delete
                                        </Button>
                                    </>
                                )}
                            </div>

                            <div className="flex gap-2">
                                {!isCompleted && !isExpired && (
                                    <>
                                        {!isQuickTask && (
                                            (status === "To Do" || status === "to_do") ? (
                                                <Button
                                                    onClick={() => {
                                                        onStartTask(task);
                                                        onClose();
                                                    }}
                                                    className="bg-indigo-600 hover:bg-indigo-700 font-bold"
                                                    disabled={(assignedToUserId || "").trim().toLowerCase() !== (currentUser?.["Full Name"] || currentUser?.full_name || "").trim().toLowerCase()}
                                                >
                                                    <Play className="w-4 h-4 mr-2 fill-current" />
                                                    Start Task
                                                </Button>
                                            ) : (status === "In Progress" || status === "in_progress") && (
                                                <Button
                                                    onClick={() => {
                                                        onPauseTask(task);
                                                        onClose();
                                                    }}
                                                    className="bg-amber-600 hover:bg-amber-700 font-bold"
                                                    disabled={(assignedToUserId || "").trim().toLowerCase() !== (currentUser?.["Full Name"] || currentUser?.full_name || "").trim().toLowerCase()}
                                                >
                                                    <Pause className="w-4 h-4 mr-2 fill-current" />
                                                    Pause Task
                                                </Button>
                                            )
                                        )}

                                        <Button
                                            onClick={() => {
                                                onCompleteTask(task);
                                                onClose();
                                            }}
                                            className="bg-green-600 hover:bg-green-700 font-bold"
                                            disabled={(assignedToUserId || "").trim().toLowerCase() !== (currentUser?.["Full Name"] || currentUser?.full_name || "").trim().toLowerCase()}
                                        >
                                            <CheckCircle2 className="w-4 h-4 mr-2" />
                                            Complete
                                        </Button>
                                    </>
                                )}

                                {isCompleted && (
                                    <div className="flex items-center gap-2 text-green-600 font-bold">
                                        <CheckCircle2 className="w-6 h-6" />
                                        Task Completed
                                    </div>
                                )}
                            </div>
                        </DialogFooter>
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}