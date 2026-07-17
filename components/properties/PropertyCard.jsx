import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, MapPin, Users, Calendar, Phone, Settings, Wrench, Building2, Trash2, ImageIcon } from "lucide-react";
import { format } from "date-fns";
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

export default function PropertyCard({ property, accommodations, residents, onEdit, onViewDetails, onDelete, isAdmin }) {
  // Use the pre-calculated current_occupancy from the property object
  const currentOccupancy = property.current_occupancy || 0;
  const totalCapacity = property.total_capacity || 0;
  
  const occupancyRate = totalCapacity > 0 ? Math.round((currentOccupancy / totalCapacity) * 100) : 0;

  const getStatusColor = (status) => {
    const normalizedStatus = status?.toLowerCase();
    switch (normalizedStatus) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'archived':
      case 'temporarily closed':
      case 'temporarily_closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const getMaintenanceColor = (status) => {
    const normalizedStatus = status?.toLowerCase();
    switch (normalizedStatus) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'in progress':
      case 'under repair':
      case 'under_repair':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
      case 'good':
        return 'bg-green-100 text-green-800';
      case 'urgent':
      case 'major works required':
      case 'major_works_required':
        return 'bg-red-100 text-red-800';
      case 'needs attention':
      case 'needs_attention':
        return 'bg-orange-100 text-orange-800';
      case 'none':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const getOccupancyColor = (occupied, total) => {
    if (total === 0) return 'bg-gray-100 text-gray-800';
    const rate = (occupied / total) * 100;
    if (rate >= 90) return 'bg-green-100 text-green-800';
    if (rate >= 50) return 'bg-yellow-100 text-yellow-800';
    if (rate > 0) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  // Get field values - handle both Supabase and base44 formats
  const name = property["Name"] || property.name;
  const address = property["Address"] || property.address;
  const status = property["Status"] || property.status;
  const maintenanceStatus = property["Maintenance Status"] || property.Maintenance_Status || property.maintenance_status;
  const propertyManager = property["Property Manager"] || property.Property_Manager || property.property_manager;
  const supportWorker = property["Support Worker"] || property.Support_Worker || property.support_worker;
  
  // FIXED: Check for "Weekly Rent" (Supabase) and "Rent Per Week" (base44)
  const rentPerWeek = property["Weekly Rent"] || property["Rent Per Week"] || property.rent_per_week;
  
  const facilities = property["Facilities"] || property.facilities;
  const nextInspectionDue = property["Next Inspection Due"] || property.Next_Inspection_Due || property.next_inspection_due;
  const createdDate = property["Created Date"] || property.created_date || property.Created_Date;
  const createdBy = property["Created By"] || property.created_by || property.Created_By;
  const contactPhone = property["Contact Phone"] || property.Contact_Phone || property.contact_phone;
  const accessibilityFeatures = property["Accessibility Features"] || property.Accessibility_Features || property.accessibility_features;
  const googleDriveLink = property["Google Drive Link"] || property.google_drive_link;
  const previewUrl = convertToDirectImageUrl(googleDriveLink);

  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [imageError, setImageError] = useState(false);

  return (
    <>
    <Card
      className="hover:shadow-lg transition-all duration-300 cursor-pointer h-full border-l-4 border-l-teal-500 overflow-hidden flex flex-col"
      onClick={() => onViewDetails(property)}
    >
      {previewUrl && !imageError && (
        <div
          className="w-full relative group"
          onClick={(e) => {
            e.stopPropagation();
            setShowPhotoModal(true);
          }}
        >
          <img
            src={previewUrl}
            alt={name}
            className="w-full h-auto object-cover max-h-48 transition-transform duration-300 group-hover:scale-105"
            onError={() => setImageError(true)}
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
            <ImageIcon className="text-white opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8" />
          </div>
        </div>
      )}
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {(!previewUrl || imageError) && (
              <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                <Building2 className="w-6 h-6 text-white" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <CardTitle className="text-xl text-slate-900 mb-1 break-words line-clamp-2">{name}</CardTitle>
              <Badge className={getStatusColor(status)}>
                {status?.replace('_', ' ')}
              </Badge>
            </div>
          </div>
          <div className="flex gap-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(property);
              }}
              className="text-slate-400 hover:text-slate-600"
              title="Edit Property"
            >
              <Edit className="w-4 h-4" />
            </Button>
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(property);
                }}
                className="text-slate-400 hover:text-red-600"
                title="Delete Property"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Maintenance Status */}
        <div className="flex gap-2 flex-wrap">
          <Badge className={getMaintenanceColor(maintenanceStatus)}>
            {maintenanceStatus?.replace('_', ' ')}
          </Badge>
        </div>

        {/* Address */}
        <div className="flex items-start gap-2 text-sm">
          <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
          <span className="text-slate-600 break-words">{address}</span>
        </div>

        {/* Occupancy */}
        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
          <div className="flex items-center gap-2 min-w-0">
            <Users className="w-4 h-4 text-slate-500 flex-shrink-0" />
            <span className="text-sm font-medium text-slate-700 truncate">Occupancy</span>
          </div>
          <div className={`text-center rounded-md px-2 py-1 flex-shrink-0 ${getOccupancyColor(currentOccupancy, totalCapacity)}`}>
            <div className="text-sm font-semibold leading-tight whitespace-nowrap">
              {currentOccupancy}/{totalCapacity}
            </div>
            <div className="text-xs font-normal opacity-80 leading-tight mt-1 whitespace-nowrap">
              ({occupancyRate}%)
            </div>
          </div>
        </div>

        {/* Property Manager and Support Worker */}
        {(propertyManager || (supportWorker && supportWorker !== "none" && supportWorker !== "None")) && (
          <div className="space-y-2">
            {propertyManager && (
              <div className="flex items-center gap-2 text-sm">
                <Settings className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span className="text-slate-600 truncate" title={`Manager: ${propertyManager}`}>
                  Manager: {propertyManager}
                </span>
              </div>
            )}
            {supportWorker && supportWorker !== "none" && supportWorker !== "None" && (
              <div className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span className="text-slate-600 truncate" title={`Support Worker: ${supportWorker}`}>
                  Support Worker: {supportWorker}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Weekly Rent - Only show Weekly Rent, not Service Charge */}
        {rentPerWeek !== null && rentPerWeek !== undefined && rentPerWeek !== "" && (
          <div className="flex items-center justify-between text-sm gap-2">
            <span className="text-slate-600 flex-shrink-0">Weekly Rent:</span>
            <span className="font-medium text-slate-900 whitespace-nowrap">£{Number(rentPerWeek).toFixed(2)}</span>
          </div>
        )}

        {/* Facilities */}
        {facilities && facilities.length > 0 && (
          <div className="pt-3 border-t">
            <p className="text-xs font-medium text-slate-700 mb-2">Facilities:</p>
            <div className="flex flex-wrap gap-1">
              {facilities.slice(0, 4).map((facility) => (
                <Badge key={facility} variant="outline" className="text-xs">
                  {facility}
                </Badge>
              ))}
              {facilities.length > 4 && (
                <Badge variant="outline" className="text-xs">
                  +{facilities.length - 4} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Created Date */}
        {createdDate && (
          <div className="pt-3 border-t">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span className="text-slate-600 truncate">
                Created: {format(new Date(createdDate), 'dd/MM/yyyy HH:mm')}{createdBy ? ` by ${createdBy}` : ''}
              </span>
            </div>
          </div>
        )}

        {/* Next Inspection */}
        {nextInspectionDue && (
          <div className="pt-3 border-t">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-orange-500 flex-shrink-0" />
              <span className="text-slate-600 truncate" title={`Next inspection: ${format(new Date(nextInspectionDue), 'MMM d, yyyy')}`}>
                Next inspection: {format(new Date(nextInspectionDue), 'MMM d, yyyy')}
              </span>
            </div>
          </div>
        )}

        {/* Contact */}
        {contactPhone && (
          <div className="pt-3 border-t">
            <div className="flex items-center gap-2 text-sm">
              <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span className="text-slate-600 break-all">{contactPhone}</span>
            </div>
          </div>
        )}

        {/* Accessibility Features */}
        {accessibilityFeatures && (
          <div className="pt-3 border-t">
            <p className="text-sm">
              <span className="font-medium text-slate-900">Accessibility:</span>
              <span className="text-slate-600 ml-1 break-words">{accessibilityFeatures}</span>
            </p>
          </div>
        )}
      </CardContent>
    </Card>

    <ImagePreviewModal
      isOpen={showPhotoModal}
      onClose={() => setShowPhotoModal(false)}
      imageUrl={previewUrl}
      title={name}
    />
    </>
  );
}