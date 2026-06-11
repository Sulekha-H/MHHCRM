"use client"

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ClipboardCheck,
  MapPin,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Hammer,
  FileText
} from "lucide-react";
import { format, parseISO } from "date-fns";

export default function ComplianceCheckDetailModal({ log, isOpen, onClose }) {
  if (!log) return null;

  const issues = log["Checks"]?.filter(c => !c.no_issues) || [];
  const weekEnding = log["Week Ending Date"] ? format(parseISO(log["Week Ending Date"]), 'MMMM d, yyyy') : 'N/A';

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'emergency':
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-indigo-600">
              <ClipboardCheck className="w-5 h-5" />
              <span className="text-sm font-semibold uppercase tracking-wider">Compliance Log Details</span>
            </div>
            {log["Weekly Check Not Completed"] && (
              <Badge variant="destructive" className="animate-pulse">Check Not Completed</Badge>
            )}
          </div>
          <DialogTitle className="text-2xl font-bold text-slate-900">
            {log["Property Name"]}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-4 mt-1">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              Week Ending: {weekEnding}
            </span>
            <span className="flex items-center gap-1.5">
              <div className="w-5 h-5 bg-indigo-50 rounded-full flex items-center justify-center">
                <span className="text-[10px] text-indigo-600 font-bold">{log["Logged By"]?.[0]?.toUpperCase()}</span>
              </div>
              Logged By: {log["Logged By"]}
            </span>
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 p-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Identified Issues ({issues.length})
              </h3>

              {issues.length === 0 ? (
                <div className="bg-green-50 border border-green-100 rounded-xl p-8 text-center">
                  <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <p className="text-green-800 font-semibold text-lg">All Clear</p>
                  <p className="text-green-600 text-sm">No issues were identified during this compliance check.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {issues.map((issue, idx) => (
                    <div
                      key={idx}
                      className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:border-indigo-200 transition-colors"
                    >
                      <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex justify-between items-center">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2 font-semibold text-slate-900">
                            <MapPin className="w-4 h-4 text-indigo-500" />
                            {issue.location}
                          </div>
                          {issue.rating && (
                            <div className="text-[10px] text-slate-500 font-medium ml-6">
                              Rating: <span className="text-indigo-600 uppercase tracking-wider">{issue.rating}</span>
                            </div>
                          )}
                        </div>
                        <Badge className={getPriorityColor(issue.priority)}>
                          {issue.priority || 'Medium'} Priority
                        </Badge>
                      </div>
                      <div className="p-4 space-y-4">
                        <div className="space-y-4">
                          <div className="space-y-1.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Issue Details</span>
                            <p className="text-sm text-slate-700 bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                              {issue.issue_details}
                            </p>
                          </div>

                          {issue.rectified && issue.rectification_details && (
                            <div className="space-y-1.5">
                              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Rectification Details</span>
                              <p className="text-sm text-emerald-800 bg-emerald-50/50 p-3 rounded-lg border border-emerald-100 italic">
                                {issue.rectification_details}
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-2">
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Repair Status</span>
                            <div className="flex items-center gap-2">
                              {issue.repair_id ? (
                                <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 border-indigo-100 gap-1">
                                  <Hammer className="w-3 h-3" />
                                  Repair Logged
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-slate-500 border-slate-200">
                                  Manual Log
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Status / Date Fixed</span>
                            <div className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                              {issue.rectified === true || (issue.rectified === undefined && !!issue.date_fixed) ? (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                                  {issue.date_fixed ? format(parseISO(issue.date_fixed), 'MMM d, yyyy') : 'Rectified'}
                                </>
                              ) : (
                                <>
                                  <Clock className="w-3.5 h-3.5 text-red-500" />
                                  Unresolved
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {log["Materials Required"] && (
              <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-5">
                <h3 className="text-sm font-bold text-indigo-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Hammer className="w-4 h-4" />
                  Materials / Purchases Required
                </h3>
                <p className="text-sm text-indigo-800 whitespace-pre-wrap">
                  {log["Materials Required"]}
                </p>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
          >
            Close
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
