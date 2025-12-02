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
    Building, Calendar, Mail, Phone, MapPin, Users, PoundSterling, Edit, ClipboardCheck, MessageSquare, AlertTriangle, UserCheck, User, Trash2, Home, CheckCircle, XCircle, Image, FileText
} from 'lucide-react';
import { format } from 'date-fns';

const DetailItem = ({ icon, label, children }) => (
  <div className="flex items-start gap-4">
    <div className="flex-shrink-0 w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
      {React.cloneElement(icon, { className: "w-5 h-5 text-slate-600" })}
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <div className="text-md font-semibold text-slate-900 break-words">{children || <span className="text-sm font-normal text-slate-400">Not provided</span>}</div>
    </div>
  </div>
);

export default function PropertyOnboardingDetailModal({
  onboardingCase,
  getStatusColor,
  onClose,
  onEdit,
  onDelete
}) {
  if (!onboardingCase) return null;

  const getLoggedByName = (case_) => {
    if (case_.logged_by) {
      return case_.logged_by;
    }
    if (case_.created_by) {
      return case_.created_by.split('@')[0];
    }
    return '-';
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full p-0">
        <ScrollArea className="max-h-[90vh]">
          <div className="p-6">
            <DialogHeader className="mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-sm">
                  <ClipboardCheck className="w-8 h-8 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-3xl font-bold text-slate-900">
                    {onboardingCase.landlord_name}
                    {onboardingCase.landlord_company && (
                      <span className="text-xl text-slate-600 font-normal ml-2">({onboardingCase.landlord_company})</span>
                    )}
                  </DialogTitle>
                  <p className="text-slate-600 mt-1">Property Onboarding Details</p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <Badge className={getStatusColor(onboardingCase.onboarding_status)}>
                      {onboardingCase.onboarding_status?.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                </div>
              </div>
            </DialogHeader>

            <h3 className="text-xl font-semibold text-slate-800 mb-4">Landlord Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DetailItem icon={<Mail />} label="Primary Email">{onboardingCase.contact_email}</DetailItem>
              <DetailItem icon={<Phone />} label="Primary Phone">{onboardingCase.contact_phone}</DetailItem>
              <DetailItem icon={<Users />} label="Alternative Contact">{onboardingCase.alternative_contact}</DetailItem>
            </div>

            <Separator className="my-6" />

            <h3 className="text-xl font-semibold text-slate-800 mb-4">Property Information</h3>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <DetailItem icon={<MapPin />} label="Property Address">{onboardingCase.property_address}</DetailItem>
                <DetailItem icon={<MapPin />} label="Property Area">{onboardingCase.property_area}</DetailItem>
                <DetailItem icon={<Building />} label="Property Type">{onboardingCase.property_type?.replace(/_/g, ' ')}</DetailItem>
                <DetailItem icon={<Building />} label="Total Units">{onboardingCase.total_units}</DetailItem>
              </div>

              {onboardingCase.detailed_property_layout && (
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <div className="flex items-start gap-3 mb-2">
                    <FileText className="w-5 h-5 text-slate-600 flex-shrink-0 mt-0.5" />
                    <h4 className="text-sm font-semibold text-slate-700">Detailed Property Layout</h4>
                  </div>
                  <p className="text-slate-700 whitespace-pre-wrap ml-8">{onboardingCase.detailed_property_layout}</p>
                </div>
              )}
            </div>

            <Separator className="my-6" />

            <h3 className="text-xl font-semibold text-slate-800 mb-4">Financial Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DetailItem icon={<PoundSterling />} label="Weekly Rent">
                {onboardingCase.rent_per_week ? `£${onboardingCase.rent_per_week.toFixed(2)}` : null}
              </DetailItem>
              <DetailItem icon={<PoundSterling />} label="Deposit Amount">
                 {onboardingCase.deposit_amount ? `£${onboardingCase.deposit_amount.toFixed(2)}` : null}
              </DetailItem>
            </div>

            <Separator className="my-6" />

            <h3 className="text-xl font-semibold text-slate-800 mb-4">Property Readiness & Documentation</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DetailItem icon={onboardingCase.hmo_ready ? <CheckCircle /> : <XCircle />} label="HMO Ready">
                <Badge className={onboardingCase.hmo_ready ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                  {onboardingCase.hmo_ready ? "Yes" : "No"}
                </Badge>
              </DetailItem>
              {!onboardingCase.hmo_ready && (
                <DetailItem icon={<Building />} label="HMO Conversion By">
                  {onboardingCase.hmo_conversion_by?.replace(/_/g, ' ')}
                </DetailItem>
              )}
              <DetailItem icon={onboardingCase.property_ready === 'yes' ? <CheckCircle /> : <XCircle />} label="Property Ready">
                <Badge className={onboardingCase.property_ready === 'yes' ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                  {onboardingCase.property_ready}
                </Badge>
              </DetailItem>
              {onboardingCase.property_ready === 'no' && onboardingCase.property_ready_date && (
                <DetailItem icon={<Calendar />} label="Property Ready Date">
                  {format(new Date(onboardingCase.property_ready_date), 'dd MMMM yyyy')}
                </DetailItem>
              )}
              <DetailItem icon={<Image />} label="Pictures Provided">
                <Badge className={onboardingCase.pictures_provided === 'yes' ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-800"}>
                  {onboardingCase.pictures_provided}
                </Badge>
              </DetailItem>
              {onboardingCase.pictures_provided === 'yes' && onboardingCase.pictures_gdrive_link && (
                <DetailItem icon={<Image />} label="Pictures Link">
                  <a 
                    href={onboardingCase.pictures_gdrive_link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline break-all"
                  >
                    View on Google Drive
                  </a>
                </DetailItem>
              )}
            </div>

            <Separator className="my-6" />

            <h3 className="text-xl font-semibold text-slate-800 mb-4">Onboarding Timeline</h3>
            <div className="space-y-3">
              {onboardingCase.initial_contact_date && (
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-700">Initial Contact</p>
                    <p className="text-sm text-slate-600">{format(new Date(onboardingCase.initial_contact_date), 'dd MMMM yyyy, HH:mm')}</p>
                  </div>
                </div>
              )}
              {onboardingCase.documents_requested_date && (
                <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-700">Documents Requested</p>
                    <p className="text-sm text-slate-600">{format(new Date(onboardingCase.documents_requested_date), 'dd MMMM yyyy, HH:mm')}</p>
                  </div>
                </div>
              )}
              {onboardingCase.documents_received_date && (
                <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                  <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-700">Documents Received</p>
                    <p className="text-sm text-slate-600">{format(new Date(onboardingCase.documents_received_date), 'dd MMMM yyyy, HH:mm')}</p>
                  </div>
                </div>
              )}
              {onboardingCase.property_inspection_date && (
                <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                  <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-700">Property Inspection</p>
                    <p className="text-sm text-slate-600">{format(new Date(onboardingCase.property_inspection_date), 'dd MMMM yyyy, HH:mm')}</p>
                  </div>
                </div>
              )}
              {onboardingCase.contract_preparation_date && (
                <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-lg">
                  <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-700">Contract Preparation</p>
                    <p className="text-sm text-slate-600">{format(new Date(onboardingCase.contract_preparation_date), 'dd MMMM yyyy, HH:mm')}</p>
                  </div>
                </div>
              )}
              {onboardingCase.contract_signed_date && (
                <div className="flex items-center gap-3 p-3 bg-teal-50 rounded-lg">
                  <div className="w-3 h-3 rounded-full bg-teal-500"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-700">Contract Signed</p>
                    <p className="text-sm text-slate-600">{format(new Date(onboardingCase.contract_signed_date), 'dd MMMM yyyy, HH:mm')}</p>
                  </div>
                </div>
              )}
              {onboardingCase.live_date && (
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-700">Property Live</p>
                    <p className="text-sm text-slate-600">{format(new Date(onboardingCase.live_date), 'dd MMMM yyyy, HH:mm')}</p>
                  </div>
                </div>
              )}
              {onboardingCase.rejected_date && (
                <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-700">Rejected</p>
                    <p className="text-sm text-red-600">{format(new Date(onboardingCase.rejected_date), 'dd MMMM yyyy, HH:mm')}</p>
                  </div>
                </div>
              )}
              {onboardingCase.on_hold_date && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-700">On Hold</p>
                    <p className="text-sm text-slate-600">{format(new Date(onboardingCase.on_hold_date), 'dd MMMM yyyy, HH:mm')}</p>
                  </div>
                </div>
              )}
            </div>

            <Separator className="my-6" />

            <h3 className="text-xl font-semibold text-slate-800 mb-4">Assignment & Additional Dates</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DetailItem icon={<UserCheck />} label="Assigned To">{onboardingCase.assigned_to_user_id}</DetailItem>
              <DetailItem icon={<Calendar />} label="Application Started">
                {onboardingCase.application_date ? format(new Date(onboardingCase.application_date), 'dd MMMM yyyy, HH:mm') : null}
              </DetailItem>
              <DetailItem icon={<Calendar />} label="Inspection Date">
                {onboardingCase.inspection_date ? format(new Date(onboardingCase.inspection_date), 'dd MMMM yyyy, HH:mm') : null}
              </DetailItem>
              <DetailItem icon={<Calendar />} label="Contract Start Date">
                {onboardingCase.contract_start_date ? format(new Date(onboardingCase.contract_start_date), 'dd MMMM yyyy') : null}
              </DetailItem>
            </div>
            
            <Separator className="my-6" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DetailItem icon={<Calendar />} label="Created">
                {onboardingCase.created_date ? format(new Date(onboardingCase.created_date), 'dd MMMM yyyy, HH:mm') : null}
              </DetailItem>
              <DetailItem icon={<User />} label="Logged By">
                <span className="text-purple-700 font-medium">
                  {getLoggedByName(onboardingCase)}
                </span>
              </DetailItem>
            </div>

            {onboardingCase.notes && (
                <>
                    <Separator className="my-6" />
                    <h3 className="text-xl font-semibold text-slate-800 mb-4">General Notes</h3>
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                        <p className="text-slate-700 whitespace-pre-wrap">{onboardingCase.notes}</p>
                    </div>
                </>
            )}

            {onboardingCase.onboarding_status === 'rejected' && onboardingCase.rejection_reason && (
                <>
                    <Separator className="my-6" />
                    <h3 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-600"/>
                        Rejection Reason
                    </h3>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-red-800 whitespace-pre-wrap">{onboardingCase.rejection_reason}</p>
                    </div>
                </>
            )}

            <DialogFooter className="mt-8 flex gap-2">
              {onDelete && (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    onClose();
                    onDelete(onboardingCase);
                  }}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Case
                </Button>
              )}
              <Button onClick={() => {
                onClose();
                onEdit(onboardingCase);
              }} className="bg-green-600 hover:bg-green-700">
                <Edit className="w-4 h-4 mr-2" />
                Edit Onboarding Case
              </Button>
            </DialogFooter>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}