import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { X, Save, PoundSterling, Trash2 } from "lucide-react";
import { format } from "date-fns";

export default function CashLogFormSupabase({ cashLog, residents, properties, currentUser, onSubmit, onCancel, onDelete }) {
  const [formData, setFormData] = useState(() => {
    if (cashLog && cashLog.id) {
      // Extract YYYY-MM from Service Charge Month date
      const serviceChargeMonth = cashLog.service_charge_month || cashLog["Service Charge Month"];
      const monthValue = serviceChargeMonth ? serviceChargeMonth.substring(0, 7) : "";
      
      return {
        date_logged: cashLog.date_logged || cashLog["Date Logged"] || new Date().toISOString(),
        date_tenant_cash_given: cashLog.date_tenant_cash_given || cashLog["Date Tenant Cash Given"] || "",
        resident_id: cashLog.resident_id || cashLog["Resident ID"] || "",
        property_id: cashLog.property_id || cashLog["Property ID"] || "",
        amount_given: cashLog.amount_given || cashLog["Amount Given"] || 0,
        service_charge_month: monthValue,
        date_handed_to_office: cashLog.date_handed_to_office || cashLog["Date Handed to Office"] || "",
        given_to_put_where: cashLog.given_to_put_where || cashLog["Given To/Put Where"] || "",
        logged_by: cashLog.logged_by || cashLog["Logged By"] || currentUser?.full_name || "",
        notes: cashLog.notes || cashLog.Notes || ""
      };
    }
    return {
      date_logged: new Date().toISOString(),
      date_tenant_cash_given: "",
      resident_id: "",
      property_id: "",
      amount_given: 0,
      service_charge_month: "",
      date_handed_to_office: "",
      given_to_put_where: "",
      logged_by: currentUser?.full_name || "",
      notes: ""
    };
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const selectedResident = residents.find(r => (r.ID || r.id) === formData.resident_id);
    const resPropertyId = selectedResident ? (selectedResident["Property ID"] || selectedResident.property_id) : null;
    const residentName = selectedResident ? getResidentName(selectedResident) : '';
    const propertyName = getPropertyName(resPropertyId);
    
    // Get property address
    const property = properties.find(p => (p.ID || p.id) === resPropertyId);
    const propertyAddress = property ? (property.Address || property.address) : '';

    // Convert service_charge_month (YYYY-MM) to a date (first day of month)
    const serviceChargeMonthDate = formData.service_charge_month ? 
    `${formData.service_charge_month}-01` : null;

    // Convert to Supabase column names (with spaces)
    const submissionData = {
    "Date Logged": formData.date_logged,
    "Date Tenant Cash Given": formData.date_tenant_cash_given,
    "Resident ID": formData.resident_id,
    "Resident Name": residentName,
    "Property ID": resPropertyId || null,
    "Property Name": propertyName,
    "Property Address": propertyAddress,
    "Amount Given": parseFloat(formData.amount_given),
    "Service Charge Month": serviceChargeMonthDate,
    "Date Handed to Office": formData.date_handed_to_office,
    "Given To/Put Where": formData.given_to_put_where,
    "Logged By": formData.logged_by || currentUser?.full_name || '',
    "Notes": formData.notes || null,
    "Updated Date": new Date().toISOString()
    };

    if (!cashLog || !cashLog.id) {
    submissionData["ID"] = crypto.randomUUID();
    submissionData["Created Date"] = new Date().toISOString();
    submissionData["Created By"] = currentUser?.email || "Unknown";
    submissionData["Deleted"] = false;
    }
    
    onSubmit(submissionData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getPropertyName = (propertyId) => {
    const property = properties.find(p => (p.ID || p.id) === propertyId);
    return property ? (property.Name || property.name || "Unknown Property") : "Unknown Property";
  };

  // Helper function to get resident name - handles multiple field name formats
  const getResidentName = (resident) => {
    const firstName = resident["First Name"] || resident.first_name || resident.firstName || '';
    const lastName = resident["Last Name"] || resident.last_name || resident.lastName || '';
    return `${firstName} ${lastName}`.trim() || 'Unknown Resident';
  };

  // Helper to get resident ID
  const getResidentId = (resident) => {
    return resident.ID || resident.id;
  };

  const generateMonthOptions = () => {
    const months = [];
    const currentYear = new Date().getFullYear();
    const years = [currentYear - 1, currentYear, currentYear + 1];
    
    years.forEach(year => {
      for (let month = 0; month < 12; month++) {
        const date = new Date(year, month, 1);
        const value = format(date, 'yyyy-MM');
        const label = format(date, 'MMMM yyyy');
        months.push({ value, label });
      }
    });
    
    return months;
  };

  const monthOptions = generateMonthOptions();

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <PoundSterling className="w-5 h-5 text-green-600" />
          {cashLog && (cashLog.id || cashLog.ID) ? "Edit Cash Log Entry" : "Add Cash Log Entry"}
        </h2>
      </div>
      <div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="date_tenant_cash_given" className="mb-2 block">Date Tenant Gave Cash *</Label>
                <Input
                  id="date_tenant_cash_given"
                  type="date"
                  value={formData.date_tenant_cash_given}
                  onChange={(e) => handleChange("date_tenant_cash_given", e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="resident_id" className="mb-2 block">Tenant Name *</Label>
                <Select 
                  value={formData.resident_id} 
                  onValueChange={(value) => handleChange("resident_id", value)} 
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select tenant" />
                  </SelectTrigger>
                  <SelectContent>
                    {residents
                      .filter(r => {
                        const status = r.Status || r.status;
                        return status === 'active' || status === 'Active';
                      })
                      .map((resident) => {
                        const residentId = getResidentId(resident);
                        const residentPropertyId = resident["Property ID"] || resident.property_id;
                        return (
                          <SelectItem key={residentId} value={residentId}>
                            {getResidentName(resident)} - {getPropertyName(residentPropertyId)}
                          </SelectItem>
                        );
                      })}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="amount_given" className="mb-2 block">Amount Given (£) *</Label>
                <Input
                  id="amount_given"
                  type="number"
                  step="0.01"
                  value={formData.amount_given}
                  onChange={(e) => handleChange("amount_given", parseFloat(e.target.value))}
                  className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  required
                />
              </div>

              <div>
                <Label htmlFor="service_charge_month" className="mb-2 block">Service Charge Month Due *</Label>
                <Select
                  value={formData.service_charge_month}
                  onValueChange={(value) => handleChange("service_charge_month", value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select month" />
                  </SelectTrigger>
                  <SelectContent>
                    {monthOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500 mt-1">
                  Select the month this payment is for
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="date_handed_to_office" className="mb-2 block">Date Handed to Office *</Label>
                <Input
                  id="date_handed_to_office"
                  type="date"
                  value={formData.date_handed_to_office}
                  onChange={(e) => handleChange("date_handed_to_office", e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="given_to_put_where" className="mb-2 block">Given To/Put Where *</Label>
                <Input
                  id="given_to_put_where"
                  value={formData.given_to_put_where}
                  onChange={(e) => handleChange("given_to_put_where", e.target.value)}
                  placeholder="e.g., Given to Manager, Put in safe, etc."
                  required
                />
              </div>

              <div>
                <Label htmlFor="logged_by" className="mb-2 block">Logged By</Label>
                <Input
                  id="logged_by"
                  value={formData.logged_by}
                  onChange={(e) => handleChange("logged_by", e.target.value)}
                  readOnly
                  className="bg-slate-50"
                />
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="notes" className="mb-2 block">Additional Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              rows={3}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder="Any additional notes about this cash transaction"
            />
          </div>

          <div className="flex justify-between pt-4 border-t">
            <div>
              {cashLog && (cashLog.id || cashLog.ID) && onDelete && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onDelete(cashLog)}
                  className="text-red-600 border-red-200 hover:border-red-300 hover:text-red-700 hover:bg-red-50 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </Button>
              )}
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={onCancel} className="flex items-center gap-2">
                <X className="w-4 h-4" /> Cancel
              </Button>
              <Button type="submit" className="bg-green-600 hover:bg-green-700 flex items-center gap-2">
                <Save className="w-4 h-4" /> {cashLog && (cashLog.id || cashLog.ID) ? "Update Entry" : "Add Entry"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}