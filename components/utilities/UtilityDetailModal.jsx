import React from "react";
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
  Zap, Building2, Phone, Mail, Globe, User, Hash, Calendar, ClipboardList, Key, Info, Edit, Trash2
} from "lucide-react";
import { format } from "date-fns";

const DetailItem = ({ icon, label, children }) => (
  <div className="flex items-start gap-4">
    <div className="flex-shrink-0 w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
      {React.cloneElement(icon, { className: "w-5 h-5 text-slate-600" })}
    </div>
    <div>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <div className="text-md font-semibold text-slate-900">
        {children || <span className="text-sm font-normal text-slate-400">Not provided</span>}
      </div>
    </div>
  </div>
);

export default function UtilityDetailModal({ utility, propertyName, onEdit, onClose, onDelete, isManagement }) {
  if (!utility) return null;

  const formatDate = (dateString) => {
    if (!dateString) return null;
    try {
      return format(new Date(dateString), "dd MMMM yyyy");
    } catch {
      return dateString;
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl w-full p-0">
        <ScrollArea className="max-h-[90vh]">
          <div className="p-6">
            <DialogHeader className="mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-bold text-slate-900">
                    {utility["Company Name"] || "Utility Details"}
                  </DialogTitle>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200">
                      {utility["Utility Type"]}
                    </Badge>
                    {propertyName && (
                      <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">
                        {propertyName}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-8">
              <section>
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-teal-600" />
                  Company Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <DetailItem icon={<Building2 />} label="Company Name">{utility["Company Name"]}</DetailItem>
                  <DetailItem icon={<Phone />} label="Phone">{utility["Company Phone Number"]}</DetailItem>
                  <DetailItem icon={<Mail />} label="Email">{utility["Company Email Address"]}</DetailItem>
                  <DetailItem icon={<Hash />} label="Company Account #">{utility["Company Account Number"]}</DetailItem>
                  <div className="md:col-span-2">
                    <DetailItem icon={<Info />} label="Company Address">{utility["Company Address"]}</DetailItem>
                  </div>
                </div>
              </section>

              <Separator />

              <section>
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-teal-600" />
                  Account & Resident
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <DetailItem icon={<User />} label="Account Holder">{utility["Account Holder Name"]}</DetailItem>
                  <DetailItem icon={<Hash />} label="Account Number">{utility["Account Number"]}</DetailItem>
                  <DetailItem icon={<User />} label="Tenant Name">{utility["Tenant Name"]}</DetailItem>
                  <DetailItem icon={<Hash />} label="Meter Serial #">{utility["Meter Serial Number"]}</DetailItem>
                </div>
              </section>

              <Separator />

              <section>
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-teal-600" />
                  Dates & Meter Readings
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <DetailItem icon={<Calendar />} label="Move In Date">{formatDate(utility["Move In Date"])}</DetailItem>
                  <DetailItem icon={<Calendar />} label="Move Out Date">{formatDate(utility["Move Out Date"])}</DetailItem>
                  <DetailItem icon={<Calendar />} label="Leaving Date">{formatDate(utility["Leaving Date"])}</DetailItem>
                  <DetailItem icon={<ClipboardList />} label="Move In Reading">{utility["Move In Meter Reading"]}</DetailItem>
                  <DetailItem icon={<ClipboardList />} label="Final Reading">{utility["Final Meter Reading"]}</DetailItem>
                </div>
              </section>

              <Separator />

              <section>
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <Key className="w-5 h-5 text-teal-600" />
                  Login Credentials
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <DetailItem icon={<Mail />} label="Login Email">{utility["Login Email Address"]}</DetailItem>
                  <DetailItem icon={<User />} label="Username">{utility["Login Username"]}</DetailItem>
                  <DetailItem icon={<Key />} label="Password">{utility["Login Password"]}</DetailItem>
                </div>
              </section>

              {utility["Notes"] && (
                <>
                  <Separator />
                  <section>
                    <h3 className="text-lg font-semibold text-slate-800 mb-2">Notes</h3>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-slate-700 whitespace-pre-wrap">
                      {utility["Notes"]}
                    </div>
                  </section>
                </>
              )}
            </div>
          </div>
          <DialogFooter className="p-6 bg-slate-50 border-t sticky bottom-0">
            {isManagement && (
              <Button
                variant="destructive"
                onClick={() => onDelete(utility)}
                className="mr-auto"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            )}
            <Button variant="outline" className={!isManagement ? "mr-auto" : ""} onClick={onClose}>Close</Button>
            <Button onClick={() => onEdit(utility)} className="bg-teal-600 hover:bg-teal-700">
              <Edit className="w-4 h-4 mr-2" />
              Edit Utility
            </Button>
          </DialogFooter>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
