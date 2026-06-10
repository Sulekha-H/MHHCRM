
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
    Wrench, Calendar, MapPin, User, Clock, CheckCircle, Edit, X, Banknote, FileText as InvoiceIcon, Trash2
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

const getPriorityColor = (priority) => {
    const colors = { low: "bg-green-100 text-green-800", medium: "bg-blue-100 text-blue-800", high: "bg-orange-100 text-orange-800", urgent: "bg-red-100 text-red-800", emergency: "bg-purple-100 text-purple-800" };
    return colors[priority] || colors.medium;
};

const getStatusColor = (status) => {
    const colors = { reported: "bg-gray-100 text-gray-800", assessed: "bg-blue-100 text-blue-800", scheduled: "bg-yellow-100 text-yellow-800", in_progress: "bg-indigo-100 text-indigo-800", completed: "bg-green-100 text-green-800", cancelled: "bg-red-100 text-red-800" };
    return colors[status] || colors.reported;
};

const getRepairTypeColor = (type) => {
    const colors = { plumbing: "bg-blue-100 text-blue-800", electrical: "bg-yellow-100 text-yellow-800", heating: "bg-orange-100 text-orange-800", decoration: "bg-purple-100 text-purple-800", appliance: "bg-green-100 text-green-800", structural: "bg-red-100 text-red-800", security: "bg-gray-100 text-gray-800", other: "bg-slate-100 text-slate-800" };
    return colors[type] || colors.other;
};

const getPaymentStatusColor = (status) => {
    const colors = { unpaid: "bg-red-100 text-red-800", partially_paid: "bg-yellow-100 text-yellow-800", paid: "bg-green-100 text-green-800" };
    return colors[status] || "bg-gray-100 text-gray-800";
};

