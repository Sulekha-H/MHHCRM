import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
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
import { User, Calendar, PoundSterling, MapPin, Edit, X, FileText, Trash2 } from 'lucide-react';
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

export default function CashLogDetailModal({
  log,
  getResidentName,
  getPropertyName,
  onClose,
  onEdit,
  onDelete
}) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  if (!log) return null;

  // Handle both snake_case (Base44) and Title Case (Supabase) field names
  const residentId = log.resident_id || log["Resident ID"];
  const propertyId = log.property_id || log["Property ID"];
  const residentName = getResidentName(residentId);
  const propertyName = getPropertyName(propertyId);
  const amountGiven = log.amount_given || log["Amount Given"];
  const serviceChargeMonth = log.service_charge_month || log["Service Charge Month"];
  const dateTenantCashGiven = log.date_tenant_cash_given || log["Date Tenant Cash Given"];
  const dateHandedToOffice = log.date_handed_to_office || log["Date Handed to Office"];
  const givenToPutWhere = log.given_to_put_where || log["Given To/Put Where"];
  const loggedBy = log.logged_by || log["Logged By"];
  const notes = log.notes || log.Notes;

  const handleDelete = () => {
    onDelete(log);
    setShowDeleteDialog(false);
    onClose();
  };

  return (
    <>
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-xl w-full p-0">
          <ScrollArea className="max-h-[80vh]">
            <div className="p-6">
              <DialogHeader className="mb-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-sm">
                      <PoundSterling className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <DialogTitle className="text-2xl font-bold text-slate-900">
                        Cash Log Details
                      </DialogTitle>
                      <p className="text-slate-600 mt-1">For {residentName}</p>
                      <Badge variant="outline" className="mt-2">{propertyName}</Badge>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={onClose}><X className="w-5 h-5" /></Button>
                </div>
              </DialogHeader>

              <h3 className="text-xl font-semibold text-slate-800 mb-4">Cash Transaction Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <DetailItem icon={<User />} label="Resident">{residentName}</DetailItem>
                <DetailItem icon={<MapPin />} label="Property">{propertyName}</DetailItem>
                <DetailItem icon={<PoundSterling />} label="Amount Given">£{amountGiven?.toFixed(2)}</DetailItem>
                <DetailItem icon={<Calendar />} label="Service Charge Month">
                  {serviceChargeMonth ? format(new Date(serviceChargeMonth + '-01'), 'MMMM yyyy') : null}
                </DetailItem>
                <DetailItem icon={<Calendar />} label="Date Tenant Gave Cash">
                  {dateTenantCashGiven ? format(new Date(dateTenantCashGiven), 'dd MMMM yyyy') : null}
                </DetailItem>
                <DetailItem icon={<Calendar />} label="Date Handed to Office">
                  {dateHandedToOffice ? format(new Date(dateHandedToOffice), 'dd MMMM yyyy') : null}
                </DetailItem>
                <DetailItem icon={<FileText />} label="Given To / Put Where">
                  {givenToPutWhere}
                </DetailItem>
                <DetailItem icon={<User />} label="Logged By">
                  {loggedBy || 'Not recorded'}
                </DetailItem>
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
                }} className="bg-green-600 hover:bg-green-700">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Log
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
              This will permanently delete this cash log entry for {residentName}. 
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