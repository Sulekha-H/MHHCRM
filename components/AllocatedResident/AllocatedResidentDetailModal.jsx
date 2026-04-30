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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  User, Calendar, Phone, Home, MapPin, UserCheck,
  Briefcase, Shield, Link2, FileText, X, Edit, BedDouble, Building, Mail, Trash2
} from 'lucide-react';
import { format } from 'date-fns';

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

export default function AllocatedResidentDetailModal({ resident, onClose, onEdit, onDelete, isAdmin }) {
  const [showPhotoModal, setShowPhotoModal] = React.useState(false);
  const [imageError, setImageError] = React.useState(false);

  if (!resident) return null;

  const firstName = resident["First Name"] || '';
  const lastName = resident["Last Name"] || '';
  const dateOfBirth = resident["Date of Birth"];
  const phoneNumber = resident["Phone Number"];
  const emailAddress = resident["Email Address"];
  const niNumber = resident["National Insurance Number"];
  const claimRef = resident["Claim Reference Number"];
  const submissionRef = resident["Submission Reference"];
  const address = resident["Property Address"];
  const moveInDate = resident["Move-in Date"];
  const moveOutDate = resident["Move-out Date"];
  const accommodationType = resident["Accommodation Type"];
  const keyWorker = resident["Support Worker"];
  const status = resident["Status"];
  const medicalConditions = resident["Medical Conditions"];
  const notes = resident["Notes"];
  const benefits = resident["Benefits"] || [];
  const roomTransfers = resident["Room Transfers"] || [];
  const accommodationTransfers = resident["Accommodation Transfers"] || [];
  const signupGdriveUrl = resident["Sign-up Documents URL"];
  const photoIdUrl = resident["Photo ID URL"];
  const futureAddress = resident["Future Address"];
  const futureHousingType = resident["Future Housing Type"];
  const moveOnOutcome = resident["Move-on Outcome"];
  const propertyName = resident["Property Name"];
  const unitRoomNumber = resident["Unit/Room Number"];
  const residentType = resident["Resident Type"];
  const otherDocuments = resident["Other Documents"] || [];

  const previewUrl = convertToDirectImageUrl(photoIdUrl);

  const getStatusColor = (status) => {
    return status === 'Active' ? "bg-green-100 text-green-800 border-green-200" : "bg-blue-100 text-blue-800 border-blue-200";
  };

  return (
    <>
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl w-full p-0">
          <ScrollArea className="max-h-[90vh]">
            <div className="p-6">
              <DialogHeader className="mb-6">
                <div className="flex items-center gap-4">
                  <div
                    className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center overflow-hidden border cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all flex-shrink-0"
                    onClick={() => {
                      if (photoIdUrl && !imageError) {
                        setShowPhotoModal(true);
                      }
                    }}
                  >
                    {photoIdUrl && !imageError ? (
                      <img
                        src={previewUrl}
                        alt={`${firstName} ${lastName}`}
                        className="w-full h-full object-cover"
                        onError={() => setImageError(true)}
                      />
                    ) : (
                      <User className="w-8 h-8 text-slate-500" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <DialogTitle className="text-3xl font-bold text-slate-900 break-words">{firstName} {lastName}</DialogTitle>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <Badge className={getStatusColor(status)}>{status}</Badge>
                      {residentType && <Badge variant="outline" className="text-blue-600 border-blue-200">{residentType}</Badge>}
                    </div>
                  </div>
                </div>
              </DialogHeader>

              <h3 className="text-xl font-semibold text-slate-800 mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <DetailItem icon={<User />} label="Date of Birth">{dateOfBirth ? format(new Date(dateOfBirth), 'dd MMMM yyyy') : null}</DetailItem>
                <DetailItem icon={<Phone />} label="Phone Number">{phoneNumber}</DetailItem>
                <DetailItem icon={<Mail />} label="Email Address">{emailAddress}</DetailItem>
                <DetailItem icon={<Shield />} label="NI Number">{niNumber}</DetailItem>
                <DetailItem icon={<FileText />} label="Claim Reference">{claimRef}</DetailItem>
                <DetailItem icon={<FileText />} label="Submission Reference">{submissionRef}</DetailItem>
              </div>

              <Separator className="my-6" />

              <h3 className="text-xl font-semibold text-slate-800 mb-4">Accommodation</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <DetailItem icon={<Building />} label="Property Name">{propertyName}</DetailItem>
                <DetailItem icon={<BedDouble />} label="Unit/Room">{unitRoomNumber}</DetailItem>
                <DetailItem icon={<MapPin />} label="Property Address">{address}</DetailItem>
                <DetailItem icon={<Calendar />} label="Move-in Date">{moveInDate ? format(new Date(moveInDate), 'dd MMMM yyyy') : null}</DetailItem>
                {moveOutDate && <DetailItem icon={<Calendar />} label="Move-out Date">{format(new Date(moveOutDate), 'dd MMMM yyyy')}</DetailItem>}
                <DetailItem icon={<Home />} label="Accommodation Type">{accommodationType}</DetailItem>
                <DetailItem icon={<UserCheck />} label="Support Worker">{keyWorker}</DetailItem>
              </div>

              <Separator className="my-6" />

              {status === 'Moved On' && (
                <>
                  <h3 className="text-xl font-semibold text-blue-800 mb-4 flex items-center gap-2">
                    <Home className="w-6 h-6" />
                    Move-on Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 bg-blue-50 p-6 rounded-xl border border-blue-100">
                    <DetailItem icon={<MapPin />} label="Future Address">{futureAddress}</DetailItem>
                    <DetailItem icon={<Home />} label="Housing Type">{futureHousingType}</DetailItem>
                    <DetailItem icon={<UserCheck />} label="Move-on Outcome">{moveOnOutcome}</DetailItem>
                  </div>
                  <Separator className="my-6" />
                </>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-xl font-semibold text-slate-800 mb-4">Health & Notes</h3>
                  <div className="space-y-4">
                    <DetailItem icon={<Briefcase />} label="Medical Conditions">{medicalConditions}</DetailItem>
                    <DetailItem icon={<FileText />} label="Notes">{notes}</DetailItem>
                  </div>
                </div>
              </div>

              <Separator className="my-6" />

              {benefits?.length > 0 && (
                <>
                  <h3 className="text-xl font-semibold text-slate-800 mb-4">Benefits</h3>
                  <Table>
                    <TableHeader><TableRow><TableHead>Type</TableHead><TableHead>Amount</TableHead><TableHead>Payment Day</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {benefits.map((benefit, index) => (
                        <TableRow key={index}>
                          <TableCell className="capitalize">{benefit.benefit_type}</TableCell>
                          <TableCell>£{benefit.amount || '0.00'}</TableCell>
                          <TableCell>{benefit.payment_day || 'N/A'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <Separator className="my-6" />
                </>
              )}

              {(moveInDate || roomTransfers?.length > 0 || accommodationTransfers?.length > 0) && (
                <>
                  <h3 className="text-xl font-semibold text-slate-800 mb-4">History</h3>
                  <div className="space-y-3">
                    {moveInDate && (
                      <div className="flex gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <Home className="w-5 h-5 text-blue-600 mt-1" />
                        <div>
                          <p className="font-semibold text-blue-900">Initial Move-in</p>
                          <p className="text-sm text-slate-700">
                            {format(new Date(moveInDate), 'dd MMM yyyy')} → {propertyName} - Unit {unitRoomNumber}
                          </p>
                        </div>
                      </div>
                    )}
                    {roomTransfers.map((transfer, index) => (
                      <div key={`room-${index}`} className="flex gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                        <BedDouble className="w-5 h-5 text-green-600 mt-1" />
                        <div>
                          <p className="font-semibold text-green-900">Room Transfer #{index + 1}</p>
                          <p className="text-sm text-slate-700">
                            {transfer.transfer_date ? format(new Date(transfer.transfer_date), 'dd MMM yyyy') : 'N/A'} → {transfer.property_name} - From {transfer.from_room_number} to {transfer.to_room_number}
                          </p>
                        </div>
                      </div>
                    ))}
                    {accommodationTransfers.map((transfer, index) => (
                      <div key={`property-${index}`} className="flex gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <Building className="w-5 h-5 text-slate-600 mt-1" />
                        <div>
                          <p className="font-semibold text-slate-900">Accommodation Transfer #{index + 1}</p>
                          <p className="text-sm text-slate-700">
                            {transfer.transfer_date ? format(new Date(transfer.transfer_date), 'dd MMM yyyy') : 'N/A'} → From {transfer.from_property} ({transfer.from_unit}) to {transfer.to_property} ({transfer.to_unit})
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Separator className="my-6" />
                </>
              )}

              {otherDocuments.length > 0 && (
                <>
                   <h3 className="text-xl font-semibold text-slate-800 mb-4">Other Documents</h3>
                   <div className="space-y-2">
                     {otherDocuments.map((doc, idx) => (
                       <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border">
                         <div className="flex items-center gap-3">
                           <FileText className="w-5 h-5 text-slate-400" />
                           <span className="font-medium">{doc.title}</span>
                         </div>
                         {doc.url && <a href={doc.url} target="_blank" rel="noopener noreferrer"><Button size="sm" variant="ghost">View</Button></a>}
                       </div>
                     ))}
                   </div>
                   <Separator className="my-6" />
                </>
              )}

              <h3 className="text-xl font-semibold text-slate-800 mb-4">Links</h3>
              <div className="flex gap-4 flex-wrap">
                  {photoIdUrl && (
                      <a href={photoIdUrl} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline"><Link2 className="w-4 h-4 mr-2" />Photo ID</Button>
                      </a>
                  )}
                  {signupGdriveUrl && (
                      <a href={signupGdriveUrl} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline"><Link2 className="w-4 h-4 mr-2" />Sign-up Docs</Button>
                      </a>
                  )}
              </div>
            </div>
            <DialogFooter className="p-6 bg-slate-50 border-t sticky bottom-0">
              {onDelete && (
                <Button variant="destructive" onClick={() => onDelete(resident)} className="flex-1">
                  <Trash2 className="w-4 h-4 mr-2" /> Delete Resident
                </Button>
              )}
              <Button variant="outline" onClick={onClose}>Close</Button>
              <Button onClick={() => onEdit(resident)}><Edit className="w-4 h-4 mr-2"/>Edit Resident</Button>
            </DialogFooter>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {showPhotoModal && photoIdUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60]" onClick={() => setShowPhotoModal(false)}>
          <div className="relative max-w-4xl max-h-[90vh] p-4 bg-white rounded-lg shadow-2xl overflow-auto" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowPhotoModal(false)} className="absolute -top-12 right-0 text-white hover:text-gray-300">
              <X className="w-8 h-8" />
            </button>
            <div className="mb-2 text-center"><h3 className="text-lg font-semibold text-white">{firstName} {lastName} - Photo ID</h3></div>
            <PhotoModalContent imageUrl={previewUrl} residentName={`${firstName} ${lastName}`} />
          </div>
        </div>
      )}
    </>
  );
}

function PhotoModalContent({ imageUrl, residentName }) {
  const [error, setError] = React.useState(false);
  if (error) return <div className="text-center p-12"><p className="text-lg text-red-500">Failed to load image</p></div>;
  return <img src={imageUrl} alt={`${residentName} Photo ID`} className="block w-auto h-auto max-w-full max-h-[80vh] mx-auto rounded" onError={() => setError(true)} />;
}
