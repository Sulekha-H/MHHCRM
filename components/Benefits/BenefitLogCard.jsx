
import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Calendar, User, HandCoins, FileText, Banknote, AlertTriangle, Trash2 } from "lucide-react";
import { format } from "date-fns";

export default function BenefitLogCard({ log, onViewDetails, onDelete, getResidentName }) {
    
  const getStatusColor = (status) => {
    if (!status) return "bg-slate-100 text-slate-800";
    const normalized = status.toLowerCase().replace(/ /g, '_');
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      in_progress: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
      issue_raised: "bg-red-100 text-red-800",
      closed: "bg-gray-100 text-gray-800"
    };
    return colors[normalized] || "bg-slate-100 text-slate-800";
  };
  
  const getLogTypeColor = (type) => {
    if (!type) return "border-slate-500 text-slate-700";
    const normalized = type.toLowerCase().replace(/ /g, '_');
    const colors = {
        application_log: "border-teal-500 text-teal-700",
        requested_support_notes: "border-fuchsia-500 text-fuchsia-700",
        requested_documents: "border-blue-500 text-blue-700",
        suspended_claims: "border-red-500 text-red-700",
        awaiting_activation: "border-yellow-500 text-yellow-700",
        missing_payments: "border-orange-500 text-orange-700",
        change_of_addresses: "border-purple-500 text-purple-700",
        room_transfers: "border-green-500 text-green-700",
        payment_update: "border-emerald-500 text-emerald-700",
        claim_issue: "border-rose-500 text-rose-700",
        change_of_circumstances: "border-amber-500 text-amber-700",
        appeal: "border-violet-500 text-violet-700",
        general_update: "border-slate-500 text-slate-700"
    };
    return colors[normalized] || "border-slate-500 text-slate-700";
  };

  const title = log.Title || log.title;
  const logType = log["Log Type"] || log.log_type;
  const status = log.Status || log.status;
  const sanctions = log.Sanctions || log.sanctions;
  const logDate = log["Log Date"] || log.log_date;
  const residentId = log["Resident ID"] || log.resident_id;
  const loggedBy = log["Logged By"] || log.logged_by || log.staff_member;
  const description = log.Description || log.description;
  const amount = log.Amount || log.amount;
  const applicationDate = log["Application Date"] || log.application_date;

  return (
    <Card 
        className="hover:shadow-md transition-shadow duration-200 flex flex-col cursor-pointer"
        onClick={() => onViewDetails(log)}
    >
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
             <div className="flex items-center gap-2 mb-2">
                <HandCoins className="w-5 h-5 text-sky-500" />
                <h3 className="font-semibold text-slate-900 text-lg line-clamp-1">
                  {title}
                </h3>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Badge variant="outline" className={getLogTypeColor(logType)}>
                {logType?.replace(/_/g, ' ')}
              </Badge>
              <Badge className={getStatusColor(status)}>
                {status?.replace('_', ' ')}
              </Badge>
              {sanctions && (
                <Badge className="bg-red-100 text-red-800">
                  Sanctions
                </Badge>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation(); // Prevent card's onViewDetails from being triggered
              onDelete(log);
            }}
            className="text-slate-400 hover:text-red-600 flex-shrink-0"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 flex-grow">
        {/* Date, Resident, and Logged By - Made Prominent */}
        <div className="space-y-2 bg-slate-50 rounded-lg p-3 border border-slate-200">
            {residentId && getResidentName && (
                <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-slate-400" />
                    <span className="font-medium text-slate-800">{getResidentName(residentId)}</span>
                </div>
            )}
            <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span className="text-slate-600">
                    {logDate ? format(new Date(logDate), 'PPp') : 'N/A'}
                </span>
            </div>
            {loggedBy && (
                <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-sky-500" />
                    <span className="font-medium text-slate-900">
                        Logged by: <span className="text-sky-700">{loggedBy}</span>
                    </span>
                </div>
            )}
        </div>

        {description && (
          <div className="pt-3 border-t">
            <p className="text-sm text-slate-700 line-clamp-3">
              {description}
            </p>
          </div>
        )}
        
        {applicationDate && (
            <div className="pt-3 border-t">
                <div className="flex items-center gap-2 text-sm">
                    <FileText className="w-4 h-4 text-teal-500" />
                    <span className="text-slate-600">
                        Application Date: {format(new Date(applicationDate), 'PPP')}
                    </span>
                </div>
            </div>
        )}
        
        {amount > 0 && (
            <div className="pt-3 border-t">
                <div className="flex items-center gap-2 text-sm">
                    <Banknote className="w-4 h-4 text-green-600" />
                    <span className="text-slate-600 font-medium">
                        Amount: £{amount.toFixed(2)}
                    </span>
                </div>
            </div>
        )}
        
        {(status?.toLowerCase() === 'issue_raised' || status?.toLowerCase() === 'issue raised') && (
            <div className="pt-3 border-t">
                <div className="flex items-center gap-2 text-sm">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span className="text-red-700 font-medium">
                        Requires attention
                    </span>
                </div>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
