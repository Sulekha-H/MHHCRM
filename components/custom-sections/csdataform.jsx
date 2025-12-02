import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, X, Loader2, FileStack } from "lucide-react";

export default function CustomSectionDataForm({ section, entry, onSubmit, onCancel, currentUser }) {
  const [formData, setFormData] = useState(entry || {
    title: "",
    data: {},
    status: "active",
    notes: ""
  });
  const [saving, setSaving] = useState(false);

  const handleFieldChange = (fieldName, value) => {
    setFormData({
      ...formData,
      data: {
        ...formData.data,
        [fieldName]: value
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Map status to database format
      const statusMap = {
        'active': 'Active',
        'archived': 'Archived'
      };

      // Convert to Supabase format with spaces in column names
      const supabaseData = {
        Title: formData.title || null,
        Data: formData.data,
        Status: statusMap[formData.status] || formData.status,
        Notes: formData.notes || null,
        "Updated Date": new Date().toISOString()
      };

      // Only add these fields for new entries
      if (!entry?.Id && !entry?.id) {
        supabaseData["Created Date"] = new Date().toISOString();
        supabaseData["Created By"] = currentUser?.email || "Unknown";
      }

      console.log("Form submitting data:", supabaseData);
      await onSubmit(supabaseData);
    } catch (error) {
      console.error("Form submission error:", error);
      alert("Failed to save entry: " + (error.message || "Unknown error"));
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const renderField = (field) => {
    const value = formData.data[field.field_name] || "";

    if (field.field_type === "date") {
      return (
        <Input
          type="date"
          required={field.required}
          value={value}
          onChange={(e) => handleFieldChange(field.field_name, e.target.value)}
          className="w-full"
          disabled={saving}
        />
      );
    }

    if (field.field_type === "text") {
      return (
        <Input
          required={field.required}
          value={value}
          onChange={(e) => handleFieldChange(field.field_name, e.target.value)}
          placeholder={`Enter ${field.field_name}...`}
          disabled={saving}
        />
      );
    }

    if (field.field_type === "textarea") {
      return (
        <Textarea
          required={field.required}
          value={value}
          onChange={(e) => handleFieldChange(field.field_name, e.target.value)}
          placeholder={`Enter ${field.field_name}...`}
          rows={4}
          disabled={saving}
        />
      );
    }

    if (field.field_type === "number") {
      return (
        <Input
          type="number"
          required={field.required}
          value={value}
          onChange={(e) => handleFieldChange(field.field_name, e.target.value)}
          placeholder={`Enter ${field.field_name}...`}
          disabled={saving}
        />
      );
    }

    if (field.field_type === "checkbox") {
      return (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={value === true || value === "true"}
            onChange={(e) => handleFieldChange(field.field_name, e.target.checked)}
            className="rounded"
            disabled={saving}
          />
          <label className="text-sm text-slate-700">Yes</label>
        </div>
      );
    }

    if (field.field_type === "select") {
      return (
        <Select
          value={value}
          onValueChange={(val) => handleFieldChange(field.field_name, val)}
          required={field.required}
          disabled={saving}
        >
          <SelectTrigger>
            <SelectValue placeholder={`Select ${field.field_name}...`} />
          </SelectTrigger>
          <SelectContent>
            {field.options && field.options.map((option, idx) => (
              <SelectItem key={idx} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    // Default fallback
    return (
      <Input
        value={value}
        onChange={(e) => handleFieldChange(field.field_name, e.target.value)}
        placeholder={`Enter ${field.field_name}...`}
        disabled={saving}
      />
    );
  };

  return (
    <Card className="mb-6 shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileStack className="w-5 h-5 text-indigo-600" />
          {entry ? "Edit Entry" : "Add New Entry"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Title (Optional)
            </label>
            <Input
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
              placeholder="Give this entry a title..."
              disabled={saving}
            />
          </div>

          <div className="border-t pt-4">
            <h3 className="text-md font-semibold text-slate-900 mb-4">Entry Data</h3>
            <div className="space-y-4">
              {section.fields && section.fields.map((field, index) => (
                <div key={index}>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {field.field_name}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  {renderField(field)}
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Notes
            </label>
            <Textarea
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder="Add any additional notes..."
              rows={3}
              disabled={saving}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
              <X className="w-4 h-4 mr-2" /> Cancel
            </Button>
            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {entry ? "Update Entry" : "Create Entry"}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}