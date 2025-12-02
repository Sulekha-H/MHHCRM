import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Plus, Save, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function CustomSectionForm({ section, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    section_name: section?.["Section Name"] || section?.section_name || "",
    description: section?.Description || section?.description || "",
    icon: section?.Icon || section?.icon || "Settings",
    color: section?.Color || section?.color || "#6366f1",
    fields: section?.Fields || section?.fields || [],
    permissions: section?.Permissions || section?.permissions || [],
    is_active: section?.["Is Active"] !== undefined ? section["Is Active"] : (section?.is_active !== undefined ? section.is_active : true)
  });

  const [newField, setNewField] = useState({
    field_name: "",
    field_type: "text",
    required: false,
    options: []
  });

  const [newOption, setNewOption] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      // Convert to Supabase format with spaces in column names
      const supabaseData = {
        "Section Name": formData.section_name,
        "Description": formData.description || null,
        "Icon": formData.icon,
        "Color": formData.color,
        "Fields": formData.fields,
        "Permissions": formData.permissions || [],
        "Is Active": formData.is_active,
        "Updated Date": new Date().toISOString()
      };

      if (!section?.ID && !section?.Id && !section?.id) {
        supabaseData["Created Date"] = new Date().toISOString();
        supabaseData["ID"] = crypto.randomUUID();
      }

      await onSubmit(supabaseData);
    } catch (error) {
      console.error("Error saving custom section:", error);
      alert("Failed to save custom section: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const addField = () => {
    if (!newField.field_name) return;
    
    setFormData({
      ...formData,
      fields: [...formData.fields, { ...newField }]
    });
    
    setNewField({
      field_name: "",
      field_type: "text",
      required: false,
      options: []
    });
  };

  const removeField = (index) => {
    setFormData({
      ...formData,
      fields: formData.fields.filter((_, i) => i !== index)
    });
  };

  const addOption = () => {
    if (!newOption) return;
    setNewField({
      ...newField,
      options: [...(newField.options || []), newOption]
    });
    setNewOption("");
  };

  const removeOption = (index) => {
    setNewField({
      ...newField,
      options: newField.options.filter((_, i) => i !== index)
    });
  };

  return (
    <Card className="mb-6 shadow-md">
      <CardHeader>
        <CardTitle>{section ? "Edit Custom Section" : "Create Custom Section"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Section Name *
              </label>
              <Input
                required
                value={formData.section_name}
                onChange={(e) => setFormData({ ...formData, section_name: e.target.value })}
                placeholder="e.g., Staff Training Records"
                disabled={saving}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Color Theme
              </label>
              <Input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                disabled={saving}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Description
            </label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe what this section is for..."
              rows={3}
              disabled={saving}
            />
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Define Fields</h3>
            
            <div className="space-y-4 mb-4">
              {formData.fields && formData.fields.map((field, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-slate-900">{field.field_name}</div>
                    <div className="text-sm text-slate-600">
                      Type: {field.field_type}
                      {field.required && <Badge variant="outline" className="ml-2">Required</Badge>}
                    </div>
                    {field.options && field.options.length > 0 && (
                      <div className="text-xs text-slate-500 mt-1">
                        Options: {field.options.join(", ")}
                      </div>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeField(index)}
                    disabled={saving}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="border rounded-lg p-4 space-y-4 bg-slate-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Field Name
                  </label>
                  <Input
                    value={newField.field_name}
                    onChange={(e) => setNewField({ ...newField, field_name: e.target.value })}
                    placeholder="e.g., Training Name"
                    disabled={saving}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Field Type
                  </label>
                  <Select
                    value={newField.field_type}
                    onValueChange={(value) => setNewField({ ...newField, field_type: value })}
                    disabled={saving}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="textarea">Text Area</SelectItem>
                      <SelectItem value="number">Number</SelectItem>
                      <SelectItem value="date">Date</SelectItem>
                      <SelectItem value="checkbox">Checkbox</SelectItem>
                      <SelectItem value="select">Dropdown</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {newField.field_type === 'select' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Dropdown Options
                  </label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={newOption}
                      onChange={(e) => setNewOption(e.target.value)}
                      placeholder="Add option..."
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addOption())}
                      disabled={saving}
                    />
                    <Button type="button" onClick={addOption} variant="outline" disabled={saving}>
                      Add
                    </Button>
                  </div>
                  {newField.options && newField.options.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {newField.options.map((option, idx) => (
                        <Badge key={idx} variant="secondary">
                          {option}
                          <button
                            type="button"
                            onClick={() => removeOption(idx)}
                            className="ml-2"
                            disabled={saving}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="field-required"
                  checked={newField.required}
                  onChange={(e) => setNewField({ ...newField, required: e.target.checked })}
                  className="rounded"
                  disabled={saving}
                />
                <label htmlFor="field-required" className="text-sm text-slate-700">
                  Required field
                </label>
              </div>

              <Button type="button" onClick={addField} variant="outline" className="w-full" disabled={saving}>
                <Plus className="w-4 h-4 mr-2" />
                Add Field
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is-active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="rounded"
              disabled={saving}
            />
            <label htmlFor="is-active" className="text-sm text-slate-700">
              Active (visible and usable)
            </label>
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
                  {section ? "Update Section" : "Create Section"}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}