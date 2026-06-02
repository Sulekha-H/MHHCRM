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

export default function BenefitLogForm_Supabase({ log, residents, currentUser, activeBenefitType, onSubmit, onCancel }) {
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
    resident_id: log["Resident ID"] || log.resident_id || log.Resident_ID || "",
    benefit_type: log["Benefit Type"] || log.benefit_type || log.Benefit_Type || activeBenefitType || "housing_benefit",
    log_type: log["Log Type"] || log.log_type || log.Log_Type || "application_log",
    title: log.Title || log.title || "",
    description: log.Description || log.description || "",
    log_date: getInitialDateTime(),
    status: log.Status || log.status || "pending",
    logged_by: log["Logged By"] || log.logged_by || log.Logged_By || currentUser?.["Full Name"] || currentUser?.full_name || "",
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
    // Requested Support Notes fields
    date_of_request: log["Date of Request"] || log.date_of_request || "",
    support_notes_requested_dates: log["Support Notes Requested Dates"] || log.support_notes_requested_dates || "",
    support_notes_uploaded: log["Support Notes Uploaded"] !== null && log["Support Notes Uploaded"] !== undefined ? log["Support Notes Uploaded"] : (log.support_notes_uploaded || false),
    support_notes_sent: log["Support Notes Sent"] !== null && log["Support Notes Sent"] !== undefined ? log["Support Notes Sent"] : (log.support_notes_sent || false),
    date_uploaded_or_sent: log["Date Uploaded or Sent"] || log.date_uploaded_or_sent || "",
    // Requested Documents fields
    requested_document_type: log["Requested Document Type"] || log.requested_document_type || "",
    date_requested_documents_sent: log["Date Requested Documents Sent"] || log.date_requested_documents_sent || "",
    method_documents_sent: log["Method Documents Sent"] || log.method_documents_sent || "",
    // Suspended Claims fields
    reason_for_suspended_claim: log["Reason for Suspended Claim"] || log.reason_for_suspended_claim || "",
    claim_reactivated: log["Claim Reactivated"] !== null && log["Claim Reactivated"] !== undefined ? log["Claim Reactivated"] : (log.claim_reactivated || false),
    claim_reactivated_date: log["Claim Reactivated Date"] || log.claim_reactivated_date || "",
    // Awaiting Activation fields
    date_activated: log["Date Activated"] || log.date_activated || "",
    // Missing Payments fields
    period_of_missing_payment: log["Period of Missing Payment"] || log.period_of_missing_payment || "",
    action_to_follow_missing_payment: log["Action to Follow Missing Payment"] || log.action_to_follow_missing_payment || "",
    action_completed_missing_payment: log["Action Completed Missing Payment"] !== null && log["Action Completed Missing Payment"] !== undefined ? log["Action Completed Missing Payment"] : (log.action_completed_missing_payment || false),
    payment_received: log["Payment Received"] !== null && log["Payment Received"] !== undefined ? log["Payment Received"] : (log.payment_received || false),
    // Change of Addresses fields
    change_of_address_completed_hb: log["Change of Address Completed HB"] !== null && log["Change of Address Completed HB"] !== undefined ? log["Change of Address Completed HB"] : (log.change_of_address_completed_hb || false),
    change_of_address_completed_uc: log["Change of Address Completed UC"] !== null && log["Change of Address Completed UC"] !== undefined ? log["Change of Address Completed UC"] : (log.change_of_address_completed_uc || false),
    new_licence_agreement_sent_uploaded: log["New Licence Agreement Sent Uploaded"] !== null && log["New Licence Agreement Sent Uploaded"] !== undefined ? log["New Licence Agreement Sent Uploaded"] : (log.new_licence_agreement_sent_uploaded || false),
    licence_sent_uploaded_date: log["Licence Sent Uploaded Date"] || log.licence_sent_uploaded_date || "",
    licence_sent_uploaded_method: log["Licence Sent Uploaded Method"] || log.licence_sent_uploaded_method || "",
    // Room Transfers fields
    accommodation_from: log["Accommodation From"] || log.accommodation_from || "",
    unit_from: log["Unit From"] || log.unit_from || "",
    date_from: log["Date From"] || log.date_from || "",
    accommodation_to: log["Accommodation To"] || log.accommodation_to || "",
    unit_to: log["Unit To"] || log.unit_to || "",
    date_to: log["Date To"] || log.date_to || "",
    hb_updated: log["HB Updated"] !== null && log["HB Updated"] !== undefined ? log["HB Updated"] : (log.hb_updated || false),
    date_hb_updated: log["Date HB Updated"] || log.date_hb_updated || "",
    hb_update_method_email: log["HB Update Method Email"] !== null && log["HB Update Method Email"] !== undefined ? log["HB Update Method Email"] : (log.hb_update_method_email || false),
    hb_update_method_website: log["HB Update Method Website"] !== null && log["HB Update Method Website"] !== undefined ? log["HB Update Method Website"] : (log.hb_update_method_website || false),
    // HB Calls fields
    date_called: log["Date Called"] || log.date_called || "",
    reason_for_call: log["Reason for Call"] || log.reason_for_call || "",
    update_from_call: log["Update from Call"] || log.update_from_call || "",
    hb_call_action_to_follow: log["HB Call Action to Follow"] || log.hb_call_action_to_follow || "",
    hb_call_action_completed: log["HB Call Action Completed"] !== null && log["HB Call Action Completed"] !== undefined ? log["HB Call Action Completed"] : (log.hb_call_action_completed || false),
    hb_call_resolved: log["HB Call Resolved"] !== null && log["HB Call Resolved"] !== undefined ? log["HB Call Resolved"] : (log.hb_call_resolved || false),
    // HB Leavers fields
    move_out_date: log["Move Out Date"] || log.move_out_date || "",
    hb_notified: log["HB Notified"] !== null && log["HB Notified"] !== undefined ? log["HB Notified"] : (log.hb_notified || false),
    date_hb_notified: log["Date HB Notified"] || log.date_hb_notified || "",
    date_hb_notified_of_move_out: log["Date HB Notified of Move Out"] || log.date_hb_notified_of_move_out || "",
    hb_notified_method_email: log["HB Notified Method Email"] !== null && log["HB Notified Method Email"] !== undefined ? log["HB Notified Method Email"] : (log.hb_notified_method_email || false),
    hb_notified_method_website: log["HB Notified Method Website"] !== null && log["HB Notified Method Website"] !== undefined ? log["HB Notified Method Website"] : (log.hb_notified_method_website || false),
    // Universal Credit specific fields
    amount: log.Amount || log.amount || 0,
    application_date: log["Application Date"] || log.application_date || "",
    sanctions: log.Sanctions !== null && log.Sanctions !== undefined ? log.Sanctions : (log.sanctions || false),
    sanction_date: log["Sanction Date"] || log.sanction_date || "",
    sanction_amount: log["Sanction Amount"] || log.sanction_amount || 0,
    date_resolved: log["Date Resolved"] || log.date_resolved || "",
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
    // Requested Support Notes fields
    date_of_request: "",
    support_notes_requested_dates: "",
    support_notes_uploaded: false,
    support_notes_sent: false,
    date_uploaded_or_sent: "",
    // Requested Documents fields
    requested_document_type: "",
    date_requested_documents_sent: "",
    method_documents_sent: "",
    // Suspended Claims fields
    reason_for_suspended_claim: "",
    claim_reactivated: false,
    claim_reactivated_date: "",
    // Awaiting Activation fields
    date_activated: "",
    // Missing Payments fields
    period_of_missing_payment: "",
    action_to_follow_missing_payment: "",
    action_completed_missing_payment: false,
    payment_received: false,
    // Change of Addresses fields
    change_of_address_completed_hb: false,
    change_of_address_completed_uc: false,
    new_licence_agreement_sent_uploaded: false,
    licence_sent_uploaded_date: "",
    licence_sent_uploaded_method: "",
    // Room Transfers fields
    accommodation_from: "",
    unit_from: "",
    date_from: "",
    accommodation_to: "",
    unit_to: "",
    date_to: "",
    hb_updated: false,
    date_hb_updated: "",
    hb_update_method_email: false,
    hb_update_method_website: false,
    // HB Calls fields
    date_called: "",
    reason_for_call: "",
    update_from_call: "",
    hb_call_action_to_follow: "",
    hb_call_action_completed: false,
    hb_call_resolved: false,
    // HB Leavers fields
    move_out_date: "",
    hb_notified: false,
    date_hb_notified: "",
    date_hb_notified_of_move_out: "",
    hb_notified_method_email: false,
    hb_notified_method_website: false,
    // Universal Credit specific fields
    amount: 0,
    application_date: "",
    sanctions: false,
    sanction_date: "",
    sanction_amount: 0,
    date_resolved: "",
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
    
    // Validate resident selection for Housing Benefit
    if (formData.benefit_type === 'housing_benefit' && !formData.resident_id) {
      alert('Please select a resident for Housing Benefit logs');
      return;
    }
    
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
      'portal_check': 'Portal Check',
      'payment_update': 'Payment Update',
      'claim_issue': 'Claim Issue',
      'change_of_circumstances': 'Change of Circumstances',
      'appeal': 'Appeal',
      'general_update': 'General Update'
    };
    
    // Map status to database format
    const statusMap = {
      'pending': 'Pending',
      'in_progress': 'In Progress',
      'completed': 'Completed',
      'issue_raised': 'Issue Raised',
      'issue-raised': 'Issue Raised',
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
      supabaseData["Amount"] = formData.amount;
      supabaseData["Application Date"] = formData.application_date || null;
      supabaseData["Sanctions"] = formData.sanctions;
      supabaseData["Sanction Date"] = formData.sanction_date || null;
      supabaseData["Sanction Amount"] = formData.sanction_amount;
      supabaseData["Date Resolved"] = formData.date_resolved || null;

      if (formData.sanctions && !formData.sanction_date) {
        alert('Please provide a Sanction Date when Sanctions is enabled');
        return;
      }
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
      
      // Requested Support Notes fields
      supabaseData["Date of Request"] = formData.date_of_request || null;
      supabaseData["Support Notes Requested Dates"] = formData.support_notes_requested_dates || null;
      supabaseData["Support Notes Uploaded"] = formData.support_notes_uploaded;
      supabaseData["Support Notes Sent"] = formData.support_notes_sent;
      supabaseData["Date Uploaded or Sent"] = formData.date_uploaded_or_sent || null;
      
      // Requested Documents fields
      supabaseData["Requested Document Type"] = formData.requested_document_type || null;
      supabaseData["Date Requested Documents Sent"] = formData.date_requested_documents_sent || null;
      supabaseData["Method Documents Sent"] = formData.method_documents_sent || null;
      
      // Suspended Claims fields
      supabaseData["Reason for Suspended Claim"] = formData.reason_for_suspended_claim || null;
      supabaseData["Claim Reactivated"] = formData.claim_reactivated;
      supabaseData["Claim Reactivated Date"] = formData.claim_reactivated_date || null;
      
      // Awaiting Activation fields
      supabaseData["Date Activated"] = formData.date_activated || null;
      
      // Missing Payments fields
      supabaseData["Period of Missing Payment"] = formData.period_of_missing_payment || null;
      supabaseData["Action to Follow Missing Payment"] = formData.action_to_follow_missing_payment || null;
      supabaseData["Action Completed Missing Payment"] = formData.action_completed_missing_payment;
      supabaseData["Payment Received"] = formData.payment_received;
      
      // Change of Addresses fields
      supabaseData["Change of Address Completed HB"] = formData.change_of_address_completed_hb;
      supabaseData["Change of Address Completed UC"] = formData.change_of_address_completed_uc;
      supabaseData["New Licence Agreement Sent Uploaded"] = formData.new_licence_agreement_sent_uploaded;
      supabaseData["Licence Sent Uploaded Date"] = formData.licence_sent_uploaded_date || null;
      supabaseData["Licence Sent Uploaded Method"] = formData.licence_sent_uploaded_method || null;
      
      // Room Transfers fields
      supabaseData["Accommodation From"] = formData.accommodation_from || null;
      supabaseData["Unit From"] = formData.unit_from || null;
      supabaseData["Date From"] = formData.date_from || null;
      supabaseData["Accommodation To"] = formData.accommodation_to || null;
      supabaseData["Unit To"] = formData.unit_to || null;
      supabaseData["Date To"] = formData.date_to || null;
      supabaseData["HB Updated"] = formData.hb_updated;
      supabaseData["Date HB Updated"] = formData.date_hb_updated || null;
      supabaseData["HB Update Method Email"] = formData.hb_update_method_email;
      supabaseData["HB Update Method Website"] = formData.hb_update_method_website;
      
      // HB Calls fields
      supabaseData["Date Called"] = formData.date_called || null;
      supabaseData["Reason for Call"] = formData.reason_for_call || null;
      supabaseData["Update from Call"] = formData.update_from_call || null;
      supabaseData["HB Call Action to Follow"] = formData.hb_call_action_to_follow || null;
      supabaseData["HB Call Action Completed"] = formData.hb_call_action_completed;
      supabaseData["HB Call Resolved"] = formData.hb_call_resolved;
      
      // HB Leavers fields
      supabaseData["Move Out Date"] = formData.move_out_date || null;
      supabaseData["HB Notified"] = formData.hb_notified;
      supabaseData["Date HB Notified"] = formData.date_hb_notified || null;
      supabaseData["Date HB Notified of Move Out"] = formData.date_hb_notified_of_move_out || null;
      supabaseData["HB Notified Method Email"] = formData.hb_notified_method_email;
      supabaseData["HB Notified Method Website"] = formData.hb_notified_method_website;
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

          {/* HB Calls Details for Housing Benefit */}
          {formData.benefit_type === "housing_benefit" && formData.log_type === "hb_calls" && (
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-base font-semibold text-slate-900">HB Calls Details</h3>

              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  placeholder="e.g., HB Call for John Doe"
                  required
                />
              </div>

              <div>
                <Label htmlFor="date_called">Date Called</Label>
                <Input
                  id="date_called"
                  type="date"
                  value={formData.date_called}
                  onChange={(e) => handleChange("date_called", e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="reason_for_call">Reason for Call</Label>
                <Textarea
                  id="reason_for_call"
                  value={formData.reason_for_call}
                  onChange={(e) => handleChange("reason_for_call", e.target.value)}
                  placeholder="Explain the reason for making this HB call..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="update_from_call">Update from Call</Label>
                <Textarea
                  id="update_from_call"
                  value={formData.update_from_call}
                  onChange={(e) => handleChange("update_from_call", e.target.value)}
                  placeholder="What information or updates were received from the call..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="hb_call_action_to_follow">Action to Follow</Label>
                <Textarea
                  id="hb_call_action_to_follow"
                  value={formData.hb_call_action_to_follow}
                  onChange={(e) => handleChange("hb_call_action_to_follow", e.target.value)}
                  placeholder="Describe any follow-up action needed..."
                  rows={3}
                />
              </div>

              <div className="space-y-3 bg-slate-50 p-4 rounded-lg">
                <h4 className="text-sm font-semibold text-slate-700">Call Status</h4>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hb_call_action_completed"
                    checked={formData.hb_call_action_completed}
                    onCheckedChange={(checked) => handleChange("hb_call_action_completed", checked)}
                  />
                  <Label htmlFor="hb_call_action_completed" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Action Completed
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hb_call_resolved"
                    checked={formData.hb_call_resolved}
                    onCheckedChange={(checked) => handleChange("hb_call_resolved", checked)}
                  />
                  <Label htmlFor="hb_call_resolved" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Issue Resolved
                  </Label>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Status will auto-change to "Resolved" when issue is marked as resolved
                </p>
              </div>
            </div>
          )}

          {/* HB Leavers Details for Housing Benefit */}
          {formData.benefit_type === "housing_benefit" && formData.log_type === "hb_leavers" && (
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-base font-semibold text-slate-900">HB Leavers Details</h3>

              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  placeholder="e.g., HB Leaver - John Doe"
                  required
                />
              </div>

              <div>
                <Label htmlFor="move_out_date">Move Out Date</Label>
                <Input
                  id="move_out_date"
                  type="date"
                  value={formData.move_out_date}
                  onChange={(e) => handleChange("move_out_date", e.target.value)}
                />
              </div>

              <div className="space-y-3 bg-slate-50 p-4 rounded-lg">
                <h4 className="text-sm font-semibold text-slate-700">HB Notification Status</h4>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hb_notified"
                    checked={formData.hb_notified}
                    onCheckedChange={(checked) => handleChange("hb_notified", checked)}
                  />
                  <Label htmlFor="hb_notified" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    HB Notified
                  </Label>
                </div>
                <p className="text-xs text-slate-500">
                  Status will auto-change to "Completed" when HB is marked as notified
                </p>

                {formData.hb_notified && (
                  <>
                    <div className="pt-2">
                      <Label htmlFor="date_hb_notified_of_move_out">Date HB Notified of Move Out *</Label>
                      <Input
                        id="date_hb_notified_of_move_out"
                        type="date"
                        value={formData.date_hb_notified_of_move_out}
                        onChange={(e) => handleChange("date_hb_notified_of_move_out", e.target.value)}
                        required={formData.hb_notified}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">HB Notification Method *</Label>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="hb_notified_method_email"
                          checked={formData.hb_notified_method_email}
                          onCheckedChange={(checked) => handleChange("hb_notified_method_email", checked)}
                        />
                        <Label htmlFor="hb_notified_method_email" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Email
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="hb_notified_method_website"
                          checked={formData.hb_notified_method_website}
                          onCheckedChange={(checked) => handleChange("hb_notified_method_website", checked)}
                        />
                        <Label htmlFor="hb_notified_method_website" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Website
                        </Label>
                      </div>
                      {formData.hb_notified && !formData.hb_notified_method_email && !formData.hb_notified_method_website && (
                        <p className="text-xs text-red-600 mt-1">
                          At least one notification method must be selected when HB is notified
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Room Transfers Details for Housing Benefit */}
          {formData.benefit_type === "housing_benefit" && formData.log_type === "room_transfers" && (
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-base font-semibold text-slate-900">Room Transfers Details</h3>

              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  placeholder="e.g., Room Transfer for John Doe"
                  required
                />
              </div>

              <div className="space-y-4 bg-slate-50 p-4 rounded-lg">
                <h4 className="text-sm font-semibold text-slate-700">Transfer From</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="accommodation_from">Property/Accommodation From</Label>
                    <Input
                      id="accommodation_from"
                      value={formData.accommodation_from}
                      onChange={(e) => handleChange("accommodation_from", e.target.value)}
                      placeholder="Previous property"
                    />
                  </div>
                  <div>
                    <Label htmlFor="unit_from">Unit/Room Number From</Label>
                    <Input
                      id="unit_from"
                      value={formData.unit_from}
                      onChange={(e) => handleChange("unit_from", e.target.value)}
                      placeholder="Previous room"
                    />
                  </div>
                  <div>
                    <Label htmlFor="date_from">Date From</Label>
                    <Input
                      id="date_from"
                      type="date"
                      value={formData.date_from}
                      onChange={(e) => handleChange("date_from", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 bg-slate-50 p-4 rounded-lg">
                <h4 className="text-sm font-semibold text-slate-700">Transfer To</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="accommodation_to">Property/Accommodation To</Label>
                    <Input
                      id="accommodation_to"
                      value={formData.accommodation_to}
                      onChange={(e) => handleChange("accommodation_to", e.target.value)}
                      placeholder="New property"
                    />
                  </div>
                  <div>
                    <Label htmlFor="unit_to">Unit/Room Number To</Label>
                    <Input
                      id="unit_to"
                      value={formData.unit_to}
                      onChange={(e) => handleChange("unit_to", e.target.value)}
                      placeholder="New room"
                    />
                  </div>
                  <div>
                    <Label htmlFor="date_to">Date To</Label>
                    <Input
                      id="date_to"
                      type="date"
                      value={formData.date_to}
                      onChange={(e) => handleChange("date_to", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3 bg-slate-50 p-4 rounded-lg">
                <h4 className="text-sm font-semibold text-slate-700">HB Update Status</h4>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hb_updated"
                    checked={formData.hb_updated}
                    onCheckedChange={(checked) => handleChange("hb_updated", checked)}
                  />
                  <Label htmlFor="hb_updated" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    HB Updated
                  </Label>
                </div>
                <p className="text-xs text-slate-500">
                  Status will auto-change to "Completed" when HB is marked as updated
                </p>

                {formData.hb_updated && (
                  <>
                    <div className="pt-2">
                      <Label htmlFor="date_hb_updated">Date HB Updated *</Label>
                      <Input
                        id="date_hb_updated"
                        type="date"
                        value={formData.date_hb_updated}
                        onChange={(e) => handleChange("date_hb_updated", e.target.value)}
                        required={formData.hb_updated}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">HB Update Method *</Label>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="hb_update_method_email"
                          checked={formData.hb_update_method_email}
                          onCheckedChange={(checked) => handleChange("hb_update_method_email", checked)}
                        />
                        <Label htmlFor="hb_update_method_email" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Email
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="hb_update_method_website"
                          checked={formData.hb_update_method_website}
                          onCheckedChange={(checked) => handleChange("hb_update_method_website", checked)}
                        />
                        <Label htmlFor="hb_update_method_website" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Website
                        </Label>
                      </div>
                      {formData.hb_updated && !formData.hb_update_method_email && !formData.hb_update_method_website && (
                        <p className="text-xs text-red-600 mt-1">
                          At least one update method must be selected when HB is updated
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Change of Addresses Details for Housing Benefit */}
          {formData.benefit_type === "housing_benefit" && formData.log_type === "change_of_addresses" && (
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-base font-semibold text-slate-900">Change of Addresses Details</h3>

              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  placeholder="e.g., Change of Address for John Doe"
                  required
                />
              </div>

              <div className="space-y-3 bg-slate-50 p-4 rounded-lg">
                <h4 className="text-sm font-semibold text-slate-700">Address Update Status</h4>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="change_of_address_completed_hb"
                    checked={formData.change_of_address_completed_hb}
                    onCheckedChange={(checked) => handleChange("change_of_address_completed_hb", checked)}
                  />
                  <Label htmlFor="change_of_address_completed_hb" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Change of Address Completed (HB)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="change_of_address_completed_uc"
                    checked={formData.change_of_address_completed_uc}
                    onCheckedChange={(checked) => handleChange("change_of_address_completed_uc", checked)}
                  />
                  <Label htmlFor="change_of_address_completed_uc" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Change of Address Completed (UC)
                  </Label>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Status will auto-change to "Completed" when both HB and UC are marked as completed
                </p>
              </div>

              <div className="space-y-3 bg-slate-50 p-4 rounded-lg">
                <h4 className="text-sm font-semibold text-slate-700">Licence Agreement</h4>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="new_licence_agreement_sent_uploaded"
                    checked={formData.new_licence_agreement_sent_uploaded}
                    onCheckedChange={(checked) => handleChange("new_licence_agreement_sent_uploaded", checked)}
                  />
                  <Label htmlFor="new_licence_agreement_sent_uploaded" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    New Licence Agreement Sent/Uploaded
                  </Label>
                </div>

                {formData.new_licence_agreement_sent_uploaded && (
                  <>
                    <div className="pt-2">
                      <Label htmlFor="licence_sent_uploaded_date">Licence Sent/Uploaded Date *</Label>
                      <Input
                        id="licence_sent_uploaded_date"
                        type="date"
                        value={formData.licence_sent_uploaded_date}
                        onChange={(e) => handleChange("licence_sent_uploaded_date", e.target.value)}
                        required={formData.new_licence_agreement_sent_uploaded}
                      />
                    </div>
                    <div>
                      <Label htmlFor="licence_sent_uploaded_method">Licence Sent/Uploaded Method *</Label>
                      <Select
                        value={formData.licence_sent_uploaded_method || ""}
                        onValueChange={(value) => handleChange("licence_sent_uploaded_method", value)}
                        required={formData.new_licence_agreement_sent_uploaded}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="website_upload">Website Upload</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Missing Payments Details for Housing Benefit */}
          {formData.benefit_type === "housing_benefit" && formData.log_type === "missing_payments" && (
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-base font-semibold text-slate-900">Missing Payments Details</h3>

              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  placeholder="e.g., Missing Payment for John Doe"
                  required
                />
              </div>

              <div>
                <Label htmlFor="period_of_missing_payment">Period of Missing Payment</Label>
                <Input
                  id="period_of_missing_payment"
                  value={formData.period_of_missing_payment}
                  onChange={(e) => handleChange("period_of_missing_payment", e.target.value)}
                  placeholder="e.g., December 2025"
                />
              </div>

              <div>
                <Label htmlFor="action_to_follow_missing_payment">Action to Follow for Missing Payment</Label>
                <Textarea
                  id="action_to_follow_missing_payment"
                  value={formData.action_to_follow_missing_payment}
                  onChange={(e) => handleChange("action_to_follow_missing_payment", e.target.value)}
                  placeholder="Describe the action needed..."
                  rows={3}
                />
              </div>

              <div className="space-y-3 bg-slate-50 p-4 rounded-lg">
                <h4 className="text-sm font-semibold text-slate-700">Payment Status</h4>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="action_completed_missing_payment"
                    checked={formData.action_completed_missing_payment}
                    onCheckedChange={(checked) => handleChange("action_completed_missing_payment", checked)}
                  />
                  <Label htmlFor="action_completed_missing_payment" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Action Completed
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="payment_received"
                    checked={formData.payment_received}
                    onCheckedChange={(checked) => handleChange("payment_received", checked)}
                  />
                  <Label htmlFor="payment_received" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Payment Received
                  </Label>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Status will auto-change to "Payment Received" when payment received is checked
                </p>
              </div>
            </div>
          )}

          {/* Awaiting Activation Details for Housing Benefit */}
          {formData.benefit_type === "housing_benefit" && formData.log_type === "awaiting_activation" && (
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-base font-semibold text-slate-900">Awaiting Activation Details</h3>

              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  placeholder="e.g., Awaiting HB Activation for John Doe"
                  required
                />
              </div>

              <div>
                <Label htmlFor="date_activated">Date Activated</Label>
                <Input
                  id="date_activated"
                  type="date"
                  value={formData.date_activated}
                  onChange={(e) => handleChange("date_activated", e.target.value)}
                />
                <p className="text-xs text-slate-500 mt-1">
                  Status will auto-change to "Activated" when this date is entered
                </p>
              </div>
            </div>
          )}

          {/* Suspended Claims Details for Housing Benefit */}
          {formData.benefit_type === "housing_benefit" && formData.log_type === "suspended_claims" && (
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-base font-semibold text-slate-900">Suspended Claims Details</h3>

              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  placeholder="e.g., Claim Suspended for John Doe"
                  required
                />
              </div>

              <div>
                <Label htmlFor="reason_for_suspended_claim">Reason for Suspended Claim</Label>
                <Textarea
                  id="reason_for_suspended_claim"
                  value={formData.reason_for_suspended_claim}
                  onChange={(e) => handleChange("reason_for_suspended_claim", e.target.value)}
                  placeholder="Explain why the claim was suspended..."
                  rows={3}
                />
              </div>

              <div className="space-y-3 bg-slate-50 p-4 rounded-lg">
                <h4 className="text-sm font-semibold text-slate-700">Reactivation Status</h4>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="claim_reactivated"
                    checked={formData.claim_reactivated}
                    onCheckedChange={(checked) => handleChange("claim_reactivated", checked)}
                  />
                  <Label htmlFor="claim_reactivated" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Claim Reactivated
                  </Label>
                </div>
                <p className="text-xs text-slate-500">
                  Status will auto-change to "Completed" when claim is marked as reactivated
                </p>

                {formData.claim_reactivated && (
                  <div className="pt-2">
                    <Label htmlFor="claim_reactivated_date">Claim Reactivated Date *</Label>
                    <Input
                      id="claim_reactivated_date"
                      type="date"
                      value={formData.claim_reactivated_date}
                      onChange={(e) => handleChange("claim_reactivated_date", e.target.value)}
                      required={formData.claim_reactivated}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Requested Documents Details for Housing Benefit */}
          {formData.benefit_type === "housing_benefit" && formData.log_type === "requested_documents" && (
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-base font-semibold text-slate-900">Requested Documents Details</h3>

              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  placeholder="e.g., Documents Request for John Doe"
                  required
                />
              </div>

              <div>
                <Label htmlFor="requested_document_type">Requested Document Type</Label>
                <Input
                  id="requested_document_type"
                  value={formData.requested_document_type}
                  onChange={(e) => handleChange("requested_document_type", e.target.value)}
                  placeholder="e.g., Proof of Address, Bank Statements, etc."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date_requested_documents_sent">Date Requested Documents Sent</Label>
                  <Input
                    id="date_requested_documents_sent"
                    type="date"
                    value={formData.date_requested_documents_sent}
                    onChange={(e) => handleChange("date_requested_documents_sent", e.target.value)}
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Status will auto-change to "Completed" when this date is entered
                  </p>
                </div>

                <div>
                  <Label htmlFor="method_documents_sent">
                    Method Documents Were Sent{formData.date_requested_documents_sent ? ' *' : ''}
                  </Label>
                  <Select
                    value={formData.method_documents_sent || ""}
                    onValueChange={(value) => handleChange("method_documents_sent", value)}
                    required={!!formData.date_requested_documents_sent}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="post">Post</SelectItem>
                      <SelectItem value="hand_delivered">Hand Delivered</SelectItem>
                      <SelectItem value="uploaded_to_portal">Uploaded to Portal</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {formData.date_requested_documents_sent && !formData.method_documents_sent && (
                    <p className="text-xs text-red-600 mt-1">
                      Method Documents Were Sent is required when Date Requested Documents Sent is filled
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Requested Support Notes Details for Housing Benefit */}
          {formData.benefit_type === "housing_benefit" && formData.log_type === "requested_support_notes" && (
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-base font-semibold text-slate-900">Support Notes Request Details</h3>

              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  placeholder="e.g., Support Notes Request for John Doe"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date_of_request">Date of Request</Label>
                  <Input
                    id="date_of_request"
                    type="date"
                    value={formData.date_of_request}
                    onChange={(e) => handleChange("date_of_request", e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="support_notes_requested_dates">Support Notes Requested Dates (Usually 2 Months)</Label>
                  <Input
                    id="support_notes_requested_dates"
                    value={formData.support_notes_requested_dates}
                    onChange={(e) => handleChange("support_notes_requested_dates", e.target.value)}
                    placeholder="e.g., January 2025 - February 2025"
                  />
                </div>
              </div>

              <div className="space-y-3 bg-slate-50 p-4 rounded-lg">
                <h4 className="text-sm font-semibold text-slate-700">Support Notes Status</h4>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="support_notes_uploaded"
                    checked={formData.support_notes_uploaded}
                    onCheckedChange={(checked) => handleChange("support_notes_uploaded", checked)}
                  />
                  <Label htmlFor="support_notes_uploaded" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Uploaded
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="support_notes_sent"
                    checked={formData.support_notes_sent}
                    onCheckedChange={(checked) => handleChange("support_notes_sent", checked)}
                  />
                  <Label htmlFor="support_notes_sent" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Sent
                  </Label>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Status will auto-change to "Completed" when either checkbox is ticked
                </p>

                <div className="pt-2">
                  <Label htmlFor="date_uploaded_or_sent">
                    Date Uploaded or Sent{(formData.support_notes_uploaded || formData.support_notes_sent) && ' *'}
                  </Label>
                  <Input
                    id="date_uploaded_or_sent"
                    type="date"
                    value={formData.date_uploaded_or_sent}
                    onChange={(e) => handleChange("date_uploaded_or_sent", e.target.value)}
                    required={formData.support_notes_uploaded || formData.support_notes_sent}
                  />
                  {(formData.support_notes_uploaded || formData.support_notes_sent) && (
                    <p className="text-xs text-red-600 mt-1">
                      Date Uploaded/Sent is required when support notes are marked as Uploaded or Sent
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

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

          {/* Universal Credit Specific Fields */}
          {formData.benefit_type === "universal_credit" && (
            <div className="space-y-6 border-t pt-4">
              <h3 className="text-lg font-semibold text-slate-900">Universal Credit Details</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleChange("title", e.target.value)}
                    placeholder="e.g., UC Update - John Doe"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="application_date">Application Date</Label>
                  <Input
                    id="application_date"
                    type="date"
                    value={formData.application_date}
                    onChange={(e) => handleChange("application_date", e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  placeholder="Details of the update or issue"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amount">Amount (£)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => handleChange("amount", parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label htmlFor="date_resolved">Date Resolved</Label>
                  <Input
                    id="date_resolved"
                    type="date"
                    value={formData.date_resolved}
                    onChange={(e) => handleChange("date_resolved", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-4 bg-slate-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sanctions"
                    checked={formData.sanctions}
                    onCheckedChange={(checked) => handleChange("sanctions", checked)}
                  />
                  <Label htmlFor="sanctions" className="font-semibold text-red-600 cursor-pointer">
                    Sanctions Applied
                  </Label>
                </div>

                {formData.sanctions && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div>
                      <Label htmlFor="sanction_date">Sanction Date *</Label>
                      <Input
                        id="sanction_date"
                        type="date"
                        value={formData.sanction_date}
                        onChange={(e) => handleChange("sanction_date", e.target.value)}
                        required={formData.sanctions}
                      />
                    </div>
                    <div>
                      <Label htmlFor="sanction_amount">Sanction Amount (£)</Label>
                      <Input
                        id="sanction_amount"
                        type="number"
                        step="0.01"
                        value={formData.sanction_amount}
                        onChange={(e) => handleChange("sanction_amount", parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4 border-t pt-4">
                <h4 className="text-base font-semibold text-slate-900">Follow-up Action</h4>
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
                  <Label htmlFor="action_to_follow_completed" className="cursor-pointer text-sm font-medium">
                    Follow-up action completed
                  </Label>
                </div>
              </div>
            </div>
          )}

          {/* Landlord Portal Specific Fields */}
          {formData.benefit_type === "landlord_portal" && (
            <div className="space-y-6 border-t pt-4">
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
           !(formData.benefit_type === "housing_benefit" && formData.log_type === "requested_support_notes") &&
           !(formData.benefit_type === "housing_benefit" && formData.log_type === "requested_documents") &&
           !(formData.benefit_type === "housing_benefit" && formData.log_type === "suspended_claims") &&
           !(formData.benefit_type === "housing_benefit" && formData.log_type === "awaiting_activation") &&
           !(formData.benefit_type === "housing_benefit" && formData.log_type === "missing_payments") &&
           !(formData.benefit_type === "housing_benefit" && formData.log_type === "change_of_addresses") &&
           !(formData.benefit_type === "housing_benefit" && formData.log_type === "room_transfers") &&
           !(formData.benefit_type === "housing_benefit" && formData.log_type === "hb_calls") &&
           !(formData.benefit_type === "housing_benefit" && formData.log_type === "hb_leavers") &&
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