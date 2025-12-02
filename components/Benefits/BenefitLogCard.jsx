
import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Calendar, User, HandCoins, FileText, Banknote, AlertTriangle, Trash2 } from "lucide-react";
import { format } from "date-fns";

export default function BenefitLogCard({ log, onViewDetails, onDelete, getResidentName }) {
    
  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      in_progress: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
      issue_raised: "bg-red-100 text-red-800",
      closed: "bg-gray-100 text-gray-800"
    };
    return colors[status] || "bg-slate-100 text-slate-800";
  };
  
  const getLogTypeColor = (type) => {
    const colors = {
        application_log: "border-teal-500 text-teal-700",
        requested_support_notes: "border-fuchsia-500 text-fuchsia-700",
        requested_documents: "border-blue-500 text-blue-700",
        suspended_claims: "border-red-500 text-red-700",
        awaiting_activation: "border-yellow-500 text-yellow-700",
        missing_payments: "border-orange-500 text-orange-700",
        change_of_addresses: "border-purple-500 text-purple-700",
        room_transfers: "border-green-500 text-green-700"
    };
    return colors[type] || "border-slate-500 text-slate-700";
  };

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
                  {log.title}
                </h3>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Badge variant="outline" className={getLogTypeColor(log.log_type)}>
                {log.log_type.replace(/_/g, ' ')}
              </Badge>
              <Badge className={getStatusColor(log.status)}>
                {log.status.replace('_', ' ')}
              </Badge>
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
            {log.resident_id && getResidentName && (
                <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-slate-400" />
                    <span className="font-medium text-slate-800">{getResidentName(log.resident_id)}</span>
                </div>
            )}
            <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span className="text-slate-600">
                    {format(new Date(log.log_date), 'PPp')}
                </span>
            </div>
            {(log.logged_by || log.staff_member) && (
                <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-sky-500" />
                    <span className="font-medium text-slate-900">
                        Logged by: <span className="text-sky-700">{log.logged_by || log.staff_member}</span>
                    </span>
                </div>
            )}
        </div>

        {log.description && (
          <div className="pt-3 border-t">
            <p className="text-sm text-slate-700 line-clamp-3">
              {log.description}
            </p>
          </div>
        )}
        
        {log.log_type === 'application_log' && log.application_date && (
            <div className="pt-3 border-t">
                <div className="flex items-center gap-2 text-sm">
                    <FileText className="w-4 h-4 text-teal-500" />
                    <span className="text-slate-600">
                        Application Date: {format(new Date(log.application_date), 'PPP')}
                    </span>
                </div>
            </div>
        )}
        
        {log.amount > 0 && (
            <div className="pt-3 border-t">
                <div className="flex items-center gap-2 text-sm">
                    <Banknote className="w-4 h-4 text-green-600" />
                    <span className="text-slate-600 font-medium">
                        Amount: £{log.amount.toFixed(2)}
                    </span>
                </div>
            </div>
        )}
        
        {log.status === 'issue_raised' && (
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
