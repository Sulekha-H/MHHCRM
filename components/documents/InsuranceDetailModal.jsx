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
    Shield, Calendar, Building2, PoundSterling, Edit, Link2, User, FileText, Trash2
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

export default function InsuranceDetailModal({
  insurance,
  getPropertyName,
  getStatusColor,
  onClose,
  onEdit,
  onDelete
}) {
  if (!insurance) return null;

  // Handle both snake_case (Base44) and Title Case (Supabase) field names
  const policyName = insurance.policy_name || insurance["Policy Name"];
  const insuranceType = insurance.insurance_type || insurance["Insurance Type"];
  const insuranceCompany = insurance.insurance_company || insurance["Insurance Company"];
  const policyNumber = insurance.policy_number || insurance["Policy Number"];
  const coverageAmount = insurance.coverage_amount || insurance["Coverage Amount"];
  const annualPremium = insurance.annual_premium || insurance["Annual Premium"];
  const policyStartDate = insurance.policy_start_date || insurance["Policy Start Date"];
  const policyEndDate = insurance.policy_end_date || insurance["Policy End Date"];
  const renewalDate = insurance.renewal_date || insurance["Renewal Date"];
  const directDebitPaymentDay = insurance.direct_debit_payment_day || insurance["Direct Debit Payment Day"];
  const brokerName = insurance.broker_name || insurance["Broker Name"];
  const brokerContact = insurance.broker_contact || insurance["Broker Contact"];
  const propertyId = insurance.property_id || insurance["Property ID"];
  const status = insurance.status || insurance.Status;
  const policyDocumentUrl = insurance.policy_document_url || insurance["Policy Document URL"];
  const certificateUrl = insurance.certificate_url || insurance["Certificate URL"];
  const autoRenewal = insurance.auto_renewal || insurance["Auto Renewal"];
  const renewalReminderDate = insurance.renewal_reminder_date || insurance["Renewal Reminder Date"];
  const renewalContactPerson = insurance.renewal_contact_person || insurance["Renewal Contact Person"];
  const renewalNotes = insurance.renewal_notes || insurance["Renewal Notes"];
  const notes = insurance.notes || insurance.Notes;
  const createdDate = insurance.created_date || insurance["Created Date"];
  const loggedBy = insurance.logged_by || insurance["Logged By"];
  const createdBy = insurance.created_by || insurance["Created By"];

  console.log("🛡️ InsuranceDetailModal - Extracted fields:", {
    policyName,
    insuranceType,
    insuranceCompany,
    policyNumber,
    coverageAmount,
    annualPremium,
    policyStartDate,
    policyEndDate,
    renewalDate,
    directDebitPaymentDay,
    brokerName,
    brokerContact,
    propertyId,
    status,
    policyDocumentUrl,
    certificateUrl,
    autoRenewal,
    renewalReminderDate,
    renewalContactPerson,
    renewalNotes,
    notes,
    createdDate,
    loggedBy,
    createdBy
  });

  const getInsuranceTypeLabel = (type) => {
    if (!type) return "Not specified";
    const labels = {
      public_liability: "Public Liability",
      buildings: "Buildings Insurance",
      contents: "Contents Insurance",
      employers_liability: "Employers Liability",
      professional_indemnity: "Professional Indemnity",
      motor: "Motor Insurance",
      equipment: "Equipment Insurance",
      other: "Other",
      // Title case versions
      "Public Liability": "Public Liability",
      "Buildings": "Buildings Insurance",
      "Contents": "Contents Insurance",
      "Employers Liability": "Employers Liability",
      "Professional Indemnity": "Professional Indemnity",
      "Motor": "Motor Insurance",
      "Equipment": "Equipment Insurance",
      "Other": "Other"
    };
    return labels[type] || type?.replace(/_/g, ' ');
  };

  const getLoggedByNameLocal = () => {
    if (loggedBy) {
      return loggedBy;
    }
    if (createdBy) {
      return createdBy.split('@')[0];
    }
    return '-';
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return null;
      return format(date, 'dd MMMM yyyy');
    } catch (error) {
      return null;
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return null;
      return format(date, 'dd MMMM yyyy, HH:mm');
    } catch (error) {
      return null;
    }
  };

  const formatPaymentDay = (day) => {
    if (!day) return null;
    const suffix = ['th', 'st', 'nd', 'rd'];
    const v = day % 100;
    return day + (suffix[(v - 20) % 10] || suffix[v] || suffix[0]);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl w-full p-0">
        <ScrollArea className="max-h-[90vh]">
          <div className="p-6">
            <DialogHeader className="mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-sm">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-3xl font-bold text-slate-900">{policyName}</DialogTitle>
                  <p className="text-slate-600 mt-1">{insuranceCompany}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className={getStatusColor(status)}>{status?.replace('_', ' ')}</Badge>
                    <Badge variant="outline">{getInsuranceTypeLabel(insuranceType)}</Badge>
                  </div>
                </div>
              </div>
            </DialogHeader>

            <h3 className="text-xl font-semibold text-slate-800 mb-4">Policy Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DetailItem icon={<Calendar />} label="Entry Date & Time">
                {createdDate ? format(new Date(createdDate), 'dd/MM/yyyy HH:mm') : 'N/A'}
              </DetailItem>
              <DetailItem icon={<FileText />} label="Policy Number">{policyNumber}</DetailItem>
              <DetailItem icon={<User />} label="Insurance Company">{insuranceCompany}</DetailItem>
              <DetailItem icon={<PoundSterling />} label="Coverage Amount">
                {coverageAmount ? `£${coverageAmount.toLocaleString()}` : null}
              </DetailItem>
              <DetailItem icon={<PoundSterling />} label="Annual Premium">
                {annualPremium ? `£${annualPremium.toLocaleString()}` : null}
              </DetailItem>
              {directDebitPaymentDay && (
                <DetailItem icon={<Calendar />} label="Direct Debit Payment Day">
                  {formatPaymentDay(directDebitPaymentDay)}
                </DetailItem>
              )}
              {propertyId && (
                <DetailItem icon={<Building2 />} label="Related Property">{getPropertyName(propertyId)}</DetailItem>
              )}
            </div>

            <Separator className="my-6" />

            <h3 className="text-xl font-semibold text-slate-800 mb-4">Policy Dates</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DetailItem icon={<Calendar />} label="Policy Period">
                <div>
                  <div>{policyStartDate && policyEndDate ? `${formatDate(policyStartDate)} - ${formatDate(policyEndDate)}` : <span className="text-sm font-normal text-slate-400">Not provided</span>}</div>
                </div>
              </DetailItem>
              {renewalDate && (
                <DetailItem icon={<Calendar />} label="Renewal Date">
                  {formatDate(renewalDate)}
                </DetailItem>
              )}
              {renewalReminderDate && (
                <DetailItem icon={<Calendar />} label="Renewal Reminder Date">
                  {formatDate(renewalReminderDate)}
                </DetailItem>
              )}
              {autoRenewal !== null && autoRenewal !== undefined && (
                <DetailItem icon={<Shield />} label="Auto Renewal">
                  {autoRenewal ? "Yes" : "No"}
                </DetailItem>
              )}
            </div>

            {(brokerName || brokerContact) && (
              <>
                <Separator className="my-6" />
                <h3 className="text-xl font-semibold text-slate-800 mb-4">Broker Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <DetailItem icon={<User />} label="Broker Name">{brokerName}</DetailItem>
                  <DetailItem icon={<User />} label="Broker Contact">{brokerContact}</DetailItem>
                </div>
              </>
            )}

            {(renewalContactPerson || renewalNotes) && (
              <>
                <Separator className="my-6" />
                <h3 className="text-xl font-semibold text-slate-800 mb-4">Renewal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {renewalContactPerson && (
                    <DetailItem icon={<User />} label="Renewal Contact Person">{renewalContactPerson}</DetailItem>
                  )}
                </div>
                {renewalNotes && (
                  <div className="bg-slate-50 rounded-lg p-4 mt-4">
                    <p className="text-sm font-medium text-slate-500 mb-2">Renewal Notes</p>
                    <p className="text-slate-700 whitespace-pre-wrap">{renewalNotes}</p>
                  </div>
                )}
              </>
            )}

            {(policyDocumentUrl || certificateUrl) && (
              <>
                <Separator className="my-6" />
                <h3 className="text-xl font-semibold text-slate-800 mb-4">Documents</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {policyDocumentUrl && (
                    <DetailItem icon={<Link2 />} label="Policy Document">
                      <a 
                        href={policyDocumentUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-blue-600 hover:underline flex items-center gap-2"
                      >
                        <FileText className="w-4 h-4" />
                        View Policy
                      </a>
                    </DetailItem>
                  )}
                  {certificateUrl && (
                    <DetailItem icon={<Link2 />} label="Insurance Certificate">
                      <a 
                        href={certificateUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-blue-600 hover:underline flex items-center gap-2"
                      >
                        <Shield className="w-4 h-4" />
                        View Certificate
                      </a>
                    </DetailItem>
                  )}
                </div>
              </>
            )}

            {notes && (
              <>
                <Separator className="my-6" />
                <h3 className="text-xl font-semibold text-slate-800 mb-4">Additional Notes</h3>
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-slate-700 whitespace-pre-wrap">{notes}</p>
                </div>
              </>
            )}

            <Separator className="my-6" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DetailItem icon={<Calendar />} label="Created">
                {formatDateTime(createdDate)}
              </DetailItem>
              <DetailItem icon={<User />} label="Logged By">
                <span className="text-purple-700 font-medium">
                  {getLoggedByNameLocal()}
                </span>
              </DetailItem>
            </div>

            <DialogFooter className="mt-8">
              <Button onClick={() => {
                onClose();
                onEdit(insurance);
              }} className="bg-emerald-600 hover:bg-emerald-700">
                <Edit className="w-4 h-4 mr-2" />
                Edit Insurance
              </Button>
              {onDelete && (
                <Button onClick={() => {
                  if (window.confirm("Are you sure you want to delete this insurance policy? It will be moved to deleted entries.")) {
                    onDelete(insurance.id || insurance.ID);
                  }
                }} variant="destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Insurance
                </Button>
              )}
            </DialogFooter>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}