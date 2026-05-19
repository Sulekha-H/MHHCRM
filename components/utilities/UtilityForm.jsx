import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Save, Zap } from "lucide-react";

export default function UtilityForm({ utility, properties = [], onSubmit, onCancel, initialPropertyId }) {
  const [formData, setFormData] = useState({
    company_name: "",
    company_phone: "",
    property_id: initialPropertyId || "",
    company_address: "",
    company_email: "",
    company_account_number: "",
    utility_type: "",
    provider_address: "",
    provider_website: "",
    account_holder_name: "",
    account_number: "",
    tenant_name: "",
    move_in_date: "",
    move_out_date: "",
    leaving_date: "",
    final_meter_reading: "",
    move_in_meter_reading: "",
    meter_serial_number: "",
    login_email: "",
    login_username: "",
    login_password: "",
    notes: ""
  });

  useEffect(() => {
    if (utility) {
      setFormData({
        company_name: utility["Company Name"] || "",
        company_phone: utility["Company Phone Number"] || "",
        property_id: utility["Property ID"] || "",
        company_address: utility["Company Address"] || "",
        company_email: utility["Company Email Address"] || "",
        company_account_number: utility["Company Account Number"] || "",
        utility_type: utility["Utility Type"] || "",
        provider_address: utility["Provider Address"] || "",
        provider_website: utility["Provider Website"] || "",
        account_holder_name: utility["Account Holder Name"] || "",
        account_number: utility["Account Number"] || "",
        tenant_name: utility["Tenant Name"] || "",
        move_in_date: utility["Move In Date"] || "",
        move_out_date: utility["Move Out Date"] || "",
        leaving_date: utility["Leaving Date"] || "",
        final_meter_reading: utility["Final Meter Reading"] || "",
        move_in_meter_reading: utility["Move In Meter Reading"] || "",
        meter_serial_number: utility["Meter Serial Number"] || "",
        login_email: utility["Login Email Address"] || "",
        login_username: utility["Login Username"] || "",
        login_password: utility["Login Password"] || "",
        notes: utility["Notes"] || ""
      });
    } else if (initialPropertyId) {
      setFormData(prev => ({ ...prev, property_id: initialPropertyId }));
    }
  }, [utility, initialPropertyId]);

  const handleSubmit = (e) => {
    e.preventDefault();

    const supabaseData = {
      "Company Name": formData.company_name,
      "Company Phone Number": formData.company_phone,
      "Property ID": formData.property_id,
      "Company Address": formData.company_address,
      "Company Email Address": formData.company_email,
      "Company Account Number": formData.company_account_number,
      "Utility Type": formData.utility_type,
      "Provider Address": formData.provider_address,
      "Provider Website": formData.provider_website,
      "Account Holder Name": formData.account_holder_name,
      "Account Number": formData.account_number,
      "Tenant Name": formData.tenant_name,
      "Move In Date": formData.move_in_date || null,
      "Move Out Date": formData.move_out_date || null,
      "Leaving Date": formData.leaving_date || null,
      "Final Meter Reading": formData.final_meter_reading,
      "Move In Meter Reading": formData.move_in_meter_reading,
      "Meter Serial Number": formData.meter_serial_number,
      "Login Email Address": formData.login_email,
      "Login Username": formData.login_username,
      "Login Password": formData.login_password,
      "Notes": formData.notes,
      "Updated Date": new Date().toISOString()
    };

    if (utility) {
      supabaseData.ID = utility.ID;
    } else {
      supabaseData.ID = crypto.randomUUID();
      supabaseData["Created Date"] = new Date().toISOString();
    }

    onSubmit(supabaseData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const utilityTypes = [
    "Electricity", "Gas", "Water", "Council Tax", "Broadband", "TV License", "Other"
  ];

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-teal-600" />
          {utility ? "Edit Utility" : "Add New Utility"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="mb-2 block">Property *</Label>
              <Select
                value={formData.property_id}
                onValueChange={(value) => handleChange("property_id", value)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Property" />
                </SelectTrigger>
                <SelectContent>
                  {properties.map(p => (
                    <SelectItem key={p.ID || p.id} value={p.ID || p.id}>
                      {p.Name || p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-2 block">Utility Type *</Label>
              <Select
                value={formData.utility_type}
                onValueChange={(value) => handleChange("utility_type", value)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Type" />
                </SelectTrigger>
                <SelectContent>
                  {utilityTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-md font-semibold mb-4">Company Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="mb-2 block">Company Name</Label>
                <Input value={formData.company_name} onChange={(e) => handleChange("company_name", e.target.value)} />
              </div>
              <div>
                <Label className="mb-2 block">Company Phone</Label>
                <Input value={formData.company_phone} onChange={(e) => handleChange("company_phone", e.target.value)} />
              </div>
              <div>
                <Label className="mb-2 block">Company Email</Label>
                <Input value={formData.company_email} onChange={(e) => handleChange("company_email", e.target.value)} />
              </div>
              <div>
                <Label className="mb-2 block">Company Account Number</Label>
                <Input value={formData.company_account_number} onChange={(e) => handleChange("company_account_number", e.target.value)} />
              </div>
              <div className="md:col-span-2">
                <Label className="mb-2 block">Company Address</Label>
                <Input value={formData.company_address} onChange={(e) => handleChange("company_address", e.target.value)} />
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-md font-semibold mb-4">Account & Meter Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="mb-2 block">Account Holder Name</Label>
                <Input value={formData.account_holder_name} onChange={(e) => handleChange("account_holder_name", e.target.value)} />
              </div>
              <div>
                <Label className="mb-2 block">Account Number</Label>
                <Input value={formData.account_number} onChange={(e) => handleChange("account_number", e.target.value)} />
              </div>
              <div>
                <Label className="mb-2 block">Meter Serial Number</Label>
                <Input value={formData.meter_serial_number} onChange={(e) => handleChange("meter_serial_number", e.target.value)} />
              </div>
              <div>
                <Label className="mb-2 block">Tenant Name</Label>
                <Input value={formData.tenant_name} onChange={(e) => handleChange("tenant_name", e.target.value)} />
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-md font-semibold mb-4">Dates & Readings</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="mb-2 block">Move In Date</Label>
                <Input type="date" value={formData.move_in_date} onChange={(e) => handleChange("move_in_date", e.target.value)} />
              </div>
              <div>
                <Label className="mb-2 block">Move Out Date</Label>
                <Input type="date" value={formData.move_out_date} onChange={(e) => handleChange("move_out_date", e.target.value)} />
              </div>
              <div>
                <Label className="mb-2 block">Leaving Date</Label>
                <Input type="date" value={formData.leaving_date} onChange={(e) => handleChange("leaving_date", e.target.value)} />
              </div>
              <div>
                <Label className="mb-2 block">Move In Meter Reading</Label>
                <Input value={formData.move_in_meter_reading} onChange={(e) => handleChange("move_in_meter_reading", e.target.value)} />
              </div>
              <div>
                <Label className="mb-2 block">Final Meter Reading</Label>
                <Input value={formData.final_meter_reading} onChange={(e) => handleChange("final_meter_reading", e.target.value)} />
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-md font-semibold mb-4">Login Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="mb-2 block">Login Email</Label>
                <Input value={formData.login_email} onChange={(e) => handleChange("login_email", e.target.value)} />
              </div>
              <div>
                <Label className="mb-2 block">Login Username</Label>
                <Input value={formData.login_username} onChange={(e) => handleChange("login_username", e.target.value)} />
              </div>
              <div>
                <Label className="mb-2 block">Login Password</Label>
                <Input type="text" value={formData.login_password} onChange={(e) => handleChange("login_password", e.target.value)} />
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <Label className="mb-2 block">Notes</Label>
            <Textarea value={formData.notes} onChange={(e) => handleChange("notes", e.target.value)} rows={3} />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onCancel}>
              <X className="w-4 h-4 mr-2" /> Cancel
            </Button>
            <Button type="submit" className="bg-teal-600 hover:bg-teal-700">
              <Save className="w-4 h-4 mr-2" /> {utility ? "Update Utility" : "Add Utility"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
