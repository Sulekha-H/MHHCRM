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
  User, Calendar, Phone, Home, MapPin, Heart, UserCheck,
  Briefcase, Shield, Link2, FileText, X, Edit, BedDouble, Building, Mail, Users, Trash2
} from 'lucide-react';
import { format } from 'date-fns';

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

export default function ResidentDetailModal({ resident, accommodations, properties, onClose, onEdit, onDelete, isAdmin }) {
  const [showPhotoModal, setShowPhotoModal] = React.useState(false);
  const [imageError, setImageError] = React.useState(false);

  if (!resident) return null;

  // Support both space-separated and underscore column names
  const firstName = resident["First Name"] || resident.First_Name || resident.first_name || '';
  const lastName = resident["Last Name"] || resident.Last_Name || resident.last_name || '';
  const dateOfBirth = resident["Date of Birth"] || resident.Date_Of_Birth || resident.date_of_birth;
  const phoneNumber = resident["Phone Number"] || resident.Phone_Number || resident.phone_number;
  const emailAddress = resident["Email Address"] || resident.Email_Address || resident.email_address;
  const niNumber = resident["National Insurance Number"] || resident.National_Insurance_Number || resident.national_insurance_number;
  const claimRef = resident["Claim Reference Number"] || resident.Claim_Reference_Number || resident.claim_reference_number;
  const submissionRef = resident["Submission Reference"] || resident.Submission_Reference || resident.submission_reference;
  const propertyId = resident["Property ID"] || resident.Property_Id || resident.property_id;
  const accommodationId = resident["Accommodation ID"] || resident.Accommodation_Id || resident.accommodation_id;
  const address = resident["Property Address"] || resident.Address || resident.address;
  const moveInDate = resident["Move-in Date"] || resident.Move_In_Date || resident.move_in_date;
  const moveOutDate = resident["Move-out Date"] || resident.Move_Out_Date || resident.move_out_date;
  const accommodationType = resident["Accommodation Type"] || resident.Accommodation_Type || resident.accommodation_type;
  const keyWorker = resident["Support Worker"] || resident.Key_Worker || resident.key_worker;
  const supportLevel = resident["Support Level"] || resident.Support_Level || resident.support_level;
  const status = resident["Status"] || resident.Status || resident.status;
  const emergencyContactName = resident["Emergency Contact Name"] || resident.Emergency_Contact_Name || resident.emergency_contact_name;
  const emergencyContactPhone = resident["Emergency Contact Phone"] || resident.Emergency_Contact_Phone || resident.emergency_contact_phone;
  const fluentEnglish = resident["Fluent English"] !== undefined ? resident["Fluent English"] : resident.Fluent_English !== undefined ? resident.Fluent_English : resident.fluent_english;
  const partialEnglish = resident["Partial English"] !== undefined ? resident["Partial English"] : resident.Partial_English !== undefined ? resident.Partial_English : resident.partial_english;
  const languageSpoken = resident["Language Spoken"] || resident.Language_Spoken || resident.language_spoken;
  const communicationNeeds = resident["Communication Needs"] || resident.Communication_Needs || resident.communication_needs;
  const medicalConditions = resident["Medical Conditions"] || resident.Medical_Conditions || resident.medical_conditions;
  const notes = resident["Notes"] || resident.Notes || resident.notes;
  const hasNoPa = resident["Has No PA"] || resident.has_no_pa || false;
  const createdDate = resident["Created Date"] || resident.created_date || resident.Created_Date;
  const createdBy = resident["Created By"] || resident.created_by || resident.Created_By;
  const updatedDate = resident["Updated Date"] || resident.updated_date || resident.Updated_Date;
  const paWorkerName = resident["PA/Worker Name"] || resident.Pa_Worker_Name || resident.pa_worker_name;
  const paWorkerContact = resident["PA/Worker Contact"] || resident.Pa_Worker_Contact || resident.pa_worker_contact;
  const paWorkerEmail = resident["PA/Worker Email"] || resident.Pa_Worker_Email || resident.pa_worker_email;
  const paWorkerBorough = resident["PA/Worker Borough"] || resident.Pa_Worker_Borough || resident.pa_worker_borough;
  const paWorkerTeam = resident["PA/Worker Team"] || resident.Pa_Worker_Team || resident.pa_worker_team;
  const benefits = resident["Benefits"] || resident.Benefits || resident.benefits || [];
  const roomTransfers = resident["Room Transfers"] || resident.Room_Transfers || resident.room_transfers || [];
  const accommodationTransfers = resident["Accommodation Transfers"] || resident.Accommodation_Transfers || resident.accommodation_transfers || [];
  const googleDriveLink = resident["Sign Up Google Drive Link"] || resident["Google Drive Link"] || resident.Google_Drive_Link || resident.google_drive_link;
  const residentPhotographicLink = resident["Resident Photographic ID Link (Google Drive)"] || resident["Resident Photographic Link"];
  const photoIdUrl = resident["Photo Of Individual (Google Drive)"] || resident["Photo ID URL"] || resident.Photo_Id_Url || resident.photo_id_url;
  const futureAddress = resident["Future Address"] || resident.Future_Address || resident.future_address;
  const futureHousingType = resident["Future Housing Type"] || resident.Future_Housing_Type || resident.future_housing_type;
  const moveOnOutcome = resident["Move-on Outcome"] || resident.Move_On_Outcome || resident.move_on_outcome;

  const previewUrl = convertToDirectImageUrl(photoIdUrl);

  const getStatusColor = (status) => {
    return status === 'active' || status === 'Active' ? "bg-green-100 text-green-800 border-green-200" : "bg-blue-100 text-blue-800 border-blue-200";
  };

  const getSupportLevelColor = (level) => {
    const colors = { low: "bg-green-100 text-green-800", medium: "bg-yellow-100 text-yellow-800", high: "bg-orange-100 text-orange-800", intensive: "bg-red-100 text-red-800" };
    return colors[level?.toLowerCase()] || colors.medium;
  };

  const selectedProperty = properties?.find(p => (p["ID"] || p.Id || p.id) === propertyId);
  const selectedAccommodation = accommodations?.find(a => (a["ID"] || a.Id || a.id) === accommodationId);

  const propertyName = selectedProperty?.["Name"] || selectedProperty?.name || "N/A";
  const accommodationName = selectedAccommodation?.["Room Number"] || selectedAccommodation?.room_number || "N/A";
  const propertyGdriveLink = selectedProperty?.["Google Drive Link"] || selectedProperty?.google_drive_link;
  const accommodationGdriveLink = selectedAccommodation?.["Google Drive Link"] || selectedAccommodation?.google_drive_link;

  return (
    <>
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl w-full p-0">
          <ScrollArea className="max-h-[90vh]">
            <div className="p-6">
              <DialogHeader className="mb-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center overflow-hidden border cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all flex-shrink-0"
                      onClick={() => {
                        if (photoIdUrl && !imageError) {
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
                        <User className="w-8 h-8 text-slate-500" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <DialogTitle className="text-3xl font-bold text-slate-900 break-words">{firstName} {lastName}</DialogTitle>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <Badge className={getStatusColor(status)}>{status?.replace('_', ' ')}</Badge>
                        <Badge className={getSupportLevelColor(supportLevel)}>{supportLevel} support</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </DialogHeader>

              {/* Main Details Grid */}
              <h3 className="text-xl font-semibold text-slate-800 mb-4">Entry Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <DetailItem icon={<Calendar />} label="Created Date & Time">
                  {createdDate ? format(new Date(createdDate), 'dd/MM/yyyy HH:mm') : null}
                </DetailItem>
                {createdBy && (
                  <DetailItem icon={<User />} label="Created By">
                    {createdBy}
                  </DetailItem>
                )}
                {updatedDate && createdDate && new Date(updatedDate).getTime() !== new Date(createdDate).getTime() && (
                  <DetailItem icon={<Calendar />} label="Last Updated">
                    {format(new Date(updatedDate), 'dd/MM/yyyy HH:mm')}
                  </DetailItem>
                )}
                <DetailItem icon={<User />} label="Date of Birth">{dateOfBirth ? format(new Date(dateOfBirth), 'dd MMMM yyyy') : null}</DetailItem>
                <DetailItem icon={<Phone />} label="Phone Number">{phoneNumber}</DetailItem>
                <DetailItem icon={<Mail />} label="Email Address">{emailAddress}</DetailItem>
                <DetailItem icon={<Shield />} label="NI Number">{niNumber}</DetailItem>
                <DetailItem icon={<FileText />} label="Claim Reference">{claimRef}</DetailItem>
                <DetailItem icon={<FileText />} label="Submission Reference">{submissionRef}</DetailItem>
              </div>

              <Separator className="my-6" />

              {/* Accommodation & Support */}
              <h3 className="text-xl font-semibold text-slate-800 mb-4">Accommodation & Support</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <DetailItem icon={<Building />} label="Property">
                  {propertyName}
                  {propertyGdriveLink && (
                    <a href={propertyGdriveLink} target="_blank" rel="noopener noreferrer" className="ml-2 inline-flex items-center text-blue-600 hover:text-blue-800">
                      <Link2 className="w-3 h-3" />
                    </a>
                  )}
                </DetailItem>
                <DetailItem icon={<BedDouble />} label="Unit/Room">
                  {accommodationName}
                  {accommodationGdriveLink && (
                    <a href={accommodationGdriveLink} target="_blank" rel="noopener noreferrer" className="ml-2 inline-flex items-center text-blue-600 hover:text-blue-800">
                      <Link2 className="w-3 h-3" />
                    </a>
                  )}
                </DetailItem>
                <DetailItem icon={<MapPin />} label="Address">{address}</DetailItem>
                <DetailItem icon={<Calendar />} label="Move-in Date">{moveInDate ? format(new Date(moveInDate), 'dd MMMM yyyy') : null}</DetailItem>
                {moveOutDate && <DetailItem icon={<Calendar />} label="Move-out Date">{format(new Date(moveOutDate), 'dd MMMM yyyy')}</DetailItem>}
                <DetailItem icon={<Home />} label="Accommodation Type">{accommodationType?.replace('_', ' ')}</DetailItem>
                <DetailItem icon={<UserCheck />} label="Support Worker">{keyWorker}</DetailItem>
                <DetailItem icon={<Heart />} label="Support Level">{supportLevel}</DetailItem>
              </div>

              <Separator className="my-6" />

              {/* Move-on Details */}
              {status === 'Moved On' && (
                <>
                  <h3 className="text-xl font-semibold text-blue-800 mb-4 flex items-center gap-2">
                    <Home className="w-6 h-6" />
                    Move-on Details (Future Housing)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 bg-blue-50 p-6 rounded-xl border border-blue-100">
                    <DetailItem icon={<MapPin />} label="Future Address">{futureAddress}</DetailItem>
                    <DetailItem icon={<Home />} label="Housing Type">{futureHousingType}</DetailItem>
                    <DetailItem icon={<UserCheck />} label="Move-on Outcome">{moveOnOutcome}</DetailItem>
                  </div>
                  <Separator className="my-6" />
                </>
              )}

              {/* Emergency Contact */}
              <h3 className="text-xl font-semibold text-slate-800 mb-4">Emergency Contact</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <DetailItem icon={<User />} label="Contact Name">{emergencyContactName}</DetailItem>
                <DetailItem icon={<Phone />} label="Contact Phone">{emergencyContactPhone}</DetailItem>
              </div>

              <Separator className="my-6" />

              {/* Additional & Children's Services Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-xl font-semibold text-slate-800 mb-4">Additional Information</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <DetailItem icon={<User />} label="Fluent English">
                        {fluentEnglish ? "Yes" : "No"}
                      </DetailItem>
                      <DetailItem icon={<User />} label="Partial English">
                        {partialEnglish ? "Yes" : "No"}
                      </DetailItem>
                    </div>
                    <DetailItem icon={<User />} label="Language Spoken">{languageSpoken}</DetailItem>
                    <DetailItem icon={<FileText />} label="Communication Needs">{communicationNeeds}</DetailItem>
                    <DetailItem icon={<Briefcase />} label="Medical Conditions">{medicalConditions}</DetailItem>
                    <DetailItem icon={<FileText />} label="Notes">{notes}</DetailItem>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-slate-800">Children's Services/Trust</h3>
                    {hasNoPa && <Badge variant="secondary" className="bg-slate-100 text-slate-600">No PA assigned</Badge>}
                  </div>
                  <div className={`space-y-4 ${hasNoPa ? 'opacity-50' : ''}`}>
                    <DetailItem icon={<Users />} label="PA/Worker Name">{hasNoPa ? "N/A" : paWorkerName}</DetailItem>
                    <DetailItem icon={<Phone />} label="PA/Worker Contact">{hasNoPa ? "N/A" : paWorkerContact}</DetailItem>
                    <DetailItem icon={<Mail />} label="PA/Worker Email">{hasNoPa ? "N/A" : paWorkerEmail}</DetailItem>
                    <DetailItem icon={<MapPin />} label="Borough">{hasNoPa ? "N/A" : paWorkerBorough}</DetailItem>
                    <DetailItem icon={<Users />} label="Team Name">{hasNoPa ? "N/A" : paWorkerTeam}</DetailItem>
                  </div>
                </div>
              </div>

              <Separator className="my-6" />

              {/* Benefits */}
              {benefits?.length > 0 && (
                <>
                  <h3 className="text-xl font-semibold text-slate-800 mb-4">Benefits</h3>
                  <Table>
                    <TableHeader><TableRow><TableHead>Type</TableHead><TableHead>Amount</TableHead><TableHead>Payment Day</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {benefits.map((benefit, index) => (
                        <TableRow key={index}>
                          <TableCell className="capitalize">{benefit.benefit_type?.replace('_', ' ')}</TableCell>
                          <TableCell>£{benefit.amount?.toFixed(2) || '0.00'}</TableCell>
                          <TableCell>{benefit.payment_day || 'N/A'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <Separator className="my-6" />
                </>
              )}

              {/* Move History Section */}
              {(moveInDate || roomTransfers?.length > 0 || accommodationTransfers?.length > 0) && (
                <>
                  <h3 className="text-xl font-semibold text-slate-800 mb-4">Move History</h3>
                  
                  <div className="space-y-3">
                    {/* Initial Move-in */}
                    {moveInDate && (
                      <div className="flex gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex-shrink-0 mt-1">
                          <Home className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-blue-900 mb-1">Initial Move-in</p>
                          <p className="text-sm text-slate-700 break-words">
                            <span className="font-medium">{format(new Date(moveInDate), 'dd MMM yyyy')}</span>
                            {' → '}
                      <span className="font-medium">{propertyName}</span>
                            {' - Unit '}
                      <span className="font-medium">{accommodationName}</span>
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Room Transfers */}
                    {roomTransfers && roomTransfers.length > 0 && (
                      <>
                        <div className="mt-4 mb-2">
                          <h4 className="text-md font-semibold text-green-700 flex items-center gap-2">
                            <BedDouble className="w-5 h-5" />
                            Room Transfers (Within Same Property)
                          </h4>
                        </div>
                        {roomTransfers.map((transfer, index) => (
                          <div key={`room-${index}`} className="flex gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                            <div className="flex-shrink-0 mt-1">
                              <BedDouble className="w-5 h-5 text-green-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-green-900 mb-1">Room Transfer #{index + 1}</p>
                              <p className="text-sm text-slate-700 break-words">
                                {transfer.transfer_date ? (
                                  <span className="font-medium">{format(new Date(transfer.transfer_date), 'dd MMM yyyy')}</span>
                                ) : (
                                  <span className="font-medium text-orange-600">Date not recorded</span>
                                )}
                                {' → '}
                                {transfer.property_name && <span className="font-medium">{transfer.property_name}</span>}
                                {' - From Room '}
                                <span className="font-medium">{transfer.from_room_number || 'N/A'}</span>
                                {' to Room '}
                                <span className="font-medium">{transfer.to_room_number || 'N/A'}</span>
                              </p>
                              {transfer.reason && (
                                <p className="text-xs text-slate-600 mt-1 break-words">Reason: {transfer.reason}</p>
                              )}
                              {transfer.notes && (
                                <p className="text-xs text-slate-600 mt-1 italic break-words">{transfer.notes}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </>
                    )}

                    {/* Accommodation Transfers */}
                    {accommodationTransfers && accommodationTransfers.length > 0 && (
                      <>
                        <div className="mt-4 mb-2">
                          <h4 className="text-md font-semibold text-slate-700 flex items-center gap-2">
                            <Building className="w-5 h-5" />
                            Accommodation Transfers (Between Different Properties)
                          </h4>
                        </div>
                        {accommodationTransfers.map((transfer, index) => (
                          <div key={`property-${index}`} className="flex gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                            <div className="flex-shrink-0 mt-1">
                              <Building className="w-5 h-5 text-slate-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-slate-900 mb-2">Accommodation Transfer #{index + 1}</p>
                              
                              <div className="bg-blue-50 p-2 rounded mb-2 border border-blue-200">
                                <p className="text-xs font-semibold text-blue-900 mb-1">Previous Accommodation Timeline:</p>
                                {transfer.move_in_date && (
                                  <p className="text-xs text-slate-700 break-words">
                                    <span className="font-medium">Moved in: </span>
                                    {format(new Date(transfer.move_in_date), 'dd MMM yyyy')}
                                  </p>
                                )}
                                {transfer.move_out_date && (
                                  <p className="text-xs text-slate-700 break-words">
                                    <span className="font-medium">Moved out: </span>
                                    {format(new Date(transfer.move_out_date), 'dd MMM yyyy')}
                                  </p>
                                )}
                                {!transfer.move_in_date && !transfer.move_out_date && (
                                  <p className="text-xs text-slate-500 italic">No timeline dates recorded</p>
                                )}
                              </div>

                              <p className="text-sm text-slate-700 mb-1 break-words">
                                <span className="font-medium">Transfer Date: </span>
                                {transfer.transfer_date ? format(new Date(transfer.transfer_date), 'dd MMM yyyy') : 'Date not recorded'}
                              </p>
                              
                              <p className="text-sm text-slate-700 break-words">
                                <span className="text-slate-500">From:</span>
                                {' '}
                                <span className="font-medium">{transfer.from_property || properties?.find(p => (p.ID || p.id) === transfer.from_property_id)?.Name || 'N/A'}</span>
                                {' - Unit '}
                                <span className="font-medium">{transfer.from_unit || accommodations?.find(a => (a.ID || a.id) === transfer.from_accommodation_id)?.["Room Number"] || 'N/A'}</span>
                              </p>
                              <p className="text-sm text-slate-700 break-words">
                                <span className="text-slate-500">To:</span>
                                {' '}
                                <span className="font-medium">{transfer.to_property || properties?.find(p => (p.ID || p.id) === transfer.to_property_id)?.Name || 'N/A'}</span>
                                {' - Unit '}
                                <span className="font-medium">{transfer.to_unit || accommodations?.find(a => (a.ID || a.id) === transfer.to_accommodation_id)?.["Room Number"] || 'N/A'}</span>
                              </p>
                              {transfer.reason && (
                                <p className="text-xs text-slate-600 mt-1 break-words">Reason: {transfer.reason}</p>
                              )}
                              {transfer.notes && (
                                <p className="text-xs text-slate-600 mt-1 italic break-words">{transfer.notes}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>

                  <Separator className="my-6" />
                </>
              )}

               {/* Links */}
              <h3 className="text-xl font-semibold text-slate-800 mb-4">Document Links</h3>
              <div className="flex gap-4 flex-wrap">
                  {photoIdUrl && (
                      <a href={photoIdUrl} target="_blank" rel="noopener noreferrer" className="inline-block">
                          <Button variant="outline"><Link2 className="w-4 h-4 mr-2" />Photo ID</Button>
                      </a>
                  )}
                  {googleDriveLink && (
                      <a href={googleDriveLink} target="_blank" rel="noopener noreferrer" className="inline-block">
                          <Button variant="outline"><Link2 className="w-4 h-4 mr-2" />Sign Up Google Drive Link</Button>
                      </a>
                  )}
                  {residentPhotographicLink && (
                      <a href={residentPhotographicLink} target="_blank" rel="noopener noreferrer" className="inline-block">
                          <Button variant="outline"><Link2 className="w-4 h-4 mr-2" />Resident Photographic ID Link</Button>
                      </a>
                  )}
              </div>

            </div>
            <DialogFooter className="p-6 bg-slate-50 border-t sticky bottom-0">
              {onDelete && (
                <Button
                  variant="destructive"
                  onClick={() => onDelete(resident)}
                  className="flex-1"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Resident
                </Button>
              )}
              <Button variant="outline" onClick={onClose}>Close</Button>
              <Button onClick={() => onEdit(resident)}><Edit className="w-4 h-4 mr-2"/>Edit Resident</Button>
            </DialogFooter>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Photo Preview Modal */}
      {showPhotoModal && photoIdUrl && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60]"
          onClick={() => setShowPhotoModal(false)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] p-4 bg-white rounded-lg shadow-2xl overflow-auto"
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
  const [error, setError] = React.useState(false);

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
