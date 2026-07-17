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
    Home, MapPin, Users, PoundSterling, Calendar, Wrench, User, Edit, CheckCircle, Building2, Trash2, ExternalLink, ImageIcon
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

export default function AccommodationDetailModal({ 
  accommodation, 
  properties,
  residents,
  getStatusColor,
  getAvailabilityColor,
  getConditionColor, 
  getPropertyName, 
  getResidentName, 
  onEdit, 
  onClose,
  onDelete,
  isAdmin
}) {
  const [selectedImage, setSelectedImage] = React.useState(null);
  const [showPreview, setShowPreview] = React.useState(false);

  if (!accommodation) return null;

  // Use getAvailabilityColor if provided, otherwise fallback to getStatusColor
  const statusColorFunc = getAvailabilityColor || getStatusColor;

  // Handle both Supabase and base44 field formats
  const roomNumber = accommodation["Room Number"] || accommodation.room_number;
  const accommodationType = accommodation["Accommodation Type"] || accommodation.accommodation_type;
  let availabilityStatus = accommodation["Availability Status"] || accommodation.availability_status;
  const condition = accommodation["Condition"] || accommodation.condition;
  const furnished = accommodation["Furnished"] !== undefined ? accommodation["Furnished"] : accommodation.furnished;
  const propertyId = accommodation["Property ID"] || accommodation.property_id;
  const currentResidentId = accommodation["Current Resident ID"] || accommodation.current_resident_id;
  const floor = accommodation["Floor"] || accommodation.floor;
  const sizeSqm = accommodation["Size (sqm)"] || accommodation.size_sqm;
  const maxOccupancy = accommodation["Max Occupancy"] || accommodation.max_occupancy;
  const rentPerWeek = accommodation["Weekly Rent"] || accommodation.rent_per_week;
  const depositAmount = accommodation["Deposit Amount"] || accommodation.deposit_amount;
  const lastMaintenanceDate = accommodation["Last Maintenance Date"] || accommodation.last_maintenance_date;
  const nextMaintenanceDue = accommodation["Next Maintenance Due"] || accommodation.next_maintenance_due;
  const availableFrom = accommodation["Available From"] || accommodation.available_from;
  const leaseStartDate = accommodation["Lease Start Date"] || accommodation.lease_start_date;
  const leaseEndDate = accommodation["Lease End Date"] || accommodation.lease_end_date;
  const amenities = accommodation["Amenities"] || accommodation.amenities;
  const accessibilityFeatures = accommodation["Accessibility Features"] || accommodation.accessibility_features;
  const googleDriveLink = accommodation["Google Drive Link"] || accommodation.google_drive_link;
  const ensuiteImageLink = accommodation["En-suite Image Link"] || accommodation.ensuite_image_link;
  const altAngleImageLink = accommodation["Alternative Angle Link"] || accommodation.alt_angle_image_link;
  const notes = accommodation["Notes"] || accommodation.notes;
  const createdDate = accommodation["Created Date"] || accommodation.created_date || accommodation.Created_Date;
  const accommodationId = accommodation.ID || accommodation.id;
  const previewUrl = convertToDirectImageUrl(googleDriveLink);

  // IMPROVED: Get ALL active residents in this accommodation
  let activeResidentsList = [];
  if (residents && accommodationId) {
    activeResidentsList = residents.filter(resident => {
      const resAccId = resident["Accommodation ID"] || resident.accommodation_id;
      const resStatus = (resident.Status || resident.status || '').toLowerCase();
      return resAccId === accommodationId && resStatus === 'active';
    });
    
    console.log(`   📋 [DETAIL MODAL] Found ${activeResidentsList.length} active resident(s) in ${roomNumber}:`, 
      activeResidentsList.map(r => `${r["First Name"] || r.first_name} ${r["Last Name"] || r.last_name}`).join(', ')
    );

    // Safety override for status
    if (activeResidentsList.length > 0) {
      const hasAllocatedResident = activeResidentsList.some(r => r.isAllocated);
      if (hasAllocatedResident) {
        availabilityStatus = 'Allocated Residents';
      } else if (availabilityStatus?.toLowerCase() === 'available') {
        availabilityStatus = 'Occupied';
      }
    }
  }

  // Get property name - handle both passed function and manual lookup
  let propertyName = null;
  if (getPropertyName) {
    propertyName = getPropertyName(propertyId);
  } else if (propertyId && properties) {
    const property = properties.find(p => (p["ID"] || p.id) === propertyId);
    propertyName = property?.["Name"] || property?.name || null;
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl w-full p-0">
        <ScrollArea className="max-h-[90vh]">
          <div className="p-6">
            <DialogHeader className="mb-6">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                    <span className="text-white font-bold text-xl">
                      {roomNumber?.charAt(0) || 'R'}
                    </span>
                  </div>
                  <div>
                    <DialogTitle className="text-3xl font-bold text-slate-900">{roomNumber}</DialogTitle>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <Badge className={statusColorFunc(availabilityStatus)}>{availabilityStatus?.replace(/_/g, ' ')}</Badge>
                      <Badge className={getConditionColor(condition)}>{condition?.replace(/_/g, ' ')}</Badge>
                      {furnished && (
                        <Badge variant="outline" className="border-blue-500 text-blue-700">Furnished</Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Collage/Gallery Feature */}
                {(previewUrl || ensuiteImageLink || altAngleImageLink) && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    {/* Main Image */}
                    {previewUrl && (
                      <div
                        className="relative aspect-video rounded-xl overflow-hidden cursor-pointer group border border-slate-200 bg-slate-50"
                        onClick={() => {
                          setSelectedImage(previewUrl);
                          setShowPreview(true);
                        }}
                      >
                        <img src={previewUrl} alt="Main room" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <span className="bg-white/90 text-slate-900 text-xs font-bold px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                            Main Room
                          </span>
                        </div>
                      </div>
                    )}

                    {ensuiteImageLink && (
                      <div
                        className="relative aspect-video rounded-xl overflow-hidden cursor-pointer group border border-slate-200 bg-slate-50"
                        onClick={() => {
                          setSelectedImage(convertToDirectImageUrl(ensuiteImageLink));
                          setShowPreview(true);
                        }}
                      >
                        <img src={convertToDirectImageUrl(ensuiteImageLink)} alt="En-suite" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <span className="bg-white/90 text-slate-900 text-xs font-bold px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                            En-suite
                          </span>
                        </div>
                      </div>
                    )}

                    {altAngleImageLink && (
                      <div
                        className="relative aspect-video rounded-xl overflow-hidden cursor-pointer group border border-slate-200 bg-slate-50"
                        onClick={() => {
                          setSelectedImage(convertToDirectImageUrl(altAngleImageLink));
                          setShowPreview(true);
                        }}
                      >
                        <img src={convertToDirectImageUrl(altAngleImageLink)} alt="Alt angle" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <span className="bg-white/90 text-slate-900 text-xs font-bold px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                            Alt Angle
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </DialogHeader>

            <h3 className="text-xl font-semibold text-slate-800 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DetailItem icon={<Calendar />} label="Created Date & Time">
                {createdDate ? format(new Date(createdDate), 'dd MMMM yyyy, HH:mm') : null}
              </DetailItem>
              <DetailItem icon={<Building2 />} label="Property">{propertyName}</DetailItem>
              <DetailItem icon={<Home />} label="Accommodation Type">{accommodationType?.replace(/_/g, ' ')}</DetailItem>
              <DetailItem icon={<Home />} label="Floor & Size">
                {floor != null && (
                  <span>Floor {floor}{sizeSqm > 0 && ` • ${sizeSqm}m²`}</span>
                )}
              </DetailItem>
              <DetailItem icon={<Users />} label="Max Occupancy">{maxOccupancy} person{maxOccupancy > 1 ? 's' : ''}</DetailItem>
            </div>

            <Separator className="my-6" />

            <h3 className="text-xl font-semibold text-slate-800 mb-4">Current Occupancy</h3>
            <div className="grid grid-cols-1 gap-6">
              <DetailItem icon={<User />} label="Current Residents">
                {activeResidentsList.length > 0 ? (
                  <div className="space-y-1">
                    {activeResidentsList.map((resident, index) => {
                      const firstName = resident["First Name"] || resident.first_name;
                      const lastName = resident["Last Name"] || resident.last_name;
                      return (
                        <div key={resident.ID || resident.id || index} className="text-md font-semibold text-slate-900">
                          • {firstName} {lastName}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <span className="text-sm font-normal text-slate-400">No active residents</span>
                )}
              </DetailItem>
              <DetailItem icon={<Calendar />} label="Available From">
                {availableFrom && availabilityStatus?.toLowerCase() === 'available' 
                  ? format(new Date(availableFrom), 'dd MMMM yyyy') 
                  : null}
              </DetailItem>
            </div>

            <Separator className="my-6" />

            <h3 className="text-xl font-semibold text-slate-800 mb-4">Financial Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DetailItem icon={<PoundSterling />} label="Weekly Rent">
                {rentPerWeek !== null && rentPerWeek !== undefined ? `£${Number(rentPerWeek).toFixed(2)}` : null}
              </DetailItem>
              <DetailItem icon={<PoundSterling />} label="Deposit Amount">
                {depositAmount !== null && depositAmount !== undefined ? `£${Number(depositAmount).toFixed(2)}` : null}
              </DetailItem>
            </div>

            <Separator className="my-6" />

            <h3 className="text-xl font-semibold text-slate-800 mb-4">Condition & Maintenance</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DetailItem icon={<Wrench />} label="Condition">
                <Badge className={getConditionColor(condition)}>{condition?.replace(/_/g, ' ')}</Badge>
              </DetailItem>
              <DetailItem icon={<Calendar />} label="Last Maintenance">
                {lastMaintenanceDate ? format(new Date(lastMaintenanceDate), 'dd MMMM yyyy') : null}
              </DetailItem>
              <DetailItem icon={<Calendar />} label="Next Maintenance Due">
                {nextMaintenanceDue ? format(new Date(nextMaintenanceDue), 'dd MMMM yyyy') : null}
              </DetailItem>
            </div>

            {amenities && amenities.length > 0 && (
              <>
                <Separator className="my-6" />
                <h3 className="text-xl font-semibold text-slate-800 mb-4">Amenities</h3>
                <div className="flex flex-wrap gap-2">
                  {amenities.map((amenity, index) => (
                    <Badge key={index} variant="outline" className="text-sm">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      {amenity}
                    </Badge>
                  ))}
                </div>
              </>
            )}

            {(googleDriveLink || ensuiteImageLink || altAngleImageLink) && (
              <>
                <Separator className="my-6" />
                <h3 className="text-xl font-semibold text-slate-800 mb-4">Document & Image Links</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {googleDriveLink && (
                    <DetailItem icon={<ExternalLink />} label="Main Room Images">
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
                  {ensuiteImageLink && (
                    <DetailItem icon={<ExternalLink />} label="En-suite Images">
                      <a
                        href={ensuiteImageLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:underline flex items-center gap-1"
                      >
                        View En-suite
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </DetailItem>
                  )}
                  {altAngleImageLink && (
                    <DetailItem icon={<ExternalLink />} label="Alt Angle Images">
                      <a
                        href={altAngleImageLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:underline flex items-center gap-1"
                      >
                        View Alt Angle
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </DetailItem>
                  )}
                </div>
              </>
            )}

            {accessibilityFeatures && (
              <>
                <Separator className="my-6" />
                <h3 className="text-xl font-semibold text-slate-800 mb-4">Accessibility Features</h3>
                <p className="text-slate-700">{accessibilityFeatures}</p>
              </>
            )}

            {notes && (
              <>
                <Separator className="my-6" />
                <h3 className="text-xl font-semibold text-slate-800 mb-4">Additional Notes</h3>
                <p className="text-slate-700">{notes}</p>
              </>
            )}

            <DialogFooter className="mt-8 flex gap-2">
              {onDelete && (
                <Button 
                  variant="destructive"
                  onClick={() => onDelete(accommodation)}
                  className="flex-1"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Accommodation
                </Button>
              )}
              <Button onClick={() => {
                onClose();
                onEdit(accommodation);
              }} className="bg-indigo-600 hover:bg-indigo-700">
                <Edit className="w-4 h-4 mr-2" />
                Edit Accommodation
              </Button>
            </DialogFooter>
          </div>
        </ScrollArea>
      </DialogContent>

      <ImagePreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        imageUrl={selectedImage}
        title={roomNumber}
      />
    </Dialog>
  );
}
