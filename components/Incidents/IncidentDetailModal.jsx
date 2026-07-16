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
    Shield, Calendar, MapPin, User, Clock, CheckCircle, Edit, X, Users, AlertTriangle, Trash2
} from 'lucide-react';
import { format, isValid, parseISO } from 'date-fns';

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

export default function IncidentDetailModal({ 
  incident, 
  getSeverityColor, 
  getStatusColor, 
  getResidentName, 
  onClose, 
  onEdit,
  onDelete
}) {
  if (!incident) return null;

  // Log incident data for debugging
  console.log("IncidentDetailModal - incident data:", incident);

  // Handle both field name formats (with spaces for PostgreSQL, underscores for base44)
  const residentId = incident["Resident ID"] || incident.resident_id;
  const incidentDate = incident["Incident Date"] || incident.incident_date;
  const severity = incident["Severity"] || incident.severity;
  const status = incident["Status"] || incident.status;
  const incidentType = incident["Incident Type"] || incident.incident_type;
  const description = incident["Description"] || incident.description;
  const location = incident["Location"] || incident.location;
  const actionTaken = incident["Action Taken"] || incident.action_taken;
  const staffInvolved = incident["Staff Involved"] || incident.staff_involved;
  const staffMembersInvolved = incident["Staff Members Involved"] || incident.staff_members_involved;
  const witnesses = incident["Witnesses"] || incident.witnesses;
  const followUpRequired = incident["Follow-up Required"] || incident.follow_up_required;
  const followUpDate = incident["Follow-up Date"] || incident.follow_up_date;
  const followUpByUserId = incident["Follow-up By User ID"] || incident.follow_up_by_user_id;
  const followUpCompleted = incident["Follow-up Completed"] || incident.follow_up_completed;
  const followUpComments = incident["Follow-up Comments"] || incident.follow_up_comments;
  const authoritiesNotified = incident["Authorities Notified"] || incident.authorities_notified;
  const loggedBy = incident["Logged By"] || incident.logged_by || incident["Created By"] || incident.created_by;
  const createdDate = incident["Created Date"] || incident.created_date;
  const updatedDate = incident["Updated Date"] || incident.updated_date;

  console.log("Extracted residentId:", residentId);
  console.log("Extracted loggedBy:", loggedBy);

  // Helper to safely format dates
  const formatDate = (dateString, formatString) => {
    if (!dateString) return 'Not set';
    
    try {
      const date = parseISO(dateString);
      if (isValid(date)) {
        return format(date, formatString);
      }
      
      const directDate = new Date(dateString);
      if (isValid(directDate)) {
        return format(directDate, formatString);
      }
      
      return 'Invalid date';
    } catch (error) {
      console.error('Error formatting date:', dateString, error);
      return 'Invalid date';
    }
  };

  const residentName = residentId && getResidentName ? getResidentName(residentId) : null;
  console.log("Resident name:", residentName);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl w-full p-0" showClose={false}>
        <ScrollArea className="max-h-[90vh]">
          <div className="p-6">
            <DialogHeader className="mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-orange-500 rounded-xl flex items-center justify-center shadow-sm">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-3xl font-bold text-slate-900">{incidentType?.replace('_', ' ')}</DialogTitle>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className={getSeverityColor(severity)}>{severity} severity</Badge>
                    <Badge className={getStatusColor(status)}>{status?.replace('_', ' ')}</Badge>
                    {authoritiesNotified && (
                      <Badge variant="outline" className="border-blue-500 text-blue-700">Authorities notified</Badge>
                    )}
                  </div>
                </div>
              </div>
            </DialogHeader>

            <h3 className="text-xl font-semibold text-slate-800 mb-4">Incident Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DetailItem icon={<Calendar />} label="Date & Time">
                {formatDate(incidentDate, 'dd MMMM yyyy, HH:mm')}
              </DetailItem>
              <DetailItem icon={<MapPin />} label="Location">{location || 'Not specified'}</DetailItem>
              <DetailItem icon={<User />} label="Resident Involved">
                {residentName || (residentId ? `ID: ${residentId}` : 'No resident specified')}
              </DetailItem>
              <DetailItem icon={<User />} label="Reported By">
                {loggedBy ? (loggedBy.includes('@') ? loggedBy.split('@')[0] : loggedBy) : 'Not recorded'}
              </DetailItem>
            </div>

            <Separator className="my-6" />

            <h3 className="text-xl font-semibold text-slate-800 mb-4">Status & Assignment</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <DetailItem icon={<CheckCircle />} label="Current Status">
                <Badge className={getStatusColor(status)}>{status?.replace('_', ' ')}</Badge>
              </DetailItem>
              {followUpRequired && (
                <>
                  <DetailItem icon={<User />} label="Assigned To">
                    {followUpByUserId || 'Unassigned'}
                  </DetailItem>
                  {followUpDate && (
                    <DetailItem icon={<Calendar />} label="Follow-up Due Date">
                      {formatDate(followUpDate, 'dd MMMM yyyy')}
                    </DetailItem>
                  )}
                  <DetailItem icon={<CheckCircle />} label="Follow-up Status">
                    {followUpCompleted ? (
                      <Badge className="bg-green-100 text-green-800">Completed</Badge>
                    ) : (
                      <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
                    )}
                  </DetailItem>
                </>
              )}
            </div>

            <Separator className="my-6" />

            <h3 className="text-xl font-semibold text-slate-800 mb-4">Description</h3>
            <div className="bg-slate-50 rounded-lg p-4 mb-6">
              <p className="text-slate-700 whitespace-pre-wrap">{description}</p>
            </div>

            {actionTaken && (
              <>
                <h3 className="text-xl font-semibold text-slate-800 mb-4">Action Taken</h3>
                <div className="bg-blue-50 rounded-lg p-4 mb-6">
                  <p className="text-slate-700 whitespace-pre-wrap">{actionTaken}</p>
                </div>
              </>
            )}

            {staffInvolved && staffMembersInvolved?.length > 0 && (
              <>
                <Separator className="my-6" />
                <h3 className="text-xl font-semibold text-slate-800 mb-4">Staff Involved</h3>
                <div className="flex flex-wrap gap-2 mb-6">
                  {staffMembersInvolved.map((staffName, index) => (
                    <Badge key={index} variant="outline" className="border-orange-500 text-orange-700">
                      <Users className="w-3 h-3 mr-1" />
                      {staffName}
                    </Badge>
                  ))}
                </div>
              </>
            )}

            {witnesses && (
              <>
                <Separator className="my-6" />
                <DetailItem icon={<Users />} label="Witnesses">{witnesses}</DetailItem>
              </>
            )}

            {followUpRequired && followUpComments && (
              <>
                <Separator className="my-6" />
                <h3 className="text-xl font-semibold text-slate-800 mb-4">Follow-up Comments</h3>
                <div className="bg-yellow-50 rounded-lg p-4 mb-6">
                  <p className="text-slate-700 whitespace-pre-wrap">{followUpComments}</p>
                </div>
              </>
            )}

            <Separator className="my-6" />

            <h3 className="text-xl font-semibold text-slate-800 mb-4">Additional Information</h3>
            <div className="grid grid-cols-1 gap-6">
              <DetailItem icon={<Calendar />} label="Entry Date & Time">
                {formatDate(createdDate, 'dd/MM/yyyy HH:mm')}
              </DetailItem>
              <DetailItem icon={<Clock />} label="Last Updated">
                {formatDate(updatedDate, 'dd MMMM yyyy, HH:mm')}
              </DetailItem>
            </div>

            <DialogFooter className="mt-8 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Close
              </Button>
              {onDelete && (
                <Button 
                  onClick={() => {
                    onClose();
                    onDelete(incident);
                  }} 
                  variant="outline"
                  className="text-red-600 border-red-200 hover:border-red-300 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Incident
                </Button>
              )}
              <Button onClick={() => {
                onClose();
                onEdit(incident);
              }} className="bg-red-600 hover:bg-red-700">
                <Edit className="w-4 h-4 mr-2" />
                Edit Incident
              </Button>
            </DialogFooter>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}