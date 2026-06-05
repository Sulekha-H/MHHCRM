import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { X, Save, Receipt } from "lucide-react";

import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function ServiceChargeLogForm({ charge, residents, users, currentUser, onSubmit, onCancel, accommodations, properties, allCharges = [] }) {
  const [formData, setFormData] = useState(() => {
    if (charge) {
      return {
        resident_id: charge.resident_id || "",
        due_date: charge.due_date || "",
        date_paid: charge.date_paid || "",
        monthly_amount: charge.monthly_amount?.toString() || "0",
        amount_paid: charge.amount_paid?.toString() || "0",
        balance_owed: charge.balance_owed?.toString() || "0",
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
      monthly_amount: "0",
      amount_paid: "0",
      balance_owed: "0",
      payment_type: "bank_transfer",
      payment_status: "due",
      status: "active",
      logged_by: currentUser?.full_name || "",
      notes: "",
      exempt: false,
      exempt_reason: ""
    };
  });

  const [residentBalance, setResidentBalance] = useState(0);

  useEffect(() => {
    if (formData.resident_id && allCharges.length > 0) {
      const balance = allCharges
        .filter(c => (c.resident_id || c["Resident ID"]) === formData.resident_id)
        .reduce((sum, c) => {
          let chargeBalance = 0;
          if (c.payment_status === 'partially_paid' || c["Payment Status"] === 'Partially Paid') {
            chargeBalance = parseFloat(c.balance_owed || 0);
          } else if (c.payment_status === 'overdue' || c.payment_status === 'due') {
            chargeBalance = parseFloat(c.monthly_amount || c["Monthly Amount"] || 0);
          }
          return sum + chargeBalance;
        }, 0);
      setResidentBalance(balance);
    } else {
      setResidentBalance(0);
    }
  }, [formData.resident_id, allCharges]);

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

    // Prevent saving 0 amount as Overdue or Due (should be Exempt or Paid if 0)
    const amount = parseFloat(formData.monthly_amount) || 0;
    if (amount === 0 && (formData.payment_status === 'overdue' || formData.payment_status === 'due')) {
      alert("A service charge with £0.00 amount cannot be marked as 'Due' or 'Overdue'. Please mark it as 'Exempt' or 'Paid', or provide a valid amount.");
      return;
    }
    
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
      'exempt': 'Exempt',
      'partially_paid': 'Partially Paid'
    };

    let finalNotes = formData.notes || "";

    // First, remove any existing partial payment tags to avoid duplication
    finalNotes = finalNotes.replace(/\[PARTIAL_PAYMENT: amount_paid=[\d.]+, balance_owed=[\d.]+\]\s*/g, "").trim();

    if (formData.payment_status === 'partially_paid') {
      const amountPaid = parseFloat(formData.amount_paid) || 0;
      const balanceOwed = parseFloat(formData.balance_owed) || 0;
      const partialInfo = `[PARTIAL_PAYMENT: amount_paid=${amountPaid}, balance_owed=${balanceOwed}]`;
      finalNotes = `${partialInfo} ${finalNotes}`.trim();
    }

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
      "Notes": finalNotes || null,
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
    <div className="space-y-6">
      <div className="pb-4 border-b">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Receipt className="w-5 h-5 text-indigo-600" />
          {charge && (charge.id || charge.ID) ? "Edit Service Charge" : "Add Service Charge"}
        </h2>
      </div>
      <div>
        <form onSubmit={handleSubmit} className="space-y-6">
          {residentBalance > 0 && (
            <Alert className="mb-6 bg-amber-50 border-amber-200">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertTitle className="text-amber-800">Outstanding Balance Detected</AlertTitle>
              <AlertDescription className="text-amber-700">
                This resident currently owes a total of <span className="font-bold">£{residentBalance.toFixed(2)}</span> from previous service charges.
              </AlertDescription>
            </Alert>
          )}

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
                <Label htmlFor="monthly_amount" className="mb-2 block">Amount Owed (£) *</Label>
                <Input
                  id="monthly_amount"
                  type="number"
                  step="0.01"
                  value={formData.monthly_amount}
                  onChange={(e) => {
                    const valStr = e.target.value;
                    const val = parseFloat(valStr) || 0;
                    setFormData(prev => {
                      const newState = { ...prev, monthly_amount: valStr };
                      if (prev.payment_status === 'partially_paid') {
                        const amountPaid = parseFloat(prev.amount_paid) || 0;
                        newState.balance_owed = (val - amountPaid).toString();
                      } else if (prev.payment_status === 'paid') {
                        newState.amount_paid = valStr;
                        newState.balance_owed = "0";
                      } else {
                        newState.balance_owed = valStr;
                        newState.amount_paid = "0";
                      }
                      return newState;
                    });
                  }}
                  className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  required
                />
              </div>

              <div>
                <Label htmlFor="payment_status" className="mb-2 block">Payment Status *</Label>
                <Select
                  value={formData.payment_status}
                  onValueChange={(value) => {
                    setFormData(prev => {
                      const newState = { ...prev, payment_status: value };
                      const monthly = parseFloat(prev.monthly_amount) || 0;

                      if (value === 'paid') {
                        if (!prev.date_paid) {
                          newState.date_paid = new Date().toISOString().split('T')[0];
                        }
                        newState.amount_paid = monthly.toString();
                        newState.balance_owed = "0";
                      } else if (value === 'partially_paid') {
                        const paid = parseFloat(prev.amount_paid) || 0;
                        if (paid === 0) {
                          newState.balance_owed = monthly.toString();
                        } else {
                          newState.balance_owed = Math.max(0, monthly - paid).toString();
                        }
                      } else {
                        newState.amount_paid = "0";
                        newState.balance_owed = monthly.toString();
                      }
                      return newState;
                    });
                  }}
                  required
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="due">Due</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="partially_paid">Partially Paid</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="exempt">Exempt</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.payment_status === 'partially_paid' && (
                <div className="bg-amber-50 p-4 rounded-lg border border-amber-100 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="amount_paid" className="mb-2 block text-amber-900 font-medium text-sm">Amount Paid (£) *</Label>
                      <Input
                        id="amount_paid"
                        type="number"
                        step="0.01"
                        value={formData.amount_paid}
                        onChange={(e) => {
                          const valStr = e.target.value;
                          const val = parseFloat(valStr) || 0;
                          setFormData(prev => {
                            const monthlyAmount = parseFloat(prev.monthly_amount) || 0;
                            const newState = { ...prev, amount_paid: valStr };
                            if (monthlyAmount > 0) {
                              newState.balance_owed = (monthlyAmount - val).toString();
                            }
                            return newState;
                          });
                        }}
                        className="border-amber-200 focus-visible:ring-amber-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="balance_owed" className="mb-2 block text-amber-900 font-medium text-sm">Balance Remaining (£) *</Label>
                      <Input
                        id="balance_owed"
                        type="number"
                        step="0.01"
                        value={formData.balance_owed}
                        onChange={(e) => {
                          const valStr = e.target.value;
                          const val = parseFloat(valStr) || 0;
                          setFormData(prev => {
                            const monthlyAmount = parseFloat(prev.monthly_amount) || 0;
                            const newState = { ...prev, balance_owed: valStr };
                            if (monthlyAmount > 0) {
                              newState.amount_paid = (monthlyAmount - val).toString();
                            }
                            return newState;
                          });
                        }}
                        className="border-amber-200 focus-visible:ring-amber-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        required
                      />
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-xs pt-2 border-t border-amber-200">
                    <span className="text-amber-700 italic">Confirmed Total:</span>
                    <span className="font-semibold text-amber-900">
                      £{parseFloat(formData.monthly_amount || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="text-[10px] text-amber-600 italic mt-1">
                    Formula: Remaining Balance = Amount Owed - Amount Paid
                  </div>
                </div>
              )}

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
      </div>
    </div>
  );
}