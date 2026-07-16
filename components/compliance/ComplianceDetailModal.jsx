import React, { useState } from 'react';
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
import { Label } from "@/components/ui/label";
import {
    Shield, Calendar, Building2, User, FileCheck, AlertTriangle, Edit, X, Link2, PoundSterling, CheckCircle2, Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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

export default function ComplianceDetailModal({
  log,
  getPropertyName,
  onClose,
  onEdit,
  onDelete,
  getLoggedByName
}) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  if (!log) return null;

  const getStatusColor = (status) => {
    const colors = {
      valid: "bg-green-100 text-green-800",
      expiring_soon: "bg-yellow-100 text-yellow-800",
      expired: "bg-red-100 text-red-800",
      pending_renewal: "bg-blue-100 text-blue-800",
      not_required: "bg-gray-100 text-gray-800"
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: "bg-blue-100 text-blue-800",
      medium: "bg-yellow-100 text-yellow-800",
      high: "bg-orange-100 text-orange-800",
      critical: "bg-red-100 text-red-800"
    };
    return colors[priority] || "bg-gray-100 text-gray-800";
  };

  const getComplianceTypeLabel = (type) => {
    const labels = {
      gas_safety: "Gas Safety",
      emergency_lighting: "Emergency Lighting",
      eicr: "EICR",
      pat_tests: "PAT Tests",
      fire_detection_alarm_system: "Fire Detection & Alarm",
      fire_risk_assessment: "Fire Risk Assessment",
      energy_performance: "EPC",
      legionella_risk: "Legionella",
      asbestos_survey: "Asbestos",
      other: "Other"
    };
    return labels[type] || type?.replace(/_/g, ' ');
  };

  const isExpiringSoon = log.status === 'expiring_soon';
  const isExpired = log.status === 'expired';

  const handleDelete = () => {
    onDelete(log);
    setShowDeleteDialog(false);
    onClose();
  };

  return (
    <>
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl w-full p-0">
          <ScrollArea className="max-h-[90vh]">
            <div className="p-6">
              <DialogHeader className="mb-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-sm">
                      <Shield className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <DialogTitle className="text-3xl font-bold text-slate-900">{log.certificate_name}</DialogTitle>
                      <p className="text-slate-600 mt-1">{getComplianceTypeLabel(log.compliance_type)}</p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <Badge className={getStatusColor(log.status)}>{log.status?.replace(/_/g, ' ')}</Badge>
                        <Badge className={getPriorityColor(log.priority)}>{log.priority} priority</Badge>
                        {log.actioned && (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Actioned
                          </Badge>
                        )}
                        {isExpired && !log.actioned && <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />Expired</Badge>}
                        {isExpiringSoon && !log.actioned && <Badge className="bg-amber-100 text-amber-800"><AlertTriangle className="w-3 h-3 mr-1" />Expiring Soon</Badge>}
                      </div>
                    </div>
                  </div>
                </div>
              </DialogHeader>

              <h3 className="text-xl font-semibold text-slate-800 mb-4">Certificate Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <DetailItem icon={<Calendar />} label="Entry Date & Time">
                  {log["Created Date"] || log.Created_Date || log.created_date ? format(new Date(log["Created Date"] || log.Created_Date || log.created_date), 'dd/MM/yyyy HH:mm') : 'N/A'}
                </DetailItem>
                <DetailItem icon={<Building2 />} label="Property">{getPropertyName(log.property_id)}</DetailItem>
                <DetailItem icon={<FileCheck />} label="Certificate Number">{log.certificate_number}</DetailItem>
                <DetailItem icon={<Calendar />} label="Issued Date">
                  {log.issued_date ? format(new Date(log.issued_date), 'dd MMMM yyyy') : null}
                </DetailItem>
                <DetailItem icon={<Calendar />} label="Expiry Date">
                  {log.expiry_date ? (
                    <div className="flex items-center gap-2">
                      <span>{format(new Date(log.expiry_date), 'dd MMMM yyyy')}</span>
                      {isExpired && <AlertTriangle className="w-4 h-4 text-red-500" />}
                      {isExpiringSoon && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                    </div>
                  ) : <span className="text-slate-400">No expiry date</span>}
                </DetailItem>
                <DetailItem icon={<Calendar />} label="Next Action Due">
                  {log.next_action_due ? format(new Date(log.next_action_due), 'dd MMMM yyyy') : null}
                </DetailItem>
                <DetailItem icon={<User />} label="Contractor/Company">{log.contractor_company}</DetailItem>
                {getLoggedByName && (
                  <DetailItem icon={<User />} label="Logged By">
                    <span className="text-purple-700 font-semibold">{getLoggedByName(log)}</span>
                  </DetailItem>
                )}
              </div>

              {log.cost && log.cost > 0 && (
                <>
                  <Separator className="my-6" />
                  <h3 className="text-xl font-semibold text-slate-800 mb-4">Financial Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <DetailItem icon={<PoundSterling />} label="Cost">£{log.cost.toFixed(2)}</DetailItem>
                  </div>
                </>
              )}

              {log.actioned && (
                <>
                  <Separator className="my-6" />
                  <h3 className="text-xl font-semibold text-slate-800 mb-4">Renewal/Action Status</h3>
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <div className="flex items-center gap-3 mb-3">
                      <CheckCircle2 className="w-6 h-6 text-green-600" />
                      <p className="font-semibold text-green-900">This certificate has been actioned</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      {log.actioned_date && (
                        <DetailItem icon={<Calendar />} label="Actioned Date">
                          {format(new Date(log.actioned_date), 'dd MMMM yyyy')}
                        </DetailItem>
                      )}
                    </div>
                    {log.actioned_notes && (
                      <div className="mt-4">
                        <Label className="text-sm font-medium text-slate-700">Action Notes</Label>
                        <p className="text-slate-700 mt-1 text-sm bg-white rounded p-3 border border-green-200">{log.actioned_notes}</p>
                      </div>
                    )}
                  </div>
                </>
              )}

              {log.file_url && (
                <>
                  <Separator className="my-6" />
                  <h3 className="text-xl font-semibold text-slate-800 mb-4">Documents</h3>
                  <DetailItem icon={<Link2 />} label="Certificate Document">
                    <a 
                      href={log.file_url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-blue-600 hover:underline flex items-center gap-2"
                    >
                      <FileCheck className="w-4 h-4" />
                      View Certificate
                    </a>
                  </DetailItem>
                </>
              )}

              {log.notes && (
                <>
                  <Separator className="my-6" />
                  <h3 className="text-xl font-semibold text-slate-800 mb-4">Additional Notes</h3>
                  <div className="bg-slate-50 rounded-lg p-4">
                    <p className="text-slate-700 whitespace-pre-wrap">{log.notes}</p>
                  </div>
                </>
              )}

              {(isExpired || isExpiringSoon) && !log.actioned && (
                <>
                  <Separator className="my-6" />
                  <div className={`flex items-center gap-3 p-4 rounded-lg ${isExpired ? 'bg-red-50 border border-red-200' : 'bg-amber-50 border border-amber-200'}`}>
                    <AlertTriangle className={`w-6 h-6 ${isExpired ? 'text-red-600' : 'text-amber-600'}`} />
                    <div>
                      <p className={`font-medium ${isExpired ? 'text-red-700' : 'text-amber-700'}`}>
                        {isExpired ? 'Certificate Expired' : 'Certificate Expiring Soon'}
                      </p>
                      <p className={`text-sm ${isExpired ? 'text-red-600' : 'text-amber-600'}`}>
                        {isExpired 
                          ? 'This certificate has expired and needs immediate renewal.' 
                          : 'This certificate is expiring soon and may need renewal.'}
                      </p>
                    </div>
                  </div>
                </>
              )}

              <DialogFooter className="mt-8 flex justify-between">
                <Button 
                  variant="destructive" 
                  onClick={() => setShowDeleteDialog(true)}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Record
                </Button>
                <Button onClick={() => {
                  onClose();
                  onEdit(log);
                }} className="bg-emerald-600 hover:bg-emerald-700">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Record
                </Button>
              </DialogFooter>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the compliance record "{log.certificate_name}" for {getPropertyName(log.property_id)}. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}