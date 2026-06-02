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
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  HandCoins, Calendar, User, FileText, Edit, X, Banknote, CheckCircle2, AlertTriangle, Trash2, CheckCircle, XCircle, Building, Home
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

const getStatusColor = (status) => {
  if (!status) return "bg-slate-100 text-slate-800";
  const normalized = status.toLowerCase().replace(/ /g, '_');
  const colors = {
    pending: "bg-yellow-100 text-yellow-800",
    in_progress: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
    issue_raised: "bg-red-100 text-red-800",
    closed: "bg-slate-100 text-slate-800"
  };
  return colors[normalized] || "bg-slate-100 text-slate-800";
};

const getLogTypeColor = (logType) => {
  if (!logType) return "bg-slate-100 text-slate-800";
  const normalized = logType.toLowerCase().replace(/ /g, '_');
  const colors = {
    application_log: "bg-purple-100 text-purple-800",
    requested_support_notes: "bg-blue-100 text-blue-800",
    requested_documents: "bg-cyan-100 text-cyan-800",
    suspended_claims: "bg-orange-100 text-orange-800",
    awaiting_activation: "bg-yellow-100 text-yellow-800",
    missing_payments: "bg-red-100 text-red-800",
    change_of_addresses: "bg-indigo-100 text-indigo-800",
    room_transfers: "bg-teal-100 text-teal-800",
    hb_calls: "bg-pink-100 text-pink-800",
    hb_leavers: "bg-slate-100 text-slate-800",
    portal_check: "bg-green-100 text-green-800",
    payment_update: "bg-emerald-100 text-emerald-800",
    claim_issue: "bg-rose-100 text-rose-800",
    change_of_circumstances: "bg-amber-100 text-amber-800",
    appeal: "bg-violet-100 text-violet-800",
    general_update: "bg-slate-100 text-slate-800"
  };
  return colors[normalized] || "bg-slate-100 text-slate-800";
};

