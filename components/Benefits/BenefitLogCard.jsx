
import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Calendar, User, HandCoins, FileText, Banknote, AlertTriangle, Trash2, Link } from "lucide-react";
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
  const amount = log.Amount || log.amount || log["Award Amount"] || log.award_amount;
  const applicationDate = log["Application Date"] || log.application_date || log["Date Sent Off"] || log.date_sent_off;
  const deadlineDate = log["Deadline Date"] || log.deadline_date;
  const gdPdfLink = log["GD PDF Link"] || log.gd_pdf_link;

  return (
    <Card 
        className="hover:shadow-md transition-shadow duration-200 flex flex-col cursor-pointer h-full"
        onClick={() => onViewDetails(log)}
    >
      <CardHeader className="p-3 pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
             <div className="flex items-center gap-1.5 mb-1.5">
                <HandCoins className="w-4 h-4 text-sky-500 shrink-0" />
                <h3 className="font-semibold text-slate-900 text-sm line-clamp-1">
                  {title}
                </h3>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              <Badge variant="outline" className={`text-[10px] py-0 h-5 ${getLogTypeColor(logType)}`}>
                {logType?.replace(/_/g, ' ')}
              </Badge>
              <Badge className={`text-[10px] py-0 h-5 ${getStatusColor(status)}`}>
                {status?.replace('_', ' ')}
              </Badge>
              {sanctions && (
                <Badge className="bg-red-100 text-red-800 text-[10px] py-0 h-5">
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
            className="text-slate-400 hover:text-red-600 flex-shrink-0 h-7 w-7"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-0 space-y-2 flex-grow">
        {/* Date, Resident, and Logged By - Made Prominent */}
        <div className="space-y-1 bg-slate-50 rounded-md p-2 border border-slate-100">
            {residentId && getResidentName && (
                <div className="flex items-center gap-2 text-xs">
                    <User className="w-3 h-3 text-slate-400" />
                    <span className="font-medium text-slate-800 truncate">{getResidentName(residentId)}</span>
                </div>
            )}
            <div className="flex items-center gap-2 text-xs">
                <Calendar className="w-3 h-3 text-slate-400" />
                <span className="text-slate-500">
                    {logDate ? format(new Date(logDate), 'PP') : 'N/A'}
                </span>
            </div>
            {loggedBy && (
                <div className="flex items-center gap-2 text-[11px]">
                    <User className="w-3 h-3 text-sky-500" />
                    <span className="font-medium text-slate-700 truncate">
                        By: <span className="text-sky-700">{loggedBy}</span>
                    </span>
                </div>
            )}
        </div>

        {description && (
          <div className="pt-2 border-t border-slate-100">
            <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
              {description}
            </p>
          </div>
        )}
        
        {applicationDate && (
            <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2 text-[11px]">
                    <FileText className="w-3 h-3 text-teal-500" />
                    <span className="text-slate-500">
                        App: {format(new Date(applicationDate), 'PP')}
                    </span>
                </div>
            </div>
        )}

        {gdPdfLink && (
            <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2 text-[11px]">
                    <Link className="w-3 h-3 text-blue-500" />
                    <a
                      href={gdPdfLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline truncate"
                      onClick={(e) => e.stopPropagation()}
                    >
                      GD PDF Link
                    </a>
                </div>
            </div>
        )}

        {deadlineDate && (
            <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2 text-[11px]">
                    <Calendar className="w-3 h-3 text-red-500" />
                    <span className="text-slate-600 font-medium">
                        Due: {format(new Date(deadlineDate), 'PP')}
                    </span>
                </div>
            </div>
        )}
        
        {amount > 0 && (
            <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2 text-[11px]">
                    <Banknote className="w-3 h-3 text-green-600" />
                    <span className="text-slate-600 font-medium">
                        £{amount.toFixed(2)}
                    </span>
                </div>
            </div>
        )}
        
        {(status?.toLowerCase() === 'issue_raised' || status?.toLowerCase() === 'issue raised') && (
            <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2 text-[11px]">
                    <AlertTriangle className="w-3 h-3 text-red-600" />
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
