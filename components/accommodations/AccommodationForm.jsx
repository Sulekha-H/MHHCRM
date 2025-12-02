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
    property_id: accommodation.Property_Id || accommodation.property_id || "",
    room_number: accommodation.Room_Number || accommodation.room_number || "",
    accommodation_type: accommodation.Accommodation_Type || accommodation.accommodation_type || "single_room",
    floor: accommodation.Floor !== null && accommodation.Floor !== undefined ? accommodation.Floor : (accommodation.floor !== null && accommodation.floor !== undefined ? accommodation.floor : 1),
    size_sqm: accommodation.Size_Sqm || accommodation.size_sqm || 0,
    max_occupancy: accommodation.Max_Occupancy || accommodation.max_occupancy || 1,
    current_resident_id: accommodation.Current_Resident_Id || accommodation.current_resident_id || "",
    rent_per_week: accommodation.Rent_Per_Week || accommodation.rent_per_week || 0,
    deposit_amount: accommodation.Deposit_Amount || accommodation.deposit_amount || 0,
    furnished: accommodation.Furnished !== null && accommodation.Furnished !== undefined ? accommodation.Furnished : (accommodation.furnished !== null && accommodation.furnished !== undefined ? accommodation.furnished : true),
    amenities: accommodation.Amenities || accommodation.amenities || [],
    accessibility_features: accommodation.Accessibility_Features || accommodation.accessibility_features || "",
    condition: accommodation.Condition || accommodation.condition || "good",
    last_maintenance_date: accommodation.Last_Maintenance_Date || accommodation.last_maintenance_date || "",
    next_maintenance_due: accommodation.Next_Maintenance_Due || accommodation.next_maintenance_due || "",
    availability_status: accommodation.Availability_Status || accommodation.availability_status || "available",
    available_from: accommodation.Available_From || accommodation.available_from || "",
    notes: accommodation.Notes || accommodation.notes || "",
    images: accommodation.Images || accommodation.images || []
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
    
    // Convert to PascalCase for Supabase
    const supabaseData = {
      Property_Id: formData.property_id,
      Room_Number: formData.room_number,
      Accommodation_Type: formData.accommodation_type,
      Floor: formData.floor,
      Size_Sqm: formData.size_sqm,
      Max_Occupancy: formData.max_occupancy,
      Current_Resident_Id: formData.current_resident_id || null,
      Rent_Per_Week: formData.rent_per_week,
      Deposit_Amount: formData.deposit_amount,
      Furnished: formData.furnished,
      Amenities: formData.amenities,
      Accessibility_Features: formData.accessibility_features || null,
      Condition: formData.condition,
      Last_Maintenance_Date: formData.last_maintenance_date || null,
      Next_Maintenance_Due: formData.next_maintenance_due || null,
      Availability_Status: formData.availability_status,
      Available_From: formData.available_from || null,
      Notes: formData.notes || null,
      Images: formData.images,
      Updated_Date: new Date().toISOString()
    };

    if (!accommodation) {
      supabaseData.Created_Date = new Date().toISOString();
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