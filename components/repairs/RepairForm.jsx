"use client"

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Save, Wrench, File, CheckCircle2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { format } from "date-fns";

export default function RepairForm({ repair, accommodations, properties, onSubmit, onCancel }) {
  const getInitialDateTime = () => {
    if (repair?.Reported_Date || repair?.reported_date) {
      const date = repair.Reported_Date || repair.reported_date;
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

  const [formData, setFormData] = useState(repair ? 
    {
      title: repair.Title || repair.title || repair["Title"] || "",
      property_id: repair.Property_Id || repair.property_id || repair["Property ID"] || "",
      accommodation_id: repair.Accommodation_Id || repair.accommodation_id || repair["Accommodation ID"] || "",
      common_area: repair.Common_Area || repair.common_area || repair["Common Area"] || "",
      repair_type: repair.Repair_Type || repair.repair_type || "other",
      priority: repair.Priority || repair.priority || "medium",
      status: repair.Status || repair.status || "reported",
      description: repair.Description || repair.description || "",
      reported_by: repair.Reported_By || repair.reported_by || "",
      reported_by_type: repair.Reported_By_Type || repair.reported_by_type || "staff",
      logged_by: repair.Logged_By || repair.logged_by || "",
      reported_on_fiixit: repair.Reported_On_Fiixit || repair.reported_on_fiixit || "n_a",
      fiixit_updated: repair.Fiixit_Updated || repair.fiixit_updated || "n_a",
      reported_date: repair.Reported_Date ? repair.Reported_Date.slice(0, 16) : (repair.reported_date ? repair.reported_date.slice(0, 16) : getInitialDateTime()),
      assessed_date: repair.Assessed_Date ? repair.Assessed_Date.slice(0, 16) : (repair.assessed_date ? repair.assessed_date.slice(0, 16) : ""),
      scheduled_date: repair.Scheduled_Date ? repair.Scheduled_Date.slice(0, 16) : (repair.scheduled_date ? repair.scheduled_date.slice(0, 16) : ""),
      in_progress_date: repair.In_Progress_Date ? repair.In_Progress_Date.slice(0, 16) : (repair.in_progress_date ? repair.in_progress_date.slice(0, 16) : ""),
      completed_date: repair.Completed_Date ? repair.Completed_Date.slice(0, 16) : (repair.completed_date ? repair.completed_date.slice(0, 16) : ""),
      date_fixed: repair.Date_Fixed ? repair.Date_Fixed.slice(0, 16) : (repair.date_fixed ? repair.date_fixed.slice(0, 16) : ""),
      is_cancelled: repair.Is_Cancelled !== null && repair.Is_Cancelled !== undefined ? repair.Is_Cancelled : (repair.is_cancelled || false),
      cancellation_reason: repair.Cancellation_Reason || repair.cancellation_reason || "",
      cancelled_date: repair.Cancelled_Date ? repair.Cancelled_Date.slice(0, 16) : (repair.cancelled_date ? repair.cancelled_date.slice(0, 16) : ""),
      contractor: repair.Contractor || repair.contractor || "",
      contractor_contact: repair.Contractor_Contact || repair.contractor_contact || "",
      estimated_cost: repair.Estimated_Cost || repair.estimated_cost || 0,
      invoice_not_applicable: repair.Invoice_Not_Applicable !== null && repair.Invoice_Not_Applicable !== undefined ? repair.Invoice_Not_Applicable : (repair.invoice_not_applicable || false),
      invoice_received_date: repair.Invoice_Received_Date || repair.invoice_received_date || "",
      invoice_received_from: repair.Invoice_Received_From || repair.invoice_received_from || "",
      invoice_amount: repair.Invoice_Amount || repair.invoice_amount || 0,
      payment_due_date: repair.Payment_Due_Date || repair.payment_due_date || "",
      date_invoice_paid: repair.Date_Invoice_Paid || repair.date_invoice_paid || "",
      invoice_number: repair.Invoice_Number || repair.invoice_number || "",
      invoice_payment_status: repair.Invoice_Payment_Status || repair.invoice_payment_status || "unpaid",
      invoice_file_url: repair.Invoice_File_Url || repair.invoice_file_url || "",
      notes: repair.Notes || repair.notes || "",
      images: repair.Images || repair.images || [],
      logged_via: repair.Logged_Via || repair.logged_via || repair["Logged Via"] || null,
      created_date: repair["Created Date"] || repair.Created_Date || repair.created_date || ""
    } 
    : {
      title: "",
      property_id: "",
      accommodation_id: "",
      common_area: "",
      repair_type: "other",
      priority: "medium",
      status: "reported",
      description: "",
      reported_by: "",
      reported_by_type: "staff",
      logged_by: "",
      reported_on_fiixit: "n_a",
      fiixit_updated: "n_a",
      reported_date: getInitialDateTime(),
      assessed_date: "",
      scheduled_date: "",
      in_progress_date: "",
      completed_date: "",
      date_fixed: "",
      is_cancelled: false,
      cancellation_reason: "",
      cancelled_date: "",
      contractor: "",
      contractor_contact: "",
      estimated_cost: 0,
      invoice_not_applicable: false,
      invoice_received_date: "",
      invoice_received_from: "",
      invoice_amount: 0,
      payment_due_date: "",
      date_invoice_paid: "",
      invoice_number: "",
      invoice_payment_status: "unpaid",
      invoice_file_url: "",
      notes: "",
      images: [],
      logged_via: null,
      created_date: ""
    });

  const [locationType, setLocationType] = useState(() => {
    if (repair?.Accommodation_Id || repair?.accommodation_id || repair?.["Accommodation ID"]) return "unit";
    if (repair?.Common_Area || repair?.common_area || repair?.["Common Area"]) return "common";
    return "common";
  });

  const [showStatusWarning, setShowStatusWarning] = useState(false);

  // Calculate current status based on dates
  useEffect(() => {
    if (formData.is_cancelled) {
      if (formData.status !== "cancelled") {
        setFormData(prev => ({ ...prev, status: "cancelled" }));
      }
      return;
    }

    let calculatedStatus = "reported";
    
    if (formData.date_fixed || formData.completed_date) {
      calculatedStatus = "completed";
    } else if (formData.in_progress_date) {
      calculatedStatus = "in_progress";
    } else if (formData.scheduled_date) {
      calculatedStatus = "scheduled";
    } else if (formData.assessed_date) {
      calculatedStatus = "assessed";
    }

    if (formData.status !== calculatedStatus) {
      setFormData(prev => ({ ...prev, status: calculatedStatus }));
      setShowStatusWarning(true);
      setTimeout(() => setShowStatusWarning(false), 3000);
    }
  }, [formData.assessed_date, formData.scheduled_date, formData.in_progress_date, formData.completed_date, formData.date_fixed, formData.is_cancelled, formData.status]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const submitData = { ...formData };
    if (locationType === "common") {
      submitData.accommodation_id = null;
    } else {
      submitData.common_area = null;
    }

    // If cancelled, set cancelled_date
    if (submitData.is_cancelled && !submitData.cancelled_date) {
      submitData.cancelled_date = new Date().toISOString();
    }

    // If not cancelled, clear cancellation fields
    if (!submitData.is_cancelled) {
      submitData.cancelled_date = "";
      submitData.cancellation_reason = "";
    }

    // If invoice is not applicable, clear invoice-related fields
    if (submitData.invoice_not_applicable) {
      submitData.invoice_received_date = "";
      submitData.invoice_received_from = "";
      submitData.invoice_amount = 0;
      submitData.payment_due_date = "";
      submitData.date_invoice_paid = "";
      submitData.invoice_number = "";
      submitData.invoice_payment_status = "unpaid";
      submitData.invoice_file_url = "";
    }
    
    // Set updated date
    submitData.updated_date = new Date().toISOString();

    // Send data to parent handler
    onSubmit(submitData);
  };

  const handleChange = (field, value) => {
    console.log(`Field ${field} changed to:`, value); // Debug log
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Clear accommodation_id when property changes or location type changes
  useEffect(() => {
    if (locationType === "unit" && formData.property_id) {
      const currentPropertyAccommodations = accommodations?.filter(acc => 
        String(acc.Property_Id || acc.property_id || acc["Property ID"]) === String(formData.property_id)
      );
      const isCurrentAccommodationValid = currentPropertyAccommodations?.some(acc => 
        String(acc.Id || acc.id || acc["ID"]) === String(formData.accommodation_id)
      );

      if (!isCurrentAccommodationValid && formData.accommodation_id) {
        setFormData(prev => ({ ...prev, accommodation_id: "" }));
      }
    } else if (locationType === "common" && formData.accommodation_id) {
      setFormData(prev => ({ ...prev, accommodation_id: "" }));
    }
    
    if (locationType === "unit" && formData.common_area) {
      setFormData(prev => ({ ...prev, common_area: "" }));
    }
  }, [formData.property_id, formData.accommodation_id, formData.common_area, locationType, accommodations]);

  return (
    <Card className="mb-6 shadow-md">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Wrench className="w-5 h-5 text-orange-600" />
          {repair ? "Edit Repair" : "Report New Repair"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {showStatusWarning && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Status automatically updated based on the dates you've entered.
              </AlertDescription>
            </Alert>
          )}

          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-8 mt-2">Repair Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="entry_date_time">Entry Date & Time</Label>
                <Input
                  id="entry_date_time"
                  value={formData.created_date ? format(new Date(formData.created_date), 'dd/MM/yyyy HH:mm') : format(new Date(), 'dd/MM/yyyy HH:mm')}
                  disabled
                  className="bg-slate-100 cursor-not-allowed text-slate-500"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  placeholder="Brief description of the repair needed"
                  required
                />
              </div>
              <div>
                <Label htmlFor="repair_type">Repair Type *</Label>
                <Select value={formData.repair_type} onValueChange={(value) => handleChange("repair_type", value)}>
                  <SelectTrigger id="repair_type_trigger">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper" sideOffset={5}>
                    <SelectItem value="plumbing">Plumbing</SelectItem>
                    <SelectItem value="electrical">Electrical</SelectItem>
                    <SelectItem value="heating">Heating</SelectItem>
                    <SelectItem value="decoration">Decoration</SelectItem>
                    <SelectItem value="appliance">Appliance</SelectItem>
                    <SelectItem value="structural">Structural</SelectItem>
                    <SelectItem value="security">Security</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="priority">Priority *</Label>
                <Select value={formData.priority} onValueChange={(value) => handleChange("priority", value)}>
                  <SelectTrigger id="priority_trigger">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper" sideOffset={5}>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Location Information */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-8 mt-2">Location</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="property_id">Property *</Label>
                <Select 
                  value={formData.property_id || ""} 
                  onValueChange={(value) => {
                    console.log("Property selected - raw value:", value);
                    console.log("Current formData.property_id:", formData.property_id);
                    console.log("Available properties:", properties?.map(p => ({
                      id: p.ID || p.Id || p.id || p["ID"],
                      name: p.Name || p.name || p["Name"]
                    })));
                    handleChange("property_id", value);
                  }} 
                  required
                >
                  <SelectTrigger id="property_id">
                    <SelectValue placeholder="Select property" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties?.map((property) => {
                      const propertyId = property.ID || property.Id || property.id || property["ID"];
                      const propertyName = property.Name || property.name || property["Name"];
                      console.log("Rendering property:", { propertyId, propertyName });
                      return (
                        <SelectItem key={propertyId} value={String(propertyId)}>
                          {propertyName}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                {formData.property_id && (
                  <p className="text-xs text-green-600 mt-1">
                    ✓ Property selected: {properties?.find(p => 
                      String(p.ID || p.Id || p.id || p["ID"]) === String(formData.property_id)
                    )?.Name || properties?.find(p => 
                      String(p.ID || p.Id || p.id || p["ID"]) === String(formData.property_id)
                    )?.name || "Unknown"}
                  </p>
                )}
              </div>
              
              <div>
                <Label htmlFor="location_type">Location Type *</Label>
                <Select value={locationType} onValueChange={setLocationType}>
                  <SelectTrigger id="location_type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="common">Common Area</SelectItem>
                    <SelectItem value="unit">Specific Unit</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {locationType === "common" ? (
                <div className="md:col-span-2">
                  <Label htmlFor="common_area">Common Area *</Label>
                  <Select value={formData.common_area || ""} onValueChange={(value) => handleChange("common_area", value)} required>
                    <SelectTrigger id="common_area">
                      <SelectValue placeholder="Select common area" />
                    </SelectTrigger>
                    <SelectContent position="popper" sideOffset={5}>
                      <SelectItem value="general_property">General Property</SelectItem>
                      <SelectItem value="communal_kitchen">Communal Kitchen</SelectItem>
                      <SelectItem value="communal_bathroom">Communal Bathroom</SelectItem>
                      <SelectItem value="hall_way">Hall Way</SelectItem>
                      <SelectItem value="front_door">Front Door</SelectItem>
                      <SelectItem value="back_door">Back Door</SelectItem>
                      <SelectItem value="front_garden">Front Garden</SelectItem>
                      <SelectItem value="back_garden">Back Garden</SelectItem>
                      <SelectItem value="lounge">Lounge</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="md:col-span-2">
                  <Label htmlFor="accommodation_id">Accommodation Unit *</Label>
                  <Select 
                    value={formData.accommodation_id || ""} 
                    onValueChange={(value) => handleChange("accommodation_id", value)} 
                    required
                  >
                    <SelectTrigger id="accommodation_id">
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {formData.property_id ? (
                        accommodations
                          ?.filter(acc => {
                            const accPropertyId = String(acc.Property_Id || acc.property_id || acc["Property ID"] || "");
                            const currentPropertyId = String(formData.property_id);
                            return accPropertyId === currentPropertyId;
                          })
                          .length > 0 ? (
                            accommodations
                              ?.filter(acc => {
                                const accPropertyId = String(acc.Property_Id || acc.property_id || acc["Property ID"] || "");
                                const currentPropertyId = String(formData.property_id);
                                return accPropertyId === currentPropertyId;
                              })
                              .map((accommodation) => {
                                const accId = accommodation.ID || accommodation.Id || accommodation.id || accommodation["ID"];
                                const roomNumber = accommodation.Room_Number || accommodation.room_number || accommodation["Room Number"];
                                return (
                                  <SelectItem key={accId} value={String(accId)}>
                                    {roomNumber}
                                  </SelectItem>
                                );
                              })
                          ) : (
                            <SelectItem value="no_units" disabled>
                              No units available for this property
                            </SelectItem>
                          )
                      ) : (
                        <SelectItem value="select_property" disabled>
                          Please select a property first
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {formData.property_id && accommodations?.filter(acc => {
                    const accPropertyId = String(acc.Property_Id || acc.property_id || acc["Property ID"] || "");
                    const currentPropertyId = String(formData.property_id);
                    return accPropertyId === currentPropertyId;
                  }).length === 0 && (
                    <p className="text-sm text-amber-600 mt-1">
                      No accommodation units found for this property. You may need to add units first.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-8 mt-2">Description</h3>
            <div>
              <Label htmlFor="description">Detailed Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Provide detailed information about the repair needed"
                rows={4}
              />
            </div>
          </div>

          {/* Reporting Information */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-8 mt-2">Reporting Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="reported_by">Reported By *</Label>
                <Input
                  id="reported_by"
                  value={formData.reported_by}
                  onChange={(e) => handleChange("reported_by", e.target.value)}
                  placeholder="Name of person reporting"
                  required
                />
              </div>
              <div>
                <Label htmlFor="reported_by_type">Reported By Type</Label>
                <Select value={formData.reported_by_type} onValueChange={(value) => handleChange("reported_by_type", value)}>
                  <SelectTrigger id="reported_by_type_trigger">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper" sideOffset={5}>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="support_worker">Support Worker</SelectItem>
                    <SelectItem value="tenant">Tenant</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="reported_on_fiixit">Reported on Fiixit</Label>
                <Select value={formData.reported_on_fiixit || "n_a"} onValueChange={(value) => handleChange("reported_on_fiixit", value)}>
                  <SelectTrigger id="reported_on_fiixit_trigger">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper" sideOffset={5}>
                    <SelectItem value="n_a">N/A</SelectItem>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="logged_by">Logged By</Label>
                <Input
                  id="logged_by"
                  value={formData.logged_by}
                  onChange={(e) => handleChange("logged_by", e.target.value)}
                  placeholder="Staff member logging this entry"
                />
              </div>
            </div>
          </div>

          {/* Status Tracking with Dates */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-8 mt-2 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              Status Tracking
            </h3>
            <div className="bg-slate-50 rounded-lg p-4 space-y-4 border border-slate-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="reported_date" className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                    1. Reported Date & Time *
                  </Label>
                  <Input
                    id="reported_date"
                    type="datetime-local"
                    value={formData.reported_date}
                    onChange={(e) => handleChange("reported_date", e.target.value)}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="assessed_date" className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    2. Assessed Date & Time
                  </Label>
                  <Input
                    id="assessed_date"
                    type="datetime-local"
                    value={formData.assessed_date}
                    onChange={(e) => handleChange("assessed_date", e.target.value)}
                  />
                  <p className="text-xs text-slate-500 mt-1">When the repair was assessed</p>
                </div>

                <div>
                  <Label htmlFor="scheduled_date" className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    3. Scheduled Date & Time
                  </Label>
                  <Input
                    id="scheduled_date"
                    type="datetime-local"
                    value={formData.scheduled_date}
                    onChange={(e) => handleChange("scheduled_date", e.target.value)}
                  />
                  <p className="text-xs text-slate-500 mt-1">When the repair is scheduled for</p>
                </div>

                <div>
                  <Label htmlFor="in_progress_date" className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                    4. Work Started Date & Time
                  </Label>
                  <Input
                    id="in_progress_date"
                    type="datetime-local"
                    value={formData.in_progress_date}
                    onChange={(e) => handleChange("in_progress_date", e.target.value)}
                  />
                  <p className="text-xs text-slate-500 mt-1">When work actually started</p>
                </div>

                <div>
                  <Label htmlFor="date_fixed" className="flex items-center gap-2 font-semibold text-green-700">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    5. Date Fixed
                  </Label>
                  <Input
                    id="date_fixed"
                    type="datetime-local"
                    value={formData.date_fixed}
                    onChange={(e) => handleChange("date_fixed", e.target.value)}
                  />
                  <p className="text-xs text-green-600 mt-1 font-medium">
                    ✓ Entering this date will mark the repair as COMPLETED
                  </p>
                </div>

                <div>
                  <Label htmlFor="completed_date" className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    Completion Date & Time
                  </Label>
                  <Input
                    id="completed_date"
                    type="datetime-local"
                    value={formData.completed_date}
                    onChange={(e) => handleChange("completed_date", e.target.value)}
                  />
                  <p className="text-xs text-slate-500 mt-1">Official completion date</p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-300">
                <div className="flex items-center gap-2 mb-3">
                  <Label className="text-base font-semibold text-slate-900">Current Status:</Label>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    formData.status === 'completed' ? 'bg-green-100 text-green-800' :
                    formData.status === 'in_progress' ? 'bg-indigo-100 text-indigo-800' :
                    formData.status === 'scheduled' ? 'bg-yellow-100 text-yellow-800' :
                    formData.status === 'assessed' ? 'bg-blue-100 text-blue-800' :
                    formData.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {formData.status?.toUpperCase()}
                  </div>
                </div>
                <p className="text-sm text-slate-600 italic">
                  Status is automatically determined based on the dates entered above
                </p>
              </div>

              {/* Fiixit Updated after completion */}
              <div className="pt-4 border-t border-slate-300">
                <Label htmlFor="fiixit_updated" className="text-base font-semibold text-slate-900 mb-2 block">
                  Fiixit Updated after completion?
                </Label>
                <Select value={formData.fiixit_updated} onValueChange={(value) => handleChange("fiixit_updated", value)}>
                  <SelectTrigger id="fiixit_updated_trigger" className="max-w-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper" sideOffset={5}>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                    <SelectItem value="n_a">N/A</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500 mt-1">
                  Select whether Fiixit system has been updated after repair completion
                </p>
              </div>
            </div>
          </div>

          {/* Cancellation */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-8 mt-2 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              Cancellation
            </h3>
            <div className="bg-red-50 rounded-lg p-4 space-y-4 border border-red-200">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_cancelled"
                  checked={formData.is_cancelled}
                  onCheckedChange={(checked) => handleChange("is_cancelled", checked)}
                />
                <Label htmlFor="is_cancelled" className="text-base font-medium text-red-900">
                  Mark this repair as cancelled
                </Label>
              </div>
              
              {formData.is_cancelled && (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="cancellation_reason">Cancellation Reason *</Label>
                    <Textarea
                      id="cancellation_reason"
                      value={formData.cancellation_reason}
                      onChange={(e) => handleChange("cancellation_reason", e.target.value)}
                      placeholder="Please provide a reason for cancelling this repair..."
                      rows={3}
                      required={formData.is_cancelled}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cancelled_date">Cancelled Date & Time</Label>
                    <Input
                      id="cancelled_date"
                      type="datetime-local"
                      value={formData.cancelled_date}
                      onChange={(e) => handleChange("cancelled_date", e.target.value)}
                    />
                    <p className="text-xs text-slate-500 mt-1">Auto-filled if left blank</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Contractor Information */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-8 mt-2">Contractor Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contractor">Contractor/Repair Person</Label>
                <Input
                  id="contractor"
                  value={formData.contractor}
                  onChange={(e) => handleChange("contractor", e.target.value)}
                  placeholder="Name of contractor or repair person"
                />
              </div>
              <div>
                <Label htmlFor="contractor_contact">Contractor Contact Number</Label>
                <Input
                  id="contractor_contact"
                  value={formData.contractor_contact}
                  onChange={(e) => handleChange("contractor_contact", e.target.value)}
                  placeholder="Phone number of contractor"
                />
              </div>
              <div>
                <Label htmlFor="estimated_cost">Estimated Cost (£)</Label>
                <Input
                  id="estimated_cost"
                  type="number"
                  step="0.01"
                  value={formData.estimated_cost}
                  onChange={(e) => handleChange("estimated_cost", parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
          </div>

          {/* Invoice Details */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-8 mt-2 border-t pt-6">Invoice Details</h3>
            
            <div className="mb-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="invoice_not_applicable"
                  checked={formData.invoice_not_applicable}
                  onCheckedChange={(checked) => handleChange("invoice_not_applicable", checked)}
                />
                <Label htmlFor="invoice_not_applicable" className="text-base font-medium text-slate-900 cursor-pointer">
                  Invoice Not Applicable (N/A)
                </Label>
              </div>
              <p className="text-sm text-slate-600 mt-2 ml-6">
                Check this box if no invoice is expected for this repair
              </p>
            </div>

            {!formData.invoice_not_applicable && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="invoice_received_date">Date Repair Invoice Received</Label>
                  <Input
                    id="invoice_received_date"
                    type="date"
                    value={formData.invoice_received_date}
                    onChange={(e) => handleChange("invoice_received_date", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="invoice_received_from">Invoice Received From</Label>
                  <Input
                    id="invoice_received_from"
                    value={formData.invoice_received_from}
                    onChange={(e) => handleChange("invoice_received_from", e.target.value)}
                    placeholder="Company or person who sent the invoice"
                  />
                </div>
                <div>
                  <Label htmlFor="invoice_amount">Invoice Amount (£)</Label>
                  <Input
                    id="invoice_amount"
                    type="number"
                    step="0.01"
                    value={formData.invoice_amount}
                    onChange={(e) => handleChange("invoice_amount", parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label htmlFor="payment_due_date">Payment Due Date</Label>
                  <Input
                    id="payment_due_date"
                    type="date"
                    value={formData.payment_due_date}
                    onChange={(e) => handleChange("payment_due_date", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="date_invoice_paid">Date Invoice Was Paid</Label>
                  <Input
                    id="date_invoice_paid"
                    type="date"
                    value={formData.date_invoice_paid}
                    onChange={(e) => handleChange("date_invoice_paid", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="invoice_number">Invoice Number</Label>
                  <Input
                    id="invoice_number"
                    value={formData.invoice_number}
                    onChange={(e) => handleChange("invoice_number", e.target.value)}
                    placeholder="Invoice reference number"
                  />
                </div>
                <div>
                  <Label htmlFor="invoice_payment_status">Payment Status</Label>
                  <Select value={formData.invoice_payment_status} onValueChange={(value) => handleChange("invoice_payment_status", value)}>
                    <SelectTrigger id="invoice_payment_status_trigger"><SelectValue /></SelectTrigger>
                    <SelectContent position="popper" sideOffset={5}>
                      <SelectItem value="unpaid">Unpaid</SelectItem>
                      <SelectItem value="partially_paid">Partially Paid</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="lg:col-span-2">
                  <Label htmlFor="invoice_file_url">Invoice File URL</Label>
                  {formData.invoice_file_url ? (
                     <div className="flex items-center gap-2">
                       <File className="w-4 h-4 text-green-600"/>
                       <a href={formData.invoice_file_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline truncate">
                         View Uploaded Invoice
                       </a>
                       <Button variant="ghost" size="icon" onClick={() => handleChange("invoice_file_url", "")}>
                         <X className="w-4 h-4" />
                       </Button>
                     </div>
                  ) : (
                    <div>
                      <Input
                        id="invoice_file_url"
                        type="url"
                        value={formData.invoice_file_url}
                        onChange={(e) => handleChange("invoice_file_url", e.target.value)}
                        placeholder="https://gdrive.com/invoice.pdf"
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        Please enter a valid URL (must start with http:// or https://)
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Additional Notes */}
          <div>
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder="Any additional notes about the repair"
              rows={3}
            />
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
              className="bg-orange-600 hover:bg-orange-700 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {repair ? "Update Repair" : "Report Repair"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}