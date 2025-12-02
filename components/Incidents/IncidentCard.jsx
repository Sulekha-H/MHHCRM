import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Calendar, MapPin, AlertTriangle, User, Trash2 } from "lucide-react";
import { format, isValid, parseISO } from "date-fns";

export default function IncidentCard({ 
  incident, 
  onEdit, 
  onViewDetails, 
  onDelete,
  getSeverityColor, 
  getStatusColor, 
  getResidentName,
  getPropertyName 
}) {
  // Handle both field name formats (with spaces for PostgreSQL, underscores for base44)
  const residentId = incident["Resident ID"] || incident.resident_id;
  const incidentDate = incident["Incident Date"] || incident.incident_date;
  const severity = incident["Severity"] || incident.severity;
  const status = incident["Status"] || incident.status;
  const incidentType = incident["Incident Type"] || incident.incident_type;
  const description = incident["Description"] || incident.description;
  const location = incident["Location"] || incident.location;
  const loggedBy = incident["Logged By"] || incident.logged_by;
  const followUpRequired = incident["Follow-up Required"] || incident.follow_up_required;
  const followUpCompleted = incident["Follow-up Completed"] || incident.follow_up_completed;

  const propertyName = getPropertyName ? getPropertyName(residentId) : null;

  // Helper to safely format dates
  const formatIncidentDate = (dateString) => {
    if (!dateString) return 'Date not set';
    
    try {
      // Try parsing ISO string first
      const date = parseISO(dateString);
      if (isValid(date)) {
        return format(date, 'PPp');
      }
      
      // Try creating Date directly
      const directDate = new Date(dateString);
      if (isValid(directDate)) {
        return format(directDate, 'PPp');
      }
      
      return 'Invalid date';
    } catch (error) {
      console.error('Error formatting incident date:', dateString, error);
      return 'Invalid date';
    }
  };

  return (
    <Card 
      className="hover:shadow-md transition-shadow duration-200 cursor-pointer"
      onClick={() => onViewDetails(incident)}
    >
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 mr-2">
            <div className="flex items-center gap-2 mb-2">
              <Badge className={getSeverityColor(severity)}>
                {severity}
              </Badge>
              <Badge className={getStatusColor(status)}>
                {status?.replace('_', ' ')}
              </Badge>
            </div>
            <h3 className="font-semibold text-slate-900 text-lg">
              {incidentType?.replace('_', ' ')}
            </h3>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(incident);
              }}
              className="text-slate-400 hover:text-slate-600 flex-shrink-0"
            >
              <Edit className="w-4 h-4" />
            </Button>
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(incident);
                }}
                className="text-slate-400 hover:text-red-600 flex-shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-slate-700 line-clamp-3">{description}</p>
        
        <div className="space-y-2 pt-3 border-t">
          {residentId && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <User className="w-4 h-4 text-slate-400" />
              <span>{getResidentName(residentId)}</span>
            </div>
          )}
          
          {propertyName && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <MapPin className="w-4 h-4 text-slate-400" />
              <span>{propertyName}</span>
            </div>
          )}
          
          {location && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <MapPin className="w-4 h-4 text-slate-400" />
              <span>{location}</span>
            </div>
          )}
          
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>{formatIncidentDate(incidentDate)}</span>
          </div>

          {loggedBy && (
            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-cyan-500" />
              <span className="text-slate-600">
                Logged by: <span className="font-medium text-cyan-700">{loggedBy}</span>
              </span>
            </div>
          )}
        </div>

        {followUpRequired && !followUpCompleted && (
          <div className="pt-3 border-t">
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Follow-up Required
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}