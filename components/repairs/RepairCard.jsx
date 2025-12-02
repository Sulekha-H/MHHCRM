import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Calendar, MapPin, User, Wrench, Clock, Banknote, FileText as InvoiceIcon, CheckCircle, AlertTriangle, Trash2 } from "lucide-react";
import { format, isValid, parseISO } from "date-fns";
import { motion } from "framer-motion";

export default function RepairCard({ repair, onEdit, onViewDetails, onDelete, getAccommodationName, getPropertyName, viewMode = 'grid' }) {
  
  // Helper function to get value from both PostgreSQL format (capitals with spaces) and base44 format (lowercase with underscores)
  const getValue = (pgKey, base44Key) => {
    return repair[pgKey] || repair[base44Key];
  };

  // Helper to safely format dates
  const formatRepairDate = (dateString) => {
    if (!dateString) return 'Date not set';
    
    try {
      // Try parsing ISO string first
      const date = parseISO(dateString);
      if (isValid(date)) {
        return format(date, 'MMM d, yyyy');
      }
      
      // Try creating Date directly
      const directDate = new Date(dateString);
      if (isValid(directDate)) {
        return format(directDate, 'MMM d, yyyy');
      }
      
      return 'Invalid date';
    } catch (error) {
      console.error('Error formatting repair date:', dateString, error);
      return 'Invalid date';
    }
  };

  const formatRepairDateTime = (dateString) => {
    if (!dateString) return 'Date not set';
    
    try {
      const date = parseISO(dateString);
      if (isValid(date)) {
        return format(date, 'MMM d, HH:mm');
      }
      
      const directDate = new Date(dateString);
      if (isValid(directDate)) {
        return format(directDate, 'MMM d, HH:mm');
      }
      
      return 'Invalid date';
    } catch (error) {
      console.error('Error formatting repair date time:', dateString, error);
      return 'Invalid date';
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: "bg-green-50 text-green-700 border-green-200",
      medium: "bg-blue-50 text-blue-700 border-blue-200",
      high: "bg-orange-50 text-orange-700 border-orange-200",
      urgent: "bg-red-50 text-red-700 border-red-200",
      emergency: "bg-purple-50 text-purple-700 border-purple-200",
      Low: "bg-green-50 text-green-700 border-green-200",
      Medium: "bg-blue-50 text-blue-700 border-blue-200",
      High: "bg-orange-50 text-orange-700 border-orange-200",
      Urgent: "bg-red-50 text-red-700 border-red-200",
      Emergency: "bg-purple-50 text-purple-700 border-purple-200"
    };
    return colors[priority] || colors.medium;
  };

  const getPriorityIcon = (priority) => {
    const priorityLower = priority?.toLowerCase();
    if (priorityLower === 'emergency' || priorityLower === 'urgent') {
      return <AlertTriangle className="w-3 h-3" />;
    }
    return null;
  };

  const getStatusColor = (status) => {
    const statusLower = status?.toLowerCase().replace(/ /g, '_');
    const colors = {
      reported: "bg-gray-50 text-gray-700 border-gray-200",
      assessed: "bg-blue-50 text-blue-700 border-blue-200",
      scheduled: "bg-yellow-50 text-yellow-700 border-yellow-200",
      in_progress: "bg-indigo-50 text-indigo-700 border-indigo-200",
      completed: "bg-green-50 text-green-700 border-green-200",
      cancelled: "bg-red-50 text-red-700 border-red-200"
    };
    return colors[statusLower] || colors.reported;
  };

  const getRepairTypeColor = (type) => {
    const typeLower = type?.toLowerCase();
    const colors = {
      plumbing: "bg-blue-50 text-blue-700",
      electrical: "bg-yellow-50 text-yellow-700",
      heating: "bg-orange-50 text-orange-700",
      decoration: "bg-purple-50 text-purple-700",
      appliance: "bg-green-50 text-green-700",
      structural: "bg-red-50 text-red-700",
      security: "bg-gray-50 text-gray-700",
      other: "bg-slate-50 text-slate-700"
    };
    return colors[typeLower] || colors.other;
  };

  const getPaymentStatusColor = (status) => {
    const statusLower = status?.toLowerCase().replace(/ /g, '_');
    const colors = {
      unpaid: "bg-red-50 text-red-700",
      partially_paid: "bg-yellow-50 text-yellow-700",
      paid: "bg-green-50 text-green-700"
    };
    return colors[statusLower] || "bg-gray-50 text-gray-700";
  };

  // Extract values using both formats
  const title = getValue("Title", "title");
  const propertyId = getValue("Property ID", "property_id");
  const accommodationId = getValue("Accommodation ID", "accommodation_id");
  const commonArea = getValue("Common Area", "common_area");
  const repairType = getValue("Repair Type", "repair_type");
  const priority = getValue("Priority", "priority");
  const status = getValue("Status", "status");
  const description = getValue("Description", "description");
  const reportedDate = getValue("Reported Date", "reported_date");
  const scheduledDate = getValue("Scheduled Date", "scheduled_date");
  const dateFixed = getValue("Date Fixed", "date_fixed");
  const contractor = getValue("Contractor", "contractor");
  const contractorContact = getValue("Contractor Contact", "contractor_contact");
  const estimatedCost = getValue("Estimated Cost", "estimated_cost") || 0;
  const invoiceAmount = getValue("Invoice Amount", "invoice_amount") || 0;
  const invoicePaymentStatus = getValue("Invoice Payment Status", "invoice_payment_status");
  const reportedBy = getValue("Reported By", "reported_by");
  const reportedByType = getValue("Reported By Type", "reported_by_type");

  const priorityColorValue = priority?.toLowerCase() === 'emergency' ? '#9333ea' :
                             priority?.toLowerCase() === 'urgent' ? '#dc2626' :
                             priority?.toLowerCase() === 'high' ? '#ea580c' :
                             priority?.toLowerCase() === 'medium' ? '#2563eb' : '#16a34a';

  if (viewMode === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
      >
        <Card 
          className="hover:shadow-lg transition-all duration-200 cursor-pointer bg-white border-l-4"
          style={{ borderLeftColor: priorityColorValue }}
          onClick={() => onViewDetails(repair)}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              {/* Left Side - Main Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 rounded-lg ${getRepairTypeColor(repairType)}`}>
                    <Wrench className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 text-base truncate">
                      {title}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-slate-600 mt-1">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">{getPropertyName(propertyId)}</span>
                      {accommodationId || commonArea ? (
                        <span className="text-slate-400">•</span>
                      ) : null}
                      {(accommodationId || commonArea) && (
                        <span className="truncate">{getAccommodationName(repair)}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Middle - Status & Details */}
              <div className="flex flex-col items-end gap-2">
                <div className="flex gap-2 flex-wrap justify-end">
                  <Badge className={`${getPriorityColor(priority)} border font-semibold`}>
                    {getPriorityIcon(priority)}
                    {priority}
                  </Badge>
                  <Badge className={`${getStatusColor(status)} border`}>
                    {status?.replace('_', ' ')}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Calendar className="w-3 h-3" />
                  {formatRepairDate(reportedDate)}
                </div>
                {contractor && (
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <User className="w-3 h-3" />
                    {contractor}
                  </div>
                )}
              </div>

              {/* Right Side - Actions */}
              <div className="flex flex-col gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(repair);
                  }}
                  className="h-8"
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(repair);
                  }}
                  className="h-8 text-slate-400 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card 
        className="hover:shadow-xl transition-all duration-300 cursor-pointer bg-white h-full flex flex-col border-t-4"
        style={{ borderTopColor: priorityColorValue }}
        onClick={() => onViewDetails(repair)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <div className={`p-2 rounded-lg ${getRepairTypeColor(repairType)}`}>
                  <Wrench className="w-5 h-5" />
                </div>
                <Badge className={getRepairTypeColor(repairType)}>
                  {repairType}
                </Badge>
              </div>
              <h3 className="font-bold text-slate-900 text-lg line-clamp-2 mb-3">
                {title}
              </h3>
              <div className="flex gap-2 flex-wrap">
                <Badge className={`${getPriorityColor(priority)} border font-semibold`}>
                  {getPriorityIcon(priority)}
                  {priority}
                </Badge>
                <Badge className={`${getStatusColor(status)} border`}>
                  {status?.replace('_', ' ')}
                </Badge>
              </div>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(repair);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(repair);
                }}
                className="text-slate-400 hover:text-red-600"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 flex-1">
          {/* Location Information */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span className="text-slate-700 font-medium truncate">
                {getPropertyName(propertyId)}
              </span>
            </div>
            {(accommodationId || commonArea) && (
              <div className="flex items-center gap-2 text-sm pl-6">
                <span className="text-slate-600 truncate">
                  {getAccommodationName(repair)}
                </span>
              </div>
            )}
          </div>

          {/* Description */}
          {description && (
            <div className="pt-2 border-t">
              <p className="text-sm text-slate-600 line-clamp-2">
                {description}
              </p>
            </div>
          )}

          {/* Timeline Info */}
          <div className="pt-2 border-t space-y-2">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Calendar className="w-3 h-3" />
              <span>Reported: {formatRepairDate(reportedDate)}</span>
            </div>
            {scheduledDate && (
              <div className="flex items-center gap-2 text-xs text-blue-600">
                <Clock className="w-3 h-3" />
                <span>Scheduled: {formatRepairDateTime(scheduledDate)}</span>
              </div>
            )}
            {dateFixed && (
              <div className="flex items-center gap-2 text-xs text-green-600">
                <CheckCircle className="w-3 h-3" />
                <span>Fixed: {formatRepairDate(dateFixed)}</span>
              </div>
            )}
          </div>

          {/* Contractor & Cost */}
          {(contractor || estimatedCost > 0 || invoiceAmount > 0) && (
            <div className="pt-2 border-t space-y-2">
              {contractor && (
                <div className="flex items-center gap-2 text-xs">
                  <User className="w-3 h-3 text-slate-400" />
                  <span className="text-slate-700 font-medium">{contractor}</span>
                  {contractorContact && (
                    <span className="text-blue-600">• {contractorContact}</span>
                  )}
                </div>
              )}
              {(estimatedCost > 0 || invoiceAmount > 0) && (
                <div className="flex items-center gap-2 text-xs">
                  <Banknote className="w-3 h-3 text-green-500" />
                  <span className="text-slate-700 font-semibold">
                    £{invoiceAmount > 0 ? parseFloat(invoiceAmount).toFixed(2) : parseFloat(estimatedCost).toFixed(2)}
                  </span>
                  {invoicePaymentStatus && invoiceAmount > 0 && (
                    <Badge className={`${getPaymentStatusColor(invoicePaymentStatus)} text-xs`}>
                      {invoicePaymentStatus?.replace('_', ' ')}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Reported By */}
          {reportedBy && (
            <div className="pt-2 border-t">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <User className="w-3 h-3" />
                <span>
                  {reportedBy}
                  {reportedByType && (
                    <span className="ml-1 text-blue-600 capitalize">
                      ({reportedByType.replace('_', ' ')})
                    </span>
                  )}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}