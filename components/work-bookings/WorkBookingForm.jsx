"use client"

import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function WorkBookingForm({ booking, providers, properties, accommodations, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    service_provider_id: "",
    property_id: "",
    accommodation_id: "none",
    area: "",
    date: new Date().toISOString().split('T')[0],
    duration_hours: 0,
    duration_minutes: 0,
    hourly_rate: 0,
    total_pay: 0,
    payment_status: "Pending",
    work_status: "Scheduled",
    invoice_number: "",
    invoice_file_url: "",
    description_of_work: "",
    notes: ""
  });

  const getUnavailableDates = (provider) => {
    let unavail = provider?.["Unavailable Dates"] || provider?.unavailable_dates || [];
    if (typeof unavail === 'string') {
      try {
        unavail = JSON.parse(unavail);
      } catch (e) {
        unavail = unavail.split(',').map(d => d.trim()).filter(Boolean);
      }
    }
    return Array.isArray(unavail) ? unavail : [];
  };

  const isProviderUnavailable = (provider, dateString) => {
    if (!provider || !dateString) return false;
    const dates = getUnavailableDates(provider);
    const targetDate = dateString.split('T')[0];
    return dates.some(d => d.split('T')[0] === targetDate);
  };

  const selectedProvider = useMemo(() => {
    return providers.find(p => (p.ID || p.id) === formData.service_provider_id);
  }, [formData.service_provider_id, providers]);

  const isCurrentProviderUnavailable = useMemo(() => {
    return isProviderUnavailable(selectedProvider, formData.date);
  }, [selectedProvider, formData.date]);

  const selectedProviderName = selectedProvider ? (selectedProvider.Name || selectedProvider.name) : "Selected provider";

  const filteredAccommodations = useMemo(() => {
    if (!formData.property_id || formData.property_id === "none") return [];
    return accommodations.filter(acc => (acc["Property ID"] || acc.property_id) === formData.property_id);
  }, [formData.property_id, accommodations]);

  useEffect(() => {
    if (booking) {
      setFormData({
        service_provider_id: booking["Service Provider ID"] || booking.service_provider_id || "",
        property_id: booking["Property ID"] || booking.property_id || "",
        accommodation_id: booking["Accommodation ID"] || booking.accommodation_id || "none",
        area: booking.Area || booking.area || "",
        date: booking.Date || booking.date || new Date().toISOString().split('T')[0],
        duration_hours: booking["Duration Hours"] || booking.duration_hours || 0,
        duration_minutes: booking["Duration Minutes"] || booking.duration_minutes || 0,
        hourly_rate: booking["Hourly Rate"] || booking.hourly_rate || 0,
        total_pay: booking["Total Pay"] || booking.total_pay || 0,
        payment_status: booking["Payment Status"] || booking.payment_status || "Pending",
        work_status: booking["Work Status"] || booking.work_status || "Scheduled",
        invoice_number: booking["Invoice Number"] || booking.invoice_number || "",
        invoice_file_url: booking["Invoice File URL"] || booking.invoice_file_url || "",
        description_of_work: booking["Description of Work"] || booking.description_of_work || "",
        notes: booking.Notes || booking.notes || ""
      });
    }
  }, [booking]);

  // Auto-calculate pay
  useEffect(() => {
    const hours = parseFloat(formData.duration_hours || 0);
    const minutes = parseFloat(formData.duration_minutes || 0);
    const rate = parseFloat(formData.hourly_rate || 0);

    const totalHours = hours + (minutes / 60);
    const totalPay = (totalHours * rate).toFixed(2);

    setFormData(prev => ({ ...prev, total_pay: totalPay }));
  }, [formData.duration_hours, formData.duration_minutes, formData.hourly_rate]);

  // Set default hourly rate when provider changes
  const handleProviderChange = (val) => {
    const provider = providers.find(p => (p.ID || p.id) === val);
    setFormData(prev => ({
      ...prev,
      service_provider_id: val,
      hourly_rate: provider ? (provider["Default Hourly Rate"] || provider.default_hourly_rate || 0) : prev.hourly_rate
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const submissionData = { ...formData };
    if (submissionData.accommodation_id === "none") submissionData.accommodation_id = null;
    onSubmit(submissionData);
  };

  const areas = ["Lounge", "Kitchen", "Hallway", "Garden", "Bathroom", "Bedroom", "General Property"];

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>{booking ? "Edit Work Booking" : "New Work Booking"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="service_provider_id">Service Provider</Label>
              <Select
                value={formData.service_provider_id}
                onValueChange={handleProviderChange}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Provider" />
                </SelectTrigger>
                <SelectContent>
                  {providers.map(p => {
                    const isUnavail = isProviderUnavailable(p, formData.date);
                    return (
                      <SelectItem
                        key={p.ID || p.id}
                        value={p.ID || p.id}
                        disabled={isUnavail}
                      >
                        {p.Name || p.name} ({p.Category || p.category}){isUnavail ? " - (Unavailable)" : ""}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                name="date"
                type="date"
                value={formData.date}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="work_status">Work Status</Label>
              <Select
                value={formData.work_status}
                onValueChange={(val) => handleSelectChange("work_status", val)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Scheduled">Scheduled</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="property_id">Property</Label>
              <Select
                value={formData.property_id}
                onValueChange={(val) => handleSelectChange("property_id", val)}
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

            <div className="space-y-2">
              <Label htmlFor="accommodation_id">Accommodation / Room</Label>
              <Select
                value={formData.accommodation_id}
                onValueChange={(val) => handleSelectChange("accommodation_id", val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="General Property" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">General Property</SelectItem>
                  {filteredAccommodations.map(a => (
                    <SelectItem key={a.ID || a.id} value={a.ID || a.id}>
                      {a["Room Number"] || a.room_number || "Unknown Room"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="area">Area</Label>
              <Select
                value={formData.area}
                onValueChange={(val) => handleSelectChange("area", val)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Area" />
                </SelectTrigger>
                <SelectContent>
                  {areas.map(area => (
                    <SelectItem key={area} value={area}>{area}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="border-t pt-4 mt-4">
            <h3 className="text-sm font-medium text-slate-700 mb-3">Time & Payment</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration_hours">Hours</Label>
                <Input
                  id="duration_hours"
                  name="duration_hours"
                  type="number"
                  min="0"
                  value={formData.duration_hours}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration_minutes">Minutes</Label>
                <Input
                  id="duration_minutes"
                  name="duration_minutes"
                  type="number"
                  min="0"
                  max="59"
                  value={formData.duration_minutes}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hourly_rate">Hourly Rate (£)</Label>
                <Input
                  id="hourly_rate"
                  name="hourly_rate"
                  type="number"
                  step="0.01"
                  value={formData.hourly_rate}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="total_pay">Total Pay (£)</Label>
                <Input
                  id="total_pay"
                  name="total_pay"
                  type="number"
                  step="0.01"
                  value={formData.total_pay}
                  onChange={handleChange}
                  className="bg-slate-50 font-bold"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="payment_status">Payment Status</Label>
              <Select
                value={formData.payment_status}
                onValueChange={(val) => handleSelectChange("payment_status", val)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Payment Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="invoice_number">Invoice Number</Label>
              <Input
                id="invoice_number"
                name="invoice_number"
                value={formData.invoice_number}
                onChange={handleChange}
                placeholder="INV-XXXX"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invoice_file_url">Invoice Document Link</Label>
              <Input
                id="invoice_file_url"
                name="invoice_file_url"
                value={formData.invoice_file_url}
                onChange={handleChange}
                placeholder="https://drive.google.com/..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description_of_work">Description of Work</Label>
            <Textarea
              id="description_of_work"
              name="description_of_work"
              value={formData.description_of_work}
              onChange={handleChange}
              placeholder="What needs to be done or what was done..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Internal notes..."
              rows={2}
            />
          </div>

          {isCurrentProviderUnavailable && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-3.5 text-sm flex items-start gap-2.5">
              <span className="font-bold text-red-600 shrink-0">⚠️ Notice:</span>
              <div>
                <span className="font-semibold">{selectedProviderName}</span> is marked as <span className="font-bold text-red-700">unavailable</span> on <span className="font-bold text-red-700">{formData.date}</span>. Please choose another date or service provider.
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-orange-600 hover:bg-orange-700"
              disabled={isCurrentProviderUnavailable}
            >
              {booking ? "Update Booking" : "Save Booking"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
