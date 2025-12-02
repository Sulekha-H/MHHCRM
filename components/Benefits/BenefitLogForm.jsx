"use client"

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Save, HandCoins } from "lucide-react";

export default function BenefitLogForm({ log, residents, currentUser, activeBenefitType, onSubmit, onCancel }) {
  const getInitialDateTime = () => {
    if (log?.["Log Date"] || log?.log_date) {
      const date = log["Log Date"] || log.log_date;
      return date.slice(0, 16);
    }
    const now = new Date();
    return now.toISOString().slice(0, 16);
  };

  const [formData, setFormData] = useState(log ? {
    id: log.ID || log.id || "",
    resident_id: log["Resident ID"] || log.resident_id || "",
    benefit_type: log["Benefit Type"] || log.benefit_type || activeBenefitType || "housing_benefit",
    log_type: log["Log Type"] || log.log_type || "application_log",
    title: log.Title || log.title || "",
    description: log.Description || log.description || "",
    log_date: getInitialDateTime(),
    status: log.Status || log.status || "pending",
    logged_by: log["Logged By"] || log.logged_by || currentUser?.["Full Name"] || currentUser?.full_name || "",
    notes: log.Notes || log.notes || "",
    date_application_started: log["Date Application Started"] || log.date_application_started || "",
    application_saved_date: log["Application Saved Date"] || log.application_saved_date || "",
    completed_application_submitted_date: log["Completed Application Submitted Date"] || log.completed_application_submitted_date || "",
    claim_submission_reference: log["Claim Submission Reference"] || log.claim_submission_reference || "",
    licence_agreement_uploaded: log["Licence Agreement Uploaded"] !== null && log["Licence Agreement Uploaded"] !== undefined ? log["Licence Agreement Uploaded"] : (log.licence_agreement_uploaded || false),
    authorisation_form_uploaded: log["Authorisation Form Uploaded"] !== null && log["Authorisation Form Uploaded"] !== undefined ? log["Authorisation Form Uploaded"] : (log.authorisation_form_uploaded || false),
    proof_of_income_uploaded: log["Proof of Income Uploaded"] !== null && log["Proof of Income Uploaded"] !== undefined ? log["Proof of Income Uploaded"] : (log.proof_of_income_uploaded || false),
    date_uploaded: log["Date Uploaded"] || log.date_uploaded || "",
    action_to_follow: log["Action to Follow"] || log.action_to_follow || "",
    action_to_follow_completed: log["Action to Follow Completed"] !== null && log["Action to Follow Completed"] !== undefined ? log["Action to Follow Completed"] : (log.action_to_follow_completed || false),
  } : {
    id: "",
    resident_id: "",
    benefit_type: activeBenefitType || "housing_benefit",
    log_type: activeBenefitType === "universal_credit" ? "application_log" : (activeBenefitType === "landlord_portal" ? "portal_check" : "application_log"),
    title: "",
    description: "",
    log_date: getInitialDateTime(),
    status: activeBenefitType === "landlord_portal" ? "No Updates Found" : "pending",
    logged_by: currentUser?.["Full Name"] || currentUser?.full_name || "",
    notes: "",
    date_application_started: "",
    application_saved_date: "",
    completed_application_submitted_date: "",
    claim_submission_reference: "",
    licence_agreement_uploaded: false,
    authorisation_form_uploaded: false,
    proof_of_income_uploaded: false,
    date_uploaded: "",
    action_to_follow: "",
    action_to_follow_completed: false,
  });

  // Update logged_by when currentUser becomes available
  useEffect(() => {
    if (!log && currentUser && formData.logged_by === "") {
      const userName = currentUser["Full Name"] || currentUser.full_name || "";
      setFormData(prev => ({
        ...prev,
        logged_by: userName
      }));
    }
  }, [currentUser, log, formData.logged_by]);

  // Update benefit_type when activeBenefitType changes
  useEffect(() => {
    if (activeBenefitType && !log) {
      setFormData(prev => ({
        ...prev,
        benefit_type: activeBenefitType,
        log_type: activeBenefitType === "universal_credit" ? "application_log" : (activeBenefitType === "landlord_portal" ? "portal_check" : "application_log")
      }));
    }
  }, [activeBenefitType, log]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    console.log("🔍 Form submitting with ID:", formData.id);
    console.log("🔍 Full form data:", formData);
    
    // Convert to PascalCase with spaces for Supabase - ONLY columns that exist in housing_benefit_logs table
    // Map benefit_type to database format
    const benefitTypeMap = {
      'housing_benefit': 'Housing Benefit',
      'universal_credit': 'Universal Credit',
      'landlord_portal': 'Landlord Portal'
    };
    
    // Map log_type to database format
    const logTypeMap = {
      'application_log': 'Application Log',
      'requested_support_notes': 'Requested Support Notes',
      'requested_documents': 'Requested Documents',
      'suspended_claims': 'Suspended Claims',
      'awaiting_activation': 'Awaiting Activation',
      'missing_payments': 'Missing Payments',
      'change_of_addresses': 'Change of Addresses',
      'room_transfers': 'Room Transfers',
      'hb_calls': 'HB Calls',
      'hb_leavers': 'HB Leavers',
      'portal_check': 'Portal Check'
    };
    
    // Map status to database format
    const statusMap = {
      'pending': 'Pending',
      'in_progress': 'In Progress',
      'completed': 'Completed',
      'issue_raised': 'Issue Raised',
      'closed': 'Closed',
      'application_to_be_completed': 'Application To Be Completed',
      'application_saved_not_submitted': 'Application Saved Not Submitted',
      'completed_application_submitted': 'Completed Application Submitted',
      'requested': 'Requested',
      'awaiting_activation': 'Awaiting Activation',
      'activated': 'Activated',
      'payment_missing': 'Payment Missing',
      'payment_in_processing': 'Payment In Processing',
      'payment_received': 'Payment Received',
      'to_complete': 'To Complete',
      'outstanding': 'Outstanding',
      'to_do': 'To Do',
      'query': 'Query',
      'resolved': 'Resolved',
      'No Updates Found': 'No Updates Found',
      'Updates Found - Action Required': 'Updates Found - Action Required',
      'Updates Found - In Progress': 'Updates Found - In Progress',
      'Issue Found': 'Issue Found'
    };
    
    // Build common fields
    const supabaseData = {
      "Resident ID": formData.resident_id || null,
      "Benefit Type": benefitTypeMap[formData.benefit_type] || formData.benefit_type,
      "Log Type": logTypeMap[formData.log_type] || formData.log_type,
      Title: formData.title,
      Description: formData.description || null,
      "Log Date": formData.log_date,
      Status: statusMap[formData.status] || formData.status,
      "Logged By": formData.logged_by || null,
      Notes: formData.notes || null,
      "Updated Date": new Date().toISOString()
    };
    
    // Add fields specific to Universal Credit
    if (formData.benefit_type === 'universal_credit') {
      supabaseData["Follow Up Action"] = formData.action_to_follow || null;
      supabaseData["Follow Up Completed"] = formData.action_to_follow_completed;
    }
    
    // Add fields specific to Housing Benefit
    if (formData.benefit_type === 'housing_benefit') {
      supabaseData["Date Application Started"] = formData.date_application_started || null;
      supabaseData["Application Saved Date"] = formData.application_saved_date || null;
      supabaseData["Completed Application Submitted Date"] = formData.completed_application_submitted_date || null;
      supabaseData["Claim Submission Reference"] = formData.claim_submission_reference || null;
      supabaseData["Licence Agreement Uploaded"] = formData.licence_agreement_uploaded;
      supabaseData["Authorisation Form Uploaded"] = formData.authorisation_form_uploaded;
      supabaseData["Proof of Income Uploaded"] = formData.proof_of_income_uploaded;
      supabaseData["Date Uploaded"] = formData.date_uploaded || null;
      supabaseData["Action to Follow"] = formData.action_to_follow || null;
      supabaseData["Action to Follow Completed"] = formData.action_to_follow_completed;
    }

    // Add fields specific to Landlord Portal
    if (formData.benefit_type === 'landlord_portal') {
      supabaseData["Follow Up Action"] = formData.action_to_follow || null;
      supabaseData["Follow Up Completed"] = formData.action_to_follow_completed;
    }

    // Include ID if exists
    if (formData.id) {
      supabaseData.ID = formData.id;
    }
    
    console.log("📤 Submitting to Supabase:", supabaseData);
    onSubmit(supabaseData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getLogTypeOptions = () => {
    if (formData.benefit_type === "housing_benefit") {
      return [
        { value: "application_log", label: "Application Log" },
        { value: "requested_support_notes", label: "Requested Support Notes" },
        { value: "requested_documents", label: "Requested Documents" },
        { value: "suspended_claims", label: "Suspended Claims" },
        { value: "awaiting_activation", label: "Awaiting Activation" },
        { value: "missing_payments", label: "Missing Payments" },
        { value: "change_of_addresses", label: "Change of Addresses" },
        { value: "room_transfers", label: "Room Transfers" },
        { value: "hb_calls", label: "HB Calls" },
        { value: "hb_leavers", label: "HB Leavers" }
      ];
    } else if (formData.benefit_type === "universal_credit") {
      return [
        { value: "application_log", label: "Application Log" },
        { value: "payment_update", label: "Payment Update" },
        { value: "claim_issue", label: "Claim Issue" },
        { value: "change_of_circumstances", label: "Change of Circumstances" },
        { value: "appeal", label: "Appeal" },
        { value: "general_update", label: "General Update" }
      ];
    } else if (formData.benefit_type === "landlord_portal") {
      return [
        { value: "portal_check", label: "Portal Check" }
      ];
    }
    return [];
  };

  const getStatusOptions = () => {
    if (formData.benefit_type === "housing_benefit") {
      if (formData.log_type === "application_log") {
        return [
          { value: "application_to_be_completed", label: "Application To Be Completed" },
          { value: "application_saved_not_submitted", label: "Application Saved Not Submitted" },
          { value: "completed_application_submitted", label: "Completed Application Submitted" }
        ];
      } else if (formData.log_type === "requested_support_notes" || formData.log_type === "requested_documents") {
        return [
          { value: "requested", label: "Requested" },
          { value: "completed", label: "Completed" }
        ];
      } else if (formData.log_type === "suspended_claims") {
        return [
          { value: "outstanding", label: "Outstanding" },
          { value: "completed", label: "Completed" }
        ];
      } else if (formData.log_type === "awaiting_activation") {
        return [
          { value: "awaiting_activation", label: "Awaiting Activation" },
          { value: "activated", label: "Activated" }
        ];
      } else if (formData.log_type === "missing_payments") {
        return [
          { value: "payment_missing", label: "Payment Missing" },
          { value: "payment_in_processing", label: "Payment In Processing" },
          { value: "payment_received", label: "Payment Received" }
        ];
      } else if (formData.log_type === "change_of_addresses" || formData.log_type === "room_transfers") {
        return [
          { value: "to_complete", label: "To Complete" },
          { value: "completed", label: "Completed" }
        ];
      } else if (formData.log_type === "hb_calls") {
        return [
          { value: "to_do", label: "To Do" },
          { value: "query", label: "Query" },
          { value: "resolved", label: "Resolved" }
        ];
      } else if (formData.log_type === "hb_leavers") {
        return [
          { value: "to_complete", label: "To Complete" },
          { value: "completed", label: "Completed" }
        ];
      }
    }
    
    // Default statuses for landlord_portal
    if (formData.benefit_type === "landlord_portal") {
      return [
        { value: "No Updates Found", label: "No Updates Found" },
        { value: "Updates Found - Action Required", label: "Updates Found - Action Required" },
        { value: "Updates Found - In Progress", label: "Updates Found - In Progress" },
        { value: "Issue Found", label: "Issue Found" }
      ];
    }
    
    // Default statuses for universal_credit
    return [
      { value: "pending", label: "Pending" },
      { value: "in_progress", label: "In Progress" },
      { value: "completed", label: "Completed" },
      { value: "issue_raised", label: "Issue Raised" },
      { value: "closed", label: "Closed" }
    ];
  };

  return (
    <Card className="mb-6 shadow-md">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <HandCoins className="w-5 h-5 text-sky-600" />
          {log ? "Edit Benefit Log" : "Add New Benefit Log"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Top Section - Resident and Benefit Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {formData.benefit_type !== "landlord_portal" && (
              <div>
                <Label htmlFor="resident_id">Resident *</Label>
                <Select value={formData.resident_id || ""} onValueChange={(value) => handleChange("resident_id", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a resident" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>None</SelectItem>
                    {residents?.map((resident) => (
                      <SelectItem key={resident.ID || resident.id} value={resident.ID || resident.id}>
                        {resident["First Name"] || resident.first_name} {resident["Last Name"] || resident.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label htmlFor="benefit_type">Benefit Type</Label>
              <Select value={formData.benefit_type} onValueChange={(value) => {
                handleChange("benefit_type", value);
                if (value === "universal_credit") {
                  handleChange("log_type", "application_log");
                } else if (value === "landlord_portal") {
                  handleChange("log_type", "portal_check");
                } else {
                  handleChange("log_type", "application_log");
                }
              }} disabled={!!activeBenefitType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="housing_benefit">Housing Benefit</SelectItem>
                  <SelectItem value="universal_credit">Universal Credit</SelectItem>
                  <SelectItem value="landlord_portal">Landlord Portal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Log Type and Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="log_type">{formData.benefit_type === "landlord_portal" ? "Check Type" : "Log Type"} *</Label>
              <Select value={formData.log_type} onValueChange={(value) => handleChange("log_type", value)} required>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getLogTypeOptions().map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">Status *</Label>
              <Select value={formData.status} onValueChange={(value) => handleChange("status", value)} required>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getStatusOptions().map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Application Details for Housing Benefit Application Log */}
          {formData.benefit_type === "housing_benefit" && formData.log_type === "application_log" && (
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Application Details</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleChange("title", e.target.value)}
                    placeholder="e.g., HB Application for John Doe"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date_application_started">Date Application Started *</Label>
                    <Input
                      id="date_application_started"
                      type="date"
                      value={formData.date_application_started}
                      onChange={(e) => handleChange("date_application_started", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="application_saved_date">Application Saved Date (if applicable)</Label>
                    <Input
                      id="application_saved_date"
                      type="date"
                      value={formData.application_saved_date}
                      onChange={(e) => handleChange("application_saved_date", e.target.value)}
                    />
                    <p className="text-xs text-slate-500 mt-1">Status will auto-change to "Application Saved (Not Yet Submitted)" when this date is entered</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="completed_application_submitted_date">Completed Application Submitted Date</Label>
                    <Input
                      id="completed_application_submitted_date"
                      type="date"
                      value={formData.completed_application_submitted_date}
                      onChange={(e) => handleChange("completed_application_submitted_date", e.target.value)}
                    />
                    <p className="text-xs text-slate-500 mt-1">Status will auto-change to "Completed Application Submitted" when this date is entered</p>
                  </div>
                  <div>
                    <Label htmlFor="claim_submission_reference">Claim Submission Reference</Label>
                    <Input
                      id="claim_submission_reference"
                      value={formData.claim_submission_reference}
                      onChange={(e) => handleChange("claim_submission_reference", e.target.value)}
                      placeholder="Enter reference number"
                    />
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-red-600 mb-3">Documents Uploaded</h4>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="licence_agreement_uploaded"
                        checked={formData.licence_agreement_uploaded}
                        onCheckedChange={(checked) => handleChange("licence_agreement_uploaded", checked)}
                      />
                      <Label htmlFor="licence_agreement_uploaded" className="cursor-pointer">Licence Agreement Uploaded</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="authorisation_form_uploaded"
                        checked={formData.authorisation_form_uploaded}
                        onCheckedChange={(checked) => handleChange("authorisation_form_uploaded", checked)}
                      />
                      <Label htmlFor="authorisation_form_uploaded" className="cursor-pointer">Authorisation Form Uploaded</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="proof_of_income_uploaded"
                        checked={formData.proof_of_income_uploaded}
                        onCheckedChange={(checked) => handleChange("proof_of_income_uploaded", checked)}
                      />
                      <Label htmlFor="proof_of_income_uploaded" className="cursor-pointer">Proof of Income (UC Payments Screenshots) Uploaded</Label>
                    </div>
                  </div>

                  <div className="mt-4">
                    <Label htmlFor="date_uploaded">Date Uploaded</Label>
                    <Input
                      id="date_uploaded"
                      type="date"
                      value={formData.date_uploaded}
                      onChange={(e) => handleChange("date_uploaded", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Landlord Portal Specific Fields */}
          {formData.benefit_type === "landlord_portal" && (
            <div className="space-y-6">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  placeholder="e.g., Daily portal check - 15/01/2025"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  placeholder="Details of any updates found or actions taken"
                  rows={4}
                />
              </div>

              <div className="space-y-4 border-t pt-4">
                <h3 className="text-base font-semibold text-slate-900">Follow-up Action</h3>
                
                <div>
                  <Label htmlFor="action_to_follow">Follow-up Action Required</Label>
                  <Textarea
                    id="action_to_follow"
                    value={formData.action_to_follow}
                    onChange={(e) => handleChange("action_to_follow", e.target.value)}
                    placeholder="Describe any follow-up action needed..."
                    rows={3}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="action_to_follow_completed"
                    checked={formData.action_to_follow_completed}
                    onCheckedChange={(checked) => handleChange("action_to_follow_completed", checked)}
                  />
                  <Label htmlFor="action_to_follow_completed" className="cursor-pointer">
                    Follow-up action completed
                  </Label>
                </div>
              </div>
            </div>
          )}

          {/* Title and Description for non-HB application log and non-landlord portal types */}
          {!(formData.benefit_type === "housing_benefit" && formData.log_type === "application_log") && 
           formData.benefit_type !== "landlord_portal" && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  placeholder="Brief title for this log entry"
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  placeholder="Detailed description..."
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Notes section */}
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder="Additional notes about this application..."
              rows={3}
            />
          </div>

          {/* Bottom Section - Log Date and Logged By */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="log_date">Log Date & Time *</Label>
              <Input
                id="log_date"
                type="datetime-local"
                value={formData.log_date}
                onChange={(e) => handleChange("log_date", e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="logged_by">Logged By</Label>
              <Input
                id="logged_by"
                value={formData.logged_by}
                onChange={(e) => handleChange("logged_by", e.target.value)}
                placeholder="Automatically set to current user"
                disabled
              />
              <p className="text-xs text-slate-500 mt-1">Automatically set to current user</p>
            </div>
          </div>



          {/* Form Actions */}
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
              className="bg-sky-600 hover:bg-sky-700 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {log ? "Update Log" : "Create Log"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}