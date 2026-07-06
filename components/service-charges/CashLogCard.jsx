import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PoundSterling, Calendar, User, Building, Edit } from "lucide-react";
import { format } from "date-fns";

export default function CashLogCard({ cashLog, residents, properties, onEdit, onViewDetails, onView }) {
  const getResidentName = (residentId) => {
    // If resident_name is already provided, use it
    if (cashLog.resident_name) return cashLog.resident_name;
    
    if (!residents) return "Unknown Resident";
    const resident = residents.find(r => (r.id || r.ID) === residentId);
    if (!resident) return "Unknown Resident";
    
    const firstName = resident.first_name || resident["First Name"] || '';
    const lastName = resident.last_name || resident["Last Name"] || '';
    return `${firstName} ${lastName}`.trim() || "Unknown Resident";
  };

  const getPropertyName = (propertyId) => {
    // If property_name is already provided, use it
    if (cashLog.property_name) return cashLog.property_name;
    
    if (!properties) return "Unknown Property";
    const property = properties.find(p => (p.id || p.ID) === propertyId);
    return property?.name || property?.Name || "Unknown Property";
  };
  
  // Support both onViewDetails and onView props
  const handleClick = () => {
    if (onView) onView(cashLog);
    else if (onViewDetails) onViewDetails(cashLog);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      return format(date, 'MMM d, yyyy');
    } catch (error) {
      return 'Invalid date';
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Not set';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      return format(date, 'MMM d, yyyy HH:mm');
    } catch (error) {
      return 'Invalid date';
    }
  };

  const formatMonth = (monthString) => {
    if (!monthString) return 'Not set';
    try {
      // Handle both 'YYYY-MM' and 'YYYY-MM-DD' formats
      const dateStr = monthString.length === 7 ? monthString + '-01' : monthString;
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return 'Invalid date';
      return format(date, 'MMMM yyyy');
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Handle both snake_case (Base44) and Title Case (Supabase) field names
  const residentId = cashLog.resident_id || cashLog["Resident ID"];
  const propertyId = cashLog.property_id || cashLog["Property ID"];
  const amountGiven = cashLog.amount_given || cashLog["Amount Given"] || 0;
  const dateTenantCashGiven = cashLog.date_tenant_cash_given || cashLog["Date Tenant Cash Given"];
  const dateHandedToOffice = cashLog.date_handed_to_office || cashLog["Date Handed to Office"];
  const serviceChargeMonth = cashLog.service_charge_month || cashLog["Service Charge Month"];
  const givenToPutWhere = cashLog.given_to_put_where || cashLog["Given To/Put Where"];
  const notes = cashLog.notes || cashLog.Notes;
  const loggedBy = cashLog.logged_by || cashLog["Logged By"];
  const dateLogged = cashLog.date_logged || cashLog["Date Logged"];

  return (
    <Card 
      className="hover:shadow-md transition-shadow duration-200 cursor-pointer"
      onClick={handleClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <PoundSterling className="w-5 h-5 text-green-600" />
            £{amountGiven.toFixed(2)}
          </CardTitle>
          {onEdit && (
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(cashLog);
              }}
              className="text-slate-400 hover:text-slate-600"
            >
              <Edit className="w-4 h-4" />
            </Button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <User className="w-3 h-3" />
            {getResidentName(residentId)}
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <Building className="w-3 h-3" />
            {getPropertyName(propertyId)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-slate-500">Cash Given:</span>
            <p className="font-medium">{formatDate(dateTenantCashGiven)}</p>
          </div>
          <div>
            <span className="text-slate-500">Handed to Office:</span>
            <p className="font-medium">{formatDate(dateHandedToOffice)}</p>
          </div>
        </div>

        <div className="text-sm">
          <span className="text-slate-500">Service Charge Month:</span>
          <p className="font-medium">{formatMonth(serviceChargeMonth)}</p>
        </div>

        <div className="text-sm">
          <span className="text-slate-500">Given To/Put Where:</span>
          <p className="font-medium">{givenToPutWhere || 'Not specified'}</p>
        </div>

        {notes && (
          <div className="text-sm">
            <span className="text-slate-500">Notes:</span>
            <p className="text-slate-700 mt-1">{notes}</p>
          </div>
        )}

        <div className="text-xs text-slate-500 border-t pt-2">
          Logged by {loggedBy || 'Unknown'} on {formatDateTime(dateLogged)}
        </div>
      </CardContent>
    </Card>
  );
}