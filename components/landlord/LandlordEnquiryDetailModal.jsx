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
    Users, Calendar, Mail, Phone, MapPin, Building, Bed, HandCoins, Info, Edit, X, UserCheck, MessageSquare, User, Trash2
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

export default function LandlordEnquiryDetailModal({
  enquiry,
  getStatusColor,
  getPriorityColor,
  onClose,
  onEdit,
  onDelete
}) {
  if (!enquiry) return null;

  const getLoggedByName = (enquiry) => {
    if (enquiry.logged_by) {
      return enquiry.logged_by;
    }
    // If created_by is an email, take the part before @
    if (enquiry.created_by && typeof enquiry.created_by === 'string') {
      return enquiry.created_by.split('@')[0];
    }
    return 'Not provided';
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl w-full p-0">
        <ScrollArea className="max-h-[90vh]">
          <div className="p-6">
            <DialogHeader className="mb-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-sky-500 rounded-xl flex items-center justify-center shadow-sm">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <DialogTitle className="text-3xl font-bold text-slate-900">{enquiry.landlord_name}</DialogTitle>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <Badge className={getStatusColor(enquiry.status)}>{enquiry.status?.replace(/_/g, ' ')}</Badge>
                      <Badge className={getPriorityColor(enquiry.priority)}>{enquiry.priority} priority</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </DialogHeader>

            <h3 className="text-xl font-semibold text-slate-800 mb-4">Contact & Enquiry Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DetailItem icon={<Mail />} label="Email">{enquiry.contact_email}</DetailItem>
              <DetailItem icon={<Phone />} label="Phone">{enquiry.contact_phone}</DetailItem>
              <DetailItem icon={<Calendar />} label="Enquiry Date">
                {enquiry.enquiry_date ? format(new Date(enquiry.enquiry_date), 'dd MMMM yyyy, HH:mm') : null}
              </DetailItem>
              <DetailItem icon={<Info />} label="Enquiry Source">{enquiry.enquiry_source?.replace(/_/g, ' ')}</DetailItem>
            </div>

            <Separator className="my-6" />

            <h3 className="text-xl font-semibold text-slate-800 mb-4">Property Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DetailItem icon={<MapPin />} label="Property Address">{enquiry.property_address}</DetailItem>
              <DetailItem icon={<Building />} label="Property Type">{enquiry.property_type?.replace(/_/g, ' ')}</DetailItem>
              <DetailItem icon={<Bed />} label="Number of Rooms">{enquiry.number_of_rooms}</DetailItem>
              <DetailItem icon={<HandCoins />} label="Weekly Rent">
                {enquiry.rent_per_week ? `£${enquiry.rent_per_week}` : null}
              </DetailItem>
            </div>
            
            {enquiry.description && (
                <>
                    <Separator className="my-6" />
                    <h3 className="text-xl font-semibold text-slate-800 mb-4">Property Description</h3>
                    <div className="bg-slate-50 rounded-lg p-4 mb-6">
                      <p className="text-slate-700 whitespace-pre-wrap">{enquiry.description}</p>
                    </div>
                </>
            )}

            <Separator className="my-6" />
            <h3 className="text-xl font-semibold text-slate-800 mb-4">Internal Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DetailItem icon={<UserCheck />} label="Assigned To">{enquiry.assigned_to_user_id}</DetailItem>
              <DetailItem icon={<Calendar />} label="Next Action Date">
                {enquiry.next_action_date ? format(new Date(enquiry.next_action_date), 'dd MMMM yyyy') : null}
              </DetailItem>
              <DetailItem icon={<Calendar />} label="Viewing Date & Time">
                {enquiry.viewing_date ? format(new Date(enquiry.viewing_date), 'dd MMMM yyyy, HH:mm') : null}
              </DetailItem>
            </div>
            
            {enquiry.notes && (
                <>
                    <Separator className="my-6" />
                    <h3 className="text-xl font-semibold text-slate-800 mb-4">Additional Notes</h3>
                    <div className="bg-slate-50 rounded-lg p-4">
                        <p className="text-slate-700 whitespace-pre-wrap">{enquiry.notes}</p>
                    </div>
                </>
            )}

            <Separator className="my-6" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DetailItem icon={<Calendar />} label="Created">
                {enquiry.created_date ? format(new Date(enquiry.created_date), 'dd MMMM yyyy, HH:mm') : null}
              </DetailItem>
              <DetailItem icon={<User />} label="Logged By">
                <span className="text-purple-700 font-medium">
                  {getLoggedByName(enquiry)}
                </span>
              </DetailItem>
            </div>

            <DialogFooter className="mt-8 flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => onDelete(enquiry)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Enquiry
              </Button>
              <Button onClick={() => {
                onClose();
                onEdit(enquiry);
              }} className="bg-blue-600 hover:bg-blue-700">
                <Edit className="w-4 h-4 mr-2" />
                Edit Enquiry
              </Button>
            </DialogFooter>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}