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
import { User, Calendar, PoundSterling, CreditCard, Edit, X, FileText, Trash2 } from 'lucide-react';
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

export default function ServiceChargeDetailModal({
  charge,
  getResidentName,
  getPaymentStatusColor,
  onClose,
  onEdit,
  onDelete
}) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  if (!charge) return null;

  // Handle both snake_case (Base44) and Title Case (Supabase) field names
  const residentId = charge.resident_id || charge["Resident ID"];
  const residentName = getResidentName(residentId);
  const dueDate = charge.due_date || charge["Due Date"];
  const datePaid = charge.date_paid || charge["Date Paid"];
  const monthlyAmount = charge.monthly_amount || charge["Monthly Amount"];
  const paymentType = charge.payment_type || charge["Payment Type"];
  const paymentStatus = charge.payment_status || charge["Payment Status"];
  const exempt = charge.exempt || charge.Exempt;
  const exemptReason = charge.exempt_reason || charge["Exempt Reason"];
  const notes = charge.notes || charge.Notes;
  const loggedBy = charge.logged_by || charge["Logged By"];

  const handleDelete = () => {
    onDelete(charge);
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
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-xl flex items-center justify-center shadow-sm">
                    <PoundSterling className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <DialogTitle className="text-2xl font-bold text-slate-900">
                      Service Charge Details
                    </DialogTitle>
                    <p className="text-slate-600 mt-1">For {residentName}</p>
                    <div className="flex items-center gap-2 mt-2">
                       <Badge className={getPaymentStatusColor(paymentStatus)}>{paymentStatus?.replace(/_/g, ' ')}</Badge>
                       {exempt && <Badge variant="outline">Exempt</Badge>}
                       {!exempt && (
                         <Badge variant="outline">
                           {paymentType === 'bank_transfer' || paymentType === 'Card' ? 'Card' : 'Cash'}
                         </Badge>
                       )}
                    </div>
                  </div>
                </div>
              </DialogHeader>

              <h3 className="text-xl font-semibold text-slate-800 mb-4">Payment Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <DetailItem icon={<User />} label="Resident">{residentName}</DetailItem>
                <DetailItem icon={<PoundSterling />} label="Amount Due">
                  {exempt ? (
                    <span className="text-blue-600">Exempt - No payment required</span>
                  ) : (
                    `£${monthlyAmount?.toFixed(2)}`
                  )}
                </DetailItem>
                <DetailItem icon={<Calendar />} label="Due Date">
                  {exempt ? (
                    <span className="text-blue-600">N/A (Exempt)</span>
                  ) : dueDate ? (
                    format(new Date(dueDate), 'dd MMMM yyyy')
                  ) : null}
                </DetailItem>
                <DetailItem icon={<Calendar />} label="Date Paid">
                  {exempt ? (
                    <span className="text-blue-600">N/A (Exempt)</span>
                  ) : datePaid ? (
                    format(new Date(datePaid), 'dd MMMM yyyy')
                  ) : (
                    'Not Paid'
                  )}
                </DetailItem>
                <DetailItem icon={<CreditCard />} label="Payment Type">
                  {paymentType === 'bank_transfer' || paymentType === 'Card' ? 'Card' : 'Cash'}
                </DetailItem>
                <DetailItem icon={<User />} label="Logged By">
                  {loggedBy || 'Not recorded'}
                </DetailItem>
              </div>
              
              {exempt && exemptReason && (
                <>
                  <Separator className="my-6" />
                  <h3 className="text-xl font-semibold text-slate-800 mb-4">Exemption Reason</h3>
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <p className="text-slate-700 whitespace-pre-wrap">{exemptReason}</p>
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
                  onEdit(charge);
                }} className="bg-indigo-600 hover:bg-indigo-700">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Charge
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
              This will permanently delete this service charge record for {residentName}. 
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