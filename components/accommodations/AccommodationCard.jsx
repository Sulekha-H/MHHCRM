import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, User, Home, Calendar, AlertTriangle, Trash2, ImageIcon } from "lucide-react";
import { format } from "date-fns";

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

export default function AccommodationCard({ 
  accommodation, 
  onEdit, 
  onViewDetails, 
  onDelete, 
  getStatusColor,
  getAvailabilityColor, 
  getConditionColor, 
  getPropertyName, 
  getResidentName, 
  isDuplicate, 
  isAdmin,
  properties,
  residents 
}) {
  // Use getAvailabilityColor if provided, otherwise fallback to getStatusColor
  const statusColorFunc = getAvailabilityColor || getStatusColor;
  
  // Handle both Supabase and base44 field formats
  const roomNumber = accommodation["Room Number"] || accommodation.room_number;
  const accommodationType = accommodation["Accommodation Type"] || accommodation.accommodation_type;
  let availabilityStatus = accommodation["Availability Status"] || accommodation.availability_status;
  const condition = accommodation["Condition"] || accommodation.condition;
  const currentResidentId = accommodation["Current Resident ID"] || accommodation.current_resident_id;
  const leaseStartDate = accommodation["Lease Start Date"] || accommodation.lease_start_date;
  const availableFrom = accommodation["Available From"] || accommodation.available_from;
  const currentOccupancy = accommodation.current_occupancy || 0;
  const accommodationId = accommodation.ID || accommodation.id;
  const googleDriveLink = accommodation["Google Drive Link"] || accommodation.google_drive_link;
  const previewUrl = convertToDirectImageUrl(googleDriveLink);
  
  // IMPROVED: Get ALL active residents in this accommodation, not just the one in currentResidentId
  let activeResidentsList = [];
  if (residents && accommodationId) {
    activeResidentsList = residents.filter(resident => {
      const resAccId = resident["Accommodation ID"] || resident.accommodation_id;
      const resStatus = (resident.Status || resident.status || '').toLowerCase();
      return resAccId === accommodationId && resStatus === 'active';
    });
    
    console.log(`   📋 Found ${activeResidentsList.length} active resident(s) in ${roomNumber}:`, 
      activeResidentsList.map(r => `${r["First Name"] || r.first_name} ${r["Last Name"] || r.last_name}`).join(', ')
    );
  }

  // CRITICAL FIX: Override status based on current_occupancy
  // If there are active residents, force status to "Occupied" or "Allocated Residents"
  console.log(`🏠 ${roomNumber}: current_occupancy = ${currentOccupancy}, status = ${availabilityStatus}`);

  if (activeResidentsList.length > 0) {
    const hasAllocatedResident = activeResidentsList.some(r => r.isAllocated);
    if (hasAllocatedResident) {
      availabilityStatus = 'Allocated Residents';
    } else if (availabilityStatus?.toLowerCase() === 'available') {
      availabilityStatus = 'Occupied';
    }
  }
  
  // Get property name if needed and not passed as function
  let propertyName = null;
  if (getPropertyName) {
    const propertyId = accommodation["Property ID"] || accommodation.property_id;
    propertyName = getPropertyName(propertyId);
  }

  return (
    <Card 
      className="hover:shadow-lg transition-shadow duration-300 cursor-pointer flex flex-col"
      onClick={() => onViewDetails(accommodation)}
    >
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          {previewUrl && (
            <div className="w-12 h-12 rounded-xl overflow-hidden shadow-sm flex-shrink-0 border border-slate-200 bg-slate-50">
              <img
                src={previewUrl}
                alt={roomNumber}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
                <h3 className="font-semibold text-slate-900 text-lg truncate" title={roomNumber}>
                    {roomNumber || "No Room #"}
                </h3>
                {isDuplicate && (
                    <AlertTriangle className="w-4 h-4 text-orange-500 flex-shrink-0" title="This room number is duplicated within this property." />
                )}
            </div>
            <p className="text-sm text-slate-500 capitalize" title={accommodationType}>
              {accommodationType?.replace(/_/g, ' ')}
            </p>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(accommodation);
              }}
              className="text-slate-400 hover:text-slate-600"
              title="Edit Accommodation"
            >
              <Edit className="w-4 h-4" />
            </Button>
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(accommodation);
                }}
                className="text-slate-400 hover:text-red-600"
                title="Delete Accommodation"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 flex-grow">
        {/* Status and Condition */}
        <div className="flex gap-2 flex-wrap">
          <Badge className={statusColorFunc(availabilityStatus)}>
            {availabilityStatus?.replace(/_/g, ' ')}
          </Badge>
          <Badge className={getConditionColor(condition)}>
            {condition?.replace(/_/g, ' ')}
          </Badge>
          {currentOccupancy > 0 && (
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              {currentOccupancy} resident{currentOccupancy > 1 ? 's' : ''}
            </Badge>
          )}
        </div>

        {/* Resident and Lease Info */}
        <div className="pt-3 border-t">
          {availabilityStatus?.toLowerCase() === 'occupied' && currentOccupancy > 0 ? (
            <>
              <div className="flex items-center gap-2 text-sm text-blue-800 mb-2">
                <User className="w-4 h-4" />
                <span className="font-medium">
                  {currentOccupancy} Active Resident{currentOccupancy > 1 ? 's' : ''}
                </span>
              </div>
              {/* Display ALL active residents in this accommodation */}
              {activeResidentsList.length > 0 ? (
                <div className="ml-6 space-y-1">
                  {activeResidentsList.map((resident, index) => {
                    const firstName = resident["First Name"] || resident.first_name;
                    const lastName = resident["Last Name"] || resident.last_name;
                    return (
                      <div key={resident.ID || resident.id || index} className="text-sm text-slate-600">
                        • {firstName} {lastName}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-xs text-slate-400 ml-6">
                  (Resident data not available)
                </div>
              )}
            </>
          ) : (
             <div className="flex items-center gap-2 text-sm text-green-800">
              <Home className="w-4 h-4" />
              <span className="font-medium">Available</span>
            </div>
          )}
          {availabilityStatus?.toLowerCase() === 'occupied' && leaseStartDate && (
            <div className="flex items-center gap-2 text-sm text-slate-600 mt-2">
              <Calendar className="w-4 h-4" />
              <span className="truncate">
                Lease since {format(new Date(leaseStartDate), 'MMM d, yyyy')}
              </span>
            </div>
          )}
           {availabilityStatus?.toLowerCase() === 'available' && availableFrom && (
            <div className="flex items-center gap-2 text-sm text-slate-600 mt-2">
              <Calendar className="w-4 h-4" />
              <span className="truncate">
                Available from {format(new Date(availableFrom), 'MMM d, yyyy')}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}