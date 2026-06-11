"use client"

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Save, Shield } from "lucide-react";

export default function WarrantyForm({ warranty, properties, accommodations, currentUser, onSubmit, onCancel }) {
  const normalizeStatus = (val) => {
    if (!val) return "active";
    const v = val.toLowerCase();
    if (v.includes('pending')) return 'pending_renewal';
    if (v.includes('active')) return 'active';
    if (v.includes('expired')) return 'expired';
    if (v.includes('claimed')) return 'claimed';
    if (v.includes('cancelled')) return 'cancelled';
    return v;
  };

  const normalizeWarrantyType = (val) => {
    if (!val) return "manufacturer";
    const v = val.toLowerCase();
    if (v.includes('manufacturer')) return 'manufacturer';
    if (v.includes('extended')) return 'extended';
    if (v.includes('retailer')) return 'retailer';
    if (v.includes('insurance')) return 'insurance';
    return v;
  };

  const [formData, setFormData] = useState(warranty ? {
    product_name: warranty["Product Name"] || warranty.Product_Name || warranty.product_name || "",
    brand: warranty.Brand || warranty.brand || "",
    model_number: warranty["Model Number"] || warranty.Model_Number || warranty.model_number || "",
    serial_number: warranty["Serial Number"] || warranty.Serial_Number || warranty.serial_number || "",
    location_type: (warranty.Office || (warranty["Property ID"] === null && (warranty["Product Name"] || warranty.product_name))) ? "office" : "property",
    property_id: warranty["Property ID"] || warranty.Property_Id || warranty.property_id || "",
    accommodation_id: warranty["Accommodation ID"] || warranty.Accommodation_Id || warranty.accommodation_id || "",
    purchase_date: warranty["Purchase Date"] || warranty.Purchase_Date || warranty.purchase_date || "",
    warranty_start_date: warranty["Warranty Start Date"] || warranty.Warranty_Start_Date || warranty.warranty_start_date || "",
    warranty_end_date: warranty["Warranty End Date"] || warranty.Warranty_End_Date || warranty.warranty_end_date || "",
    warranty_period_months: warranty["Warranty Period (Months)"] !== null && warranty["Warranty Period (Months)"] !== undefined
      ? warranty["Warranty Period (Months)"]
      : (warranty.Warranty_Period_Months !== null && warranty.Warranty_Period_Months !== undefined
        ? warranty.Warranty_Period_Months
        : (warranty.warranty_period_months !== null && warranty.warranty_period_months !== undefined ? warranty.warranty_period_months : 12)),
    supplier: warranty.Supplier || warranty.supplier || "",
    purchase_price: warranty["Purchase Price"] !== null && warranty["Purchase Price"] !== undefined
      ? warranty["Purchase Price"]
      : (warranty.Purchase_Price !== null && warranty.Purchase_Price !== undefined
        ? warranty.Purchase_Price
        : (warranty.purchase_price !== null && warranty.purchase_price !== undefined ? warranty.purchase_price : 0)),
    warranty_type: normalizeWarrantyType(warranty["Warranty Type"] || warranty.Warranty_Type || warranty.warranty_type),
    status: normalizeStatus(warranty.Status || warranty.status),
    warranty_document_url: warranty["Warranty Document URL"] || warranty.Warranty_Document_Url || warranty.warranty_document_url || "",
    receipt_url: warranty["Receipt URL"] || warranty.Receipt_Url || warranty.receipt_url || "",
    policy_provider: warranty["Policy Provider"] || warranty.Policy_Provider || warranty.policy_provider || "",
    policy_number: warranty["Policy Number"] || warranty.Policy_Number || warranty.policy_number || "",
    letter_received_from: warranty["Letter Received From"] || warranty.Letter_Received_From || warranty.letter_received_from || "",
    direct_debit_payment_day: warranty["Direct Debit Payment Day"] || warranty.Direct_Debit_Payment_Day || warranty.direct_debit_payment_day || null,
    online_account_website: warranty["Online Account Website"] || warranty.Online_Account_Website || warranty.online_account_website || "",
    online_account_email: warranty["Online Account Email"] || warranty.Online_Account_Email || warranty.online_account_email || "",
    online_account_password: warranty["Online Account Password"] || warranty.Online_Account_Password || warranty.online_account_password || "",
    auto_renewal: warranty["Auto Renewal"] !== null && warranty["Auto Renewal"] !== undefined
      ? warranty["Auto Renewal"]
      : (warranty.Auto_Renewal !== null && warranty.Auto_Renewal !== undefined ? warranty.Auto_Renewal : (warranty.auto_renewal || false)),
    renewal_reminder_date: warranty["Renewal Reminder Date"] || warranty.Renewal_Reminder_Date || warranty.renewal_reminder_date || "",
    renewal_contact_person: warranty["Renewal Contact Person"] || warranty.Renewal_Contact_Person || warranty.renewal_contact_person || "",
    renewal_notes: warranty["Renewal Notes"] || warranty.Renewal_Notes || warranty.renewal_notes || "",
    notes: warranty.Notes || warranty.notes || "",
    logged_by: warranty["Logged By"] || warranty.Logged_By || warranty.logged_by || currentUser?.full_name || ""
  } : {
    product_name: "",
    brand: "",
    model_number: "",
    serial_number: "",
    location_type: "property",
    property_id: "",
    accommodation_id: "",
    purchase_date: "",
    warranty_start_date: "",
    warranty_end_date: "",
    warranty_period_months: 12,
    supplier: "",
    purchase_price: 0,
    warranty_type: "manufacturer",
    status: "active",
    warranty_document_url: "",
    receipt_url: "",
    policy_provider: "",
    policy_number: "",
    letter_received_from: "",
    direct_debit_payment_day: null,
    online_account_website: "",
    online_account_email: "",
    online_account_password: "",
    auto_renewal: false,
    renewal_reminder_date: "",
    renewal_contact_person: "",
    renewal_notes: "",
    notes: "",
    logged_by: currentUser?.full_name || ""
  });

  // Update logged_by when currentUser becomes available
  useEffect(() => {
    if (currentUser?.full_name) {
      setFormData(prev => ({
        ...prev,
        logged_by: currentUser.full_name
      }));
    }
  }, [currentUser]);

  const formatEnumForSupabase = (value, enumType) => {
    if (!value) return null;

    const enumMaps = {
      status: {
        'active': 'Active',
        'expired': 'Expired',
        'claimed': 'Claimed',
        'cancelled': 'Cancelled',
        'pending_renewal': 'Pending Renewal'
      },
      warranty_type: {
        'manufacturer': 'Manufacturer Warranty',
        'extended': 'Extended Warranty',
        'retailer': 'Retailer Warranty',
        'insurance': 'Insurance Warranty'
      }
    };

    const lowerValue = String(value).toLowerCase();
    return enumMaps[enumType]?.[lowerValue] || value;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Ensure logged_by is set before submission
    const dataToSubmit = {
      ...formData,
      logged_by: formData.logged_by || currentUser?.full_name || ""
    };

    // Convert to PascalCase for Supabase
    const supabaseData = {
      "Product Name": dataToSubmit.product_name,
      Brand: dataToSubmit.brand || null,
      "Model Number": dataToSubmit.model_number || null,
      "Serial Number": dataToSubmit.serial_number || null,
      Office: dataToSubmit.location_type === "office",
      "Property ID": dataToSubmit.location_type === "office" ? null : (dataToSubmit.property_id || null),
      "Accommodation ID": dataToSubmit.accommodation_id || null,
      "Purchase Date": dataToSubmit.purchase_date || null,
      "Warranty Start Date": dataToSubmit.warranty_start_date,
      "Warranty End Date": dataToSubmit.warranty_end_date,
      "Warranty Period (Months)": dataToSubmit.warranty_period_months,
      Supplier: dataToSubmit.supplier || null,
      "Purchase Price": dataToSubmit.purchase_price,
      "Warranty Type": formatEnumForSupabase(dataToSubmit.warranty_type, 'warranty_type'),
      Status: formatEnumForSupabase(dataToSubmit.status, 'status'),
      "Warranty Document URL": dataToSubmit.warranty_document_url || null,
      "Receipt URL": dataToSubmit.receipt_url || null,
      "Policy Provider": dataToSubmit.policy_provider || null,
      "Policy Number": dataToSubmit.policy_number || null,
      "Letter Received From": dataToSubmit.letter_received_from || null,
      "Direct Debit Payment Day": dataToSubmit.direct_debit_payment_day || null,
      "Online Account Website": dataToSubmit.online_account_website || null,
      "Online Account Email": dataToSubmit.online_account_email || null,
      "Online Account Password": dataToSubmit.online_account_password || null,
      "Auto Renewal": dataToSubmit.auto_renewal,
      "Renewal Reminder Date": dataToSubmit.renewal_reminder_date || null,
      "Renewal Contact Person": dataToSubmit.renewal_contact_person || null,
      "Renewal Notes": dataToSubmit.renewal_notes || null,
      Notes: dataToSubmit.notes || null,
      "Logged By": dataToSubmit.logged_by || null,
      "Updated Date": new Date().toISOString()
    };

    if (!warranty) {
      supabaseData["Created Date"] = new Date().toISOString();
      supabaseData["Created By"] = currentUser?.email || "Unknown";
      supabaseData.ID = crypto.randomUUID();
    }

    onSubmit(supabaseData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Only filter accommodations if a property_id is selected and location type is property
  const filteredAccommodations = formData.property_id && formData.location_type === "property"
    ? accommodations?.filter(acc => {
        const accPropertyId = acc["Property ID"] || acc.Property_Id || acc.property_id;
        return String(accPropertyId) === String(formData.property_id);
      })
    : [];

  return (
    <Card className="mb-6 shadow-md">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-600" />
          {warranty ? "Edit Warranty" : "Add New Warranty"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Product Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="product_name">Product Name *</Label>
                <Input
                  id="product_name"
                  value={formData.product_name}
                  onChange={(e) => handleChange("product_name", e.target.value)}
                  placeholder="e.g., Washing Machine, Refrigerator"
                  required
                />
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
                      handleChange("accommodation_id", "");
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
                    <Label htmlFor="property_id">Property</Label>
                    <Select value={formData.property_id || ""} onValueChange={(value) => handleChange("property_id", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select property" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={null}>None</SelectItem>
                        {properties?.map((property) => {
                          const propertyId = property.ID || property.Id || property.id;
                          const propertyName = property.Name || property.name;
                          return (
                            <SelectItem key={propertyId} value={propertyId}>
                              {propertyName}
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
                        <SelectItem value={null}>General property item</SelectItem>
                        {filteredAccommodations.map((accommodation) => {
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
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Purchase & Warranty Details</h3>
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
                <Label htmlFor="supplier">Supplier</Label>
                <Input
                  id="supplier"
                  value={formData.supplier}
                  onChange={(e) => handleChange("supplier", e.target.value)}
                  placeholder="Where was it purchased from?"
                />
              </div>
              <div>
                <Label htmlFor="purchase_price">Purchase Price (£)</Label>
                <Input
                  id="purchase_price"
                  type="text"
                  value={formData.purchase_price}
                  onChange={(e) => handleChange("purchase_price", e.target.value)}
                  placeholder="e.g., 299.99"
                />
              </div>
              <div>
                <Label htmlFor="warranty_type">Warranty Type</Label>
                <Select value={formData.warranty_type} onValueChange={(value) => handleChange("warranty_type", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manufacturer">Manufacturer Warranty</SelectItem>
                    <SelectItem value="extended">Extended Warranty</SelectItem>
                    <SelectItem value="retailer">Retailer Warranty</SelectItem>
                    <SelectItem value="insurance">Insurance Warranty</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="warranty_start_date">Warranty Start Date *</Label>
                <Input
                  id="warranty_start_date"
                  type="date"
                  value={formData.warranty_start_date}
                  onChange={(e) => handleChange("warranty_start_date", e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="warranty_end_date">Warranty End Date *</Label>
                <Input
                  id="warranty_end_date"
                  type="date"
                  value={formData.warranty_end_date}
                  onChange={(e) => handleChange("warranty_end_date", e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="warranty_period_months">Warranty Period (Months)</Label>
                <Input
                  id="warranty_period_months"
                  type="number"
                  value={formData.warranty_period_months}
                  onChange={(e) => handleChange("warranty_period_months", parseInt(e.target.value) || 12)}
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleChange("status", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="claimed">Claimed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="pending_renewal">Pending Renewal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Documents</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="warranty_document_url">Warranty Document URL</Label>
                <Input
                  id="warranty_document_url"
                  type="url"
                  value={formData.warranty_document_url}
                  onChange={(e) => handleChange("warranty_document_url", e.target.value)}
                  placeholder="https://gdrive.com/warranty.pdf"
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
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Policy & Payment Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="policy_provider">Policy Provider</Label>
                <Input
                  id="policy_provider"
                  value={formData.policy_provider}
                  onChange={(e) => handleChange("policy_provider", e.target.value)}
                  placeholder="e.g., AXA, Allianz"
                />
              </div>
              <div>
                <Label htmlFor="policy_number">Policy Number</Label>
                <Input
                  id="policy_number"
                  value={formData.policy_number}
                  onChange={(e) => handleChange("policy_number", e.target.value)}
                  placeholder="Policy reference number"
                />
              </div>
              <div>
                <Label htmlFor="letter_received_from">Letter Received From (Company Name)</Label>
                <Input
                  id="letter_received_from"
                  value={formData.letter_received_from}
                  onChange={(e) => handleChange("letter_received_from", e.target.value)}
                  placeholder="Company that sent warranty letter"
                />
              </div>
              <div>
                <Label htmlFor="direct_debit_payment_day">Direct Debit Payment Day</Label>
                <Input
                  id="direct_debit_payment_day"
                  type="number"
                  min="1"
                  max="31"
                  value={formData.direct_debit_payment_day || ""}
                  onChange={(e) => handleChange("direct_debit_payment_day", e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="e.g., 1, 15, 28"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Day of the month for recurring direct debit payment (1-31)
                </p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Renewal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="auto_renewal" className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    id="auto_renewal"
                    checked={formData.auto_renewal}
                    onChange={(e) => handleChange("auto_renewal", e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  Auto-Renewal Enabled
                </Label>
              </div>
              <div>
                <Label htmlFor="renewal_reminder_date">Renewal Reminder Date</Label>
                <Input
                  id="renewal_reminder_date"
                  type="date"
                  value={formData.renewal_reminder_date}
                  onChange={(e) => handleChange("renewal_reminder_date", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="renewal_contact_person">Renewal Contact Person/Company</Label>
                <Input
                  id="renewal_contact_person"
                  value={formData.renewal_contact_person}
                  onChange={(e) => handleChange("renewal_contact_person", e.target.value)}
                  placeholder="Who to contact for renewal"
                />
              </div>
            </div>
            <div className="mt-4">
              <Label htmlFor="renewal_notes">Renewal Notes</Label>
              <Textarea
                id="renewal_notes"
                value={formData.renewal_notes}
                onChange={(e) => handleChange("renewal_notes", e.target.value)}
                placeholder="Notes about the renewal process..."
                rows={2}
              />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Online Account Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="online_account_website">Website</Label>
                <Input
                  id="online_account_website"
                  type="url"
                  value={formData.online_account_website}
                  onChange={(e) => handleChange("online_account_website", e.target.value)}
                  placeholder="https://provider-portal.com"
                />
              </div>
              <div>
                <Label htmlFor="online_account_email">Login Email</Label>
                <Input
                  id="online_account_email"
                  type="email"
                  value={formData.online_account_email}
                  onChange={(e) => handleChange("online_account_email", e.target.value)}
                  placeholder="account@email.com"
                />
              </div>
              <div>
                <Label htmlFor="online_account_password">Password</Label>
                <Input
                  id="online_account_password"
                  type="password"
                  value={formData.online_account_password}
                  onChange={(e) => handleChange("online_account_password", e.target.value)}
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Administration Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="logged_by">Logged By</Label>
                <Input
                  id="logged_by"
                  value={formData.logged_by}
                  placeholder="Staff member who logged this entry"
                  readOnly
                  className="bg-slate-50"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Automatically set to current user
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
              placeholder="Any additional notes about the warranty..."
              rows={3}
            />
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
              {warranty ? "Update Warranty" : "Add Warranty"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}