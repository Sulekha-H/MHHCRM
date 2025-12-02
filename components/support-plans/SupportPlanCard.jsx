import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Clock, User, FileText, ExternalLink, Trash2 } from "lucide-react";
import { format } from "date-fns";

export default function SupportPlanCard({ plan, onEdit, onDelete, getResidentName, getStatusColor }) {
  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900 text-lg mb-2">
              {plan.title}
            </h3>
            <div className="flex items-center gap-4 text-sm text-slate-600">
              <div className="flex items-center gap-1">
                <User className="w-4 h-4" />
                <span>{getResidentName(plan.resident_id)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{format(new Date(plan.log_date), 'dd/MM/yyyy HH:mm')}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {plan.file_url && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => window.open(plan.file_url, '_blank')}
                className="text-slate-400 hover:text-slate-600"
                title="View Document"
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(plan)}
              className="text-slate-400 hover:text-slate-600"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(plan)}
              className="text-slate-400 hover:text-red-600"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          <Badge className={getStatusColor(plan.status)}>
            {plan.status?.replace('_', ' ')}
          </Badge>
          <Badge variant="outline">
            Logged by: {plan.key_worker}
          </Badge>
          {plan.support_hours > 0 && (
            <Badge variant="outline">
              {plan.support_hours}h support
            </Badge>
          )}
        </div>

        <div>
          <p className="text-slate-700 text-sm leading-relaxed">
            {plan.description}
          </p>
        </div>

        {plan.goals_discussed && (
          <div className="pt-3 border-t">
            <h4 className="font-medium text-slate-900 mb-1">Goals Discussed</h4>
            <p className="text-sm text-slate-600">{plan.goals_discussed}</p>
          </div>
        )}

        {plan.action_points && (
          <div className="pt-3 border-t">
            <h4 className="font-medium text-slate-900 mb-1">Action Points</h4>
            <p className="text-sm text-slate-600">{plan.action_points}</p>
          </div>
        )}

        {plan.resident_feedback && (
          <div className="pt-3 border-t">
            <h4 className="font-medium text-slate-900 mb-1">Resident Feedback</h4>
            <p className="text-sm text-slate-600">{plan.resident_feedback}</p>
          </div>
        )}

        {plan.next_review_date && (
          <div className="pt-3 border-t">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-slate-400" />
              <span className="text-slate-600">
                Next review due: {format(new Date(plan.next_review_date), 'dd/MM/yyyy')}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}