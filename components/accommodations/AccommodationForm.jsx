"use client"

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Save, Home } from "lucide-react";

export default function AccommodationForm({ accommodation, properties, residents, onSubmit, onCancel }) {
  const [formData, setFormData] = useState(accommodation ? {
    property_id: accommodation["Property ID"] || accommodation.Property_Id || accommodation.property_id || "",
    room_number: accommodation["Room Number"] || accommodation.Room_Number || accommodation.room_number || "",
    accommodation_type: (accommodation["Accommodation Type"] || accommodation.Accommodation_Type || accommodation.accommodation_type || "single_room").toLowerCase().replace(/ /g, '_'),
    floor: accommodation["Floor"] ?? accommodation.Floor ?? accommodation.floor ?? 1,
    size_sqm: accommodation["Size (sqm)"] || accommodation.Size_Sqm || accommodation.size_sqm || 0,
    max_occupancy: accommodation["Max Occupancy"] || accommodation.Max_Occupancy || accommodation.max_occupancy || 1,
    current_resident_id: accommodation["Current Resident ID"] || accommodation.Current_Resident_Id || accommodation.current_resident_id || "",
    rent_per_week: accommodation["Weekly Rent"] || accommodation.Rent_Per_Week || accommodation.rent_per_week || 0,
    deposit_amount: accommodation["Deposit Amount"] || accommodation.Deposit_Amount || accommodation.deposit_amount || 0,
    furnished: accommodation["Furnished"] ?? accommodation.Furnished ?? accommodation.furnished ?? true,
    amenities: accommodation["Amenities"] || accommodation.Amenities || accommodation.amenities || [],
    accessibility_features: accommodation["Accessibility Features"] || accommodation.Accessibility_Features || accommodation.accessibility_features || "",
    condition: (accommodation["Condition"] || accommodation.Condition || accommodation.condition || "good").toLowerCase().replace(/ /g, '_'),
    last_maintenance_date: accommodation["Last Maintenance Date"] || accommodation.Last_Maintenance_Date || accommodation.last_maintenance_date || "",
    next_maintenance_due: accommodation["Next Maintenance Due"] || accommodation.Next_Maintenance_Due || accommodation.next_maintenance_due || "",
    availability_status: (accommodation["Availability Status"] || accommodation.Availability_Status || accommodation.availability_status || "available").toLowerCase().replace(/ /g, '_'),
    available_from: accommodation["Available From"] || accommodation.Available_From || accommodation.available_from || "",
    notes: accommodation["Notes"] || accommodation.Notes || accommodation.notes || "",
    images: accommodation["Images"] || accommodation.Images || accommodation.images || []
  } : {
    property_id: "",
    room_number: "",
    accommodation_type: "single_room",
    floor: 1,
    size_sqm: 0,
    max_occupancy: 1,
    current_resident_id: "",
    rent_per_week: 0,
    deposit_amount: 0,
    furnished: true,
    amenities: [],
    accessibility_features: "",
    condition: "good",
    last_maintenance_date: "",
    next_maintenance_due: "",
    availability_status: "available",
    available_from: "",
    notes: "",
    images: []
  });

  const amenityOptions = [
    "Ensuite Bathroom", "Kitchenette", "Wardrobe", "Internet Connection",
    "off-suite", "double bed", "shared kitchen", "double wardrobe",
    "clothes airers", "wheelie chairs", "bedside table", "sofas",
    "coffee table", "shared bathroom", "shared lounge", "en-suite",
    "pots and pans", "bedding", "cutlery", "electrical kettle",
    "electrical toaster", "microwave oven", "washing machine",
    "tumble dryer", "crockery", "built-in ovens", "standing ovens",
    "property key", "room key", "fridge-freezer"
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const selectedProperty = properties?.find(p => p.ID === formData.property_id);
    const selectedResident = residents?.find(r => r.ID === formData.current_resident_id);

    // Value mapping for constraints
    const statusMap = {
      'available': 'Available',
      'occupied': 'Occupied',
      'reserved': 'Reserved',
      'maintenance': 'Maintenance',
      'out_of_service': 'Out of Service'
    };

    const conditionMap = {
      'excellent': 'Excellent',
      'good': 'Good',
      'fair': 'Fair',
      'needs_repair': 'Needs Repair',
      'out_of_order': 'Out of Order'
    };

    const typeMap = {
      'single_room': 'Single Room',
      'shared_room': 'Shared Room',
      'studio': 'Studio',
      'one_bedroom_flat': 'One Bedroom Flat',
      'two_bedroom_flat': 'Two Bedroom Flat'
    };

    // Align with exact database schema column names
    const supabaseData = {
      "Property ID": formData.property_id,
      "Property Name": selectedProperty?.Name || null,
      "Property Address": selectedProperty?.Address || null,
      "Room Number": formData.room_number,
      "Accommodation Type": typeMap[formData.accommodation_type] || 'Single Room',
      "Floor": formData.floor,
      "Size (sqm)": formData.size_sqm,
      "Max Occupancy": formData.max_occupancy,
      "Current Resident ID": formData.current_resident_id || null,
      "Current Resident Name": selectedResident ? `${selectedResident["First Name"]} ${selectedResident["Last Name"]}` : null,
      "Weekly Rent": formData.rent_per_week,
      "Deposit Amount": formData.deposit_amount,
      "Furnished": formData.furnished,
      "Amenities": formData.amenities,
      "Accessibility Features": formData.accessibility_features || null,
      "Condition": conditionMap[formData.condition] || 'Good',
      "Last Maintenance Date": formData.last_maintenance_date || null,
      "Next Maintenance Due": formData.next_maintenance_due || null,
      "Availability Status": statusMap[formData.availability_status] || 'Available',
      "Available From": formData.available_from || null,
      "Notes": formData.notes || null,
      "Images": formData.images,
      "Updated Date": new Date().toISOString()
    };

    if (!accommodation) {
      supabaseData.ID = crypto.randomUUID();
      supabaseData["Created Date"] = new Date().toISOString();
    } else {
      supabaseData.ID = accommodation.ID || accommodation.id;
    }

    onSubmit(supabaseData);
  };

  const handleChange = (field, value) => {
    // Simplified: allow direct control over availability_status
    // No longer automatically setting based on current_resident_id
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAmenityChange = (amenity, checked) => {
    setFormData(prev => ({
      ...prev,
      amenities: checked
        ? [...(prev.amenities || []), amenity]
        : (prev.amenities || []).filter(a => a !== amenity)
    }));
  };

  return (
    <Card className="mb-6 shadow-md">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Home className="w-5 h-5 text-indigo-600" />
          {accommodation ? "Edit Unit" : "Add New Unit"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4 pb-2 border-b border-slate-200">Location</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="property_id">Property *</Label>
                <Select value={formData.property_id} onValueChange={(value) => handleChange("property_id", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select property" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties?.map((property) => (
                      <SelectItem key={property.ID} value={property.ID}>
                        {property.Name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="room_number">Room/Unit Number *</Label>
                <Input
                  id="room_number"
                  value={formData.room_number}
                  onChange={(e) => handleChange("room_number", e.target.value)}
                  placeholder="e.g., Room 101, Unit A"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accommodation_type">Accommodation Type *</Label>
                <Select value={formData.accommodation_type} onValueChange={(value) => handleChange("accommodation_type", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single_room">Single Room</SelectItem>
                    <SelectItem value="shared_room">Shared Room</SelectItem>
                    <SelectItem value="studio">Studio</SelectItem>
                    <SelectItem value="one_bedroom_flat">One Bedroom Flat</SelectItem>
                    <SelectItem value="two_bedroom_flat">Two Bedroom Flat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="floor">Floor</Label>
                <Input
                  id="floor"
                  type="number"
                  value={formData.floor}
                  onChange={(e) => handleChange("floor", parseInt(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="size_sqm">Size (sq m)</Label>
                <Input
                  id="size_sqm"
                  type="number"
                  step="0.1"
                  value={formData.size_sqm}
                  onChange={(e) => handleChange("size_sqm", parseFloat(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_occupancy">Max Occupancy</Label>
                <Input
                  id="max_occupancy"
                  type="number"
                  min="1"
                  value={formData.max_occupancy}
                  onChange={(e) => handleChange("max_occupancy", parseInt(e.target.value))}
                />
              </div>
            </div>
          </div>

          {/* Occupancy & Pricing */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4 pb-2 border-b border-slate-200">Occupancy & Pricing</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="current_resident_id">Current Resident</Label>
                <Select value={formData.current_resident_id || ""} onValueChange={(value) => handleChange("current_resident_id", value || "")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select resident (if occupied)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>No resident (Available)</SelectItem>
                    {residents?.filter(r => (r.Status || '').toLowerCase() === 'active').map((resident) => (
                      <SelectItem key={resident.ID} value={resident.ID}>
                        {resident["First Name"]} {resident["Last Name"]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="availability_status">Availability Status</Label>
                <Select value={formData.availability_status} onValueChange={(value) => handleChange("availability_status", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="occupied">Occupied</SelectItem>
                    <SelectItem value="reserved">Reserved</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="out_of_service">Out of Service</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-slate-500 mt-1">
                  Current: <span className={`font-medium ${formData.availability_status === 'available' ? 'text-green-600' : formData.availability_status === 'occupied' ? 'text-blue-600' : 'text-orange-600'}`}>
                    {formData.availability_status?.replace('_', ' ')}
                  </span>
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="rent_per_week">Weekly Rent (£)</Label>
                <Input
                  id="rent_per_week"
                  type="number"
                  step="0.01"
                  value={formData.rent_per_week === 0 ? '0' : formData.rent_per_week}
                  onChange={(e) => handleChange("rent_per_week", parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deposit_amount">Deposit Amount (£)</Label>
                <Input
                  id="deposit_amount"
                  type="number"
                  step="0.01"
                  value={formData.deposit_amount === 0 ? '0' : formData.deposit_amount}
                  onChange={(e) => handleChange("deposit_amount", parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="available_from">Available From</Label>
                <Input
                  id="available_from"
                  type="date"
                  value={formData.available_from}
                  onChange={(e) => handleChange("available_from", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Condition & Maintenance */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4 pb-2 border-b border-slate-200">Condition & Maintenance</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="condition">Condition</Label>
                <Select value={formData.condition} onValueChange={(value) => handleChange("condition", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excellent">Excellent</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="fair">Fair</SelectItem>
                    <SelectItem value="needs_repair">Needs Repair</SelectItem>
                    <SelectItem value="out_of_order">Out of Order</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_maintenance_date">Last Maintenance Date</Label>
                <Input
                  id="last_maintenance_date"
                  type="date"
                  value={formData.last_maintenance_date}
                  onChange={(e) => handleChange("last_maintenance_date", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="next_maintenance_due">Next Maintenance Due</Label>
                <Input
                  id="next_maintenance_due"
                  type="date"
                  value={formData.next_maintenance_due}
                  onChange={(e) => handleChange("next_maintenance_due", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Features & Amenities */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4 pb-2 border-b border-slate-200">Features & Amenities</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="furnished"
                  checked={formData.furnished}
                  onCheckedChange={(checked) => handleChange("furnished", checked)}
                />
                <Label htmlFor="furnished">Furnished</Label>
              </div>

              <div>
                <Label className="text-sm font-medium text-slate-700 mb-3 block">Amenities</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {amenityOptions.map((amenity) => (
                    <div key={amenity} className="flex items-center space-x-2">
                      <Checkbox
                        id={amenity}
                        checked={(formData.amenities || []).includes(amenity)}
                        onCheckedChange={(checked) => handleAmenityChange(amenity, checked)}
                      />
                      <Label htmlFor={amenity} className="text-sm">{amenity}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="accessibility_features">Accessibility Features</Label>
                <Textarea
                  id="accessibility_features"
                  value={formData.accessibility_features}
                  onChange={(e) => handleChange("accessibility_features", e.target.value)}
                  placeholder="Wheelchair access, grab rails, adapted shower, etc."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleChange("notes", e.target.value)}
                  placeholder="Any additional notes about this unit"
                  rows={3}
                />
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
              className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {accommodation ? "Update Unit" : "Add Unit"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}