export default function BenefitLogDetailModal({ 
  log, 
  getResidentName, 
  onClose, 
  onEdit,
  onDelete
}) {
  if (!log) return null;

  // Defensive field access for both normalized and PascalCase database keys
  const title = log.Title || log.title;
  const status = log.Status || log.status;
  const logType = log["Log Type"] || log.log_type;
  const benefit_type = log["Benefit Type"] || log.benefit_type || log.Benefit_Type;
  const sanctions = log.Sanctions || log.sanctions;
  const residentId = log["Resident ID"] || log.resident_id;
  const logDate = log["Log Date"] || log.log_date;
  const loggedBy = log["Logged By"] || log.logged_by || log.staff_member;
  const description = log.Description || log.description;
  const amount = log.Amount || log.amount;
  const applicationDate = log["Application Date"] || log.application_date;
  const sanctionDate = log["Sanction Date"] || log.sanction_date;
  const sanctionAmount = log["Sanction Amount"] || log.sanction_amount;
  const dateResolved = log["Date Resolved"] || log.date_resolved;
  const notes = log.Notes || log.notes;

  const residentName = residentId ? getResidentName(residentId) : 'N/A';
  const benefitTypeLabel = benefit_type?.toLowerCase().replace(/ /g, '_') === 'housing_benefit' ? 'Housing Benefit' :
                      benefit_type?.toLowerCase().replace(/ /g, '_') === 'universal_credit' ? 'Universal Credit' :
                      'Landlord Portal';
  
  const isHBApplicationLog = benefit_type?.toLowerCase().replace(/ /g, '_') === 'housing_benefit' && logType?.toLowerCase().replace(/ /g, '_') === 'application_log';
  const isRequestedSupportNotes = benefit_type?.toLowerCase().replace(/ /g, '_') === 'housing_benefit' && logType?.toLowerCase().replace(/ /g, '_') === 'requested_support_notes';
  const isRequestedDocuments = benefit_type?.toLowerCase().replace(/ /g, '_') === 'housing_benefit' && logType?.toLowerCase().replace(/ /g, '_') === 'requested_documents';
  const isSuspendedClaims = benefit_type?.toLowerCase().replace(/ /g, '_') === 'housing_benefit' && logType?.toLowerCase().replace(/ /g, '_') === 'suspended_claims';
  const isAwaitingActivation = benefit_type?.toLowerCase().replace(/ /g, '_') === 'housing_benefit' && logType?.toLowerCase().replace(/ /g, '_') === 'awaiting_activation';
  const isChangeOfAddresses = benefit_type?.toLowerCase().replace(/ /g, '_') === 'housing_benefit' && logType?.toLowerCase().replace(/ /g, '_') === 'change_of_addresses';
  const isRoomTransfers = benefit_type?.toLowerCase().replace(/ /g, '_') === 'housing_benefit' && logType?.toLowerCase().replace(/ /g, '_') === 'room_transfers';
  const isHBCalls = benefit_type?.toLowerCase().replace(/ /g, '_') === 'housing_benefit' && logType?.toLowerCase().replace(/ /g, '_') === 'hb_calls';
  const isHBLeavers = benefit_type?.toLowerCase().replace(/ /g, '_') === 'housing_benefit' && logType?.toLowerCase().replace(/ /g, '_') === 'hb_leavers';


  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-full p-0">
        <ScrollArea className="max-h-[80vh]">
          <div className="p-6">
            <DialogHeader className="mb-6">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-gradient-to-r from-sky-500 to-blue-500 rounded-xl flex items-center justify-center shadow-sm">
                  <HandCoins className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <DialogTitle className="text-2xl font-bold text-slate-900">{title}</DialogTitle>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <Badge className={getStatusColor(status)}>{status?.replace('_', ' ')}</Badge>
                    <Badge variant="outline" className={getLogTypeColor(logType)}>{logType?.replace(/_/g, ' ')}</Badge>
                    <Badge variant="outline">{benefitTypeLabel}</Badge>
                    {sanctions && <Badge className="bg-red-100 text-red-800">Sanctions</Badge>}
                  </div>
                </div>
              </div>
            </DialogHeader>

            {isHBApplicationLog ? (
              // Special display for HB Application Log
              <>
                <h3 className="text-xl font-semibold text-slate-800 mb-4">Log Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {residentId && (
                    <DetailItem icon={<User />} label="Resident">{residentName}</DetailItem>
                  )}
                  <DetailItem icon={<Calendar />} label="Log Date & Time">
                    {logDate ? format(new Date(logDate), 'dd MMMM yyyy, HH:mm') : null}
                  </DetailItem>
                  {loggedBy && (
                    <DetailItem icon={<User />} label="Logged By">
                      {loggedBy}
                    </DetailItem>
                  )}
                </div>

                <Separator className="my-6" />
                <h3 className="text-xl font-semibold text-slate-800 mb-4">Application Timeline</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {log.date_application_started && (
                    <DetailItem icon={<Calendar />} label="Date Application Started">
                      {format(new Date(log.date_application_started), 'dd MMMM yyyy')}
                    </DetailItem>
                  )}
                  {log.application_saved_date && (
                    <DetailItem icon={<Calendar />} label="Application Saved Date">
                      {format(new Date(log.application_saved_date), 'dd MMMM yyyy')}
                    </DetailItem>
                  )}
                  {log.completed_application_submitted_date && (
                    <DetailItem icon={<Calendar />} label="Completed Application Submitted Date">
                      {format(new Date(log.completed_application_submitted_date), 'dd MMMM yyyy')}
                    </DetailItem>
                  )}
                  {log.claim_submission_reference && (
                    <DetailItem icon={<FileText />} label="Claim Submission Reference">
                      {log.claim_submission_reference}
                    </DetailItem>
                  )}
                </div>

                <Separator className="my-6" />
                <h3 className="text-xl font-semibold text-slate-800 mb-4">Documents Uploaded</h3>
                <div className="bg-slate-50 rounded-lg p-4 space-y-3 mb-6">
                  <div className="flex items-center gap-2">
                    {log.licence_agreement_uploaded ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-gray-400" />
                    )}
                    <span className={log.licence_agreement_uploaded ? "text-green-700 font-medium" : "text-gray-600"}>
                      Licence Agreement {log.licence_agreement_uploaded ? "Uploaded" : "Not Uploaded"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {log.authorisation_form_uploaded ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-gray-400" />
                    )}
                    <span className={log.authorisation_form_uploaded ? "text-green-700 font-medium" : "text-gray-600"}>
                      Authorisation Form {log.authorisation_form_uploaded ? "Uploaded" : "Not Uploaded"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {log.proof_of_income_uploaded ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-gray-400" />
                    )}
                    <span className={log.proof_of_income_uploaded ? "text-green-700 font-medium" : "text-gray-600"}>
                      Proof of Income (UC Payments Screenshots) {log.proof_of_income_uploaded ? "Uploaded" : "Not Uploaded"}
                    </span>
                  </div>
                  {log.date_uploaded && (
                    <div className="pt-2 border-t border-slate-200">
                      <Label className="text-sm font-medium text-slate-700">Date Uploaded:</Label>
                      <p className="text-slate-900 font-semibold mt-1">{format(new Date(log.date_uploaded), 'dd MMMM yyyy')}</p>
                    </div>
                  )}
                </div>

                {notes && (
                  <>
                    <Separator className="my-6" />
                    <h3 className="text-xl font-semibold text-slate-800 mb-4">Notes</h3>
                    <div className="bg-slate-50 rounded-lg p-4">
                      <p className="text-slate-700 whitespace-pre-wrap">{notes}</p>
                    </div>
                  </>
                )}
              </>
            ) : isRequestedSupportNotes ? (
              // Special display for Requested Support Notes
              <>
                <h3 className="text-xl font-semibold text-slate-800 mb-4">Support Notes Request Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {residentId && (
                    <DetailItem icon={<User />} label="Resident">{residentName}</DetailItem>
                  )}
                  <DetailItem icon={<Calendar />} label="Log Date & Time">
                    {logDate ? format(new Date(logDate), 'dd MMMM yyyy, HH:mm') : null}
                  </DetailItem>
                  {log.date_of_request && (
                    <DetailItem icon={<Calendar />} label="Date of Request">
                      {format(new Date(log.date_of_request), 'dd MMMM yyyy')}
                    </DetailItem>
                  )}
                  {log.support_notes_requested_dates && (
                    <DetailItem icon={<FileText />} label="Support Notes Requested Dates">
                      {log.support_notes_requested_dates}
                    </DetailItem>
                  )}
                  {loggedBy && (
                    <DetailItem icon={<User />} label="Logged By">
                      {loggedBy}
                    </DetailItem>
                  )}
                </div>

                <Separator className="my-6" />
                <h3 className="text-xl font-semibold text-slate-800 mb-4">Support Notes Status</h3>
                <div className="bg-slate-50 rounded-lg p-4 space-y-3 mb-6">
                  <div className="flex items-center gap-2">
                    {log.support_notes_uploaded ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-gray-400" />
                    )}
                    <span className={log.support_notes_uploaded ? "text-green-700 font-medium" : "text-gray-600"}>
                      Support Notes {log.support_notes_uploaded ? "Uploaded" : "Not Uploaded"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {log.support_notes_sent ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-gray-400" />
                    )}
                    <span className={log.support_notes_sent ? "text-green-700 font-medium" : "text-gray-600"}>
                      Support Notes {log.support_notes_sent ? "Sent" : "Not Sent"}
                    </span>
                  </div>
                  {log.date_uploaded_or_sent && (
                    <div className="pt-2 border-t border-slate-200">
                      <Label className="text-sm font-medium text-slate-700">Date Uploaded/Sent:</Label>
                      <p className="text-slate-900 font-semibold mt-1">{format(new Date(log.date_uploaded_or_sent), 'dd MMMM yyyy')}</p>
                    </div>
                  )}
                </div>

                {notes && (
                  <>
                    <Separator className="my-6" />
                    <h3 className="text-xl font-semibold text-slate-800 mb-4">Notes</h3>
                    <div className="bg-slate-50 rounded-lg p-4">
                      <p className="text-slate-700 whitespace-pre-wrap">{notes}</p>
                    </div>
                  </>
                )}
              </>
            ) : isRequestedDocuments ? (
              // Special display for Requested Documents
              <>
                <h3 className="text-xl font-semibold text-slate-800 mb-4">Requested Documents Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {residentId && (
                    <DetailItem icon={<User />} label="Resident">{residentName}</DetailItem>
                  )}
                  <DetailItem icon={<Calendar />} label="Log Date & Time">
                    {logDate ? format(new Date(logDate), 'dd MMMM yyyy, HH:mm') : null}
                  </DetailItem>
                  {log.requested_document_type && (
                    <DetailItem icon={<FileText />} label="Requested Document Type">
                      {log.requested_document_type}
                    </DetailItem>
                  )}
                  {log.date_requested_documents_sent && (
                    <DetailItem icon={<Calendar />} label="Date Documents Sent">
                      {format(new Date(log.date_requested_documents_sent), 'dd MMMM yyyy')}
                    </DetailItem>
                  )}
                  {log.method_documents_sent && (
                    <DetailItem icon={<FileText />} label="Method Documents Were Sent">
                      {log.method_documents_sent.replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                    </DetailItem>
                  )}
                  {loggedBy && (
                    <DetailItem icon={<User />} label="Logged By">
                      {loggedBy}
                    </DetailItem>
                  )}
                </div>

                {notes && (
                  <>
                    <Separator className="my-6" />
                    <h3 className="text-xl font-semibold text-slate-800 mb-4">Notes</h3>
                    <div className="bg-slate-50 rounded-lg p-4">
                      <p className="text-slate-700 whitespace-pre-wrap">{notes}</p>
                    </div>
                  </>
                )}
              </>
            ) : isSuspendedClaims ? (
              // Special display for Suspended Claims
              <>
                <h3 className="text-xl font-semibold text-slate-800 mb-4">Suspended Claims Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {residentId && (
                    <DetailItem icon={<User />} label="Resident">{residentName}</DetailItem>
                  )}
                  <DetailItem icon={<Calendar />} label="Log Date & Time">
                    {logDate ? format(new Date(logDate), 'dd MMMM yyyy, HH:mm') : null}
                  </DetailItem>
                  {loggedBy && (
                    <DetailItem icon={<User />} label="Logged By">
                      {loggedBy}
                    </DetailItem>
                  )}
                </div>

                {log.reason_for_suspended_claim && (
                  <>
                    <Separator className="my-6" />
                    <h3 className="text-xl font-semibold text-slate-800 mb-4">Reason for Suspended Claim</h3>
                    <div className="bg-slate-50 rounded-lg p-4">
                      <p className="text-slate-700 whitespace-pre-wrap">{log.reason_for_suspended_claim}</p>
                    </div>
                  </>
                )}

                {log.action_to_follow && (
                  <>
                    <Separator className="my-6" />
                    <h3 className="text-xl font-semibold text-slate-800 mb-4">Action to Follow</h3>
                    <div className="bg-slate-50 rounded-lg p-4">
                      <p className="text-slate-700 whitespace-pre-wrap">{log.action_to_follow}</p>
                    </div>
                  </>
                )}

                <Separator className="my-6" />
                <h3 className="text-xl font-semibold text-slate-800 mb-4">Action Status</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    {log.action_to_follow_completed ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-slate-400" />
                    )}
                    <span className={log.action_to_follow_completed ? "text-green-700 font-medium" : "text-slate-600"}>
                      Action to Follow {log.action_to_follow_completed ? 'Completed' : 'Not Completed'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {log.claim_reactivated ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-slate-400" />
                    )}
                    <span className={log.claim_reactivated ? "text-green-700 font-medium" : "text-slate-600"}>
                      Claim {log.claim_reactivated ? 'Reactivated' : 'Not Reactivated'}
                    </span>
                  </div>
                  {log.claim_reactivated && log.claim_reactivated_date && (
                    <div className="pl-7">
                      <DetailItem icon={<Calendar />} label="Claim Reactivated Date">
                        {format(new Date(log.claim_reactivated_date), 'dd MMMM yyyy')}
                      </DetailItem>
                    </div>
                  )}
                </div>

                {notes && (
                  <>
                    <Separator className="my-6" />
                    <h3 className="text-xl font-semibold text-slate-800 mb-4">Notes</h3>
                    <div className="bg-slate-50 rounded-lg p-4">
                      <p className="text-slate-700 whitespace-pre-wrap">{notes}</p>
                    </div>
                  </>
                )}
              </>
            ) : isAwaitingActivation ? (
              // Special display for Awaiting Activation
              <>
                <h3 className="text-xl font-semibold text-slate-800 mb-4">Awaiting Activation Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {residentId && (
                    <DetailItem icon={<User />} label="Resident">{residentName}</DetailItem>
                  )}
                  <DetailItem icon={<Calendar />} label="Log Date & Time">
                    {logDate ? format(new Date(logDate), 'dd MMMM yyyy, HH:mm') : null}
                  </DetailItem>
                  {loggedBy && (
                    <DetailItem icon={<User />} label="Logged By">
                      {loggedBy}
                    </DetailItem>
                  )}
                  {log.date_activated && (
                    <DetailItem icon={<Calendar />} label="Date Activated">
                      {format(new Date(log.date_activated), 'dd MMMM yyyy')}
                    </DetailItem>
                  )}
                </div>

                {description && (
                  <>
                    <Separator className="my-6" />
                    <h3 className="text-xl font-semibold text-slate-800 mb-4">Description</h3>
                    <div className="bg-slate-50 rounded-lg p-4">
                      <p className="text-slate-700 whitespace-pre-wrap">{description}</p>
                    </div>
                  </>
                )}

                {notes && (
                  <>
                    <Separator className="my-6" />
                    <h3 className="text-xl font-semibold text-slate-800 mb-4">Notes</h3>
                    <div className="bg-slate-50 rounded-lg p-4">
                      <p className="text-slate-700 whitespace-pre-wrap">{notes}</p>
                    </div>
                  </>
                )}
              </>
            ) : isChangeOfAddresses ? (
              // Special display for Change of Addresses
              <>
                <h3 className="text-xl font-semibold text-slate-800 mb-4">Change of Address Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {residentId && (
                    <DetailItem icon={<User />} label="Resident">{residentName}</DetailItem>
                  )}
                  <DetailItem icon={<Calendar />} label="Log Date & Time">
                    {logDate ? format(new Date(logDate), 'dd MMMM yyyy, HH:mm') : null}
                  </DetailItem>
                  {loggedBy && (
                    <DetailItem icon={<User />} label="Logged By">
                      {loggedBy}
                    </DetailItem>
                  )}
                </div>

                <Separator className="my-6" />
                <h3 className="text-xl font-semibold text-slate-800 mb-4">Completion Status</h3>
                <div className="bg-slate-50 rounded-lg p-4 space-y-3 mb-6">
                  <div className="flex items-center gap-2">
                    {log.change_of_address_completed_hb ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-gray-400" />
                    )}
                    <span className={log.change_of_address_completed_hb ? "text-green-700 font-medium" : "text-gray-600"}>
                      Change of Address HB {log.change_of_address_completed_hb ? "Completed" : "Not Completed"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {log.change_of_address_completed_uc ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-gray-400" />
                    )}
                    <span className={log.change_of_address_completed_uc ? "text-green-700 font-medium" : "text-gray-600"}>
                      Change of Address UC {log.change_of_address_completed_uc ? "Completed" : "Not Completed"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {log.new_licence_agreement_sent_uploaded ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-gray-400" />
                    )}
                    <span className={log.new_licence_agreement_sent_uploaded ? "text-green-700 font-medium" : "text-gray-600"}>
                      New Licence Agreement {log.new_licence_agreement_sent_uploaded ? "Sent/Uploaded" : "Not Sent/Uploaded"}
                    </span>
                  </div>
                </div>

                {(log.licence_sent_uploaded_date || log.licence_sent_uploaded_method) && (
                  <>
                    <Separator className="my-6" />
                    <h3 className="text-xl font-semibold text-slate-800 mb-4">Licence Agreement Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      {log.licence_sent_uploaded_date && (
                        <DetailItem icon={<Calendar />} label="Sent/Uploaded Date">
                          {format(new Date(log.licence_sent_uploaded_date), 'dd MMMM yyyy')}
                        </DetailItem>
                      )}
                      {log.licence_sent_uploaded_method && (
                        <DetailItem icon={<FileText />} label="Sent/Uploaded Method">
                          {log.licence_sent_uploaded_method === 'website_upload' ? 'Website Upload' : 'Email'}
                        </DetailItem>
                      )}
                    </div>
                  </>
                )}

                {notes && (
                  <>
                    <Separator className="my-6" />
                    <h3 className="text-xl font-semibold text-slate-800 mb-4">Notes</h3>
                    <div className="bg-slate-50 rounded-lg p-4">
                      <p className="text-slate-700 whitespace-pre-wrap">{notes}</p>
                    </div>
                  </>
                )}
              </>
            ) : isRoomTransfers ? (
              // Special display for Room Transfers
              <>
                <h3 className="text-xl font-semibold text-slate-800 mb-4">Room Transfer Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {residentId && (
                    <DetailItem icon={<User />} label="Resident">{residentName}</DetailItem>
                  )}
                  <DetailItem icon={<Calendar />} label="Log Date & Time">
                    {logDate ? format(new Date(logDate), 'dd MMMM yyyy, HH:mm') : null}
                  </DetailItem>
                  {loggedBy && (
                    <DetailItem icon={<User />} label="Logged By">
                      {loggedBy}
                    </DetailItem>
                  )}
                </div>

                {/* Moving From Section */}
                {(log.accommodation_from || log.unit_from || log.date_from) && (
                  <>
                    <Separator className="my-6" />
                    <h3 className="text-xl font-semibold text-slate-800 mb-4">Moving From</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                      {log.accommodation_from && (
                        <DetailItem icon={<Building />} label="Accommodation">{log.accommodation_from}</DetailItem>
                      )}
                      {log.unit_from && (
                        <DetailItem icon={<Home />} label="Unit">{log.unit_from}</DetailItem>
                      )}
                      {log.date_from && (
                        <DetailItem icon={<Calendar />} label="Date">
                          {format(new Date(log.date_from), 'dd MMMM yyyy')}
                        </DetailItem>
                      )}
                    </div>
                  </>
                )}

                {/* Moving To Section */}
                {(log.accommodation_to || log.unit_to || log.date_to) && (
                  <>
                    <Separator className="my-6" />
                    <h3 className="text-xl font-semibold text-slate-800 mb-4">Moving To</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                      {log.accommodation_to && (
                        <DetailItem icon={<Building />} label="Accommodation">{log.accommodation_to}</DetailItem>
                      )}
                      {log.unit_to && (
                        <DetailItem icon={<Home />} label="Unit">{log.unit_to}</DetailItem>
                      )}
                      {log.date_to && (
                        <DetailItem icon={<Calendar />} label="Date">
                          {format(new Date(log.date_to), 'dd MMMM yyyy')}
                        </DetailItem>
                      )}
                    </div>
                  </>
                )}

                {/* HB Update Section */}
                <Separator className="my-6" />
                <h3 className="text-xl font-semibold text-slate-800 mb-4">Housing Benefit Update Status</h3>
                <div className="bg-slate-50 rounded-lg p-4 space-y-3 mb-6">
                  <div className="flex items-center gap-2">
                    {log.hb_updated ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-gray-400" />
                    )}
                    <span className={log.hb_updated ? "text-green-700 font-medium" : "text-gray-600"}>
                      HB {log.hb_updated ? "Updated" : "Not Updated"}
                    </span>
                  </div>

                  {log.date_hb_updated && (
                    <div className="mt-2">
                      <span className="text-sm text-slate-600">Date Updated: </span>
                      <span className="text-sm font-medium text-slate-900">
                        {format(new Date(log.date_hb_updated), 'dd MMMM yyyy')}
                      </span>
                    </div>
                  )}

                  {(log.hb_update_method_email || log.hb_update_method_website) && (
                    <div className="mt-2">
                      <span className="text-sm text-slate-600">Update Method: </span>
                      <div className="flex gap-2 mt-1">
                        {log.hb_update_method_email && (
                          <Badge className="bg-blue-100 text-blue-800">Email</Badge>
                        )}
                        {log.hb_update_method_website && (
                          <Badge className="bg-green-100 text-green-800">Website</Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {notes && (
                  <>
                    <Separator className="my-6" />
                    <h3 className="text-xl font-semibold text-slate-800 mb-4">Notes</h3>
                    <div className="bg-slate-50 rounded-lg p-4">
                      <p className="text-slate-700 whitespace-pre-wrap">{notes}</p>
                    </div>
                  </>
                )}
              </>
            ) : isHBCalls ? (
              // Special display for HB Calls
              <>
                <h3 className="text-xl font-semibold text-slate-800 mb-4">HB Call Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {residentId && (
                    <DetailItem icon={<User />} label="Resident">{residentName}</DetailItem>
                  )}
                  <DetailItem icon={<Calendar />} label="Log Date & Time">
                    {logDate ? format(new Date(logDate), 'dd MMMM yyyy, HH:mm') : null}
                  </DetailItem>
                  {log.date_called && (
                    <DetailItem icon={<Calendar />} label="Date Called">
                      {format(new Date(log.date_called), 'dd MMMM yyyy')}
                    </DetailItem>
                  )}
                  {loggedBy && (
                    <DetailItem icon={<User />} label="Logged By">
                      {loggedBy}
                    </DetailItem>
                  )}
                </div>

                {log.reason_for_call && (
                  <>
                    <Separator className="my-6" />
                    <h3 className="text-xl font-semibold text-slate-800 mb-4">Reason for Call</h3>
                    <div className="bg-slate-50 rounded-lg p-4">
                      <p className="text-slate-700 whitespace-pre-wrap">{log.reason_for_call}</p>
                    </div>
                  </>
                )}

                {log.update_from_call && (
                  <>
                    <Separator className="my-6" />
                    <h3 className="text-xl font-semibold text-slate-800 mb-4">Update from Call</h3>
                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="text-slate-700 whitespace-pre-wrap">{log.update_from_call}</p>
                    </div>
                  </>
                )}

                {(log.hb_call_action_to_follow || log.hb_call_action_completed !== undefined) && (
                  <>
                    <Separator className="my-6" />
                    <h3 className="text-xl font-semibold text-slate-800 mb-4">Action to Follow</h3>
                    <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                      {log.hb_call_action_to_follow && (
                        <div className="mb-3">
                          <p className="text-slate-700 whitespace-pre-wrap">{log.hb_call_action_to_follow}</p>
                        </div>
                      )}
                      <div className="flex items-center gap-2 pt-3 border-t border-amber-200">
                        {log.hb_call_action_completed ? (
                          <>
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <span className="text-green-700 font-medium">Action Completed</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-5 h-5 text-amber-600" />
                            <span className="text-amber-700 font-medium">Action Not Completed</span>
                          </>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {notes && (
                  <>
                    <Separator className="my-6" />
                    <h3 className="text-xl font-semibold text-slate-800 mb-4">Notes</h3>
                    <div className="bg-slate-50 rounded-lg p-4">
                      <p className="text-slate-700 whitespace-pre-wrap">{notes}</p>
                    </div>
                  </>
                )}
              </>
            ) : isHBLeavers ? (
              // Special display for HB Leavers
              <>
                <h3 className="text-xl font-semibold text-slate-800 mb-4">HB Leaver Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {residentId && (
                    <DetailItem icon={<User />} label="Resident">{residentName}</DetailItem>
                  )}
                  <DetailItem icon={<Calendar />} label="Log Date & Time">
                    {logDate ? format(new Date(logDate), 'dd MMMM yyyy, HH:mm') : null}
                  </DetailItem>
                  {log.move_out_date && (
                    <DetailItem icon={<Calendar />} label="Move Out Date">
                      {format(new Date(log.move_out_date), 'dd MMMM yyyy')}
                    </DetailItem>
                  )}
                  {loggedBy && (
                    <DetailItem icon={<User />} label="Logged By">
                      {loggedBy}
                    </DetailItem>
                  )}
                </div>

                <Separator className="my-6" />
                <h3 className="text-xl font-semibold text-slate-800 mb-4">HB Notification Status</h3>
                <div className="bg-blue-50 rounded-lg p-4 space-y-4">
                  <div className="flex items-center gap-2">
                    {log.hb_notified ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-slate-400" />
                    )}
                    <span className={log.hb_notified ? "text-green-700 font-medium" : "text-slate-600"}>
                      HB {log.hb_notified ? 'Notified' : 'Not Notified'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-blue-200">
                    {log.date_hb_notified && (
                      <div>
                        <Label className="text-sm font-medium text-slate-700">Date HB Notified:</Label>
                        <p className="text-slate-900 font-semibold mt-1">{format(new Date(log.date_hb_notified), 'dd MMMM yyyy')}</p>
                      </div>
                    )}
                    {log.date_hb_notified_of_move_out && (
                      <div>
                        <Label className="text-sm font-medium text-slate-700">Date HB Notified of Move Out:</Label>
                        <p className="text-slate-900 font-semibold mt-1">{format(new Date(log.date_hb_notified_of_move_out), 'dd MMMM yyyy')}</p>
                      </div>
                    )}
                  </div>

                  {(log.hb_notified_method_email || log.hb_notified_method_website) && (
                    <div className="pt-2 border-t border-blue-200">
                      <Label className="text-sm font-medium text-slate-700">Notification Method (Change of Circumstances):</Label>
                      <div className="flex gap-2 mt-2">
                        {log.hb_notified_method_email && (
                          <Badge className="bg-blue-100 text-blue-800">Updated via Email</Badge>
                        )}
                        {log.hb_notified_method_website && (
                          <Badge className="bg-green-100 text-green-800">Updated via Website</Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {notes && (
                  <>
                    <Separator className="my-6" />
                    <h3 className="text-xl font-semibold text-slate-800 mb-4">Notes</h3>
                    <div className="bg-slate-50 rounded-lg p-4">
                      <p className="text-slate-700 whitespace-pre-wrap">{notes}</p>
                    </div>
                  </>
                )}
              </>
            ) : (
              // Standard display for other log types
              <>
                <h3 className="text-xl font-semibold text-slate-800 mb-4">Log Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {residentId && (
                    <DetailItem icon={<User />} label="Resident">{residentName}</DetailItem>
                  )}
                  <DetailItem icon={<Calendar />} label="Log Date & Time">
                    {logDate ? format(new Date(logDate), 'dd MMMM yyyy, HH:mm') : null}
                  </DetailItem>
                  {loggedBy && (
                    <DetailItem icon={<User />} label="Logged By">
                      {loggedBy}
                    </DetailItem>
                  )}
                  
                  {applicationDate && (
                      <DetailItem icon={<FileText />} label="Application Date">
                          {format(new Date(applicationDate), 'dd MMMM yyyy')}
                      </DetailItem>
                  )}
                  
                  {(amount != null && amount > 0) && (
                      <DetailItem icon={<Banknote />} label="Amount">
                          £{amount.toFixed(2)}
                      </DetailItem>
                  )}

                  {dateResolved && (
                      <DetailItem icon={<CheckCircle2 />} label="Date Resolved">
                          {format(new Date(dateResolved), 'dd MMMM yyyy')}
                      </DetailItem>
                  )}
                </div>

                {description && (
                    <>
                        <Separator className="my-6" />
                        <h3 className="text-xl font-semibold text-slate-800 mb-4">Description</h3>
                        <div className="bg-slate-50 rounded-lg p-4">
                            <p className="text-slate-700 whitespace-pre-wrap">{description}</p>
                        </div>
                    </>
                )}

                {sanctions && (
                    <>
                        <Separator className="my-6" />
                        <h3 className="text-xl font-semibold text-slate-800 mb-4">Sanctions Information</h3>
                        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {sanctionDate && (
                                    <div>
                                        <Label className="text-sm font-medium text-slate-700">Sanction Date:</Label>
                                        <p className="text-slate-900 font-semibold mt-1">{format(new Date(sanctionDate), 'dd MMMM yyyy')}</p>
                                    </div>
                                )}
                                {sanctionAmount != null && sanctionAmount > 0 && (
                                    <div>
                                        <Label className="text-sm font-medium text-slate-700">Sanction Amount:</Label>
                                        <p className="text-slate-900 font-semibold mt-1">£{sanctionAmount.toFixed(2)}</p>
                                    </div>
                                )}
                                {dateResolved && (
                                    <div>
                                        <Label className="text-sm font-medium text-slate-700">Date Resolved:</Label>
                                        <p className="text-slate-900 font-semibold mt-1">{format(new Date(dateResolved), 'dd MMMM yyyy')}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}

                {notes && (
                    <>
                        <Separator className="my-6" />
                        <h3 className="text-xl font-semibold text-slate-800 mb-4">Notes</h3>
                        <div className="bg-slate-50 rounded-lg p-4">
                            <p className="text-slate-700 whitespace-pre-wrap">{notes}</p>
                        </div>
                    </>
                )}

                {(status?.toLowerCase() === 'issue_raised' || status?.toLowerCase() === 'issue raised') && (
                    <>
                        <Separator className="my-6" />
                        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <AlertTriangle className="w-6 h-6 text-red-600" />
                            <span className="text-red-700 font-medium">
                                This log is marked as 'Issue Raised' and may require attention.
                            </span>
                        </div>
                    </>
                )}
              </>
            )}

            <DialogFooter className="mt-8 flex justify-between">
              <Button 
                onClick={() => {
                  onClose();
                  onDelete(log);
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
              }} className="bg-sky-600 hover:bg-sky-700">
                <Edit className="w-4 h-4 mr-2" />
                Edit Log
              </Button>
            </DialogFooter>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
