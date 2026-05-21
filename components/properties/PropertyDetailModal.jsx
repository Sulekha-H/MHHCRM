
import React, { useState } from 'react';
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
    Building2, MapPin, Users, PoundSterling, Wrench, Calendar, Phone, ShieldCheck, Edit, FileText, Fingerprint, Trash2, ExternalLink, Zap, ImageIcon
} from 'lucide-react';
import { format } from 'date-fns';
import ImagePreviewModal from "@/components/ui/ImagePreviewModal";

const convertToDirectImageUrl = (url) => {
  if (!url) return url;

  if (url.includes('dropbox.com')) {
    return url
      .replace('www.dropbox.com', 'dl.dropboxusercontent.com')
      .replace('?dl=0', '')
      .replace('?dl=1', '');
  }

  if (url.includes('drive.google.com')) {
    let fileId = null;
    const match1 = url.match(/\/file\/d\/([^\/\?]+)/);
    if (match1) {
      fileId = match1[1];
    }
    const match2 = url.match(/[?&]id=([^&]+)/);
    if (match2 && !fileId) {
      fileId = match2[1];
    }

    if (fileId) {
      return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
    }
  }

  return url;
};

const DetailItem = ({ icon, label, children, isId = false }) => (
  <div className="flex items-start gap-4">
    <div className="flex-shrink-0 w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
      {React.cloneElement(icon, { className: "w-5 h-5 text-slate-600" })}
    </div>
    <div>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <div className={`text-md font-semibold text-slate-900 ${isId ? 'break-all text-xs font-mono bg-gray-100 p-2 rounded border' : ''}`}>{children || <span className="text-sm font-normal text-slate-400">Not provided</span>}</div>
    </div>
  </div>
);

