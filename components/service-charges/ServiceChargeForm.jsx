"use client"

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Save, Receipt } from "lucide-react";

export default function ServiceChargeForm({ charge, residents, users, currentUser, onSubmit, onCancel }) {
  const [formData, setFormData] = useState(charge || {
    resident_id: "",
    due_date: "",
    date_paid: "",
    monthly_amount: 0,
    payment_type: "bank_transfer",
    payment_status: "due",
    status: "active",
    exempt: false,
    exempt_reason: "",
    logged_by: currentUser?.full_name || "",
    notes: ""
  });

  // Update logged_by when currentUser becomes available, only for new charges and if not already set
  useEffect(() => {
    if (!charge && currentUser?.full_name && formData.logged_by === "") {
      setFormData(prev => ({
        ...prev,
        logged_by: currentUser.full_name
      }));
    }
  }, [currentUser, charge, formData.logged_by]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    let updatedData = { ...formData };
    
    // Ensure logged_by is set before submission if it's still empty and currentUser is available
    if (!updatedData.logged_by && currentUser?.full_name) {
      updatedData.logged_by = currentUser.full_name;
    }
    
    // Auto-set payment status based on exempt, date_paid, and due_date
    if (updatedData.exempt) {
      updatedData.payment_status = 'exempt';
    } else if (updatedData.date_paid) {
      updatedData.payment_status = 'paid';
    } else if (updatedData.due_date) {
      const dueDate = new Date(updatedData.due_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      dueDate.setHours(0, 0, 0, 0);
      
      if (dueDate < today) {
        updatedData.payment_status = 'overdue';
      } else {
        updatedData.payment_status = 'due';
      }
    }
    
    // Convert to PascalCase for Supabase
    const supabaseData = {
      Resident_Id: updatedData.resident_id,
      Due_Date: updatedData.due_date,
      Date_Paid: updatedData.date_paid || null,
      Monthly_Amount: updatedData.monthly_amount,
      Payment_Type: updatedData.payment_type,
      Payment_Status: updatedData.payment_status,
      Status: updatedData.status,
      Exempt: updatedData.exempt,
      Exempt_Reason: updatedData.exempt_reason || null,
      Logged_By: updatedData.logged_by || null,
      Notes: updatedData.notes || null,
      Updated_Date: new Date().toISOString()
    };

    if (!charge) {
      supabaseData.Created_Date = new Date().toISOString();
    }
    
    onSubmit(supabaseData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      if (field === 'exempt' && !value) {
        updated.exempt_reason = '';
      }
      
      return updated;
    });
  };

  return (
    <Card className="mb-6 shadow-md">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Receipt className="w-5 h-5 text-indigo-600" />
          {charge && charge.Id ? "Edit Service Charge" : "Add Service Charge"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="resident_id">Resident *</Label>
                <Select value={formData.resident_id} onValueChange={(value) => handleChange("resident_id", value)} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a resident" />
                  </SelectTrigger>
                  <SelectContent>
                    {residents?.map((resident) => (
                      <SelectItem key={resident.Id || resident.id} value={resident.Id || resident.id}>
                        {resident.First_Name || resident.first_name} {resident.Last_Name || resident.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="monthly_amount">Amount Due (£) *</Label>
                <Input
                  id="monthly_amount"
                  type="number"
                  step="0.01"
                  value={formData.monthly_amount}
                  onChange={(e) => handleChange("monthly_amount", parseFloat(e.target.value))}
                  required
                  disabled={formData.exempt}
                />
              </div>

              <div>
                <Label htmlFor="payment_type">Payment Type *</Label>
                <Select value={formData.payment_type} onValueChange={(value) => handleChange("payment_type", value)} required>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank_transfer">Card</SelectItem>
                    <SelectItem value="cash_payment">Cash</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="due_date">Due Date * (When payment was/is due)</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => handleChange("due_date", e.target.value)}
                  required
                  disabled={formData.exempt}
                />
                <p className="text-xs text-slate-500 mt-1">
                  This determines which month the charge appears in (e.g., if due 28 Sep, it appears in September even if paid in October)
                </p>
              </div>

              <div>
                <Label htmlFor="date_paid">Date Paid (if paid)</Label>
                <Input
                  id="date_paid"
                  type="date"
                  value={formData.date_paid}
                  onChange={(e) => handleChange("date_paid", e.target.value)}
                  disabled={formData.exempt}
                />
                <p className="text-xs text-slate-500 mt-1">
                  Leave empty if not yet paid. Filling this will mark as "Paid".
                </p>
              </div>

              <div>
                <Label htmlFor="logged_by">Logged By</Label>
                <Input
                  id="logged_by"
                  value={formData.logged_by}
                  onChange={(e) => handleChange("logged_by", e.target.value)}
                  placeholder="Staff member name"
                  readOnly
                />
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center space-x-2 mb-3">
              <Checkbox
                id="exempt"
                checked={formData.exempt}
                onCheckedChange={(checked) => handleChange("exempt", checked)}
              />
              <Label htmlFor="exempt" className="text-base font-semibold cursor-pointer">
                Exempt (No payment required)
              </Label>
            </div>
            
            {formData.exempt && (
              <div className="ml-6 space-y-2">
                <Label htmlFor="exempt_reason">Reason for Exemption *</Label>
                <Textarea
                  id="exempt_reason"
                  value={formData.exempt_reason}
                  onChange={(e) => handleChange("exempt_reason", e.target.value)}
                  placeholder="Explain why this service charge is exempt..."
                  required={formData.exempt}
                  rows={3}
                  className="w-full"
                />
                <p className="text-xs text-slate-500">
                  This charge will be marked as exempt and won't count towards overdue payments.
                </p>
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
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
              <Save className="w-4 h-4" /> {charge && charge.Id ? "Update Charge" : "Add Charge"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}