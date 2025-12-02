import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { X, Save, Receipt } from "lucide-react";

export default function ServiceChargeLogForm({ charge, residents, users, currentUser, onSubmit, onCancel, accommodations, properties }) {
  const [formData, setFormData] = useState(() => {
    if (charge) {
      return {
        resident_id: charge.resident_id || "",
        due_date: charge.due_date || "",
        date_paid: charge.date_paid || "",
        monthly_amount: charge.monthly_amount || 0,
        payment_type: charge.payment_type === 'Card' ? 'bank_transfer' : charge.payment_type === 'bank_transfer' ? 'bank_transfer' : 'cash_payment',
        payment_status: charge.payment_status || "due",
        status: charge.status?.toLowerCase() || "active",
        logged_by: charge.logged_by || currentUser?.full_name || "",
        notes: charge.notes || "",
        exempt: charge.exempt || false,
        exempt_reason: charge.exempt_reason || ""
      };
    }
    return {
      resident_id: "",
      due_date: "",
      date_paid: "",
      monthly_amount: 0,
      payment_type: "bank_transfer",
      payment_status: "due",
      status: "active",
      logged_by: currentUser?.full_name || "",
      notes: "",
      exempt: false,
      exempt_reason: ""
    };
  });

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

  // Get property and accommodation info for a resident
  const getResidentPropertyInfo = (residentId) => {
    const resident = residents.find(r => getResidentId(r) === residentId);
    if (!resident) return { propertyName: '', unitNumber: '' };

    const accommodationId = resident["Accommodation ID"] || resident.accommodation_id;
    const accommodation = accommodations?.find(a => (a.ID || a.id) === accommodationId);
    
    let propertyName = '';
    let unitNumber = '';

    if (accommodation) {
      const propertyId = accommodation["Property ID"] || accommodation.property_id;
      const property = properties?.find(p => (p.ID || p.id) === propertyId);
      propertyName = property ? (property.Name || property.name) : '';
      unitNumber = accommodation["Unit/Room Number"] || accommodation.room_number || '';
    }

    return { propertyName, unitNumber };
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Get resident info to populate denormalized fields
    const resident = residents.find(r => getResidentId(r) === formData.resident_id);
    const residentName = resident ? getResidentName(resident) : '';
    const { propertyName, unitNumber } = getResidentPropertyInfo(formData.resident_id);
    
    // Map payment status and status to Supabase format (title case)
    const statusMap = {
      'active': 'Active',
      'inactive': 'Inactive',
      'suspended': 'Suspended'
    };

    const paymentStatusMap = {
      'paid': 'Paid',
      'due': 'Due',
      'overdue': 'Overdue',
      'exempt': 'Exempt'
    };

    // Prepare the data with all fields (including denormalized ones)
    const submissionData = {
      "Resident ID": formData.resident_id,
      "Resident Name": residentName,
      "Property Name": propertyName,
      "Unit/Room Number": unitNumber,
      "Due Date": formData.due_date,
      "Date Paid": formData.date_paid || null,
      "Monthly Amount": parseFloat(formData.monthly_amount),
      "Payment Type": formData.payment_type === 'bank_transfer' ? 'Card' : 'Cash',
      "Payment Status": paymentStatusMap[formData.payment_status] || 'Due',
      "Status": statusMap[formData.status] || 'Active',
      "Exempt": formData.exempt || false,
      "Exempt Reason": formData.exempt ? formData.exempt_reason : null,
      "Notes": formData.notes || null,
      "Logged By": formData.logged_by || currentUser?.full_name || '',
      "Updated Date": new Date().toISOString()
    };

    if (!charge || !charge.id) {
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

  return (
    <Card className="mb-6 shadow-md">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Receipt className="w-5 h-5 text-indigo-600" />
          {charge && (charge.id || charge.ID) ? "Edit Service Charge" : "Add Service Charge"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="resident_id" className="mb-2 block">Resident *</Label>
                <Select value={formData.resident_id} onValueChange={(value) => handleChange("resident_id", value)} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a resident" />
                  </SelectTrigger>
                  <SelectContent>
                    {residents.map((resident) => (
                      <SelectItem key={getResidentId(resident)} value={getResidentId(resident)}>
                        {getResidentName(resident)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="monthly_amount" className="mb-2 block">Amount Due (£) *</Label>
                <Input
                  id="monthly_amount"
                  type="number"
                  step="0.01"
                  value={formData.monthly_amount}
                  onChange={(e) => handleChange("monthly_amount", parseFloat(e.target.value))}
                  className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  required
                />
              </div>

              <div>
                <Label htmlFor="payment_type" className="mb-2 block">Payment Type *</Label>
                <Select value={formData.payment_type} onValueChange={(value) => handleChange("payment_type", value)} required>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank_transfer">Card</SelectItem>
                    <SelectItem value="cash_payment">Cash</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="status" className="mb-2 block">Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleChange("status", value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="due_date" className="mb-2 block">Due Date *</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => handleChange("due_date", e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="date_paid" className="mb-2 block">Date Paid (if paid)</Label>
                <Input
                  id="date_paid"
                  type="date"
                  value={formData.date_paid}
                  onChange={(e) => handleChange("date_paid", e.target.value)}
                />
                <p className="text-xs text-slate-500 mt-1">
                  Leave empty if not yet paid. Filling this will mark as "Paid".
                </p>
              </div>

              <div>
                <Label className="mb-2 block flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.exempt || false}
                    onChange={(e) => handleChange("exempt", e.target.checked)}
                    className="w-4 h-4"
                  />
                  Mark as Exempt
                </Label>
              </div>

              {formData.exempt && (
                <div>
                  <Label htmlFor="exempt_reason" className="mb-2 block">Exempt Reason *</Label>
                  <Textarea
                    id="exempt_reason"
                    value={formData.exempt_reason}
                    onChange={(e) => handleChange("exempt_reason", e.target.value)}
                    placeholder="Please provide reason for exemption"
                    rows={3}
                    required={formData.exempt}
                  />
                </div>
              )}

              <div>
                <Label htmlFor="logged_by" className="mb-2 block">Logged By</Label>
                <Input
                  id="logged_by"
                  value={formData.logged_by}
                  onChange={(e) => handleChange("logged_by", e.target.value)}
                  readOnly
                  className="bg-slate-50"
                />
                <p className="text-xs text-slate-500 mt-1">
                  This is automatically set to the current user
                </p>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="notes" className="mb-2 block">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              rows={3}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder="Any additional notes about this service charge"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onCancel} className="flex items-center gap-2">
              <X className="w-4 h-4" /> Cancel
            </Button>
            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2">
              <Save className="w-4 h-4" /> {charge && (charge.id || charge.ID) ? "Update Charge" : "Add Charge"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}