export default function PropertyDetailModal({ property, accommodations, residents, utilities = [], getStatusColor, getMaintenanceColor, onEdit, onClose, onDelete, isAdmin }) {
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [imageError, setImageError] = useState(false);

  if (!property) return null;

  // Use the pre-calculated current_occupancy from the property object
  const currentOccupancy = property.current_occupancy || 0;
  const totalCapacity = property.total_capacity || 0;
  
  const occupancyRate = totalCapacity > 0 ? Math.round((currentOccupancy / totalCapacity) * 100) : 0;

  // Handle both base44 (snake_case) and Supabase (Title Case) field names
  const propertyId = property["ID"] || property.id;
  const name = property["Name"] || property.name;
  const address = property["Address"] || property.address;
  const status = property["Status"] || property.status;
  const propertyType = property["Property Type"] || property.property_type;
  const propertyManager = property["Property Manager"] || property.property_manager;
  const supportWorker = property["Support Worker"] || property.support_worker;
  const maintenanceStatus = property["Maintenance Status"] || property.maintenance_status;
  
  // FIXED: Check for "Weekly Rent" (Supabase) and "Rent Per Week" (base44)
  const rentPerWeek = property["Weekly Rent"] || property["Rent Per Week"] || property.rent_per_week;
  
  const facilities = property["Facilities"] || property.facilities;
  const accessibilityFeatures = property["Accessibility Features"] || property.accessibility_features;
  const lastInspectionDate = property["Last Inspection Date"] || property.last_inspection_date;
  const nextInspectionDue = property["Next Inspection Due"] || property.next_inspection_due;
  const contactPhone = property["Contact Phone"] || property.contact_phone;
  const emergencyContact = property["Emergency Contact"] || property.emergency_contact;
  const googleDriveLink = property["Google Drive Link"] || property.google_drive_link;
  const notes = property["Notes"] || property.notes;
  const previewUrl = convertToDirectImageUrl(googleDriveLink);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full p-0">
        <ScrollArea className="max-h-[90vh]">
          <div className="p-6">
            <DialogHeader className="mb-6">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                {previewUrl && !imageError ? (
                  <div
                    className="w-full md:w-32 h-48 md:h-32 rounded-xl overflow-hidden shadow-md flex-shrink-0 border border-slate-200 bg-slate-50 cursor-pointer group relative"
                    onClick={() => setShowPhotoModal(true)}
                  >
                    <img
                      src={previewUrl}
                      alt={name}
                      className="w-full h-full object-cover transition-transform group-hover:scale-110"
                      onError={() => setImageError(true)}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                      <ImageIcon className="text-white opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6" />
                    </div>
                  </div>
                ) : (
                  <div className="w-20 h-20 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                    <Building2 className="w-10 h-10 text-white" />
                  </div>
                )}
                <div className="flex-1">
                  <DialogTitle className="text-3xl font-bold text-slate-900">{name}</DialogTitle>
                  <Badge className={`mt-2 ${getStatusColor ? getStatusColor(status) : 'bg-slate-100 text-slate-800'}`}>
                    {status?.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
            </DialogHeader>

            <h3 className="text-xl font-semibold text-slate-800 mb-4">Property Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <DetailItem icon={<MapPin />} label="Address">{address}</DetailItem>
                <DetailItem icon={<Building2 />} label="Property Type">{propertyType?.replace('_', ' ')}</DetailItem>
                <DetailItem icon={<Users />} label="Capacity">
                  {currentOccupancy} / {totalCapacity} residents ({occupancyRate}%)
                </DetailItem>
                <DetailItem icon={<Users />} label="Property Manager">{propertyManager}</DetailItem>
                <DetailItem icon={<Users />} label="Support Worker">{supportWorker}</DetailItem>
            </div>
            
            <Separator className="my-6" />

            <h3 className="text-xl font-semibold text-slate-800 mb-4">Financials</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <DetailItem icon={<PoundSterling />} label="Weekly Rent">
                  {rentPerWeek !== null && rentPerWeek !== undefined && rentPerWeek !== "" 
                    ? `£${Number(rentPerWeek).toFixed(2)}` 
                    : <span className="text-sm font-normal text-slate-400">Not provided</span>}
                </DetailItem>
            </div>

            <Separator className="my-6" />

            <h3 className="text-xl font-semibold text-slate-800 mb-4">Landlord Inspections</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <DetailItem icon={<Calendar />} label="Last Inspection">{lastInspectionDate ? format(new Date(lastInspectionDate), 'dd MMMM yyyy') : null}</DetailItem>
                <DetailItem icon={<Calendar />} label="Next Inspection Due">{nextInspectionDue ? format(new Date(nextInspectionDue), 'dd MMMM yyyy') : null}</DetailItem>
                <DetailItem icon={<Wrench />} label="Maintenance Status">
                  <Badge className={getMaintenanceColor ? getMaintenanceColor(maintenanceStatus) : 'bg-slate-100 text-slate-800'}>
                    {maintenanceStatus?.replace('_', ' ')}
                  </Badge>
                </DetailItem>
            </div>
            
            <Separator className="my-6" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h3 className="text-xl font-semibold text-slate-800 mb-4">Contact</h3>
                    <div className="space-y-4">
                        <DetailItem icon={<Phone />} label="Contact Phone">{contactPhone}</DetailItem>
                        <DetailItem icon={<ShieldCheck />} label="Emergency Contact">{emergencyContact}</DetailItem>
                    </div>
                </div>
                <div>
                    <h3 className="text-xl font-semibold text-slate-800 mb-4">Additional Information</h3>
                    <div className="space-y-4">
                        {googleDriveLink && (
                          <DetailItem icon={<ExternalLink />} label="Google Drive Link">
                            <a
                              href={googleDriveLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 hover:underline flex items-center gap-1"
                            >
                              View Folder/Images
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </DetailItem>
                        )}
                        <DetailItem icon={<Users />} label="Accessibility">{accessibilityFeatures}</DetailItem>
                        <DetailItem icon={<FileText />} label="Notes">{notes}</DetailItem>
                    </div>
                </div>
            </div>

            {facilities && facilities.length > 0 && (
                <>
                    <Separator className="my-6" />
                    <h3 className="text-xl font-semibold text-slate-800 mb-4">Facilities</h3>
                    <div className="flex flex-wrap gap-2">
                        {facilities.map(facility => (
                            <Badge key={facility} variant="secondary">{facility}</Badge>
                        ))}
                    </div>
                </>
            )}

            {utilities && utilities.length > 0 && (
              <>
                <Separator className="my-6" />
                <h3 className="text-xl font-semibold text-slate-800 mb-4">Utilities</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {utilities.filter(u => u["Property ID"] === (property.ID || property.id)).map(utility => (
                    <div key={utility.ID} className="flex items-center gap-4 p-4 border rounded-xl bg-slate-50">
                      <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Zap className="w-6 h-6 text-teal-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">{utility["Utility Type"]}</p>
                        <p className="text-md font-bold text-slate-900 truncate">{utility["Company Name"]}</p>
                        <p className="text-xs text-slate-500 truncate">Account: {utility["Account Number"] || utility["Company Account Number"] || 'N/A'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

          </div>
          <DialogFooter className="p-6 bg-slate-50 border-t sticky bottom-0 z-[60]">
            {onDelete && (
              <Button
                variant="destructive"
                onClick={() => onDelete(property)}
                className="flex-1"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Property
              </Button>
            )}
            <Button variant="outline" onClick={onClose}>Close</Button>
            <Button onClick={() => onEdit(property)}>
              <Edit className="w-4 h-4 mr-2" />
              Edit Property
            </Button>
          </DialogFooter>
        </ScrollArea>
      </DialogContent>

      <ImagePreviewModal
        isOpen={showPhotoModal}
        onClose={() => setShowPhotoModal(false)}
        imageUrl={previewUrl}
        title={name}
      />
    </Dialog>
  );
}