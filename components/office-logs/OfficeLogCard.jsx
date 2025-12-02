import React, { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Edit, Calendar, User, Clock, AlertCircle, CheckCircle, Eye, Trash2 } from "lucide-react";
import { format } from "date-fns";

export default function OfficeLogCard({ log, onEdit, onDelete, getPriorityColor, getStatusColor }) {
  const [showReadMore, setShowReadMore] = useState(false);

  // Handle both PostgreSQL format (with spaces) and base44 format
  const logType = log["Log Type"] || log.log_type;
  const title = log["Title"] || log.title;
  const description = log["Description"] || log.description;
  const dateTime = log["Date Time"] || log.date_time;
  const personInvolved = log["Person Involved"] || log.person_involved;
  const staffMember = log["Staff Member"] || log.staff_member;
  const priority = log["Priority"] || log.priority;
  const status = log["Status"] || log.status;
  const actionRequired = log["Action Required"] || log.action_required;
  const actionDueDate = log["Action Due Date"] || log.action_due_date;
  const followUpByUserId = log["Follow-up By User ID"] || log.follow_up_by_user_id;
  const followUpCompleted = log["Follow-up Completed"] || log.follow_up_completed;
  const followUpComments = log["Follow-up Comments"] || log.follow_up_comments;
  const createdBy = log["Created By"] || log.created_by;
  const createdDate = log["Created Date"] || log.created_date;

  return (
    <>
      <Card className="hover:shadow-md transition-shadow duration-200">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-slate-900 text-lg">
                  {title}
                </h3>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Badge variant="outline" className="border-purple-500 text-purple-700 capitalize">
                  {logType?.replace('_', ' ')}
                </Badge>
                <Badge className={getPriorityColor(priority)}>
                  {priority} priority
                </Badge>
                <Badge className={getStatusColor(status)}>
                  {status?.replace('_', ' ')}
                </Badge>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowReadMore(true)}
                className="text-slate-400 hover:text-slate-600"
                title="Read more"
              >
                <Eye className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(log)}
                className="text-slate-400 hover:text-slate-600"
                title="Edit"
              >
                <Edit className="w-4 h-4" />
              </Button>
              {onDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(log)}
                  className="text-slate-400 hover:text-red-600"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Date and Staff - Made More Prominent */}
          <div className="space-y-2 bg-slate-50 rounded-lg p-3 border border-slate-200">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span className="text-slate-600">
                {dateTime && format(new Date(dateTime), 'PPp')}
              </span>
            </div>
            {staffMember && (
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-purple-500" />
                <span className="font-medium text-slate-900">
                  Logged by: <span className="text-purple-700">{staffMember}</span>
                </span>
              </div>
            )}
            {personInvolved && (
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-slate-400" />
                <span className="text-slate-600">
                  Person involved: {personInvolved}
                </span>
              </div>
            )}
          </div>

          {/* Description */}
          {description && (
            <div className="pt-3 border-t">
              <p className="text-sm text-slate-700 line-clamp-3">
                {description}
              </p>
              {description.length > 150 && (
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => setShowReadMore(true)}
                  className="p-0 h-auto text-blue-600 hover:text-blue-700 text-sm mt-1"
                >
                  Read more
                </Button>
              )}
            </div>
          )}

          {/* Action Required */}
          {actionRequired && !followUpCompleted && (
            <div className="pt-3 border-t">
              <div className="flex items-center gap-2 text-sm text-orange-700 font-medium">
                <Clock className="w-4 h-4 text-orange-500" />
                <span>
                  Action required
                  {actionDueDate && (
                    <span className="ml-1">
                      by {format(new Date(actionDueDate), 'PPP')}
                    </span>
                  )}
                </span>
              </div>
              {followUpByUserId && (
                <div className="flex items-center gap-2 text-sm mt-2">
                  <User className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-600">
                    Assigned to: {followUpByUserId}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Follow-up Completed */}
          {followUpCompleted && (
            <div className="pt-3 border-t">
              <div className="flex items-center gap-2 text-sm text-green-700 font-medium">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Follow-up Completed</span>
              </div>
              {followUpByUserId && (
                <div className="flex items-center gap-2 text-sm mt-2">
                  <User className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-600">
                    Completed by: {followUpByUserId}
                  </span>
                </div>
              )}
              {followUpComments && (
                <p className="text-sm text-slate-700 mt-2 pl-6 border-l-2 border-slate-200 ml-2">
                  {followUpComments}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Read More Dialog */}
      <Dialog open={showReadMore} onOpenChange={setShowReadMore}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Badge variant="outline" className="border-purple-500 text-purple-700 capitalize">
                {logType?.replace('_', ' ')}
              </Badge>
              {title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 pt-4">
            {/* Basic Information - Staff Member Prominent */}
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <h4 className="font-semibold text-slate-900 mb-3">Log Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h5 className="font-medium text-slate-900 mb-1">Date & Time</h5>
                  <p className="text-slate-600">{dateTime && format(new Date(dateTime), 'PPPp')}</p>
                </div>
                {staffMember && (
                  <div>
                    <h5 className="font-medium text-slate-900 mb-1 flex items-center gap-2">
                      <User className="w-4 h-4 text-purple-500" />
                      Logged By
                    </h5>
                    <p className="text-purple-700 font-semibold">{staffMember}</p>
                  </div>
                )}
                {personInvolved && (
                  <div>
                    <h5 className="font-medium text-slate-900 mb-1">Person Involved</h5>
                    <p className="text-slate-600">{personInvolved}</p>
                  </div>
                )}
                <div>
                  <h5 className="font-medium text-slate-900 mb-1">Priority</h5>
                  <Badge className={getPriorityColor(priority)}>
                    {priority} priority
                  </Badge>
                </div>
                <div>
                  <h5 className="font-medium text-slate-900 mb-1">Status</h5>
                  <Badge className={getStatusColor(status)}>
                    {status?.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Description */}
            {description && (
              <div>
                <h4 className="font-medium text-slate-900 mb-2">Description</h4>
                <p className="text-slate-700 whitespace-pre-wrap">{description}</p>
              </div>
            )}

            {/* Follow-up Information */}
            {actionRequired && (
              <div className="bg-slate-50 rounded-lg p-4">
                <h4 className="font-medium text-slate-900 mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-500" />
                  Action Required
                </h4>
                <div className="space-y-2">
                  {actionDueDate && (
                    <div>
                      <span className="text-sm font-medium text-slate-600">Due Date: </span>
                      <span className="text-sm text-slate-800">{format(new Date(actionDueDate), 'PPP')}</span>
                    </div>
                  )}
                  {followUpByUserId && (
                    <div>
                      <span className="text-sm font-medium text-slate-600">Assigned to: </span>
                      <span className="text-sm text-slate-800">{followUpByUserId}</span>
                    </div>
                  )}
                  {followUpComments && (
                    <div>
                      <span className="text-sm font-medium text-slate-600">Comments: </span>
                      <p className="text-sm text-slate-800 mt-1">{followUpComments}</p>
                    </div>
                  )}
                  {followUpCompleted && (
                    <div className="mt-3 p-2 bg-green-50 rounded border-l-4 border-green-400">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm font-medium text-green-800">Follow-up Completed</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Created By Information */}
            {createdBy && (
              <div className="pt-4 border-t">
                <div className="text-xs text-slate-500">
                  <span>Created by: {createdBy}</span>
                  {createdDate && (
                    <span className="ml-2">on {format(new Date(createdDate), 'PPP')}</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}