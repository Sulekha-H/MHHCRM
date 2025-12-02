import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Save, FileStack } from "lucide-react";

export default function SWDocumentForm_Supabase({ document, currentUser, onSubmit, onCancel }) {
  const [formData, setFormData] = useState(document ? {
    name: document.Name || document.name || "",
    category: document.Category || document.category || "Fire Safety",
    description: document.Description || document.description || "",
    is_active: document.Is_Active !== null && document.Is_Active !== undefined ? document.Is_Active : (document.is_active !== null && document.is_active !== undefined ? document.is_active : true)
  } : {
    name: "",
    category: "Fire Safety",
    description: "",
    is_active: true
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Convert to PascalCase for Supabase
    const supabaseData = {
      Name: formData.name,
      Category: formData.category,
      Description: formData.description || null,
      Is_Active: formData.is_active,
      Updated_Date: new Date().toISOString()
    };

    if (!document) {
      supabaseData.Created_Date = new Date().toISOString();
      supabaseData.Created_By = currentUser?.email || "Unknown";
    }

    onSubmit(supabaseData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="mb-6 shadow-md border-t-4 border-t-blue-600">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <FileStack className="w-5 h-5 text-blue-600" />
          {document ? "Edit SW Document Type" : "Add New SW Document Type"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Document Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="e.g., Weekly fire alarm test"
              required
            />
          </div>

          <div>
            <Label htmlFor="category">Category *</Label>
            <Select value={formData.category} onValueChange={(value) => handleChange("category", value)} required>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Fire Safety">Fire Safety</SelectItem>
                <SelectItem value="Health & Safety">Health & Safety</SelectItem>
                <SelectItem value="Building Maintenance">Building Maintenance</SelectItem>
                <SelectItem value="General">General</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              rows={3}
              placeholder="Optional description of what this check entails..."
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => handleChange("is_active", checked)}
            />
            <Label htmlFor="is_active" className="text-sm font-medium">
              Active (appears in weekly tracking)
            </Label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onCancel}>
              <X className="w-4 h-4 mr-2" /> Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              <Save className="w-4 h-4 mr-2" />
              {document ? "Update Document Type" : "Create Document Type"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}