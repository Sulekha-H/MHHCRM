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
  cashLog,
  log,
  getResidentName,
  getPropertyName,
  onClose,
  onEdit,
  onDelete
}) {
  // Support both 'log' and 'cashLog' prop names
  const actualLog = cashLog || log;
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  if (!actualLog) return null;

  // Handle both snake_case (Base44) and Title Case (Supabase) field names
  const residentId = actualLog.resident_id || actualLog["Resident ID"];
  const propertyId = actualLog.property_id || actualLog["Property ID"];
  const residentName = getResidentName(residentId);
  const propertyName = getPropertyName(propertyId);
  const amountGiven = actualLog.amount_given || actualLog["Amount Given"];
  const serviceChargeMonth = actualLog.service_charge_month || actualLog["Service Charge Month"];
  const dateTenantCashGiven = actualLog.date_tenant_cash_given || actualLog["Date Tenant Cash Given"];
  const dateHandedToOffice = actualLog.date_handed_to_office || actualLog["Date Handed to Office"];
  const givenToPutWhere = actualLog.given_to_put_where || actualLog["Given To/Put Where"];
  const loggedBy = actualLog.logged_by || actualLog["Logged By"];
  const notes = actualLog.notes || actualLog.Notes;

  const handleDelete = () => {
    onDelete(actualLog);
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
                  {serviceChargeMonth ? format(new Date(serviceChargeMonth.length === 7 ? serviceChargeMonth + '-01' : serviceChargeMonth), 'MMMM yyyy') : null}
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
                {onDelete && (
                  <Button 
                    variant="destructive" 
                    onClick={() => setShowDeleteDialog(true)}
                    className="flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Record
                  </Button>
                )}
                <Button onClick={() => {
                  onClose();
                  onEdit(actualLog);
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