
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
    ClipboardPlus, Calendar, User, UserPlus, Info, Home, Edit, X, Check, Circle, Building, Link as LinkIcon, Trash2
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

export default function ReferralDetailModal({ 
  referral, 
  getStatusColor, 
  getUserName, 
  getLoggedByName, 
  onClose, 
  onEdit,
  onDelete 
}) {
  if (!referral) return null;

  const isSelfReferral = referral.referral_type === 'self-referral';

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl w-full p-0">
        <ScrollArea className="max-h-[90vh]">
          <div className="p-6">
            <DialogHeader className="mb-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-fuchsia-500 to-pink-500 rounded-xl flex items-center justify-center shadow-sm">
                    <UserPlus className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <DialogTitle className="text-3xl font-bold text-slate-900">{referral.applicant_name}</DialogTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={getStatusColor(referral.status)}>{referral.status?.replace(/_/g, ' ')}</Badge>
                      <Badge variant="outline" className="capitalize">{referral.priority} priority</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </DialogHeader>

            <h3 className="text-xl font-semibold text-slate-800 mb-4">Applicant & Referral Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DetailItem icon={<Calendar />} label="Referral Date & Time">
                {referral.referral_date ? format(new Date(referral.referral_date), 'dd MMMM yyyy, HH:mm') : null}
              </DetailItem>
              <DetailItem icon={<User />} label="Applicant DOB">
                {referral.applicant_dob ? format(new Date(referral.applicant_dob), 'dd MMMM yyyy') : null}
              </DetailItem>
              <DetailItem icon={<Info />} label="Referral Type">
                {isSelfReferral ? 'Self-Referral' : 'Organisation Referral'}
              </DetailItem>
              {!isSelfReferral && (
                <DetailItem icon={<Building />} label="Referred By">{referral.referred_by_agency}</DetailItem>
              )}
              <DetailItem icon={<LinkIcon />} label="Referral From URL">
                {referral.referral_from_url ? (
                  <a 
                    href={referral.referral_from_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline break-all"
                  >
                    View Referral Document
                  </a>
                ) : null}
              </DetailItem>
              {getLoggedByName && (
                <DetailItem icon={<User />} label="Logged By">{getLoggedByName(referral)}</DetailItem>
              )}
            </div>
            
            {(referral.referral_reason || referral.notes) && <Separator className="my-6" />}
            
            {referral.referral_reason && (
                <>
                    <h3 className="text-xl font-semibold text-slate-800 mb-4">Reason for Referral</h3>
                    <p className="text-slate-700 whitespace-pre-wrap mb-6">{referral.referral_reason}</p>
                </>
            )}
            
            {referral.notes && (
                <>
                    <h3 className="text-xl font-semibold text-slate-800 mb-4">Additional Notes</h3>
                    <p className="text-slate-700 whitespace-pre-wrap mb-6">{referral.notes}</p>
                </>
            )}

            <Separator className="my-6" />

            <h3 className="text-xl font-semibold text-slate-800 mb-4">Processing & Decision</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DetailItem icon={<User />} label="Assigned To">{getUserName(referral.assigned_to_user_id)}</DetailItem>
              <DetailItem icon={<Home />} label="Accommodation Needed">{referral.accommodation_type_needed?.replace(/_/g, ' ')}</DetailItem>
              <DetailItem icon={<Calendar />} label="Assessment Date">
                {referral.assessment_date ? format(new Date(referral.assessment_date), 'dd MMMM yyyy') : null}
              </DetailItem>
              <DetailItem icon={<Calendar />} label="Decision Date">
                {referral.decision_date ? format(new Date(referral.decision_date), 'dd MMMM yyyy') : null}
              </DetailItem>
            </div>
            
            {referral.decision_reason && (
                <>
                    <Separator className="my-6" />
                    <h3 className="text-xl font-semibold text-slate-800 mb-4">Decision Reason</h3>
                    <p className="text-slate-700 whitespace-pre-wrap">{referral.decision_reason}</p>
                </>
            )}

            <DialogFooter className="mt-8 flex justify-between">
              <Button 
                onClick={() => {
                  onClose();
                  onDelete(referral);
                }} 
                variant="destructive"
                className="bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Referral
              </Button>
              <Button onClick={() => {
                onClose();
                onEdit(referral);
              }} className="bg-fuchsia-600 hover:bg-fuchsia-700">
                <Edit className="w-4 h-4 mr-2" />
                Edit Referral
              </Button>
            </DialogFooter>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}