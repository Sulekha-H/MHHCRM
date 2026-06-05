"use client"

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Save, FileCheck, CheckCircle2 } from "lucide-react";

export default function ComplianceForm({ log, properties, currentUser, onSubmit, onCancel }) {
  const [formData, setFormData] = useState(log ? {
    ...log,
    logged_by: currentUser?.full_name || currentUser?.fullName || log.logged_by || ""
  } : {
    property_id: "",
    compliance_type: "gas_safety",
    certificate_name: "",
    issued_date: new Date().toISOString().slice(0, 10),
    expiry_date: "",
    status: "valid",
    contractor_company: "",
    certificate_number: "",
    cost: 0,
    next_action_due: "",
    file_url: "",
    notes: "",
    priority: "medium",
    logged_by: currentUser?.full_name || currentUser?.fullName || "",
    actioned: false,
    actioned_date: "",
    actioned_notes: ""
  });

  // Update logged_by whenever currentUser or log changes to ensure it's accurate
  useEffect(() => {
    const currentName = currentUser?.full_name || currentUser?.fullName;
    if (currentName) {
      setFormData(prev => ({
        ...prev,
        logged_by: currentName
      }));
    }
  }, [currentUser]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Ensure logged_by is updated to current user on every save
    const currentName = currentUser?.full_name || currentUser?.fullName || formData.logged_by || "";
    const dataToSubmit = {
      ...formData,
      logged_by: currentName
    };
    
    // Map form values to database format
    const complianceTypeMap = {
      'gas_safety': 'Gas Safety',
      'emergency_lighting': 'Emergency Lighting',
      'eicr': 'EICR',
      'pat_tests': 'PAT Tests',
      'fire_detection_alarm_system': 'Fire Detection & Alarm System',
      'fire_risk_assessment': 'Fire Risk Assessment',
      'energy_performance': 'EPC',
      'legionella_risk': 'Legionella',
      'asbestos_survey': 'Asbestos',
      'other': 'Other'
    };

    const statusMap = {
      'valid': 'Valid',
      'expiring_soon': 'Expiring Soon',
      'expired': 'Expired',
      'pending_renewal': 'Pending Renewal',
      'not_required': 'Not Required'
    };

    const priorityMap = {
      'low': 'Low',
      'medium': 'Medium',
      'high': 'High',
      'critical': 'Critical'
    };

    // Convert to PascalCase for Supabase
    const supabaseData = {
      "Property ID": dataToSubmit.property_id,
      "Compliance Type": complianceTypeMap[dataToSubmit.compliance_type] || dataToSubmit.compliance_type,
      "Certificate Name": dataToSubmit.certificate_name,
      "Issued Date": dataToSubmit.issued_date,
      "Expiry Date": dataToSubmit.expiry_date || null,
      Status: statusMap[dataToSubmit.status] || dataToSubmit.status,
      "Contractor Company": dataToSubmit.contractor_company || null,
      "Certificate Number": dataToSubmit.certificate_number || null,
      Cost: dataToSubmit.cost || null,
      "Next Action Due": dataToSubmit.next_action_due || null,
      "File URL": dataToSubmit.file_url || null,
      Notes: dataToSubmit.notes || null,
      Priority: priorityMap[dataToSubmit.priority] || dataToSubmit.priority,
      "Logged By": dataToSubmit.logged_by || null,
      Actioned: dataToSubmit.actioned,
      "Actioned Date": dataToSubmit.actioned_date || null,
      "Actioned Notes": dataToSubmit.actioned_notes || null,
      "Updated Date": new Date().toISOString()
    };

    if (!log) {
      supabaseData.ID = crypto.randomUUID();
      supabaseData["Created Date"] = new Date().toISOString();
    }

    onSubmit(supabaseData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Check if the certificate is expired
  const isExpired = formData.expiry_date && new Date(formData.expiry_date) < new Date();

  return (
    <Card className="mb-6 shadow-md">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <FileCheck className="w-5 h-5 text-emerald-600" />
          {log ? "Edit Compliance Record" : "Add New Compliance Record"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="property_id">Property *</Label>
                <Select value={formData.property_id} onValueChange={v => handleChange("property_id", v)} required>
                  <SelectTrigger><SelectValue placeholder="Select property" /></SelectTrigger>
                  <SelectContent>
                    {properties?.map(property => (
                      <SelectItem key={property.Id || property.id} value={property.Id || property.id}>
                        {property.Name || property.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="compliance_type">Compliance Type *</Label>
                <Select value={formData.compliance_type} onValueChange={v => handleChange("compliance_type", v)} required>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gas_safety">Gas Safety</SelectItem>
                    <SelectItem value="emergency_lighting">Emergency Lighting</SelectItem>
                    <SelectItem value="eicr">EICR</SelectItem>
                    <SelectItem value="pat_tests">PAT Tests</SelectItem>
                    <SelectItem value="fire_detection_alarm_system">Fire Detection & Alarm System</SelectItem>
                    <SelectItem value="fire_risk_assessment">Fire Risk Assessment</SelectItem>
                    <SelectItem value="energy_performance">EPC</SelectItem>
                    <SelectItem value="legionella_risk">Legionella</SelectItem>
                    <SelectItem value="asbestos_survey">Asbestos</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="certificate_name">Certificate Name/Title *</Label>
                <Input 
                  id="certificate_name" 
                  value={formData.certificate_name} 
                  onChange={e => handleChange("certificate_name", e.target.value)} 
                  placeholder="e.g., Gas Safety Certificate for Maple House" 
                  required 
                />
              </div>
            </div>
          </div>

          {/* Certificate Details */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Certificate Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="issued_date">Issued Date *</Label>
                <Input 
                  id="issued_date" 
                  type="date" 
                  value={formData.issued_date} 
                  onChange={e => handleChange("issued_date", e.target.value)} 
                  required 
                />
              </div>
              <div>
                <Label htmlFor="expiry_date">Expiry Date</Label>
                <Input 
                  id="expiry_date" 
                  type="date" 
                  value={formData.expiry_date} 
                  onChange={e => handleChange("expiry_date", e.target.value)} 
                />
              </div>
              <div>
                <Label htmlFor="next_action_due">Next Action Due</Label>
                <Input 
                  id="next_action_due" 
                  type="date" 
                  value={formData.next_action_due} 
                  onChange={e => handleChange("next_action_due", e.target.value)} 
                />
              </div>
              <div>
                <Label htmlFor="certificate_number">Certificate Number</Label>
                <Input 
                  id="certificate_number" 
                  value={formData.certificate_number} 
                  onChange={e => handleChange("certificate_number", e.target.value)} 
                  placeholder="Reference number" 
                />
              </div>
              <div>
                <Label htmlFor="contractor_company">Contractor/Company</Label>
                <Input 
                  id="contractor_company" 
                  value={formData.contractor_company} 
                  onChange={e => handleChange("contractor_company", e.target.value)} 
                  placeholder="Company that issued certificate" 
                />
              </div>
              <div>
                <Label htmlFor="cost">Cost (£)</Label>
                <Input 
                  id="cost" 
                  type="text" 
                  value={formData.cost} 
                  onChange={e => handleChange("cost", e.target.value)} 
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          {/* Status & Priority */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Status & Priority</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={v => handleChange("status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="valid">Valid</SelectItem>
                    <SelectItem value="expiring_soon">Expiring Soon</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="pending_renewal">Pending Renewal</SelectItem>
                    <SelectItem value="not_required">Not Required</SelectItem>
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
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Completion/Action Section - Show for expired or expiring certificates */}
          {(isExpired || formData.status === 'expired' || formData.status === 'expiring_soon' || formData.actioned) && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-amber-900 mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                Renewal/Action Status
              </h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="actioned"
                    checked={formData.actioned}
                    onCheckedChange={(checked) => {
                    const isChecked = checked === true;

                    handleChange("actioned", isChecked);

                    if (!isChecked) {
                   handleChange("actioned_date", null);
                   handleChange("actioned_notes", "");
                   }
                   }}
                  />
                  <Label htmlFor="actioned" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    This certificate has been renewed/actioned
                  </Label>
                </div>
                
                {formData.actioned && (
                  <>
                    <div>
                      <Label htmlFor="actioned_date">Renewal/Action Date</Label>
                      <Input
                        id="actioned_date"
                        type="date"
                        value={formData.actioned_date}
                        onChange={e => handleChange("actioned_date", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="actioned_notes">Renewal/Action Notes</Label>
                      <Textarea
                        id="actioned_notes"
                        value={formData.actioned_notes}
                        onChange={e => handleChange("actioned_notes", e.target.value)}
                        rows={3}
                        placeholder="E.g., New certificate added as record #123, or Certificate renewed with ABC Contractors"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Document & Notes */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Document & Notes</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="file_url">Certificate Document URL</Label>
                <Input
                  id="file_url"
                  type="url"
                  value={formData.file_url}
                  onChange={(e) => handleChange("file_url", e.target.value)}
                  placeholder="https://gdrive.com/certificate.pdf"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Please enter a valid URL (must start with http:// or https://)
                </p>
              </div>
              <div>
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea 
                  id="notes" 
                  value={formData.notes} 
                  onChange={e => handleChange("notes", e.target.value)} 
                  rows={4} 
                  placeholder="Any additional notes about this compliance record..." 
                />
              </div>
            </div>
          </div>
          
          {/* Logged By */}
          {(currentUser?.full_name || currentUser?.fullName || formData.logged_by) && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <p className="text-sm text-purple-900">
                <span className="font-semibold">Logged by:</span> {currentUser?.full_name || currentUser?.fullName || formData.logged_by}
              </p>
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onCancel}>
              <X className="w-4 h-4 mr-2" /> Cancel
            </Button>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
              <Save className="w-4 h-4 mr-2" /> {log ? "Update Record" : "Save Record"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
