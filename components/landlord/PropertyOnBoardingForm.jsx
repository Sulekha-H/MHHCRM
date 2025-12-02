import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Save, Building, CheckCircle2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Helper to convert enum values to Supabase format
const formatEnumForSupabase = (value, enumType) => {
  if (!value) return null;
  
  const enumMaps = {
    property_type: {
      'shared': 'Shared',
      'en_suites': 'En-suites',
      'shared_en_suites_mixed': 'Shared/En-suites Mixed',
      'studio': 'Studio',
      'bedsits': 'Bedsits',
      'flats': 'Flats',
      'standard_house_not_hmo': 'Standard House (Not HMO)'
    },
    hmo_conversion: {
      'landlord': 'Landlord',
      'us': 'Us',
      'not_applicable': 'Not Applicable'
    },
    yes_no: {
      'yes': 'Yes',
      'no': 'No'
    },
    onboarding_status: {
      'initial_contact': 'Initial Contact',
      'documents_requested': 'Docs Requested',
      'documents_received': 'Docs Received',
      'property_inspection': 'Inspection',
      'contract_preparation': 'Contract Prep',
      'contract_signed': 'Contract Signed',
      'live': 'Live',
      'rejected': 'Rejected',
      'on_hold': 'On Hold'
    }
  };
  
  const lowerCaseValue = String(value).toLowerCase();
  return enumMaps[enumType]?.[lowerCaseValue] || value;
};

