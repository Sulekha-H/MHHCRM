"use client"

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { X, Save, Shield } from "lucide-react";

export default function IncidentForm({ incident, residents, users, currentUser, onSubmit, onCancel }) {
  const getInitialDateTime = () => {
    if (incident?.Incident_Date || incident?.incident_date) {
      const date = incident.Incident_Date || incident.incident_date;
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

  const [formData, setFormData] = useState(incident ? 
    {
      resident_id: incident.Resident_Id || incident.resident_id || "",
      incident_type: incident.Incident_Type || incident.incident_type || "Other",
      severity: incident.Severity || incident.severity || "Medium",
      incident_date: getInitialDateTime(),
      location: incident.Location || incident.location || "",
      description: incident.Description || incident.description || "",
      action_taken: incident.Action_Taken || incident.action_taken || "",
      follow_up_required: incident.Follow_Up_Required || incident.follow_up_required || false,
      follow_up_date: incident.Follow_Up_Date || incident.follow_up_date || "",
      follow_up_by_user_id: incident.Follow_Up_By_User_Id || incident.follow_up_by_user_id || "",
      follow_up_completed: incident.Follow_Up_Completed || incident.follow_up_completed || false,
      follow_up_comments: incident.Follow_Up_Comments || incident.follow_up_comments || "",
      witnesses: incident.Witnesses || incident.witnesses || "",
      staff_involved: incident.Staff_Involved || incident.staff_involved || false,
      staff_members_involved: incident.Staff_Members_Involved || incident.staff_members_involved || [],
      authorities_notified: incident.Authorities_Notified || incident.authorities_notified || false,
      status: incident.Status || incident.status || "Open",
      logged_by: incident.Logged_By || incident.logged_by || currentUser?.full_name || "",
    } 
    : {
      resident_id: "",
      incident_type: "Other",
      severity: "Medium",
      incident_date: getInitialDateTime(),
      location: "",
      description: "",
      action_taken: "",
      follow_up_required: false,
      follow_up_date: "",
      follow_up_by_user_id: "",
      follow_up_completed: false,
      follow_up_comments: "",
      witnesses: "",
      staff_involved: false,
      staff_members_involved: [],
      authorities_notified: false,
      status: "Open",
      logged_by: currentUser?.full_name || ""
    });

  const staffMembers = [
    "Hasib", "Leticia", "Burton", 
    "Amaani", "Sulekha", "Shaila", "Nathan"
  ];

  // Transform incident_type from any format to database format
  const transformIncidentType = (type) => {
    const typeMap = {
      'medical': 'Medical',
      'Medical': 'Medical',
      'behavioral': 'Behavioral',
      'Behavioral': 'Behavioral',
      'property_damage': 'Property Damage',
      'Property Damage': 'Property Damage',
      'safeguarding': 'Safeguarding',
      'Safeguarding': 'Safeguarding',
      'police_involved': 'Police Involved',
      'Police Involved': 'Police Involved',
      'other': 'Other',
      'Other': 'Other'
    };
    return typeMap[type] || 'Other';
  };

  // Transform severity from any format to database format
  const transformSeverity = (severity) => {
    const severityMap = {
      'low': 'Low',
      'Low': 'Low',
      'medium': 'Medium',
      'Medium': 'Medium',
      'high': 'High',
      'High': 'High',
      'critical': 'Critical',
      'Critical': 'Critical'
    };
    return severityMap[severity] || 'Medium';
  };

  // Transform status from any format to database format
  const transformStatus = (status) => {
    const statusMap = {
      'open': 'Open',
      'Open': 'Open',
      'under_investigation': 'Under Investigation',
      'Under Investigation': 'Under Investigation',
      'resolved': 'Resolved',
      'Resolved': 'Resolved',
      'closed': 'Closed',
      'Closed': 'Closed'
    };
    return statusMap[status] || 'Open';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Convert to Supabase column names (with spaces)
    const supabaseData = {
      "Resident ID": formData.resident_id || null,
      "Incident Type": transformIncidentType(formData.incident_type),
      "Severity": transformSeverity(formData.severity),
      "Incident Date": formData.incident_date,
      "Location": formData.location || null,
      "Description": formData.description,
      "Action Taken": formData.action_taken || null,
      "Follow-up Required": formData.follow_up_required,
      "Follow-up Date": formData.follow_up_date || null,
      "Follow-up By User ID": formData.follow_up_by_user_id || null,
      "Follow-up Completed": formData.follow_up_completed,
      "Follow-up Comments": formData.follow_up_comments || null,
      "Witnesses": formData.witnesses || null,
      "Staff Involved": formData.staff_involved,
      "Staff Members Involved": formData.staff_members_involved || [],
      "Authorities Notified": formData.authorities_notified,
      "Status": transformStatus(formData.status),
      "Logged By": formData.logged_by || currentUser?.full_name || null,
      "Updated Date": new Date().toISOString()
    };

    if (!incident) {
      supabaseData.ID = crypto.randomUUID();
      supabaseData["Created Date"] = new Date().toISOString();
    }

    onSubmit(supabaseData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleStaffToggle = (staffName) => {
    setFormData(prev => ({
      ...prev,
      staff_members_involved: prev.staff_members_involved.includes(staffName)
        ? prev.staff_members_involved.filter(name => name !== staffName)
        : [...prev.staff_members_involved, staffName]
    }));
  };

  return (
    <Card className="mb-6 shadow-md">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-red-600" />
          {incident ? "Edit Incident" : "Report New Incident"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Incident Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="incident_type">Incident Type *</Label>
                <Select value={formData.incident_type} onValueChange={(value) => handleChange("incident_type", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Medical">Medical</SelectItem>
                    <SelectItem value="Behavioral">Behavioral</SelectItem>
                    <SelectItem value="Property Damage">Property Damage</SelectItem>
                    <SelectItem value="Safeguarding">Safeguarding</SelectItem>
                    <SelectItem value="Police Involved">Police Involved</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="severity">Severity *</Label>
                <Select value={formData.severity} onValueChange={(value) => handleChange("severity", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="incident_date">Date & Time *</Label>
                <Input
                  id="incident_date"
                  type="datetime-local"
                  value={formData.incident_date}
                  onChange={(e) => handleChange("incident_date", e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleChange("location", e.target.value)}
                  placeholder="Where did this occur?"
                />
              </div>
            </div>
          </div>

          {/* Involved People Information */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Involved People</h3>
            
            {/* Resident Selection */}
            <div className="mb-4">
              <Label htmlFor="resident_id">Resident (if applicable)</Label>
              <Select value={formData.resident_id || ""} onValueChange={(value) => handleChange("resident_id", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select resident or leave blank" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>No specific resident</SelectItem>
                  {residents?.filter(r => (r.Status || r.status || '').toLowerCase() === 'active').map((resident) => (
                    <SelectItem key={resident.ID || resident.Id || resident.id} value={resident.ID || resident.Id || resident.id}>
                      {resident["First Name"] || resident.First_Name || resident.first_name} {resident["Last Name"] || resident.Last_Name || resident.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Staff Involvement */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="staff_involved"
                  checked={formData.staff_involved}
                  onCheckedChange={(checked) => {
                    handleChange("staff_involved", checked);
                    if (!checked) {
                      handleChange("staff_members_involved", []);
                    }
                  }}
                />
                <Label htmlFor="staff_involved">Staff members were involved in this incident</Label>
              </div>

              {formData.staff_involved && (
                <div>
                  <Label className="text-sm font-medium text-slate-700 mb-2 block">
                    Select staff members involved:
                  </Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                    {staffMembers.map((staffName) => (
                      <div key={staffName} className="flex items-center space-x-2">
                        <Checkbox
                          id={`staff-${staffName}`}
                          checked={formData.staff_members_involved.includes(staffName)}
                          onCheckedChange={() => handleStaffToggle(staffName)}
                        />
                        <Label htmlFor={`staff-${staffName}`} className="text-sm">
                          {staffName}
                        </Label>
                      </div>
                    ))}
                  </div>
                  {formData.staff_members_involved.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.staff_members_involved.map((staffName) => (
                        <Badge key={staffName} variant="secondary" className="bg-blue-100 text-blue-800">
                          {staffName}
                          <button
                            type="button"
                            onClick={() => handleStaffToggle(staffName)}
                            className="ml-1 text-blue-600 hover:text-blue-800"
                          >
                            &times;
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Incident Description */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Description</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="description">What happened? *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  placeholder="Provide a detailed description of the incident"
                  rows={4}
                  required
                />
              </div>
              <div>
                <Label htmlFor="action_taken">Action Taken</Label>
                <Textarea
                  id="action_taken"
                  value={formData.action_taken}
                  onChange={(e) => handleChange("action_taken", e.target.value)}
                  placeholder="What actions were taken in response?"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="witnesses">Witnesses</Label>
                <Input
                  id="witnesses"
                  value={formData.witnesses}
                  onChange={(e) => handleChange("witnesses", e.target.value)}
                  placeholder="Names of any witnesses"
                />
              </div>
            </div>
          </div>

          {/* Follow-up and Status */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Follow-up & Status</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="follow_up_required"
                  checked={formData.follow_up_required}
                  onCheckedChange={(checked) => handleChange("follow_up_required", checked)}
                />
                <Label htmlFor="follow_up_required">Follow-up action required</Label>
              </div>
              
              {formData.follow_up_required && (
                <div className="p-4 border rounded-lg space-y-4 bg-slate-50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="follow_up_date">Follow-up Due Date</Label>
                      <Input
                        id="follow_up_date"
                        type="date"
                        value={formData.follow_up_date || ""}
                        onChange={(e) => handleChange("follow_up_date", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="follow_up_by_user_id">Follow Up By</Label>
                      <Select value={formData.follow_up_by_user_id || ""} onValueChange={(value) => handleChange("follow_up_by_user_id", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Assign to staff..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={null}>Unassigned</SelectItem>
                          {staffMembers.map((staffName) => (
                            <SelectItem key={staffName} value={staffName}>
                              {staffName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="follow_up_comments">Follow Up Comments</Label>
                    <Textarea
                      id="follow_up_comments"
                      value={formData.follow_up_comments || ""}
                      onChange={(e) => handleChange("follow_up_comments", e.target.value)}
                      placeholder="Add comments about the follow-up action..."
                      rows={2}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="follow_up_completed"
                      checked={formData.follow_up_completed}
                      onCheckedChange={(checked) => handleChange("follow_up_completed", checked)}
                    />
                    <Label htmlFor="follow_up_completed">Mark follow-up as completed</Label>
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="authorities_notified"
                  checked={formData.authorities_notified}
                  onCheckedChange={(checked) => handleChange("authorities_notified", checked)}
                />
                <Label htmlFor="authorities_notified">Authorities were notified</Label>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleChange("status", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Open">Open</SelectItem>
                    <SelectItem value="Under Investigation">Under Investigation</SelectItem>
                    <SelectItem value="Resolved">Resolved</SelectItem>
                    <SelectItem value="Closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
              className="bg-red-600 hover:bg-red-700 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {incident ? "Update Incident" : "Report Incident"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}