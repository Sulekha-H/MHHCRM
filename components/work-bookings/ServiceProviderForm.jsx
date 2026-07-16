"use client"

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, X, Calendar } from "lucide-react";
import { eachDayOfInterval, parseISO, format, isBefore, isAfter } from "date-fns";

const CATEGORIES = [
  "Handyman",
  "Plumber",
  "Electrician",
  "Decorator",
  "Gas Engineer",
  "Cleaner",
  "Gardener",
  "Translator",
  "Rubbish Collector",
  "Delivery Person",
  "Pest Control",
  "Other"
];

export default function ServiceProviderForm({ provider, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    contact_number: "",
    email: "",
    default_hourly_rate: "",
    default_day_rate: "",
    notes: "",
    unavailable_dates: []
  });

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    if (provider) {
      let unavail = provider["Unavailable Dates"] || provider.unavailable_dates || [];
      if (typeof unavail === 'string') {
        try {
          unavail = JSON.parse(unavail);
        } catch (e) {
          unavail = unavail.split(',').map(d => d.trim()).filter(Boolean);
        }
      }
      if (!Array.isArray(unavail)) unavail = [];

      setFormData({
        name: provider.Name || provider.name || "",
        category: provider.Category || provider.category || "",
        contact_number: provider["Contact Number"] || provider.contact_number || "",
        email: provider.Email || provider.email || "",
        default_hourly_rate: provider["Default Hourly Rate"] || provider.default_hourly_rate || "",
        default_day_rate: provider["Default Day Rate"] || provider.default_day_rate || "",
        notes: provider.Notes || provider.notes || "",
        unavailable_dates: unavail
      });
    }
  }, [provider]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (cat, checked) => {
    let currentCats = formData.category
      ? formData.category.split(",").map(c => c.trim())
      : [];
    if (checked) {
      if (!currentCats.some(c => c.toLowerCase() === cat.toLowerCase())) {
        currentCats.push(cat);
      }
    } else {
      currentCats = currentCats.filter(c => c.toLowerCase() !== cat.toLowerCase());
    }
    setFormData(prev => ({ ...prev, category: currentCats.join(", ") }));
  };

  const handleAddDateRange = () => {
    if (!startDate) return;

    let targetDates = [];
    if (endDate) {
      const start = parseISO(startDate);
      const end = parseISO(endDate);

      if (isAfter(start, end)) {
        alert("Start Date must be before or equal to End Date.");
        return;
      }

      try {
        const interval = eachDayOfInterval({ start, end });
        targetDates = interval.map(date => format(date, "yyyy-MM-dd"));
      } catch (err) {
        alert("Invalid date range entered.");
        return;
      }
    } else {
      targetDates = [startDate];
    }

    setFormData(prev => {
      const existing = prev.unavailable_dates || [];
      // Combine and filter unique dates
      const combined = [...new Set([...existing, ...targetDates])].sort();
      return {
        ...prev,
        unavailable_dates: combined
      };
    });

    setStartDate("");
    setEndDate("");
  };

  const handleRemoveDate = (dateToRemove) => {
    setFormData(prev => ({
      ...prev,
      unavailable_dates: prev.unavailable_dates.filter(d => d !== dateToRemove)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.category) {
      alert("Please select at least one category.");
      return;
    }
    onSubmit(formData);
  };

  const formatDateString = (ds) => {
    if (!ds) return "";
    const [year, month, day] = ds.split('-');
    return `${day}/${month}/${year}`;
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>{provider ? "Edit Service Provider" : "Add New Service Provider"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
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
                <Label htmlFor="contact_number">Contact Number</Label>
                <Input
                  id="contact_number"
                  name="contact_number"
                  value={formData.contact_number}
                  onChange={handleChange}
                  placeholder="Phone Number"
                />
              </div>
            </div>

            <div className="space-y-3 p-4 border border-slate-200 rounded-lg bg-slate-50/50">
              <div className="flex justify-between items-center">
                <Label className="font-semibold text-slate-800">Categories (Select all that apply) <span className="text-red-500">*</span></Label>
                {!formData.category && (
                  <span className="text-xs text-red-500 font-medium">Please select at least one category</span>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {CATEGORIES.map((cat) => {
                  const selectedCategories = formData.category
                    ? formData.category.split(",").map(c => c.trim().toLowerCase())
                    : [];
                  const isChecked = selectedCategories.includes(cat.toLowerCase());
                  return (
                    <label
                      key={cat}
                      className={`flex items-center gap-2 p-2.5 rounded-md border text-sm cursor-pointer transition-all select-none hover:bg-slate-100 ${
                        isChecked
                          ? "bg-blue-50 border-blue-300 text-blue-900 font-medium shadow-sm"
                          : "bg-white border-slate-200 text-slate-700"
                      }`}
                    >
                      <Checkbox
                        id={`cat-${cat}`}
                        checked={isChecked}
                        onCheckedChange={(checked) => handleCheckboxChange(cat, checked)}
                      />
                      <span>{cat}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  type="text"
                  value={formData.default_hourly_rate}
                  onChange={handleChange}
                  placeholder="e.g. 15.00 or Variable"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="default_day_rate">Default Day Rate (£)</Label>
                <Input
                  id="default_day_rate"
                  name="default_day_rate"
                  type="text"
                  value={formData.default_day_rate}
                  onChange={handleChange}
                  placeholder="e.g. 120.00 or N/A"
                />
              </div>
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

          <div className="space-y-3 pt-4 border-t border-slate-100">
            <Label className="font-semibold text-slate-800 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-500" />
              Unavailable Dates Range
            </Label>
            <div className="flex flex-col sm:flex-row gap-3 items-end max-w-xl">
              <div className="flex-1 space-y-1 w-full">
                <Label htmlFor="start_date" className="text-xs text-slate-500">Start Date</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="flex-1 space-y-1 w-full">
                <Label htmlFor="end_date" className="text-xs text-slate-500">End Date</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full"
                />
              </div>
              <Button
                type="button"
                onClick={handleAddDateRange}
                variant="secondary"
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium shrink-0 flex items-center gap-1 w-full sm:w-auto"
              >
                <Plus className="w-4 h-4" />
                Add Range
              </Button>
            </div>

            {formData.unavailable_dates && formData.unavailable_dates.length > 0 ? (
              <div className="flex flex-wrap gap-2 mt-2 pt-1">
                {formData.unavailable_dates.map((date) => (
                  <span
                    key={date}
                    className="inline-flex items-center gap-1.5 bg-red-50 text-red-700 border border-red-200 text-xs px-2.5 py-1 rounded-full font-medium"
                  >
                    {formatDateString(date)}
                    <button
                      type="button"
                      onClick={() => handleRemoveDate(date)}
                      className="text-red-400 hover:text-red-600 transition-colors focus:outline-none"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic font-medium">No unavailable dates added yet.</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" className="bg-orange-600 hover:bg-orange-700" disabled={!formData.category}>
              {provider ? "Update Provider" : "Save Provider"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
