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
    FileStack, Calendar, User, Clock, CheckCircle, Edit, X, AlertTriangle, Link2, XCircle, Trash2
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

export default function WeeklySWDocLogDetailModal({
  log,
  documentName,
  propertyName,
  weekDate,
  onClose,
  onEdit,
  onDelete
}) {
  if (!log) return null;

  const getStatusColor = (status) => {
    const colors = {
      completed: "bg-green-100 text-green-800",
      issue_raised: "bg-orange-100 text-orange-800",
      incomplete: "bg-slate-100 text-slate-800"
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getStatusIcon = (status) => {
    if (status === 'issue_raised') return <AlertTriangle className="w-5 h-5 text-orange-600" />;
    if (status === 'completed') return <CheckCircle className="w-5 h-5 text-green-600" />;
    return <XCircle className="w-5 h-5 text-slate-600" />;
  };

  const getStatusText = (status) => {
    if (status === 'issue_raised') return 'Issue Raised';
    if (status === 'completed') return 'Completed';
    return 'Incomplete';
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-full p-0">
        <ScrollArea className="max-h-[80vh]">
          <div className="p-6">
            <DialogHeader className="mb-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-xl flex items-center justify-center shadow-sm">
                    {getStatusIcon(log.status)}
                  </div>
                  <div>
                    <DialogTitle className="text-2xl font-bold text-slate-900">{documentName}</DialogTitle>
                    <p className="text-slate-600 mt-1">
                      {propertyName} - W/C {format(new Date(weekDate), 'dd/MM/yy')}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={getStatusColor(log.status)}>
                        {getStatusText(log.status)}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </DialogHeader>

            <h3 className="text-xl font-semibold text-slate-800 mb-4">Check Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DetailItem icon={<Calendar />} label="Week Starting">
                {log.week_start_date ? format(new Date(log.week_start_date), 'dd MMMM yyyy') : <span className="text-sm font-normal text-slate-400">Not provided</span>}
              </DetailItem>
              <DetailItem icon={<User />} label="Staff Member">{log.staff_member}</DetailItem>
              <DetailItem icon={<Clock />} label="Logged Date & Time">
                {log.log_date ? format(new Date(log.log_date), 'dd MMMM yyyy, HH:mm') : null}
              </DetailItem>
              {log.file_url && (
                <DetailItem icon={<Link2 />} label="Supporting Document">
                  <a 
                    href={log.file_url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-blue-600 hover:underline truncate block"
                  >
                    View Document
                  </a>
                </DetailItem>
              )}
            </div>

            {log.notes && (
              <>
                <Separator className="my-6" />
                <h3 className="text-xl font-semibold text-slate-800 mb-4">
                  {log.status === 'issue_raised' ? 'Issue Description' : 'Notes'}
                </h3>
                <div className={`${log.status === 'issue_raised' ? 'bg-orange-50 border border-orange-200' : 'bg-slate-50'} rounded-lg p-4`}>
                  <p className="text-slate-700 whitespace-pre-wrap">{log.notes}</p>
                </div>
              </>
            )}

            <DialogFooter className="mt-8 flex justify-between">
              <Button 
                onClick={() => {
                  onClose();
                  onDelete();
                }} 
                variant="destructive"
                className="bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Log
              </Button>
              <Button onClick={() => {
                onClose();
                onEdit(log);
              }} className="bg-cyan-600 hover:bg-cyan-700">
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