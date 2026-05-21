import React, { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Home, Calendar, Phone, User, MapPin, DoorOpen, X, Mail, Trash2 } from "lucide-react";
import { format } from "date-fns";

// Helper function to convert links
const convertToDirectImageUrl = (url) => {
  if (!url) return url;
  
  if (url.includes('dropbox.com')) {
    return url
      .replace('www.dropbox.com', 'dl.dropboxusercontent.com')
      .replace('?dl=0', '')
      .replace('?dl=1', '');
  }
  
  if (url.includes('drive.google.com')) {
    const fileIdMatch = url.match(/\/file\/d\/([^\/\?]+)/);
    if (fileIdMatch) {
      return `https://drive.google.com/thumbnail?id=${fileIdMatch[1]}&sz=w1000`;
    }
    const idMatch = url.match(/[?&]id=([^&]+)/);
    if (idMatch) {
      return `https://drive.google.com/thumbnail?id=${idMatch[1]}&sz=w1000`;
    }
  }
  
  return url;
};

export default function ResidentCard({ resident, onEdit, onViewDetails, onDelete, getSupportLevelColor, getStatusColor, accommodations, isAdmin }) {
  // Support both space-separated and underscore column names
  const firstName = resident["First Name"] || resident.First_Name || resident.first_name || '';
  const lastName = resident["Last Name"] || resident.Last_Name || resident.last_name || '';
  const claimRef = resident["Claim Reference Number"] || resident.Claim_Reference_Number || resident.claim_reference_number;
  const submissionRef = resident["Submission Reference"] || resident.Submission_Reference || resident.submission_reference;
  const niNumber = resident["National Insurance Number"] || resident.National_Insurance_Number || resident.national_insurance_number;
  const keyWorker = resident["Support Worker"] || resident.Key_Worker || resident.key_worker;
  const status = resident["Status"] || resident.Status || resident.status;
  const supportLevel = resident["Support Level"] || resident.Support_Level || resident.support_level;
  const accommodationType = resident["Accommodation Type"] || resident.Accommodation_Type || resident.accommodation_type;
  const address = resident["Property Address"] || resident.Address || resident.address;
  const moveInDate = resident["Move-in Date"] || resident.Move_In_Date || resident.move_in_date;
  const phoneNumber = resident["Phone Number"] || resident.Phone_Number || resident.phone_number;
  const emailAddress = resident["Email Address"] || resident.Email_Address || resident.email_address;
  const emergencyContactName = resident["Emergency Contact Name"] || resident.Emergency_Contact_Name || resident.emergency_contact_name;
  const emergencyContactPhone = resident["Emergency Contact Phone"] || resident.Emergency_Contact_Phone || resident.emergency_contact_phone;
  const medicalConditions = resident["Medical Conditions"] || resident.Medical_Conditions || resident.medical_conditions;
  const photoIdUrl = resident["Photo Of Individual (Google Drive)"] || resident["Photo ID URL"] || resident.Photo_Id_Url || resident.photo_id_url;
  const accommodationId = resident["Accommodation ID"] || resident.Accommodation_Id || resident.accommodation_id;

  const accommodation = accommodations?.find(a => (a["ID"] || a.Id || a.id) === accommodationId);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [imageError, setImageError] = useState(false);
  const previewUrl = convertToDirectImageUrl(photoIdUrl);

  return (
    <>
      <Card 
        className="hover:shadow-lg transition-shadow duration-300 cursor-pointer flex flex-col"
        onClick={() => onViewDetails(resident)}
      >
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div 
                className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center overflow-hidden border flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all"
                onClick={(e) => {
                  if (photoIdUrl && !imageError) {
                    e.stopPropagation();
                    setShowPhotoModal(true);
                  }
                }}
                title={photoIdUrl && !imageError ? "Click to enlarge photo" : "No photo available"}
              >
                {photoIdUrl && !imageError ? (
                  <img 
                    src={previewUrl} 
                    alt={`${firstName} ${lastName}`} 
                    className="w-full h-full object-cover"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <span className="text-slate-500 font-semibold text-lg">
                    {firstName?.[0]}{lastName?.[0]}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-slate-900 text-lg truncate" title={`${firstName} ${lastName}`}>
                  {firstName} {lastName}
                </h3>
                {claimRef && (
                  <p className="text-sm text-slate-500 break-words" title={`Claim Ref: ${claimRef}`}>
                    <span className="font-medium">Claim Ref:</span> {claimRef}
                  </p>
                )}
                {submissionRef && (
                  <p className="text-sm text-slate-500 break-words" title={`Submission Ref: ${submissionRef}`}>
                    <span className="font-medium">Submission Ref:</span> {submissionRef}
                  </p>
                )}
                {niNumber && (
                  <p className="text-sm text-slate-500 break-words" title={`NI No: ${niNumber}`}>
                    <span className="font-medium">NI No:</span> {niNumber}
                  </p>
                )}
                {keyWorker && (
                  <p className="text-sm text-slate-500 truncate" title={keyWorker}>
                    Support Worker: {keyWorker}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                    e.stopPropagation();
                    onEdit(resident);
                }}
                className="text-slate-400 hover:text-slate-600"
                title="Edit Resident"
              >
                <Edit className="w-4 h-4" />
              </Button>
              {onDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                      e.stopPropagation();
                      onDelete(resident);
                  }}
                  className="text-slate-400 hover:text-red-600"
                  title="Delete Resident"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 flex-grow">
          {/* Status and Support Level */}
          <div className="flex gap-2 flex-wrap">
            <Badge className={getStatusColor(status)}>
              {status?.replace('_', ' ')}
            </Badge>
            <Badge className={getSupportLevelColor(supportLevel)}>
              {supportLevel} support
            </Badge>
          </div>

          {/* Accommodation Info */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Home className="w-4 h-4 text-slate-400" />
              <span className="font-medium text-slate-600 truncate">
                {accommodationType?.replace('_', ' ')}
              </span>
            </div>
            {address && (
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <span className="text-slate-600 truncate block" title={address}>{address}</span>
                  {accommodation && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                      <DoorOpen className="w-3 h-3" />
                      <span className="truncate">Unit: {accommodation["Room Number"] || accommodation.Room_Number || accommodation.room_number}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            {moveInDate && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span className="text-slate-600">
                  Moved in {format(new Date(moveInDate), 'MMM yyyy')}
                </span>
              </div>
            )}
          </div>

          {/* Contact Info */}
          {(phoneNumber || emailAddress || emergencyContactName) && (
            <div className="pt-3 border-t">
              {phoneNumber && (
                 <div className="flex items-center gap-2 text-sm mb-2">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-600 truncate">
                    {phoneNumber}
                  </span>
                </div>
              )}
              {emailAddress && (
                 <div className="flex items-center gap-2 text-sm mb-2">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-600 truncate">
                    {emailAddress}
                  </span>
                </div>
              )}
              {emergencyContactName && (
                <div className="flex items-start gap-2 text-sm">
                  <User className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-600 break-words">
                    Emergency: {emergencyContactName}
                    {emergencyContactPhone && ` (${emergencyContactPhone})`}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Medical Conditions */}
          {medicalConditions && (
            <div className="pt-3 border-t">
              <p className="text-sm text-slate-600 break-words">
                <span className="font-medium">Medical:</span> {medicalConditions}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Photo Preview Modal */}
      {showPhotoModal && photoIdUrl && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" 
          onClick={() => setShowPhotoModal(false)}
        >
          <div 
            className="relative max-w-3xl max-h-[90vh] p-4 bg-white rounded-lg shadow-2xl overflow-auto" 
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowPhotoModal(false)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
              title="Close"
            >
              <X className="w-8 h-8" />
            </button>
            <div className="mb-2 text-center">
              <h3 className="text-lg font-semibold text-white">
                {firstName} {lastName} - Photo ID
              </h3>
            </div>
            <PhotoModalContent imageUrl={previewUrl} residentName={`${firstName} ${lastName}`} />
          </div>
        </div>
      )}
    </>
  );
}

// Separate component for photo modal content to handle errors properly
function PhotoModalContent({ imageUrl, residentName }) {
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div className="text-center p-12">
        <p className="text-lg text-red-500 mb-2">Failed to load image</p>
        <p className="text-sm text-slate-600">The URL may not be a direct image link or is inaccessible.</p>
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={`${residentName} Photo ID`}
      className="block w-auto h-auto max-w-full max-h-[80vh] mx-auto rounded"
      onError={() => setError(true)}
    />
  );
}