export default function RepairDetailModal({ 
  repair, 
  getAccommodationName, 
  getPropertyName, 
  onClose, 
  onEdit,
  onDelete
}) {
  if (!repair) return null;

  // Helper function to normalize yes/no/n_a values from both formats
  const normalizeYesNoNA = (value) => {
    if (value === undefined || value === null) return null;
    const normalized = String(value).toLowerCase().replace(/\s+/g, '_');
    return normalized;
  };

  const reportedOnFiixit = normalizeYesNoNA(repair.reported_on_fiixit);
  const fiixitUpdated = normalizeYesNoNA(repair.fiixit_updated);

  const loggedVia = repair["Logged Via"] || repair.logged_via || (repair.title?.startsWith("Repair from Compliance Check:") ? "Compliance Check" : null);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl w-full p-0">
        <ScrollArea className="max-h-[90vh]">
          <div className="p-6">
            <DialogHeader className="mb-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl flex items-center justify-center shadow-sm">
                    <Wrench className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <DialogTitle className="text-3xl font-bold text-slate-900">{repair.title}</DialogTitle>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <Badge className={getStatusColor(repair.status)}>{repair.status?.replace('_', ' ')}</Badge>
                      <Badge className={getPriorityColor(repair.priority)}>{repair.priority} priority</Badge>
                      <Badge className={getRepairTypeColor(repair.repair_type)}>{repair.repair_type}</Badge>
                      {loggedVia === "Compliance Check" && (
                        <Badge variant="outline" className="bg-indigo-100 text-indigo-800 border-indigo-200">Logged via Compliance Check</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </DialogHeader>

            <h3 className="text-xl font-semibold text-slate-800 mb-4">Repair Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DetailItem icon={<MapPin />} label="Location">
                {getPropertyName(repair.property_id)} - {getAccommodationName(repair)}
              </DetailItem>
              <DetailItem icon={<Calendar />} label="Reported Date">
                {repair.reported_date ? format(new Date(repair.reported_date), 'dd MMMM yyyy, HH:mm') : null}
              </DetailItem>
            </div>

            <Separator className="my-6" />
            <h3 className="text-xl font-semibold text-slate-800 mb-4">Reporting Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DetailItem icon={<User />} label="Reported By">
                {repair.reported_by} 
                {repair.reported_by_type && (
                  <span className="text-sm font-normal text-slate-500 ml-1">
                    ({repair.reported_by_type.replace('_', ' ')}{loggedVia === "Compliance Check" ? " via Compliance Check" : ""})
                  </span>
                )}
                {(!repair.reported_by_type && loggedVia === "Compliance Check") && (
                  <span className="text-sm font-normal text-slate-500 ml-1">
                    (via Compliance Check)
                  </span>
                )}
              </DetailItem>
              <DetailItem icon={<User />} label="Logged By">{repair.logged_by}</DetailItem>
              {loggedVia && (
                <DetailItem icon={<Wrench />} label="Logged Via">
                  {loggedVia}
                </DetailItem>
              )}
              <DetailItem icon={<CheckCircle />} label="Reported on Fiixit">
                {reportedOnFiixit === 'yes' ? (
                  <span className="text-green-600 font-medium">Yes</span>
                ) : reportedOnFiixit === 'no' ? (
                  <span className="text-red-600 font-medium">No</span>
                ) : (
                  <span className="text-slate-500">N/A</span>
                )}
              </DetailItem>
            </div>

            {repair.description && (
              <>
                <Separator className="my-6" />
                <h3 className="text-xl font-semibold text-slate-800 mb-4">Description</h3>
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-slate-700 whitespace-pre-wrap">{repair.description}</p>
                </div>
              </>
            )}

            <Separator className="my-6" />
            <h3 className="text-xl font-semibold text-slate-800 mb-4">Status Timeline</h3>
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="space-y-3">
                {repair.reported_date && (
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-gray-500 flex-shrink-0"></div>
                    <div>
                      <span className="font-medium text-slate-700">Reported:</span>
                      <span className="ml-2 text-slate-600">{format(new Date(repair.reported_date), 'PPp')}</span>
                    </div>
                  </div>
                )}
                {repair.assessed_date && (
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-blue-500 flex-shrink-0"></div>
                    <div>
                      <span className="font-medium text-slate-700">Assessed:</span>
                      <span className="ml-2 text-slate-600">{format(new Date(repair.assessed_date), 'PPp')}</span>
                    </div>
                  </div>
                )}
                {repair.scheduled_date && (
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-yellow-500 flex-shrink-0"></div>
                    <div>
                      <span className="font-medium text-slate-700">Scheduled:</span>
                      <span className="ml-2 text-slate-600">{format(new Date(repair.scheduled_date), 'PPp')}</span>
                    </div>
                  </div>
                )}
                {repair.in_progress_date && (
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-indigo-500 flex-shrink-0"></div>
                    <div>
                      <span className="font-medium text-slate-700">Work Started:</span>
                      <span className="ml-2 text-slate-600">{format(new Date(repair.in_progress_date), 'PPp')}</span>
                    </div>
                  </div>
                )}
                {repair.date_fixed && (
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-green-500 flex-shrink-0"></div>
                    <div>
                      <span className="font-medium text-green-700">Date Fixed:</span>
                      <span className="ml-2 text-green-600">{format(new Date(repair.date_fixed), 'PPp')}</span>
                    </div>
                  </div>
                )}
                {repair.completed_date && (
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-green-500 flex-shrink-0"></div>
                    <div>
                      <span className="font-medium text-slate-700">Completed:</span>
                      <span className="ml-2 text-slate-600">{format(new Date(repair.completed_date), 'PPp')}</span>
                    </div>
                  </div>
                )}
                {repair.is_cancelled && repair.cancelled_date && (
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-red-500 flex-shrink-0"></div>
                    <div>
                      <span className="font-medium text-red-700">Cancelled:</span>
                      <span className="ml-2 text-red-600">{format(new Date(repair.cancelled_date), 'PPp')}</span>
                      {repair.cancellation_reason && (
                        <div className="mt-1 text-sm text-slate-600 italic">
                          Reason: {repair.cancellation_reason}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Fiixit Updated Status */}
              {fiixitUpdated && fiixitUpdated !== 'n_a' && ( // Only show if fiixit_updated is 'yes' or 'no'
                <div className="mt-4 pt-4 border-t border-slate-300">
                  <DetailItem icon={<CheckCircle />} label="Fiixit Updated after completion">
                    <span className={`font-medium ${
                      fiixitUpdated === 'yes' ? 'text-green-600' : 'text-slate-600'
                    }`}>
                      {fiixitUpdated === 'yes' ? 'Yes' : 'No'}
                    </span>
                  </DetailItem>
                </div>
              )}
            </div>

            <Separator className="my-6" />
            <h3 className="text-xl font-semibold text-slate-800 mb-4">Scheduling & Contractor</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DetailItem icon={<Clock />} label="Scheduled Date">
                {repair.scheduled_date ? format(new Date(repair.scheduled_date), 'dd MMMM yyyy, HH:mm') : 'Not scheduled'}
              </DetailItem>
              <DetailItem icon={<User />} label="Contractor">
                {repair.contractor}
                {repair.contractor_contact && <span className="text-sm font-normal text-blue-600 ml-1 block">{repair.contractor_contact}</span>}
              </DetailItem>
              <DetailItem icon={<Banknote />} label="Estimated Cost">
                {repair.estimated_cost > 0 ? `£${repair.estimated_cost.toFixed(2)}` : null}
              </DetailItem>
            </div>

            <Separator className="my-6" />
            <h3 className="text-xl font-semibold text-slate-800 mb-4">Invoice Information</h3>
            {repair.invoice_not_applicable ? (
              <div className="bg-slate-50 rounded-lg p-6 text-center border border-slate-200">
                <p className="text-slate-700 font-medium">Invoice Not Applicable (N/A)</p>
                <p className="text-sm text-slate-500 mt-1">No invoice is expected for this repair</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <DetailItem icon={<InvoiceIcon />} label="Invoice Number">{repair.invoice_number}</DetailItem>
                <DetailItem icon={<Banknote />} label="Invoice Amount">
                  {repair.invoice_amount > 0 ? `£${repair.invoice_amount.toFixed(2)}` : null}
                </DetailItem>
                <DetailItem icon={<Calendar />} label="Invoice Received Date">
                  {repair.invoice_received_date ? format(new Date(repair.invoice_received_date), 'dd MMMM yyyy') : null}
                </DetailItem>
                <DetailItem icon={<User />} label="Invoice From">{repair.invoice_received_from}</DetailItem>
                <DetailItem icon={<CheckCircle />} label="Payment Status">
                  <Badge className={getPaymentStatusColor(repair.invoice_payment_status)}>
                    {repair.invoice_payment_status?.replace('_', ' ')}
                  </Badge>
                </DetailItem>
                <DetailItem icon={<Calendar />} label="Payment Due Date">
                  {repair.payment_due_date ? format(new Date(repair.payment_due_date), 'dd MMMM yyyy') : null}
                </DetailItem>
                <DetailItem icon={<Calendar />} label="Date Invoice Paid">
                  {repair.date_invoice_paid ? format(new Date(repair.date_invoice_paid), 'dd MMMM yyyy') : null}
                </DetailItem>
                <DetailItem icon={<InvoiceIcon />} label="Invoice File">
                  {repair.invoice_file_url ? (
                    <a href={repair.invoice_file_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      View Invoice
                    </a>
                  ) : null}
                </DetailItem>
              </div>
            )}

            {repair.notes && (
                <>
                    <Separator className="my-6" />
                    <h3 className="text-xl font-semibold text-slate-800 mb-4">Additional Notes</h3>
                     <div className="bg-slate-50 rounded-lg p-4">
                        <p className="text-slate-700 whitespace-pre-wrap">{repair.notes}</p>
                    </div>
                </>
            )}

            <DialogFooter className="mt-8 flex justify-between">
              <Button 
                onClick={() => {
                  onClose();
                  onDelete(repair);
                }} 
                variant="destructive"
                className="bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Repair
              </Button>
              <Button onClick={() => {
                onClose();
                onEdit(repair);
              }} className="bg-orange-600 hover:bg-orange-700">
                <Edit className="w-4 h-4 mr-2" />
                Edit Repair
              </Button>
            </DialogFooter>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}