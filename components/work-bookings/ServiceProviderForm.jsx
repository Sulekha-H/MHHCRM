"use client"

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ServiceProviderForm({ provider, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    contact_number: "",
    email: "",
    default_hourly_rate: "",
    notes: ""
  });

  useEffect(() => {
    if (provider) {
      setFormData({
        name: provider.Name || provider.name || "",
        category: provider.Category || provider.category || "",
        contact_number: provider["Contact Number"] || provider.contact_number || "",
        email: provider.Email || provider.email || "",
        default_hourly_rate: provider["Default Hourly Rate"] || provider.default_hourly_rate || "",
        notes: provider.Notes || provider.notes || ""
      });
    }
  }, [provider]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>{provider ? "Edit Service Provider" : "Add New Service Provider"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Full Name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(val) => handleSelectChange("category", val)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cleaner">Cleaner</SelectItem>
                  <SelectItem value="Tradesman">Tradesman</SelectItem>
                  <SelectItem value="Gardener">Gardener</SelectItem>
                  <SelectItem value="Translator">Translator</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_number">Contact Number</Label>
              <Input
                id="contact_number"
                name="contact_number"
                value={formData.contact_number}
                onChange={handleChange}
                placeholder="Phone Number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email Address"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="default_hourly_rate">Default Hourly Rate (£)</Label>
              <Input
                id="default_hourly_rate"
                name="default_hourly_rate"
                type="number"
                step="0.01"
                value={formData.default_hourly_rate}
                onChange={handleChange}
                placeholder="0.00"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Any additional information..."
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" className="bg-orange-600 hover:bg-orange-700">
              {provider ? "Update Provider" : "Save Provider"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
