import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Save, Building2, Zap, Plus, Edit, Trash2 } from "lucide-react";
import UtilityForm from "@/components/utilities/UtilityForm";
import { useClerkSupabaseClient } from "@/lib/supabaseClient";
import { format } from "date-fns";

export default function PropertyForm({ property, onSubmit, onCancel }) {
  const supabase = useClerkSupabaseClient();
  const [propertyUtilities, setPropertyUtilities] = useState([]);
  const [showUtilityForm, setShowUtilityForm] = useState(false);
  const [editingUtility, setEditingUtility] = useState(null);
  const [loadingUtilities, setLoadingUtilities] = useState(false);

  const [formData, setFormData] = useState(property || {
    name: "",
    address: "",
    property_type: "shared",
    total_capacity: 1,
    current_occupancy: 0,
    property_manager: "",
    support_worker: "none",
    maintenance_status: "good",
    rent_per_week: 0,
    service_charge_per_month: 0,
    facilities: [],
    accessibility_features: "",
    last_inspection_date: "",
    next_inspection_due: "",
    contact_phone: "",
    emergency_contact: "",
    google_drive_link: "",
    bathroom_image_link: "",
    communal_area_image_link: "",
    kitchen_image_link: "",
    garden_image_link: "",
    living_room_image_link: "",
    exterior_image_link: "",
    notes: "",
    status: "active",
    created_date: ""
  });

  const facilityOptions = [
    "Kitchen", "Laundry Room", "Garden", "Parking", "WiFi", "Lounge Room",
    "Dining Area", "Storage", "CCTV", "Lift", "bathroom", "en-suite",
    "Ring doorbell", "kitchenette"
  ];

  const loadPropertyUtilities = async () => {
    const propertyId = property?.ID || property?.id;
    if (!propertyId || !supabase) return;

    try {
      setLoadingUtilities(true);
      const { data, error } = await supabase
        .from("Utilities")
        .select("*")
        .eq("Property ID", propertyId)
        .or('Deleted.is.null,Deleted.eq.false');

      if (error) throw error;
      setPropertyUtilities(data || []);
    } catch (error) {
      console.error("Error loading property utilities:", error);
    } finally {
      setLoadingUtilities(false);
    }
  };

  useEffect(() => {
    if (property) {
      loadPropertyUtilities();
      // Normalize database format to form format
      const maintenanceStatusReverseMap = {
        'Good': 'good',
        'Needs Attention': 'needs_attention',
        'Under Repair': 'under_repair',
        'Major Works Required': 'major_works_required'
      };
      
      const statusReverseMap = {
        'Active': 'active',
        'Temporarily Closed': 'temporarily_closed',
        'Under Renovation': 'under_renovation',
        'Decommissioned': 'decommissioned'
      };
      
      const propertyTypeReverseMap = {
        'Shared': 'shared',
        'En Suite Rooms': 'en_suite_rooms',
        'Shared/En Suite Mixed': 'shared_en_suite_mixed',
        'Self Contained': 'self_contained',
        'Apartment': 'apartment'
      };
      
      setFormData({
        name: property.Name || property.name || "",
        address: property.Address || property.address || "",
        property_type: propertyTypeReverseMap[property["Property Type"]] || property.property_type || "shared",
        total_capacity: property["Total Capacity"] || property.total_capacity || 1,
        current_occupancy: property["Current Occupancy"] || property.current_occupancy || 0,
        property_manager: property["Property Manager"] || property.property_manager || "",
        support_worker: property["Support Worker"] || property.support_worker || "none",
        maintenance_status: maintenanceStatusReverseMap[property["Maintenance Status"]] || property.maintenance_status || "good",
        rent_per_week: property["Weekly Rent"] || property.rent_per_week || 0,
        service_charge_per_month: property["Monthly Service Charge"] || property.service_charge_per_month || 0,
        facilities: property.Facilities || property.facilities || [],
        accessibility_features: property["Accessibility Features"] || property.accessibility_features || "",
        last_inspection_date: property["Last Inspection Date"] || property.last_inspection_date || "",
        next_inspection_due: property["Next Inspection Due"] || property.next_inspection_due || "",
        contact_phone: property["Contact Phone"] || property.contact_phone || "",
        emergency_contact: property["Emergency Contact"] || property.emergency_contact || "",
        google_drive_link: property["Google Drive Link"] || property.google_drive_link || "",
        bathroom_image_link: property["Bathroom Image Link"] || property.bathroom_image_link || "",
        communal_area_image_link: property["Communal Area Image Link"] || property.communal_area_image_link || "",
        kitchen_image_link: property["Kitchen Image Link"] || property.kitchen_image_link || "",
        garden_image_link: property["Garden Image Link"] || property.garden_image_link || "",
        living_room_image_link: property["Living Room Image Link"] || property.living_room_image_link || "",
        exterior_image_link: property["Exterior Image Link"] || property.exterior_image_link || "",
        notes: property.Notes || property.notes || "",
        status: statusReverseMap[property.Status] || property.status || "active",
        created_date: property["Created Date"] || property.Created_Date || property.created_date || ""
      });
    }
  }, [property]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Map form values to database format
    const maintenanceStatusMap = {
      'good': 'Good',
      'needs_attention': 'Needs Attention',
      'under_repair': 'Under Repair',
      'major_works_required': 'Major Works Required'
    };
    
    const statusMap = {
      'active': 'Active',
      'temporarily_closed': 'Temporarily Closed',
      'under_renovation': 'Under Renovation',
      'decommissioned': 'Decommissioned'
    };
    
    const propertyTypeMap = {
      'shared': 'Shared',
      'en_suite_rooms': 'En Suite Rooms',
      'shared_en_suite_mixed': 'Shared/En Suite Mixed',
      'self_contained': 'Self Contained',
      'apartment': 'Apartment'
    };
    
    // Convert to PascalCase for Supabase
    const supabaseData = {
      Name: formData.name,
      Address: formData.address,
      "Property Type": propertyTypeMap[formData.property_type] || 'Shared',
      "Total Capacity": parseInt(formData.total_capacity) || 1,
      "Current Occupancy": parseInt(formData.current_occupancy) || 0,
      "Property Manager": formData.property_manager || null,
      "Support Worker": formData.support_worker || null,
      "Maintenance Status": maintenanceStatusMap[formData.maintenance_status] || 'Good',
      "Weekly Rent": parseFloat(formData.rent_per_week) || null,
      "Monthly Service Charge": parseFloat(formData.service_charge_per_month) || null,
      Facilities: formData.facilities || [],
      "Accessibility Features": formData.accessibility_features || null,
      "Last Inspection Date": formData.last_inspection_date || null,
      "Next Inspection Due": formData.next_inspection_due || null,
      "Contact Phone": formData.contact_phone || null,
      "Emergency Contact": formData.emergency_contact || null,
      "Google Drive Link": formData.google_drive_link || null,
      "Bathroom Image Link": formData.bathroom_image_link || null,
      "Communal Area Image Link": formData.communal_area_image_link || null,
      "Kitchen Image Link": formData.kitchen_image_link || null,
      "Garden Image Link": formData.garden_image_link || null,
      "Living Room Image Link": formData.living_room_image_link || null,
      "Exterior Image Link": formData.exterior_image_link || null,
      Status: statusMap[formData.status] || 'Active',
      Notes: formData.notes || null,
      "Updated Date": new Date().toISOString()
    };

    if (property) {
      // Include ID when editing
      supabaseData.ID = property.ID || property.id;
    } else {
      // Add Created Date for new properties
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

  const handleFacilityChange = (facility, checked) => {
    setFormData(prev => ({
      ...prev,
      facilities: checked
        ? [...(prev.facilities || []), facility]
        : (prev.facilities || []).filter(f => f !== facility)
    }));
  };

  const handleUtilitySubmit = async (utilityData) => {
    try {
      if (editingUtility) {
        const { error } = await supabase
          .from("Utilities")
          .update(utilityData)
          .eq("ID", editingUtility.ID);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("Utilities")
          .insert([utilityData]);
        if (error) throw error;
      }
      setShowUtilityForm(false);
      setEditingUtility(null);
      loadPropertyUtilities();
    } catch (error) {
      console.error("Error saving utility:", error);
      alert("Error saving utility: " + error.message);
    }
  };

  const handleUtilityDelete = async (utility) => {
    if (!window.confirm("Are you sure you want to delete this utility?")) return;
    try {
      const { error } = await supabase
        .from("Utilities")
        .update({ Deleted: true, "Deleted Date": new Date().toISOString() })
        .eq("ID", utility.ID);
      if (error) throw error;
      loadPropertyUtilities();
    } catch (error) {
      console.error("Error deleting utility:", error);
      alert("Error deleting utility: " + error.message);
    }
  };

  return (
    <Card className="mb-6 shadow-md">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-teal-600" />
          {property ? "Edit Property" : "Add New Property"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="entry_date_time" className="mb-2 block">Entry Date & Time</Label>
                <Input
                  id="entry_date_time"
                  value={formData.created_date ? format(new Date(formData.created_date), 'dd/MM/yyyy HH:mm') : format(new Date(), 'dd/MM/yyyy HH:mm')}
                  disabled
                  className="bg-slate-100 cursor-not-allowed text-slate-500"
                />
              </div>
              <div>
                <Label htmlFor="name" className="mb-2 block">Property Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="e.g., Maple House, Oak Lodge"
                  required
                />
              </div>
              <div>
                <Label htmlFor="property_type" className="mb-2 block">Property Type *</Label>
                <Select value={formData.property_type} onValueChange={(value) => handleChange("property_type", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="shared">Shared</SelectItem>
                    <SelectItem value="en_suite_rooms">En-suite Rooms</SelectItem>
                    <SelectItem value="shared_en_suite_mixed">Shared/En-suite Mixed</SelectItem>
                    <SelectItem value="self_contained">Self-contained</SelectItem>
                    <SelectItem value="apartment">Apartment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="address" className="mb-2 block">Address *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  placeholder="Full property address"
                  required
                />
              </div>
              <div>
                <Label htmlFor="status" className="mb-2 block">Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleChange("status", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="temporarily_closed">Temporarily Closed</SelectItem>
                    <SelectItem value="under_renovation">Under Renovation</SelectItem>
                    <SelectItem value="decommissioned">Decommissioned</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Capacity & Management */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Capacity & Management</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="total_capacity" className="mb-2 block">Total Capacity *</Label>
                <Input
                  id="total_capacity"
                  type="number"
                  min="1"
                  value={formData.total_capacity}
                  onChange={(e) => handleChange("total_capacity", parseInt(e.target.value))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="current_occupancy" className="mb-2 block">Current Occupancy</Label>
                <Input
                  id="current_occupancy"
                  type="number"
                  min="0"
                  value={formData.current_occupancy}
                  onChange={(e) => handleChange("current_occupancy", parseInt(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="property_manager" className="mb-2 block">Property Manager</Label>
                <Input
                  id="property_manager"
                  value={formData.property_manager}
                  onChange={(e) => handleChange("property_manager", e.target.value)}
                  placeholder="Assigned property manager"
                />
              </div>
              <div>
                <Label htmlFor="support_worker" className="mb-2 block">Support Worker</Label>
                <Select value={formData.support_worker} onValueChange={(value) => handleChange("support_worker", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select support worker" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No support worker assigned</SelectItem>
                    <SelectItem value="Hasib">Hasib</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="rent_per_week" className="mb-2 block">Weekly Rent (£)</Label>
                <Input
                  id="rent_per_week"
                  type="text"
                  inputMode="decimal"
                  value={formData.rent_per_week}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9.]/g, '');
                    handleChange("rent_per_week", value);
                  }}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="service_charge_per_month" className="mb-2 block">Monthly Service Charge (£)</Label>
                <Input
                  id="service_charge_per_month"
                  type="text"
                  inputMode="decimal"
                  value={formData.service_charge_per_month}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9.]/g, '');
                    handleChange("service_charge_per_month", value);
                  }}
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          {/* Landlord Inspections */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Landlord Inspections</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="last_inspection_date" className="mb-2 block">Last Inspection Date</Label>
                <Input
                  id="last_inspection_date"
                  type="date"
                  value={formData.last_inspection_date}
                  onChange={(e) => handleChange("last_inspection_date", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="next_inspection_due" className="mb-2 block">Next Inspection Due</Label>
                <Input
                  id="next_inspection_due"
                  type="date"
                  value={formData.next_inspection_due}
                  onChange={(e) => handleChange("next_inspection_due", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="maintenance_status" className="mb-2 block">Maintenance Status</Label>
                <Select value={formData.maintenance_status} onValueChange={(value) => handleChange("maintenance_status", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="needs_attention">Needs Attention</SelectItem>
                    <SelectItem value="under_repair">Under Repair</SelectItem>
                    <SelectItem value="major_works_required">Major Works Required</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Facilities */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Facilities</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {facilityOptions.map((facility) => (
                <div key={facility} className="flex items-center space-x-2">
                  <Checkbox
                    id={facility}
                    checked={(formData.facilities || []).includes(facility)}
                    onCheckedChange={(checked) => handleFacilityChange(facility, checked)}
                  />
                  <Label htmlFor={facility} className="text-sm">{facility}</Label>
                </div>
              ))}
            </div>
          </div>

          {/* Utilities Section (Only for existing properties) */}
          {property && (
            <div className="border-t pt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-teal-600" />
                  Utilities
                </h3>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditingUtility(null);
                    setShowUtilityForm(true);
                  }}
                  className="text-teal-600 border-teal-600 hover:bg-teal-50"
                >
                  <Plus className="w-4 h-4 mr-1" /> Add Utility
                </Button>
              </div>

              {showUtilityForm && (
                <div className="mb-6 border rounded-lg p-4 bg-slate-50">
                  <UtilityForm
                    utility={editingUtility}
                    properties={[{ ID: property.ID || property.id, Name: formData.name }]}
                    initialPropertyId={property.ID || property.id}
                    onSubmit={handleUtilitySubmit}
                    onCancel={() => {
                      setShowUtilityForm(false);
                      setEditingUtility(null);
                    }}
                  />
                </div>
              )}

              {loadingUtilities ? (
                <p className="text-sm text-slate-500 italic">Loading utilities...</p>
              ) : propertyUtilities.length === 0 ? (
                <div className="text-center py-6 bg-slate-50 rounded-lg border border-dashed">
                  <p className="text-sm text-slate-500">No utilities registered for this property</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {propertyUtilities.map((u) => (
                    <div key={u.ID} className="flex items-center justify-between p-3 border rounded-lg bg-white shadow-sm hover:border-teal-200 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-teal-50 rounded-lg text-teal-600">
                          <Zap className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{u["Utility Type"]}</p>
                          <p className="text-xs text-slate-500">{u["Company Name"]}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-slate-400 hover:text-teal-600"
                          onClick={() => {
                            setEditingUtility(u);
                            setShowUtilityForm(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-slate-400 hover:text-red-600"
                          onClick={() => handleUtilityDelete(u)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Contact & Additional Info */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Contact & Additional Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contact_phone" className="mb-2 block">Contact Phone</Label>
                <Input
                  id="contact_phone"
                  value={formData.contact_phone}
                  onChange={(e) => handleChange("contact_phone", e.target.value)}
                  placeholder="Property contact number"
                />
              </div>
              <div>
                <Label htmlFor="emergency_contact" className="mb-2 block">Emergency Contact</Label>
                <Input
                  id="emergency_contact"
                  value={formData.emergency_contact}
                  onChange={(e) => handleChange("emergency_contact", e.target.value)}
                  placeholder="Emergency contact for property"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="google_drive_link" className="mb-2 block">Main Property Image (Google Drive Link)</Label>
                <Input
                  id="google_drive_link"
                  value={formData.google_drive_link}
                  onChange={(e) => handleChange("google_drive_link", e.target.value)}
                  placeholder="https://drive.google.com/..."
                />
              </div>
              <div>
                <Label htmlFor="bathroom_image_link" className="mb-2 block">Bathroom Image Link</Label>
                <Input
                  id="bathroom_image_link"
                  value={formData.bathroom_image_link}
                  onChange={(e) => handleChange("bathroom_image_link", e.target.value)}
                  placeholder="Direct image link"
                />
              </div>
              <div>
                <Label htmlFor="communal_area_image_link" className="mb-2 block">Communal Area Image Link</Label>
                <Input
                  id="communal_area_image_link"
                  value={formData.communal_area_image_link}
                  onChange={(e) => handleChange("communal_area_image_link", e.target.value)}
                  placeholder="Direct image link"
                />
              </div>
              <div>
                <Label htmlFor="kitchen_image_link" className="mb-2 block">Kitchen Image Link</Label>
                <Input
                  id="kitchen_image_link"
                  value={formData.kitchen_image_link}
                  onChange={(e) => handleChange("kitchen_image_link", e.target.value)}
                  placeholder="Direct image link"
                />
              </div>
              <div>
                <Label htmlFor="garden_image_link" className="mb-2 block">Garden Image Link</Label>
                <Input
                  id="garden_image_link"
                  value={formData.garden_image_link}
                  onChange={(e) => handleChange("garden_image_link", e.target.value)}
                  placeholder="Direct image link"
                />
              </div>
              <div>
                <Label htmlFor="living_room_image_link" className="mb-2 block">Living Room Image Link</Label>
                <Input
                  id="living_room_image_link"
                  value={formData.living_room_image_link}
                  onChange={(e) => handleChange("living_room_image_link", e.target.value)}
                  placeholder="Direct image link"
                />
              </div>
              <div>
                <Label htmlFor="exterior_image_link" className="mb-2 block">Exterior Image Link</Label>
                <Input
                  id="exterior_image_link"
                  value={formData.exterior_image_link}
                  onChange={(e) => handleChange("exterior_image_link", e.target.value)}
                  placeholder="Direct image link"
                />
              </div>
            </div>
            <div className="mt-4">
              <Label htmlFor="accessibility_features" className="mb-2 block">Accessibility Features</Label>
              <Textarea
                id="accessibility_features"
                value={formData.accessibility_features}
                onChange={(e) => handleChange("accessibility_features", e.target.value)}
                placeholder="Wheelchair access, lift, adapted bathrooms, etc."
                rows={2}
              />
            </div>
            <div className="mt-4">
              <Label htmlFor="notes" className="mb-2 block">Additional Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                placeholder="Any additional notes about the property"
                rows={3}
              />
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
              className="bg-teal-600 hover:bg-teal-700 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {property ? "Update Property" : "Add Property"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}