export default function PropertyOnboardingForm_Supabase({ onboardingCase, users, currentUser, onSubmit, onCancel }) {
  const getInitialDateTime = () => {
    if (onboardingCase?.application_date) {
      const date = onboardingCase.application_date;
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

  const [formData, setFormData] = useState(onboardingCase ? {
    application_date: (onboardingCase.application_date || "").slice(0, 16) || getInitialDateTime(),
    landlord_name: onboardingCase.landlord_name || "",
    landlord_company: onboardingCase.landlord_company || "",
    contact_email: onboardingCase.contact_email || "",
    contact_phone: onboardingCase.contact_phone || "",
    alternative_contact: onboardingCase.alternative_contact || "",
    property_address: onboardingCase.property_address || "",
    property_area: onboardingCase.property_area || "",
    property_type: onboardingCase.property_type || "shared",
    total_units: onboardingCase.total_units || 1,
    detailed_property_layout: onboardingCase.detailed_property_layout || "",
    rent_per_week: onboardingCase.rent_per_week || "",
    deposit_amount: onboardingCase.deposit_amount || "",
    hmo_ready: onboardingCase.hmo_ready !== null && onboardingCase.hmo_ready !== undefined ? onboardingCase.hmo_ready : false,
    hmo_conversion_by: onboardingCase.hmo_conversion_by || "not_applicable",
    property_ready: onboardingCase.property_ready ? String(onboardingCase.property_ready).toLowerCase() : "yes",
    property_ready_date: onboardingCase.property_ready_date || "",
    pictures_provided: onboardingCase.pictures_provided ? String(onboardingCase.pictures_provided).toLowerCase() : "no",
    pictures_gdrive_link: onboardingCase.pictures_gdrive_link || "",
    onboarding_status: onboardingCase.onboarding_status || "initial_contact",
    assigned_to_user_id: onboardingCase.assigned_to_user_id || "",
    initial_contact_date: (onboardingCase.initial_contact_date || "").slice(0, 16) || getInitialDateTime(),
    documents_requested_date: (onboardingCase.documents_requested_date || "").slice(0, 16) || "",
    documents_received_date: (onboardingCase.documents_received_date || "").slice(0, 16) || "",
    property_inspection_date: (onboardingCase.property_inspection_date || "").slice(0, 16) || "",
    contract_preparation_date: (onboardingCase.contract_preparation_date || "").slice(0, 16) || "",
    contract_signed_date: (onboardingCase.contract_signed_date || "").slice(0, 16) || "",
    live_date: (onboardingCase.live_date || "").slice(0, 16) || "",
    rejected_date: (onboardingCase.rejected_date || "").slice(0, 16) || "",
    on_hold_date: (onboardingCase.on_hold_date || "").slice(0, 16) || "",
    inspection_date: (onboardingCase.inspection_date || "").slice(0, 16) || "",
    contract_start_date: onboardingCase.contract_start_date || "",
    notes: onboardingCase.notes || "",
    rejection_reason: onboardingCase.rejection_reason || "",
    logged_by: onboardingCase.logged_by || currentUser?.Full_Name || currentUser?.full_name || ""
  } : {
    application_date: getInitialDateTime(),
    landlord_name: "",
    landlord_company: "",
    contact_email: "",
    contact_phone: "",
    alternative_contact: "",
    property_address: "",
    property_area: "",
    property_type: "shared",
    total_units: 1,
    detailed_property_layout: "",
    rent_per_week: "",
    deposit_amount: "",
    hmo_ready: false,
    hmo_conversion_by: "not_applicable",
    property_ready: "yes",
    property_ready_date: "",
    pictures_provided: "no",
    pictures_gdrive_link: "",
    onboarding_status: "initial_contact",
    assigned_to_user_id: "",
    initial_contact_date: getInitialDateTime(),
    documents_requested_date: "",
    documents_received_date: "",
    property_inspection_date: "",
    contract_preparation_date: "",
    contract_signed_date: "",
    live_date: "",
    rejected_date: "",
    on_hold_date: "",
    inspection_date: "",
    contract_start_date: "",
    notes: "",
    rejection_reason: "",
    logged_by: currentUser?.Full_Name || currentUser?.full_name || ""
  });

  const [showStatusWarning, setShowStatusWarning] = useState(false);

  // Update logged_by when currentUser becomes available, only for new cases
  useEffect(() => {
    if (!onboardingCase && (currentUser?.Full_Name || currentUser?.full_name) && formData.logged_by === "") {
      setFormData(prev => ({
        ...prev,
        logged_by: currentUser.Full_Name || currentUser.full_name
      }));
    }
  }, [currentUser, onboardingCase, formData.logged_by]);

  // Auto-calculate status based on dates
  useEffect(() => {
    let calculatedStatus = "initial_contact";
    
    if (formData.rejected_date) {
      calculatedStatus = "rejected";
    } else if (formData.on_hold_date) {
      calculatedStatus = "on_hold";
    } else if (formData.live_date) {
      calculatedStatus = "live";
    } else if (formData.contract_signed_date) {
      calculatedStatus = "contract_signed";
    } else if (formData.contract_preparation_date) {
      calculatedStatus = "contract_preparation";
    } else if (formData.property_inspection_date) {
      calculatedStatus = "property_inspection";
    } else if (formData.documents_received_date) {
      calculatedStatus = "documents_received";
    } else if (formData.documents_requested_date) {
      calculatedStatus = "documents_requested";
    }

    if (formData.onboarding_status !== calculatedStatus) {
      setFormData(prev => ({ ...prev, onboarding_status: calculatedStatus }));
      setShowStatusWarning(true);
      setTimeout(() => setShowStatusWarning(false), 3000);
    }
  }, [formData.initial_contact_date, formData.documents_requested_date, formData.documents_received_date, formData.property_inspection_date, formData.contract_preparation_date, formData.contract_signed_date, formData.live_date, formData.rejected_date, formData.on_hold_date]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const dataToSubmit = {
      ...formData,
      logged_by: formData.logged_by || currentUser?.Full_Name || currentUser?.full_name || "",
      rent_per_week: formData.rent_per_week === "" || isNaN(parseFloat(formData.rent_per_week)) ? null : parseFloat(formData.rent_per_week),
      deposit_amount: formData.deposit_amount === "" || isNaN(parseFloat(formData.deposit_amount)) ? null : parseFloat(formData.deposit_amount)
    };

    // Convert to Supabase format with spaces in column names
    const supabaseData = {
      "Application Date": dataToSubmit.application_date,
      "Landlord Name": dataToSubmit.landlord_name,
      "Landlord Company": dataToSubmit.landlord_company || null,
      "Contact Email": dataToSubmit.contact_email,
      "Contact Phone": dataToSubmit.contact_phone || null,
      "Alternative Contact": dataToSubmit.alternative_contact || null,
      "Property Address": dataToSubmit.property_address,
      "Property Area": dataToSubmit.property_area || null,
      "Property Type": formatEnumForSupabase(dataToSubmit.property_type, 'property_type'),
      "Total Units": dataToSubmit.total_units || null,
      "Detailed Property Layout": dataToSubmit.detailed_property_layout || null,
      "Rent Per Week": dataToSubmit.rent_per_week,
      "Deposit Amount": dataToSubmit.deposit_amount,
      "HMO Ready": dataToSubmit.hmo_ready,
      "HMO Conversion By": formatEnumForSupabase(dataToSubmit.hmo_conversion_by, 'hmo_conversion'),
      "Property Ready": formatEnumForSupabase(dataToSubmit.property_ready, 'yes_no'),
      "Property Ready Date": dataToSubmit.property_ready_date || null,
      "Pictures Provided": formatEnumForSupabase(dataToSubmit.pictures_provided, 'yes_no'),
      "Pictures GDrive Link": dataToSubmit.pictures_gdrive_link || null,
      "Onboarding Status": formatEnumForSupabase(dataToSubmit.onboarding_status, 'onboarding_status'),
      "Assigned To User ID": dataToSubmit.assigned_to_user_id || null,
      "Initial Contact Date": dataToSubmit.initial_contact_date || null,
      "Documents Requested Date": dataToSubmit.documents_requested_date || null,
      "Documents Received Date": dataToSubmit.documents_received_date || null,
      "Property Inspection Date": dataToSubmit.property_inspection_date || null,
      "Contract Preparation Date": dataToSubmit.contract_preparation_date || null,
      "Contract Signed Date": dataToSubmit.contract_signed_date || null,
      "Live Date": dataToSubmit.live_date || null,
      "Rejected Date": dataToSubmit.rejected_date || null,
      "On Hold Date": dataToSubmit.on_hold_date || null,
      "Inspection Date": dataToSubmit.inspection_date || null,
      "Contract Start Date": dataToSubmit.contract_start_date || null,
      "Notes": dataToSubmit.notes || null,
      "Rejection Reason": dataToSubmit.rejection_reason || null,
      "Logged By": dataToSubmit.logged_by || null,
      "Updated Date": new Date().toISOString()
    };

    if (!onboardingCase) {
      supabaseData["Created Date"] = new Date().toISOString();
      supabaseData["Created By"] = currentUser?.Email || currentUser?.email || "Unknown";
      supabaseData["ID"] = crypto.randomUUID();
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
          <Building className="w-5 h-5 text-green-600" />
          {onboardingCase ? "Edit Property Onboarding" : "Start New Property Onboarding"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {showStatusWarning && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Status automatically updated based on the dates you entered.
              </AlertDescription>
            </Alert>
          )}

          {/* Landlord Information */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Landlord Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="landlord_name">Landlord Name *</Label>
                <Input
                  id="landlord_name"
                  value={formData.landlord_name}
                  onChange={(e) => handleChange("landlord_name", e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="landlord_company">Company Name</Label>
                <Input
                  id="landlord_company"
                  value={formData.landlord_company}
                  onChange={(e) => handleChange("landlord_company", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="contact_email">Primary Email *</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => handleChange("contact_email", e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="contact_phone">Primary Phone</Label>
                <Input
                  id="contact_phone"
                  value={formData.contact_phone}
                  onChange={(e) => handleChange("contact_phone", e.target.value)}
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="alternative_contact">Alternative Contact</Label>
                <Input
                  id="alternative_contact"
                  value={formData.alternative_contact}
                  onChange={(e) => handleChange("alternative_contact", e.target.value)}
                  placeholder="Alternative phone, email, or contact person"
                />
              </div>
            </div>
          </div>

          {/* Property Details */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Property Details</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="property_address">Property Address *</Label>
                  <Textarea
                    id="property_address"
                    value={formData.property_address}
                    onChange={(e) => handleChange("property_address", e.target.value)}
                    required
                    rows={2}
                  />
                </div>
                <div>
                  <Label htmlFor="property_area">Property Area</Label>
                  <Input
                    id="property_area"
                    value={formData.property_area}
                    onChange={(e) => handleChange("property_area", e.target.value)}
                    placeholder="e.g., Haringey, Islington, etc."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="property_type">Property Type</Label>
                  <Select value={formData.property_type} onValueChange={(value) => handleChange("property_type", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="shared">Shared</SelectItem>
                      <SelectItem value="en_suites">En-suites</SelectItem>
                      <SelectItem value="shared_en_suites_mixed">Shared/En-suites mixed</SelectItem>
                      <SelectItem value="studio">Studio</SelectItem>
                      <SelectItem value="bedsits">Bedsits</SelectItem>
                      <SelectItem value="flats">Flats</SelectItem>
                      <SelectItem value="standard_house_not_hmo">Standard house (not HMO)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="total_units">Total Units</Label>
                  <Input
                    id="total_units"
                    type="number"
                    min="1"
                    value={formData.total_units}
                    onChange={(e) => handleChange("total_units", parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="rent_per_week">Weekly Rent (£)</Label>
                  <Input
                    id="rent_per_week"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.rent_per_week}
                    onChange={(e) => handleChange("rent_per_week", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="deposit_amount">Deposit Amount (£)</Label>
                  <Input
                    id="deposit_amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.deposit_amount}
                    onChange={(e) => handleChange("deposit_amount", e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="detailed_property_layout">Detailed Property Layout</Label>
                <Textarea
                  id="detailed_property_layout"
                  value={formData.detailed_property_layout}
                  onChange={(e) => handleChange("detailed_property_layout", e.target.value)}
                  rows={3}
                  placeholder="Describe the property layout, room configuration, floor plan, etc."
                />
              </div>

              <div className="border-t pt-4 space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hmo_ready"
                    checked={formData.hmo_ready || false}
                    onCheckedChange={(checked) => {
                      handleChange("hmo_ready", checked);
                      if (checked) {
                        handleChange("hmo_conversion_by", "not_applicable");
                      }
                    }}
                  />
                  <Label htmlFor="hmo_ready" className="text-sm font-medium">
                    HMO Ready
                  </Label>
                </div>

                {!formData.hmo_ready && (
                  <div>
                    <Label htmlFor="hmo_conversion_by">HMO Conversion Completed By</Label>
                    <Select 
                      value={formData.hmo_conversion_by} 
                      onValueChange={(value) => handleChange("hmo_conversion_by", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="not_applicable">Not Applicable</SelectItem>
                        <SelectItem value="landlord">Landlord</SelectItem>
                        <SelectItem value="us">Us</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="property_ready">Property Ready?</Label>
                  <Select value={formData.property_ready} onValueChange={(value) => handleChange("property_ready", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.property_ready === "no" && (
                  <div>
                    <Label htmlFor="property_ready_date">Date Ready</Label>
                    <Input
                      id="property_ready_date"
                      type="date"
                      value={formData.property_ready_date || ""}
                      onChange={(e) => handleChange("property_ready_date", e.target.value)}
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="pictures_provided">Pictures Provided?</Label>
                  <Select value={formData.pictures_provided} onValueChange={(value) => handleChange("pictures_provided", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.pictures_provided === "yes" && (
                  <div>
                    <Label htmlFor="pictures_gdrive_link">Google Drive Link to Pictures</Label>
                    <Input
                      id="pictures_gdrive_link"
                      type="url"
                      value={formData.pictures_gdrive_link || ""}
                      onChange={(e) => handleChange("pictures_gdrive_link", e.target.value)}
                      placeholder="https://drive.google.com/..."
                    />
                    {formData.pictures_gdrive_link && (
                      <a 
                        href={formData.pictures_gdrive_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800 underline mt-1 inline-block"
                      >
                        View pictures on Google Drive →
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Onboarding Status Tracking */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              Onboarding Status Tracking
            </h3>
            <div className="bg-slate-50 rounded-lg p-4 space-y-4 border border-slate-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="initial_contact_date" className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    1. Initial Contact Date *
                  </Label>
                  <Input
                    id="initial_contact_date"
                    type="datetime-local"
                    value={formData.initial_contact_date}
                    onChange={(e) => handleChange("initial_contact_date", e.target.value)}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="documents_requested_date" className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    2. Documents Requested Date
                  </Label>
                  <Input
                    id="documents_requested_date"
                    type="datetime-local"
                    value={formData.documents_requested_date}
                    onChange={(e) => handleChange("documents_requested_date", e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="documents_received_date" className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                    3. Documents Received Date
                  </Label>
                  <Input
                    id="documents_received_date"
                    type="datetime-local"
                    value={formData.documents_received_date}
                    onChange={(e) => handleChange("documents_received_date", e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="property_inspection_date" className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                    4. Property Inspection Date
                  </Label>
                  <Input
                    id="property_inspection_date"
                    type="datetime-local"
                    value={formData.property_inspection_date}
                    onChange={(e) => handleChange("property_inspection_date", e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="contract_preparation_date" className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                    5. Contract Preparation Date
                  </Label>
                  <Input
                    id="contract_preparation_date"
                    type="datetime-local"
                    value={formData.contract_preparation_date}
                    onChange={(e) => handleChange("contract_preparation_date", e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="contract_signed_date" className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-teal-500"></div>
                    6. Contract Signed Date
                  </Label>
                  <Input
                    id="contract_signed_date"
                    type="datetime-local"
                    value={formData.contract_signed_date}
                    onChange={(e) => handleChange("contract_signed_date", e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="live_date" className="flex items-center gap-2 font-semibold text-green-700">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    7. Live Date
                  </Label>
                  <Input
                    id="live_date"
                    type="datetime-local"
                    value={formData.live_date}
                    onChange={(e) => handleChange("live_date", e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="rejected_date" className="flex items-center gap-2 font-semibold text-red-700">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    Rejected Date
                  </Label>
                  <Input
                    id="rejected_date"
                    type="datetime-local"
                    value={formData.rejected_date}
                    onChange={(e) => handleChange("rejected_date", e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="on_hold_date" className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                    On Hold Date
                  </Label>
                  <Input
                    id="on_hold_date"
                    type="datetime-local"
                    value={formData.on_hold_date}
                    onChange={(e) => handleChange("on_hold_date", e.target.value)}
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-300">
                <div className="flex items-center gap-2 mb-2">
                  <Label className="text-base font-semibold text-slate-900">Current Status:</Label>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    formData.onboarding_status === 'live' ? 'bg-green-100 text-green-800' :
                    formData.onboarding_status === 'rejected' ? 'bg-red-100 text-red-800' :
                    formData.onboarding_status === 'on_hold' ? 'bg-gray-100 text-gray-800' :
                    formData.onboarding_status === 'contract_signed' ? 'bg-teal-100 text-teal-800' :
                    formData.onboarding_status === 'contract_preparation' ? 'bg-indigo-100 text-indigo-800' :
                    formData.onboarding_status === 'property_inspection' ? 'bg-purple-100 text-purple-800' :
                    formData.onboarding_status === 'documents_received' ? 'bg-orange-100 text-orange-800' :
                    formData.onboarding_status === 'documents_requested' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {formData.onboarding_status?.toUpperCase().replace(/_/g, ' ')}
                  </div>
                </div>
                <p className="text-sm text-slate-600 italic">
                  Status is automatically determined based on the dates entered above
                </p>
              </div>
            </div>
          </div>

          {/* Assignment & Timeline */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Assignment & Timeline</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="assigned_to_user_id">Assigned To</Label>
                <Select value={formData.assigned_to_user_id || ""} onValueChange={(value) => handleChange("assigned_to_user_id", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select staff member..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>Unassigned</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="Amaani">Amaani</SelectItem>
                    <SelectItem value="Leticia">Leticia</SelectItem>
                    <SelectItem value="Burton">Burton</SelectItem>
                    <SelectItem value="Sulekha">Sulekha</SelectItem>
                    <SelectItem value="Shaila">Shaila</SelectItem>
                    <SelectItem value="Kaitlin">Kaitlin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="inspection_date">Inspection Date & Time</Label>
                <Input
                  id="inspection_date"
                  type="datetime-local"
                  value={formData.inspection_date || ""}
                  onChange={(e) => handleChange("inspection_date", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="contract_start_date">Contract Start Date</Label>
                <Input
                  id="contract_start_date"
                  type="date"
                  value={formData.contract_start_date || ""}
                  onChange={(e) => handleChange("contract_start_date", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="logged_by">Logged By</Label>
                <Input
                  id="logged_by"
                  value={formData.logged_by}
                  onChange={(e) => handleChange("logged_by", e.target.value)}
                  placeholder="Staff member who logged this"
                />
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Additional Information</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="notes">General Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleChange("notes", e.target.value)}
                  rows={3}
                  placeholder="General notes about the onboarding process, conversations, requirements, etc."
                />
              </div>
              {formData.onboarding_status === 'rejected' && (
                <div>
                  <Label htmlFor="rejection_reason">Rejection Reason</Label>
                  <Textarea
                    id="rejection_reason"
                    value={formData.rejection_reason}
                    onChange={(e) => handleChange("rejection_reason", e.target.value)}
                    rows={2}
                    placeholder="Reason for rejecting this property application"
                  />
                </div>
              )}
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
              className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {onboardingCase ? "Update Case" : "Start Onboarding"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}