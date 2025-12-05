"use client"

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Save, ClipboardPlus } from "lucide-react";

export default function ReferralForm({ referral, users, currentUser, onSubmit, onCancel, activeReferralType }) {
  const getInitialDateTime = () => {
    if (referral?.Referral_Date || referral?.referral_date) {
      const date = referral.Referral_Date || referral.referral_date;
      return date.slice(0, 16);
    }
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const [formData, setFormData] = useState(() => {
    const initialDefaultState = {
      referral_date: getInitialDateTime(),
      referred_by_agency: "",
      referral_from_url: "",
      applicant_name: "",
      applicant_dob: "",
      referral_reason: "",
      status: "received",
      priority: "medium",
      assigned_to_user_id: "",
      assessment_date: "",
      decision_date: "",
      decision_reason: "",
      accommodation_type_needed: "single_room",
      notes: "",
      referral_type: referral?.Referral_Type || referral?.referral_type || activeReferralType || 'organisation',
      logged_by: referral?.Logged_By || referral?.logged_by || (currentUser?.full_name || "")
    };
    return { ...initialDefaultState, ...(referral ? {
      referral_date: getInitialDateTime(),
      referred_by_agency: referral.Referred_By_Agency || referral.referred_by_agency || "",
      referral_from_url: referral.Referral_From_Url || referral.referral_from_url || "",
      applicant_name: referral.Applicant_Name || referral.applicant_name || "",
      applicant_dob: referral.Applicant_Dob || referral.applicant_dob || "",
      referral_reason: referral.Referral_Reason || referral.referral_reason || "",
      status: referral.Status || referral.status || "received",
      priority: referral.Priority || referral.priority || "medium",
      assigned_to_user_id: referral.Assigned_To_User_Id || referral.assigned_to_user_id || "",
      assessment_date: referral.Assessment_Date || referral.assessment_date || "",
      decision_date: referral.Decision_Date || referral.decision_date || "",
      decision_reason: referral.Decision_Reason || referral.decision_reason || "",
      accommodation_type_needed: referral.Accommodation_Type_Needed || referral.accommodation_type_needed || "single_room",
      notes: referral.Notes || referral.notes || "",
      referral_type: referral.Referral_Type || referral.referral_type || activeReferralType || 'organisation',
      logged_by: referral.Logged_By || referral.logged_by || (currentUser?.full_name || "")
    } : {}) };
  });

  // Update logged_by when currentUser becomes available
  useEffect(() => {
    if (!referral && currentUser?.full_name && formData.logged_by === "") {
      setFormData(prev => ({
        ...prev,
        logged_by: currentUser.full_name
      }));
    }
  }, [currentUser, referral, formData.logged_by]);

  useEffect(() => {
    // If the referral type changes to 'self-referral', clear the referred_by_agency field
    if (formData.referral_type === 'self-referral' && formData.referred_by_agency !== "") {
      handleChange("referred_by_agency", "");
    }
  }, [formData.referral_type, formData.referred_by_agency]);

  // Hardcoded list of assignable users for the dropdown
  const assignableUsers = [
    { id: "admin", name: "Admin" },
    { id: "amaani", name: "Amaani" },
    { id: "leticia", name: "Leticia" },
    { id: "burton", name: "Burton" },
    { id: "sulekha", name: "Sulekha" },
    { id: "shaila", name: "Shaila" }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Map status to Supabase format (with spaces and title case)
    const statusMap = {
      'received': 'Received',
      'under_assessment': 'Under Assessment',
      'awaiting_interview': 'Awaiting Interview',
      'interviewed': 'Interviewed',
      'accepted': 'Accepted',
      'rejected': 'Rejected',
      'withdrawn': 'Withdrawn'
    };

    // Map priority to Supabase format (title case)
    const priorityMap = {
      'low': 'Low',
      'medium': 'Medium',
      'high': 'High'
    };

    // Map referral type to Supabase format
    const referralTypeMap = {
      'organisation': 'Organisation',
      'self-referral': 'Self-Referral'
    };

    // Convert to Supabase column names (with spaces)
    const supabaseData = {
      "Referral Date": formData.referral_date,
      "Referral Type": referralTypeMap[formData.referral_type] || 'Organisation',
      "Referral From URL": formData.referral_from_url || null,
      "Applicant Name": formData.applicant_name,
      "Applicant DOB": formData.applicant_dob || null,
      "Referral Reason": formData.referral_reason || null,
      "Status": statusMap[formData.status] || 'Received',
      "Priority": priorityMap[formData.priority] || 'Medium',
      "Assigned To": formData.assigned_to_user_id || null,
      "Assessment Date": formData.assessment_date || null,
      "Decision Date": formData.decision_date || null,
      "Decision Reason": formData.decision_reason || null,
      "Accommodation Type Needed": formData.accommodation_type_needed || null,
      "Notes": formData.notes || null,
      "Logged By": formData.logged_by || null,
      "Updated Date": new Date().toISOString()
    };

    // Only add "Referred By Agency" for organisation referrals (it's required in that table)
    if (formData.referral_type === 'organisation') {
      supabaseData["Referred By Agency"] = formData.referred_by_agency;
    }

    if (!referral) {
      supabaseData.ID = crypto.randomUUID();
      supabaseData["Created Date"] = new Date().toISOString();
      supabaseData["Created By"] = currentUser?.email || "Unknown";
    }

    onSubmit(supabaseData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="mb-6 shadow-md">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <ClipboardPlus className="w-5 h-5 text-fuchsia-600" />
          {referral ? "Edit Referral" : "Add New Referral"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">

          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-8 mt-2">Applicant & Referral Source</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="referral_type">Referral Type *</Label>
                <Select value={formData.referral_type} onValueChange={v => handleChange("referral_type", v)} required>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="organisation">Organisation Referral</SelectItem>
                    <SelectItem value="self-referral">Self-Referral</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="referral_from_url">Referral From URL (Google Drive Link)</Label>
                <Input 
                  id="referral_from_url" 
                  type="url"
                  value={formData.referral_from_url} 
                  onChange={e => handleChange("referral_from_url", e.target.value)} 
                  placeholder="https://drive.google.com/..."
                />
              </div>
              
              <div>
                <Label htmlFor="applicant_name">Applicant Name *</Label>
                <Input id="applicant_name" value={formData.applicant_name} onChange={e => handleChange("applicant_name", e.target.value)} required />
              </div>
              
              <div>
                <Label htmlFor="applicant_dob">Applicant Date of Birth</Label>
                <Input id="applicant_dob" type="date" value={formData.applicant_dob || ""} onChange={e => handleChange("applicant_dob", e.target.value)} />
              </div>
              
              {formData.referral_type === 'organisation' && (
                <div>
                  <Label htmlFor="referred_by_agency">Referred By (Agency/Person) *</Label>
                  <Input id="referred_by_agency" value={formData.referred_by_agency} onChange={e => handleChange("referred_by_agency", e.target.value)} required={formData.referral_type === 'organisation'} />
                </div>
              )}
              
              <div>
                <Label htmlFor="referral_date">Referral Date & Time *</Label>
                <Input id="referral_date" type="datetime-local" value={formData.referral_date} onChange={e => handleChange("referral_date", e.target.value)} required />
              </div>
              
              <div>
                <Label htmlFor="logged_by">Logged By</Label>
                <Input id="logged_by" value={formData.logged_by} onChange={e => handleChange("logged_by", e.target.value)} placeholder="Name of staff member logging referral" />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-8 mt-2">Referral Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="referral_reason">Reason for Referral</Label>
                <Textarea id="referral_reason" value={formData.referral_reason} onChange={e => handleChange("referral_reason", e.target.value)} rows={3} />
              </div>
              <div>
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea id="notes" value={formData.notes} onChange={e => handleChange("notes", e.target.value)} rows={3} />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-8 mt-2">Processing & Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="status">Status *</Label>
                <Select value={formData.status} onValueChange={v => handleChange("status", v)} required>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="received">Received</SelectItem>
                    <SelectItem value="under_assessment">Under Assessment</SelectItem>
                    <SelectItem value="awaiting_interview">Awaiting Interview</SelectItem>
                    <SelectItem value="interviewed">Interviewed</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="withdrawn">Withdrawn</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select value={formData.priority} onValueChange={v => handleChange("priority", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="assigned_to_user_id">Assigned To</Label>
                <Select value={formData.assigned_to_user_id} onValueChange={v => handleChange("assigned_to_user_id", v)}>
                  <SelectTrigger><SelectValue placeholder="Select staff member" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>Unassigned</SelectItem>
                    {assignableUsers.map(user => (
                      <SelectItem key={user.id} value={user.name}>{user.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="accommodation_type_needed">Accommodation Needed</Label>
                <Select value={formData.accommodation_type_needed} onValueChange={v => handleChange("accommodation_type_needed", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single_room">Single Room</SelectItem>
                    <SelectItem value="shared_room">Shared Room</SelectItem>
                    <SelectItem value="studio">Studio</SelectItem>
                    <SelectItem value="bedsit">Bedsit</SelectItem>
                    <SelectItem value="one_bedroom_flat">One Bedroom Flat</SelectItem>
                    <SelectItem value="two_bedroom_flat">Two Bedroom Flat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="assessment_date">Assessment Date</Label>
                <Input id="assessment_date" type="date" value={formData.assessment_date} onChange={e => handleChange("assessment_date", e.target.value)} />
              </div>
              
              <div>
                <Label htmlFor="decision_date">Decision Date</Label>
                <Input id="decision_date" type="date" value={formData.decision_date} onChange={e => handleChange("decision_date", e.target.value)} />
              </div>
              
              <div className="md:col-span-3">
                 <Label htmlFor="decision_reason">Decision Reason</Label>
                 <Input id="decision_reason" value={formData.decision_reason} onChange={e => handleChange("decision_reason", e.target.value)} placeholder="Reason for acceptance or rejection..." />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onCancel}>
              <X className="w-4 h-4 mr-2" /> Cancel
            </Button>
            <Button type="submit" className="bg-fuchsia-600 hover:bg-fuchsia-700">
              <Save className="w-4 h-4 mr-2" /> {referral ? "Update Referral" : "Save Referral"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}