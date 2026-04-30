import React, { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Home, Calendar, Phone, MapPin, DoorOpen, X, Mail, Trash2, User } from "lucide-react";
import { format } from "date-fns";

const convertToDirectImageUrl = (url) => {
  if (!url) return url;
  if (url.includes('dropbox.com')) {
    return url.replace('www.dropbox.com', 'dl.dropboxusercontent.com').replace('?dl=0', '').replace('?dl=1', '');
  }
  if (url.includes('drive.google.com')) {
    const fileIdMatch = url.match(/\/file\/d\/([^\/\?]+)/);
    if (fileIdMatch) return `https://drive.google.com/thumbnail?id=${fileIdMatch[1]}&sz=w1000`;
    const idMatch = url.match(/[?&]id=([^&]+)/);
    if (idMatch) return `https://drive.google.com/thumbnail?id=${idMatch[1]}&sz=w1000`;
  }
  return url;
};

export default function AllocatedResidentCard({ resident, onEdit, onViewDetails, onDelete, getStatusColor, accommodations, isAdmin }) {
  const firstName = resident["First Name"] || '';
  const lastName = resident["Last Name"] || '';
  const claimRef = resident["Claim Reference Number"];
  const keyWorker = resident["Support Worker"];
  const status = resident["Status"];
  const accommodationType = resident["Accommodation Type"];
  const moveInDate = resident["Move-in Date"];
  const phoneNumber = resident["Phone Number"];
  const emailAddress = resident["Email Address"];
  const photoIdUrl = resident["Photo ID URL"];
  const propertyName = resident["Property Name"];
  const unitRoomNumber = resident["Unit/Room Number"];
  const residentType = resident["Resident Type"];

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
                onClick={(e) => { if (photoIdUrl && !imageError) { e.stopPropagation(); setShowPhotoModal(true); } }}
              >
                {photoIdUrl && !imageError ? (
                  <img src={previewUrl} alt={`${firstName} ${lastName}`} className="w-full h-full object-cover" onError={() => setImageError(true)} />
                ) : (
                  <User className="text-slate-400 w-6 h-6" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-slate-900 text-lg truncate">{firstName} {lastName}</h3>
                {residentType && <p className="text-xs text-blue-600 font-medium">{residentType}</p>}
                {claimRef && <p className="text-xs text-slate-500 truncate">Ref: {claimRef}</p>}
                {keyWorker && <p className="text-xs text-slate-500 truncate">SW: {keyWorker}</p>}
              </div>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onEdit(resident); }} className="text-slate-400 hover:text-slate-600"><Edit className="w-4 h-4" /></Button>
              {onDelete && <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onDelete(resident); }} className="text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></Button>}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 flex-grow">
          <div className="flex gap-2 flex-wrap">
            <Badge className={getStatusColor(status)}>{status}</Badge>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Home className="w-4 h-4 text-slate-400" />
              <span className="font-medium text-slate-600 truncate">{accommodationType}</span>
            </div>
            {propertyName && (
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <span className="text-slate-600 truncate block">{propertyName}</span>
                  {unitRoomNumber && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                      <DoorOpen className="w-3 h-3" />
                      <span className="truncate">Unit: {unitRoomNumber}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            {moveInDate && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>{format(new Date(moveInDate), 'dd MMM yyyy')}</span>
              </div>
            )}
          </div>
          {(phoneNumber || emailAddress) && (
            <div className="pt-3 border-t space-y-1">
              {phoneNumber && <div className="flex items-center gap-2 text-sm text-slate-600"><Phone className="w-4 h-4 text-slate-400" />{phoneNumber}</div>}
              {emailAddress && <div className="flex items-center gap-2 text-sm text-slate-600"><Mail className="w-4 h-4 text-slate-400" />{emailAddress}</div>}
            </div>
          )}
        </CardContent>
      </Card>
      {showPhotoModal && photoIdUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={() => setShowPhotoModal(false)}>
          <div className="relative max-w-3xl max-h-[90vh] p-4 bg-white rounded-lg shadow-2xl overflow-auto" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowPhotoModal(false)} className="absolute -top-12 right-0 text-white hover:text-gray-300"><X className="w-8 h-8" /></button>
            <div className="mb-2 text-center"><h3 className="text-lg font-semibold">{firstName} {lastName} - Photo ID</h3></div>
            <PhotoModalContent imageUrl={previewUrl} residentName={`${firstName} ${lastName}`} />
          </div>
        </div>
      )}
    </>
  );
}

function PhotoModalContent({ imageUrl, residentName }) {
  const [error, setError] = useState(false);
  if (error) return <div className="text-center p-12"><p className="text-lg text-red-500">Failed to load image</p></div>;
  return <img src={imageUrl} alt={`${residentName} Photo ID`} className="block w-auto h-auto max-w-full max-h-[80vh] mx-auto rounded" onError={() => setError(true)} />;
}
