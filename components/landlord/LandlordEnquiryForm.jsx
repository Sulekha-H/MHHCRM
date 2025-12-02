import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Save, Users, CheckCircle2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function LandlordEnquiryForm({ enquiry, users, currentUser, onSubmit, onCancel }) {
  const getInitialDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const [formData, setFormData] = useState(enquiry ?
    {
      ...enquiry,
      enquiry_date: (enquiry.Enquiry_Date || enquiry.enquiry_date) ? (enquiry.Enquiry_Date || enquiry.enquiry_date).slice(0, 16) : getInitialDateTime(),
      new_date: (enquiry.New_Date || enquiry.new_date) ? (enquiry.New_Date || enquiry.new_date).slice(0, 16) : getInitialDateTime(),
      contacted_date: (enquiry.Contacted_Date || enquiry.contacted_date) ? (enquiry.Contacted_Date || enquiry.contacted_date).slice(0, 16) : "",
      viewing_arranged_date: (enquiry.Viewing_Arranged_Date || enquiry.viewing_arranged_date) ? (enquiry.Viewing_Arranged_Date || enquiry.viewing_arranged_date).slice(0, 16) : "",
      under_assessment_date: (enquiry.Under_Assessment_Date || enquiry.under_assessment_date) ? (enquiry.Under_Assessment_Date || enquiry.under_assessment_date).slice(0, 16) : "",
      accepted_date: (enquiry.Accepted_Date || enquiry.accepted_date) ? (enquiry.Accepted_Date || enquiry.accepted_date).slice(0, 16) : "",
      declined_date: (enquiry.Declined_Date || enquiry.declined_date) ? (enquiry.Declined_Date || enquiry.declined_date).slice(0, 16) : "",
      on_hold_date: (enquiry.On_Hold_Date || enquiry.on_hold_date) ? (enquiry.On_Hold_Date || enquiry.on_hold_date).slice(0, 16) : "",
      next_action_date: (enquiry.Next_Action_Date || enquiry.next_action_date) ? (enquiry.Next_Action_Date || enquiry.next_action_date).slice(0, 10) : "",
      viewing_date: (enquiry.Viewing_Date || enquiry.viewing_date) ? (enquiry.Viewing_Date || enquiry.viewing_date).slice(0, 16) : "",
      // Ensure booleans default to false if null/undefined in existing enquiry
      is_company: enquiry.Is_Company !== null && enquiry.Is_Company !== undefined ? enquiry.Is_Company : (enquiry.is_company || false),
      is_individual: enquiry.Is_Individual !== null && enquiry.Is_Individual !== undefined ? enquiry.Is_Individual : (enquiry.is_individual || false),
      multiple_properties: enquiry.Multiple_Properties !== null && enquiry.Multiple_Properties !== undefined ? enquiry.Multiple_Properties : (enquiry.multiple_properties || false),
      hmo_ready: enquiry.Hmo_Ready !== null && enquiry.Hmo_Ready !== undefined ? enquiry.Hmo_Ready : (enquiry.hmo_ready || false),
      intro_given_to_organisation: enquiry.Intro_Given_To_Organisation !== null && enquiry.Intro_Given_To_Organisation !== undefined ? enquiry.Intro_Given_To_Organisation : (enquiry.intro_given_to_organisation || false),
      follow_up_completed: enquiry.Follow_Up_Completed !== null && enquiry.Follow_Up_Completed !== undefined ? enquiry.Follow_Up_Completed : (enquiry.follow_up_completed || false),
      initial_contact_date: (enquiry.Initial_Contact_Date || enquiry.initial_contact_date) ? (enquiry.Initial_Contact_Date || enquiry.initial_contact_date).slice(0, 16) : "",
      documents_received_date: (enquiry.Documents_Received_Date || enquiry.documents_received_date) ? (enquiry.Documents_Received_Date || enquiry.documents_received_date).slice(0, 16) : "",
      property_inspection_date: (enquiry.Property_Inspection_Date || enquiry.property_inspection_date) ? (enquiry.Property_Inspection_Date || enquiry.property_inspection_date).slice(0, 16) : "",
      contract_preparation_date: (enquiry.Contract_Preparation_Date || enquiry.contract_preparation_date) ? (enquiry.Contract_Preparation_Date || enquiry.contract_preparation_date).slice(0, 16) : "",
      contract_signed_date: (enquiry.Contract_Signed_Date || enquiry.contract_signed_date) ? (enquiry.Contract_Signed_Date || enquiry.contract_signed_date).slice(0, 16) : "",
      live_date: (enquiry.Live_Date || enquiry.live_date) ? (enquiry.Live_Date || enquiry.live_date).slice(0, 16) : "",
      rejected_date: (enquiry.Rejected_Date || enquiry.rejected_date) ? (enquiry.Rejected_Date || enquiry.rejected_date).slice(0, 16) : "",
      inspection_datetime: (enquiry.Inspection_Datetime || enquiry.inspection_datetime) ? (enquiry.Inspection_Datetime || enquiry.inspection_datetime).slice(0, 16) : "",
      contract_start_date: (enquiry.Contract_Start_Date || enquiry.contract_start_date) ? (enquiry.Contract_Start_Date || enquiry.contract_start_date).slice(0, 10) : "",
    }
    : {
      enquiry_date: getInitialDateTime(),
      landlord_name: "",
      is_company: false,
      company_name: "",
      is_individual: false,
      individual_name: "",
      contact_email: "",
      contact_phone: "",
      property_address: "",
      property_area: "",
      property_type: "shared",
      number_of_bedrooms: 1,
      number_of_bathrooms: 1,
      multiple_properties: false,
      hmo_ready: false,
      hmo_conversion_by: "not_applicable",
      property_ready: "yes",
      property_ready_date: "",
      pictures_provided: "no",
      pictures_gdrive_link: "",
      requested_rent_figure: "",
      rent_per_week: "",
      enquiry_source: "website",
      description: "",
      status: "new",
      priority: "medium",
      assigned_to_user_id: "",
      intro_given_to_organisation: false,
      new_date: getInitialDateTime(),
      contacted_date: "",
      viewing_arranged_date: "",
      under_assessment_date: "",
      accepted_date: "",
      declined_date: "",
      on_hold_date: "",
      next_action_date: "",
      viewing_date: "",
      follow_up_action: "",
      follow_up_completed: false,
      notes: "",
      logged_by: "",
      initial_contact_date: "",
      documents_received_date: "",
      property_inspection_date: "",
      contract_preparation_date: "",
      contract_signed_date: "",
      live_date: "",
      rejected_date: "",
      inspection_datetime: "",
      contract_start_date: ""
    });

  const [showStatusWarning, setShowStatusWarning] = useState(false);

  // Update logged_by when currentUser becomes available, only for new enquiries
  useEffect(() => {
    if (!enquiry && currentUser?.user_metadata?.full_name && formData.logged_by === "") {
      setFormData(prev => ({
        ...prev,
        logged_by: currentUser.user_metadata.full_name
      }));
    }
  }, [currentUser, enquiry, formData.logged_by]);

  // Auto-calculate status based on dates
  useEffect(() => {
    let calculatedStatus = "new";

    if (formData.declined_date) {
      calculatedStatus = "declined";
    } else if (formData.accepted_date) {
      calculatedStatus = "accepted";
    } else if (formData.on_hold_date) {
      calculatedStatus = "on_hold";
    } else if (formData.under_assessment_date) {
      calculatedStatus = "under_assessment";
    } else if (formData.viewing_arranged_date) {
      calculatedStatus = "viewing_arranged";
    } else if (formData.contacted_date) {
      calculatedStatus = "contacted";
    }

    if (formData.status !== calculatedStatus) {
      setFormData(prev => ({ ...prev, status: calculatedStatus }));
      setShowStatusWarning(true);
      setTimeout(() => setShowStatusWarning(false), 3000);
    }
  }, [formData.new_date, formData.contacted_date, formData.viewing_arranged_date, formData.under_assessment_date, formData.accepted_date, formData.declined_date, formData.on_hold_date, formData.status]);

  const handleSubmit = (e) => {
    e.preventDefault();

    const submitData = {
      ...formData,
      rent_per_week: formData.rent_per_week === "" || isNaN(Number(formData.rent_per_week)) ? null : Number(formData.rent_per_week),
      requested_rent_figure: formData.requested_rent_figure === "" || isNaN(Number(formData.requested_rent_figure)) ? null : Number(formData.requested_rent_figure),
      logged_by: formData.logged_by || currentUser?.user_metadata?.full_name || ""
    };

    onSubmit(submitData);
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
          <Users className="w-5 h-5 text-blue-600" />
          {enquiry ? "Edit Landlord Enquiry" : "Add New Landlord Enquiry"}
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
            <div className="space-y-4">
              <div>
                <Label htmlFor="landlord_name">Landlord Name *</Label>
                <Input
                  id="landlord_name"
                  value={formData.landlord_name}
                  onChange={(e) => handleChange("landlord_name", e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="is_company"
                      checked={formData.is_company || false}
                      onCheckedChange={(checked) => handleChange("is_company", checked)}
                    />
                    <Label htmlFor="is_company" className="font-medium">Company</Label>
                  </div>
                  {formData.is_company && (
                    <Input
                      placeholder="Company name"
                      value={formData.company_name}
                      onChange={(e) => handleChange("company_name", e.target.value)}
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="is_individual"
                      checked={formData.is_individual || false}
                      onCheckedChange={(checked) => handleChange("is_individual", checked)}
                    />
                    <Label htmlFor="is_individual" className="font-medium">Individual</Label>
                  </div>
                  {formData.is_individual && (
                    <Input
                      placeholder="Individual name"
                      value={formData.individual_name}
                      onChange={(e) => handleChange("individual_name", e.target.value)}
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contact_email">Email Address *</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => handleChange("contact_email", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="contact_phone">Phone Number</Label>
                  <Input
                    id="contact_phone"
                    value={formData.contact_phone}
                    onChange={(e) => handleChange("contact_phone", e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="enquiry_source">How did they contact us?</Label>
                <Select value={formData.enquiry_source} onValueChange={(value) => handleChange("enquiry_source", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="website">Website</SelectItem>
                    <SelectItem value="phone_call">Phone Call</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="referral">Referral</SelectItem>
                    <SelectItem value="walk_in">Walk-in</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
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

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                  <Label htmlFor="number_of_bedrooms">Number of Bedrooms</Label>
                  <Input
                    id="number_of_bedrooms"
                    type="number"
                    min="1"
                    value={formData.number_of_bedrooms}
                    onChange={(e) => handleChange("number_of_bedrooms", parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="number_of_bathrooms">Number of Bathrooms</Label>
                  <Input
                    id="number_of_bathrooms"
                    type="number"
                    min="1"
                    value={formData.number_of_bathrooms}
                    onChange={(e) => handleChange("number_of_bathrooms", parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="requested_rent_figure">Requested Rent Figure (£/week)</Label>
                  <Input
                    id="requested_rent_figure"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.requested_rent_figure}
                    onChange={(e) => handleChange("requested_rent_figure", e.target.value)}
                    placeholder="£"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2 pt-6">
                  <Checkbox
                    id="multiple_properties"
                    checked={formData.multiple_properties || false}
                    onCheckedChange={(checked) => handleChange("multiple_properties", checked)}
                  />
                  <Label htmlFor="multiple_properties" className="text-sm font-medium">
                    Multiple Properties
                  </Label>
                </div>
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
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="description">Property Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  rows={3}
                  placeholder="Details about the property, facilities, condition, etc."
                />
              </div>
            </div>
          </div>

          {/* Status Tracking */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              Status Tracking
            </h3>
            <div className="bg-slate-50 rounded-lg p-4 space-y-4 border border-slate-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="new_date" className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    1. New Enquiry Date *
                  </Label>
                  <Input
                    id="new_date"
                    type="datetime-local"
                    value={formData.new_date}
                    onChange={(e) => handleChange("new_date", e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="contacted_date" className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    2. Contacted Date
                  </Label>
                  <Input
                    id="contacted_date"
                    type="datetime-local"
                    value={formData.contacted_date}
                    onChange={(e) => handleChange("contacted_date", e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="viewing_arranged_date" className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                    3. Viewing Arranged Date
                  </Label>
                  <Input
                    id="viewing_arranged_date"
                    type="datetime-local"
                    value={formData.viewing_arranged_date}
                    onChange={(e) => handleChange("viewing_arranged_date", e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="under_assessment_date" className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                    4. Under Assessment Date
                  </Label>
                  <Input
                    id="under_assessment_date"
                    type="datetime-local"
                    value={formData.under_assessment_date}
                    onChange={(e) => handleChange("under_assessment_date", e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="accepted_date" className="flex items-center gap-2 font-semibold text-green-700">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    5. Accepted Date
                  </Label>
                  <Input
                    id="accepted_date"
                    type="datetime-local"
                    value={formData.accepted_date}
                    onChange={(e) => handleChange("accepted_date", e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="declined_date" className="flex items-center gap-2 font-semibold text-red-700">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    Declined Date
                  </Label>
                  <Input
                    id="declined_date"
                    type="datetime-local"
                    value={formData.declined_date}
                    onChange={(e) => handleChange("declined_date", e.target.value)}
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
                    formData.status === 'accepted' ? 'bg-green-100 text-green-800' :
                    formData.status === 'declined' ? 'bg-red-100 text-red-800' :
                    formData.status === 'on_hold' ? 'bg-gray-100 text-gray-800' :
                    formData.status === 'under_assessment' ? 'bg-orange-100 text-orange-800' :
                    formData.status === 'viewing_arranged' ? 'bg-purple-100 text-purple-800' :
                    formData.status === 'contacted' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {formData.status?.toUpperCase().replace(/_/g, ' ')}
                  </div>
                </div>
                <p className="text-sm text-slate-600 italic">
                  Status is automatically determined based on the dates entered above
                </p>
              </div>
            </div>
          </div>

          {/* Assignment & Priority */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Assignment & Priority</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select value={formData.priority} onValueChange={(value) => handleChange("priority", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="assigned_to_user_id">Assigned To</Label>
                <div className="flex items-center gap-3">
                  <Select value={formData.assigned_to_user_id || ""} onValueChange={(value) => handleChange("assigned_to_user_id", value)} className="flex-1">
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
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="intro_given_to_organisation"
                      checked={formData.intro_given_to_organisation || false}
                      onCheckedChange={(checked) => handleChange("intro_given_to_organisation", checked)}
                    />
                    <Label htmlFor="intro_given_to_organisation" className="text-sm font-medium whitespace-nowrap">
                      Intro given to organisation
                    </Label>
                  </div>
                </div>
              </div>
              <div className="md:col-span-2">
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

          {/* Follow-up Actions */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Follow-up Actions</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="next_action_date">Next Action Date</Label>
                  <Input
                    id="next_action_date"
                    type="date"
                    value={formData.next_action_date || ""}
                    onChange={(e) => handleChange("next_action_date", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="viewing_date">Viewing Date & Time</Label>
                  <Input
                    id="viewing_date"
                    type="datetime-local"
                    value={formData.viewing_date || ""}
                    onChange={(e) => handleChange("viewing_date", e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="follow_up_action">Follow-up Action Required</Label>
                <Textarea
                  id="follow_up_action"
                  value={formData.follow_up_action || ""}
                  onChange={(e) => handleChange("follow_up_action", e.target.value)}
                  placeholder="Describe any follow-up action needed..."
                  rows={2}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="follow_up_completed"
                  checked={formData.follow_up_completed || false}
                  onCheckedChange={(checked) => handleChange("follow_up_completed", checked)}
                />
                <Label htmlFor="follow_up_completed" className="text-sm font-medium">
                  Follow-up action completed
                </Label>
              </div>
            </div>
          </div>

          {/* Additional Notes */}
          <div>
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              rows={3}
              placeholder="Additional notes about the enquiry, conversations, etc."
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Save className="w-4 h-4 mr-2" />
              {enquiry ? "Update Enquiry" : "Add Enquiry"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}