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
    FileText, Calendar, User, Clock, CheckCircle, Edit, X, Link2, AlertTriangle, MessageSquare, Trash2
} from 'lucide-react';
import { format } from 'date-fns';

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

export default function SupportPlanDetailModal({
  plan,
  getResidentName,
  onClose,
  onEdit,
  onDelete
}) {
  if (!plan) return null;

  const isQuarterlyReview = plan.plan_type === 'quarterly_reviews';

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      in_progress: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
      up_to_date: "bg-green-100 text-green-800",
      overdue: "bg-red-100 text-red-800",
      no_review: "bg-gray-100 text-gray-800",
      document_missing: "bg-orange-100 text-orange-800",
      document_combined_uploaded: "bg-green-100 text-green-800",
      due: "bg-yellow-100 text-yellow-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const attendanceStatus = () => {
    if (plan.attended_in_person) return "Attended - in person";
    if (plan.attended_telephone) return "Attended - telephone";
    if (plan.did_not_attend) return "Did not attend";
    if (plan.authorised_absence) return "Authorised absence";
    return "Not recorded";
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl w-full p-0">
        <ScrollArea className="max-h-[90vh]">
          <div className="p-6">
            <DialogHeader className="mb-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 bg-gradient-to-r ${isQuarterlyReview ? 'from-purple-500 to-indigo-500' : 'from-sky-500 to-cyan-500'} rounded-xl flex items-center justify-center shadow-sm`}>
                    {isQuarterlyReview ? <Calendar className="w-8 h-8 text-white" /> : <FileText className="w-8 h-8 text-white" />}
                  </div>
                  <div>
                    <DialogTitle className="text-3xl font-bold text-slate-900">{plan.title}</DialogTitle>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                       <Badge className={getStatusColor(plan.status)}>{plan.status?.replace(/_/g, ' ')}</Badge>
                       <Badge variant="outline">{getResidentName(plan.resident_id)}</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </DialogHeader>

            <h3 className="text-xl font-semibold text-slate-800 mb-4">Entry Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DetailItem icon={<User />} label="Resident">{getResidentName(plan.resident_id)}</DetailItem>
              <DetailItem icon={<User />} label="Logged By">{plan.key_worker}</DetailItem>
              <DetailItem icon={<Clock />} label={isQuarterlyReview ? "Date & Time Logged" : "Date & Time"}>
                {plan.log_date ? format(new Date(plan.log_date), 'dd MMMM yyyy, HH:mm') : null}
              </DetailItem>
              <DetailItem icon={<Link2 />} label="Document URL">
                {plan.file_url ? (
                    <a href={plan.file_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate block">
                        View Document
                    </a>
                ) : null}
              </DetailItem>
            </div>
            
            <Separator className="my-6" />

            {isQuarterlyReview ? (
                <>
                    <h3 className="text-xl font-semibold text-slate-800 mb-4">Review Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <DetailItem icon={<User />} label="Support Worker Name">{plan.support_worker_name}</DetailItem>
                        <DetailItem icon={<Calendar />} label="Date Review Completed">
                            {plan.review_completed_date ? format(new Date(plan.review_completed_date), 'dd MMMM yyyy') : null}
                        </DetailItem>
                        <DetailItem icon={<Calendar />} label="Next Review Date">
                             {plan.next_review_date ? format(new Date(plan.next_review_date), 'dd MMMM yyyy') : null}
                        </DetailItem>
                    </div>
                </>
            ) : (
                <>
                    <h3 className="text-xl font-semibold text-slate-800 mb-4">Note Specifics</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <DetailItem icon={<CheckCircle />} label="Attendance">{attendanceStatus()}</DetailItem>
                        <DetailItem icon={<AlertTriangle />} label="Signature Page Missing">
                            <span className={plan.signature_page_missing ? 'text-red-600 font-semibold' : ''}>
                                {plan.signature_page_missing ? 'Yes' : 'No'}
                            </span>
                        </DetailItem>
                        {plan.signature_page_missing && (
                             <div className="md:col-span-2">
                                <DetailItem icon={<MessageSquare />} label="Signature Missing Comments">
                                    <div className="bg-yellow-50 rounded-lg p-3 mt-2">
                                        <p className="text-slate-700 whitespace-pre-wrap">{plan.signature_page_missing_comments}</p>
                                    </div>
                                </DetailItem>
                            </div>
                        )}
                    </div>
                </>
            )}
            
            <DialogFooter className="mt-8 flex justify-between">
              <Button 
                onClick={() => {
                  onClose();
                  onDelete(plan);
                }} 
                variant="destructive"
                className="bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Entry
              </Button>
              <Button onClick={() => {
                onClose();
                onEdit(plan);
              }} className="bg-indigo-600 hover:bg-indigo-700">
                <Edit className="w-4 h-4 mr-2" />
                Edit Entry
              </Button>
            </DialogFooter>

          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}