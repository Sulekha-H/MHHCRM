"use client"

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Save, Wrench } from "lucide-react";
import { format } from "date-fns";

export default function ApplianceForm({ appliance, properties, accommodations, warranties, currentUser, onSubmit, onCancel }) {
  console.log("🔧 ApplianceForm_Supabase - Received appliance:", appliance);
  
  const [formData, setFormData] = useState(appliance ? {
    appliance_name: appliance["Appliance Name"] || appliance.Appliance_Name || appliance.appliance_name || "",
    category: appliance.Category || appliance.category || "Kitchen",
    brand: appliance.Brand || appliance.brand || "",
    model_number: appliance["Model Number"] || appliance.Model_Number || appliance.model_number || "",
    serial_number: appliance["Serial Number"] || appliance.Serial_Number || appliance.serial_number || "",
    location_type: (appliance.Office || (appliance["Property ID"] === null && appliance.appliance_name)) ? "office" : "property",
    property_id: appliance["Property ID"] || appliance.Property_Id || appliance.property_id || "",
    accommodation_id: appliance["Accommodation ID"] || appliance.Accommodation_Id || appliance.accommodation_id || "",
    purchase_date: appliance["Purchase Date"] || appliance.Purchase_Date || appliance.purchase_date || "",
    installation_date: appliance["Installation Date"] || appliance.Installation_Date || appliance.installation_date || "",
    purchase_price: appliance["Purchase Price"] !== null && appliance["Purchase Price"] !== undefined 
      ? appliance["Purchase Price"] 
      : (appliance.Purchase_Price !== null && appliance.Purchase_Price !== undefined 
        ? appliance.Purchase_Price 
        : (appliance.purchase_price !== null && appliance.purchase_price !== undefined ? appliance.purchase_price : 0)),
    supplier: appliance.Supplier || appliance.supplier || "",
    condition: appliance.Condition || appliance.condition || "New",
    last_service_date: appliance["Last Service Date"] || appliance.Last_Service_Date || appliance.last_service_date || "",
    next_service_due: appliance["Next Service Due"] || appliance.Next_Service_Due || appliance.next_service_due || "",
    energy_rating: appliance["Energy Rating"] || appliance.Energy_Rating || appliance.energy_rating || "",
    warranty_id: appliance["Warranty ID"] || appliance.Warranty_Id || appliance.warranty_id || "",
    manual_url: appliance["Manual URL"] || appliance.Manual_Url || appliance.manual_url || "",
    receipt_url: appliance["Receipt URL"] || appliance.Receipt_Url || appliance.receipt_url || "",
    notes: appliance.Notes || appliance.notes || "",
    logged_by: appliance["Logged By"] || appliance.Logged_By || appliance.logged_by || currentUser?.full_name || "",
    created_date: appliance["Created Date"] || appliance.Created_Date || appliance.created_date || ""
  } : {
    appliance_name: "",
    category: "Kitchen",
    brand: "",
    model_number: "",
    serial_number: "",
    location_type: "property",
    property_id: "",
    accommodation_id: "",
    purchase_date: "",
    installation_date: "",
    purchase_price: 0,
    supplier: "",
    condition: "New",
    last_service_date: "",
    next_service_due: "",
    energy_rating: "",
    warranty_id: "",
    manual_url: "",
    receipt_url: "",
    notes: "",
    logged_by: currentUser?.full_name || "",
    created_date: ""
  });

  console.log("🔧 ApplianceForm_Supabase - Initialized formData:", formData);

  // Update logged_by when currentUser becomes available
  useEffect(() => {
    if (currentUser?.full_name) {
      setFormData(prev => ({
        ...prev,
        logged_by: currentUser.full_name
      }));
    }
  }, [currentUser]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Ensure logged_by is set before submission
    const dataToSubmit = {
      ...formData,
      logged_by: formData.logged_by || currentUser?.full_name || ""
    };
    
    // Convert to Title Case with spaces for Supabase (matching the SQL schema exactly)
    const supabaseData = {
      "Appliance Name": dataToSubmit.appliance_name,
      "Category": dataToSubmit.category,
      "Brand": dataToSubmit.brand || null,
      "Model Number": dataToSubmit.model_number || null,
      "Serial Number": dataToSubmit.serial_number || null,
      "Office": dataToSubmit.location_type === "office",
      "Property ID": dataToSubmit.location_type === "office" ? null : (dataToSubmit.property_id || null),
      "Accommodation ID": dataToSubmit.accommodation_id || null,
      "Purchase Date": dataToSubmit.purchase_date || null,
      "Installation Date": dataToSubmit.installation_date || null,
      "Purchase Price": dataToSubmit.purchase_price || null,
      "Supplier": dataToSubmit.supplier || null,
      "Condition": dataToSubmit.condition,
      "Last Service Date": dataToSubmit.last_service_date || null,
      "Next Service Due": dataToSubmit.next_service_due || null,
      "Energy Rating": dataToSubmit.energy_rating || null,
      "Warranty ID": dataToSubmit.warranty_id || null,
      "Manual URL": dataToSubmit.manual_url || null,
      "Receipt URL": dataToSubmit.receipt_url || null,
      "Notes": dataToSubmit.notes || null,
      "Logged By": dataToSubmit.logged_by || null,
      "Updated Date": new Date().toISOString()
    };

    if (!appliance) {
      supabaseData.ID = crypto.randomUUID();
      supabaseData["Created Date"] = new Date().toISOString();
      supabaseData["Created By"] = currentUser?.email || "Unknown";
    }

    console.log("🔧 ApplianceForm_Supabase - Submitting data:", supabaseData);
    onSubmit(supabaseData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const filteredAccommodations = formData.property_id && formData.location_type === "property"
    ? accommodations?.filter(acc => {
        const accPropertyId = acc["Property ID"] || acc.Property_Id || acc.property_id;
        return String(accPropertyId) === String(formData.property_id);
      })
    : [];

  const filteredWarranties = warranties?.filter(w => {
    const productName = w["Product Name"] || w.Product_Name || w.product_name || "";
    const brand = w.Brand || w.brand || "";
    return productName.toLowerCase().includes(formData.appliance_name.toLowerCase()) ||
           brand.toLowerCase().includes(formData.brand.toLowerCase());
  }) || [];

  return (
    <Card className="mb-6 shadow-md">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Wrench className="w-5 h-5 text-blue-600" />
          {appliance ? "Edit Appliance" : "Add New Appliance"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Appliance Information</h3>
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
              <div>
                <Label htmlFor="appliance_name">Appliance Name *</Label>
                <Input
                  id="appliance_name"
                  value={formData.appliance_name}
                  onChange={(e) => handleChange("appliance_name", e.target.value)}
                  placeholder="e.g., Washing Machine, Refrigerator"
                  required
                />
              </div>
              <div>
                <Label htmlFor="category">Category *</Label>
                <Select value={formData.category} onValueChange={(value) => handleChange("category", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Kitchen">Kitchen</SelectItem>
                    <SelectItem value="Laundry">Laundry</SelectItem>
                    <SelectItem value="Heating & Cooling">Heating & Cooling</SelectItem>
                    <SelectItem value="Electrical">Electrical</SelectItem>
                    <SelectItem value="Plumbing">Plumbing</SelectItem>
                    <SelectItem value="Furniture">Furniture</SelectItem>
                    <SelectItem value="Electronics">Electronics</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="brand">Brand</Label>
                <Input
                  id="brand"
                  value={formData.brand}
                  onChange={(e) => handleChange("brand", e.target.value)}
                  placeholder="e.g., Bosch, Samsung"
                />
              </div>
              <div>
                <Label htmlFor="model_number">Model Number</Label>
                <Input
                  id="model_number"
                  value={formData.model_number}
                  onChange={(e) => handleChange("model_number", e.target.value)}
                  placeholder="Product model number"
                />
              </div>
              <div>
                <Label htmlFor="serial_number">Serial Number</Label>
                <Input
                  id="serial_number"
                  value={formData.serial_number}
                  onChange={(e) => handleChange("serial_number", e.target.value)}
                  placeholder="Product serial number"
                />
              </div>
              <div>
                <Label htmlFor="energy_rating">Energy Rating</Label>
                <Input
                  id="energy_rating"
                  value={formData.energy_rating}
                  onChange={(e) => handleChange("energy_rating", e.target.value)}
                  placeholder="e.g., A+++, B, C"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Location</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-6">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="location_property"
                    name="location_type"
                    value="property"
                    checked={formData.location_type === "property"}
                    onChange={(e) => handleChange("location_type", e.target.value)}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="location_property" className="cursor-pointer font-medium">
                    Property
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="location_office"
                    name="location_type"
                    value="office"
                    checked={formData.location_type === "office"}
                    onChange={(e) => {
                      handleChange("location_type", e.target.value);
                      handleChange("property_id", "");
                    }}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="location_office" className="cursor-pointer font-medium">
                    Office
                  </Label>
                </div>
              </div>

              {formData.location_type === "property" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="property_id">Property *</Label>
                    <Select value={formData.property_id} onValueChange={(value) => handleChange("property_id", value)} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select property" />
                      </SelectTrigger>
                      <SelectContent>
                        {properties?.map((property) => {
                          const id = property.ID || property.Id || property.id;
                          const name = property.Name || property.name;
                          return (
                            <SelectItem key={id} value={id}>
                              {name}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="accommodation_id">Accommodation Unit (Optional)</Label>
                    <Select
                      value={formData.accommodation_id || ""}
                      onValueChange={(value) => handleChange("accommodation_id", value)}
                      disabled={!formData.property_id}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select unit (if specific to a unit)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={null}>Communal/General area</SelectItem>
                        {filteredAccommodations?.map((accommodation) => {
                          const accId = accommodation.ID || accommodation.Id || accommodation.id;
                          const roomNumber = accommodation["Room Number"] || accommodation.Room_Number || accommodation.room_number;
                          return (
                            <SelectItem key={accId} value={accId}>
                              {roomNumber}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Purchase Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="purchase_date">Purchase Date</Label>
                <Input
                  id="purchase_date"
                  type="date"
                  value={formData.purchase_date}
                  onChange={(e) => handleChange("purchase_date", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="installation_date">Installation Date</Label>
                <Input
                  id="installation_date"
                  type="date"
                  value={formData.installation_date}
                  onChange={(e) => handleChange("installation_date", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="purchase_price">Purchase Price (£)</Label>
                <Input
                  id="purchase_price"
                  type="number"
                  step="0.01"
                  value={formData.purchase_price}
                  onChange={(e) => handleChange("purchase_price", parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label htmlFor="supplier">Supplier</Label>
                <Input
                  id="supplier"
                  value={formData.supplier}
                  onChange={(e) => handleChange("supplier", e.target.value)}
                  placeholder="Where was it purchased from?"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Condition & Maintenance</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="condition">Condition</Label>
                <Select value={formData.condition} onValueChange={(value) => handleChange("condition", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="New">New</SelectItem>
                    <SelectItem value="Good">Good</SelectItem>
                    <SelectItem value="Fair">Fair</SelectItem>
                    <SelectItem value="Needs Repair">Needs Repair</SelectItem>
                    <SelectItem value="Out of Order">Out of Order</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="warranty_id">Related Warranty</Label>
                <Select 
                  value={formData.warranty_id || "none"} 
                  onValueChange={(value) => handleChange("warranty_id", value === "none" ? "" : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Link to warranty record" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No warranty linked</SelectItem>
                    {filteredWarranties.map((warranty) => {
                      const id = warranty.ID || warranty.Id || warranty.id;
                      const productName = warranty["Product Name"] || warranty.Product_Name || warranty.product_name;
                      const brand = warranty.Brand || warranty.brand;
                      return (
                        <SelectItem key={id} value={id}>
                          {productName} - {brand}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="last_service_date">Last Service Date</Label>
                <Input
                  id="last_service_date"
                  type="date"
                  value={formData.last_service_date}
                  onChange={(e) => handleChange("last_service_date", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="next_service_due">Next Service Due</Label>
                <Input
                  id="next_service_due"
                  type="date"
                  value={formData.next_service_due}
                  onChange={(e) => handleChange("next_service_due", e.target.value)}
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Documents</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="manual_url">User Manual URL</Label>
                <Input
                  id="manual_url"
                  type="url"
                  value={formData.manual_url}
                  onChange={(e) => handleChange("manual_url", e.target.value)}
                  placeholder="https://gdrive.com/manual.pdf"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Please enter a valid URL (must start with http:// or https://)
                </p>
              </div>
              <div>
                <Label htmlFor="receipt_url">Purchase Receipt URL</Label>
                <Input
                  id="receipt_url"
                  type="url"
                  value={formData.receipt_url}
                  onChange={(e) => handleChange("receipt_url", e.target.value)}
                  placeholder="https://gdrive.com/receipt.pdf"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Please enter a valid URL (must start with http:// or https://)
                </p>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder="Any additional notes about the appliance..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="logged_by">Logged By</Label>
            <Input
              id="logged_by"
              value={formData.logged_by}
              placeholder="Staff member who logged this appliance"
              readOnly
              className="bg-slate-50"
            />
            <p className="text-xs text-slate-500 mt-1">
              Automatically set to current user
            </p>
          </div>

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
              className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {appliance ? "Update Appliance" : "Add Appliance"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}