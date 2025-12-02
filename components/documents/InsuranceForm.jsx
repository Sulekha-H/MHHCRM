"use client"

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Save, Shield } from "lucide-react";

export default function InsuranceForm({ insurance, properties, currentUser, onSubmit, onCancel }) {
  const [formData, setFormData] = useState(insurance ? {
    policy_name: insurance.Policy_Name || insurance.policy_name || "",
    insurance_type: insurance.Insurance_Type || insurance.insurance_type || "public_liability",
    insurance_company: insurance.Insurance_Company || insurance.insurance_company || "",
    policy_number: insurance.Policy_Number || insurance.policy_number || "",
    coverage_amount: insurance.Coverage_Amount !== null && insurance.Coverage_Amount !== undefined ? insurance.Coverage_Amount : (insurance.coverage_amount !== null && insurance.coverage_amount !== undefined ? insurance.coverage_amount : 0),
    annual_premium: insurance.Annual_Premium !== null && insurance.Annual_Premium !== undefined ? insurance.Annual_Premium : (insurance.annual_premium !== null && insurance.annual_premium !== undefined ? insurance.annual_premium : 0),
    policy_start_date: insurance.Policy_Start_Date || insurance.policy_start_date || "",
    policy_end_date: insurance.Policy_End_Date || insurance.policy_end_date || "",
    renewal_date: insurance.Renewal_Date || insurance.renewal_date || "",
    direct_debit_payment_day: insurance.Direct_Debit_Payment_Day || insurance.direct_debit_payment_day || null,
    broker_name: insurance.Broker_Name || insurance.broker_name || "",
    broker_contact: insurance.Broker_Contact || insurance.broker_contact || "",
    property_id: insurance.Property_Id || insurance.property_id || "",
    status: insurance.Status || insurance.status || "active",
    policy_document_url: insurance.Policy_Document_Url || insurance.policy_document_url || "",
    certificate_url: insurance.Certificate_Url || insurance.certificate_url || "",
    auto_renewal: insurance.Auto_Renewal !== null && insurance.Auto_Renewal !== undefined ? insurance.Auto_Renewal : (insurance.auto_renewal || false),
    renewal_reminder_date: insurance.Renewal_Reminder_Date || insurance.renewal_reminder_date || "",
    renewal_contact_person: insurance.Renewal_Contact_Person || insurance.renewal_contact_person || "",
    renewal_notes: insurance.Renewal_Notes || insurance.renewal_notes || "",
    notes: insurance.Notes || insurance.notes || "",
    logged_by: insurance.Logged_By || insurance.logged_by || currentUser?.full_name || ""
  } : {
    policy_name: "",
    insurance_type: "public_liability",
    insurance_company: "",
    policy_number: "",
    coverage_amount: 0,
    annual_premium: 0,
    policy_start_date: "",
    policy_end_date: "",
    renewal_date: "",
    direct_debit_payment_day: null,
    broker_name: "",
    broker_contact: "",
    property_id: "",
    status: "active",
    policy_document_url: "",
    certificate_url: "",
    auto_renewal: false,
    renewal_reminder_date: "",
    renewal_contact_person: "",
    renewal_notes: "",
    notes: "",
    logged_by: currentUser?.full_name || ""
  });

  // Update logged_by when currentUser becomes available, only for new insurance
  useEffect(() => {
    if (!insurance && currentUser?.full_name && formData.logged_by === "") {
      setFormData(prev => ({
        ...prev,
        logged_by: currentUser.full_name
      }));
    }
  }, [currentUser, insurance, formData.logged_by]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Ensure logged_by is set before submission
    const dataToSubmit = {
      ...formData,
      logged_by: formData.logged_by || currentUser?.full_name || ""
    };
    
    // Helper to capitalize enum values for database
    const capitalizeEnum = (value, type) => {
      if (!value) return null;
      const maps = {
        insurance_type: {
          'public_liability': 'Public Liability',
          'buildings': 'Buildings Insurance',
          'contents': 'Contents Insurance',
          'employers_liability': 'Employers Liability',
          'professional_indemnity': 'Professional Indemnity',
          'motor': 'Motor Insurance',
          'equipment': 'Equipment Insurance',
          'other': 'Other'
        },
        status: {
          'active': 'Active',
          'expired': 'Expired',
          'cancelled': 'Cancelled',
          'pending_renewal': 'Pending Renewal'
        }
      };
      return maps[type]?.[value.toLowerCase()] || value;
    };

    // Convert to Supabase format with spaces in column names
    const supabaseData = {
      "Policy Name": dataToSubmit.policy_name,
      "Insurance Type": capitalizeEnum(dataToSubmit.insurance_type, 'insurance_type'),
      "Insurance Company": dataToSubmit.insurance_company,
      "Policy Number": dataToSubmit.policy_number || null,
      "Coverage Amount": dataToSubmit.coverage_amount || null,
      "Annual Premium": dataToSubmit.annual_premium || null,
      "Policy Start Date": dataToSubmit.policy_start_date,
      "Policy End Date": dataToSubmit.policy_end_date,
      "Renewal Date": dataToSubmit.renewal_date || null,
      "Direct Debit Payment Day": dataToSubmit.direct_debit_payment_day || null,
      "Broker Name": dataToSubmit.broker_name || null,
      "Broker Contact": dataToSubmit.broker_contact || null,
      "Property ID": dataToSubmit.property_id || null,
      "Status": capitalizeEnum(dataToSubmit.status, 'status'),
      "Policy Document URL": dataToSubmit.policy_document_url || null,
      "Certificate URL": dataToSubmit.certificate_url || null,
      "Auto Renewal": dataToSubmit.auto_renewal,
      "Renewal Reminder Date": dataToSubmit.renewal_reminder_date || null,
      "Renewal Contact Person": dataToSubmit.renewal_contact_person || null,
      "Renewal Notes": dataToSubmit.renewal_notes || null,
      "Notes": dataToSubmit.notes || null,
      "Logged By": dataToSubmit.logged_by || null,
      "Updated Date": new Date().toISOString()
    };

    if (!insurance) {
      supabaseData["Created Date"] = new Date().toISOString();
      supabaseData["Created By"] = currentUser?.email || "Unknown";
      supabaseData.ID = crypto.randomUUID();
    }

    onSubmit(supabaseData);
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
          <Shield className="w-5 h-5 text-blue-600" />
          {insurance ? "Edit Insurance Policy" : "Add New Insurance Policy"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Policy Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="policy_name">Policy Name *</Label>
                <Input
                  id="policy_name"
                  value={formData.policy_name}
                  onChange={(e) => handleChange("policy_name", e.target.value)}
                  placeholder="e.g., Public Liability Insurance"
                  required
                />
              </div>
              <div>
                <Label htmlFor="insurance_type">Insurance Type *</Label>
                <Select value={formData.insurance_type} onValueChange={(value) => handleChange("insurance_type", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public_liability">Public Liability</SelectItem>
                    <SelectItem value="buildings">Buildings Insurance</SelectItem>
                    <SelectItem value="contents">Contents Insurance</SelectItem>
                    <SelectItem value="employers_liability">Employers Liability</SelectItem>
                    <SelectItem value="professional_indemnity">Professional Indemnity</SelectItem>
                    <SelectItem value="motor">Motor Insurance</SelectItem>
                    <SelectItem value="equipment">Equipment Insurance</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="insurance_company">Insurance Company *</Label>
                <Input
                  id="insurance_company"
                  value={formData.insurance_company}
                  onChange={(e) => handleChange("insurance_company", e.target.value)}
                  placeholder="Name of insurance provider"
                  required
                />
              </div>
              <div>
                <Label htmlFor="policy_number">Policy Number</Label>
                <Input
                  id="policy_number"
                  value={formData.policy_number}
                  onChange={(e) => handleChange("policy_number", e.target.value)}
                  placeholder="Policy reference number"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Coverage & Financial Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="coverage_amount">Coverage Amount (£)</Label>
                <Input
                  id="coverage_amount"
                  type="text"
                  value={formData.coverage_amount}
                  onChange={(e) => handleChange("coverage_amount", e.target.value)}
                  placeholder="e.g., 5000000"
                />
              </div>
              <div>
                <Label htmlFor="annual_premium">Annual Premium (£)</Label>
                <Input
                  id="annual_premium"
                  type="text"
                  value={formData.annual_premium}
                  onChange={(e) => handleChange("annual_premium", e.target.value)}
                  placeholder="e.g., 1250.00"
                />
              </div>
              <div>
                <Label htmlFor="direct_debit_payment_day">Direct Debit Payment Day</Label>
                <Input
                  id="direct_debit_payment_day"
                  type="number"
                  min="1"
                  max="31"
                  value={formData.direct_debit_payment_day || ""}
                  onChange={(e) => handleChange("direct_debit_payment_day", e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="e.g., 1, 15, 28"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Day of the month for recurring direct debit payment (1-31)
                </p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Policy Dates</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="policy_start_date">Policy Start Date *</Label>
                <Input
                  id="policy_start_date"
                  type="date"
                  value={formData.policy_start_date}
                  onChange={(e) => handleChange("policy_start_date", e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="policy_end_date">Policy End Date *</Label>
                <Input
                  id="policy_end_date"
                  type="date"
                  value={formData.policy_end_date}
                  onChange={(e) => handleChange("policy_end_date", e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="renewal_date">Renewal Date</Label>
                <Input
                  id="renewal_date"
                  type="date"
                  value={formData.renewal_date}
                  onChange={(e) => handleChange("renewal_date", e.target.value)}
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Additional Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="broker_name">Broker Name</Label>
                <Input
                  id="broker_name"
                  value={formData.broker_name}
                  onChange={(e) => handleChange("broker_name", e.target.value)}
                  placeholder="Insurance broker (if applicable)"
                />
              </div>
              <div>
                <Label htmlFor="broker_contact">Broker Contact</Label>
                <Input
                  id="broker_contact"
                  value={formData.broker_contact}
                  onChange={(e) => handleChange("broker_contact", e.target.value)}
                  placeholder="Broker phone/email"
                />
              </div>
              <div>
                <Label htmlFor="property_id">Related Property (Optional)</Label>
                <Select
                  value={formData.property_id || "none"}
                  onValueChange={(value) => handleChange("property_id", value === "none" ? "" : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select property (if property-specific)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">General business insurance</SelectItem>
                    {properties?.map((property) => (
                      <SelectItem key={property.Id || property.id} value={property.Id || property.id}>
                        {property.Name || property.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleChange("status", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="pending_renewal">Pending Renewal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Renewal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="auto_renewal" className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    id="auto_renewal"
                    checked={formData.auto_renewal}
                    onChange={(e) => handleChange("auto_renewal", e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  Auto-Renewal Enabled
                </Label>
              </div>
              <div>
                <Label htmlFor="renewal_reminder_date">Renewal Reminder Date</Label>
                <Input
                  id="renewal_reminder_date"
                  type="date"
                  value={formData.renewal_reminder_date}
                  onChange={(e) => handleChange("renewal_reminder_date", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="renewal_contact_person">Renewal Contact Person/Company</Label>
                <Input
                  id="renewal_contact_person"
                  value={formData.renewal_contact_person}
                  onChange={(e) => handleChange("renewal_contact_person", e.target.value)}
                  placeholder="Who to contact for renewal"
                />
              </div>
            </div>
            <div className="mt-4">
              <Label htmlFor="renewal_notes">Renewal Notes</Label>
              <Textarea
                id="renewal_notes"
                value={formData.renewal_notes}
                onChange={(e) => handleChange("renewal_notes", e.target.value)}
                placeholder="Notes about the renewal process..."
                rows={2}
              />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Documents</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="policy_document_url">Policy Document URL</Label>
                <Input
                  id="policy_document_url"
                  type="url"
                  value={formData.policy_document_url}
                  onChange={(e) => handleChange("policy_document_url", e.target.value)}
                  placeholder="https://gdrive.com/policy.pdf"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Please enter a valid URL (must start with http:// or https://)
                </p>
              </div>
              <div>
                <Label htmlFor="certificate_url">Insurance Certificate URL</Label>
                <Input
                  id="certificate_url"
                  type="url"
                  value={formData.certificate_url}
                  onChange={(e) => handleChange("certificate_url", e.target.value)}
                  placeholder="https://gdrive.com/certificate.pdf"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Please enter a valid URL (must start with http:// or https://)
                </p>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder="Any additional notes about the policy..."
              rows={3}
            />
          </div>

          {/* New field for logged_by */}
          <div>
            <Label htmlFor="logged_by">Logged By</Label>
            <Input
              id="logged_by"
              value={formData.logged_by}
              onChange={(e) => handleChange("logged_by", e.target.value)}
              placeholder="Staff member who logged this policy"
              readOnly={!!insurance} // Make read-only if editing existing insurance
            />
             {insurance && (
              <p className="text-xs text-slate-500 mt-1">
                This field is read-only for existing policies.
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {insurance ? "Update Policy" : "Add Policy"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}