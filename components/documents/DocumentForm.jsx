"use client"

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Save, Loader2, FilePlus2, Tag, Plus } from "lucide-react";

export default function DocumentForm({ document: initialDocument, residents, currentUser, onSubmit, onCancel }) {
  const normalizeDocumentType = (val) => {
    if (!val) return "other";
    const v = val.toLowerCase();
    if (v.includes('policy')) return 'policy';
    if (v.includes('procedure')) return 'procedure';
    if (v.includes('form')) return 'form';
    if (v.includes('report')) return 'report';
    if (v.includes('correspondence')) return 'correspondence';
    if (v.includes('resident')) return 'resident_file';
    return 'other';
  };

  const normalizeConfidentiality = (val) => {
    if (!val) return "internal";
    const v = val.toLowerCase();
    if (v.includes('public')) return 'public';
    if (v.includes('internal')) return 'internal';
    if (v.includes('confidential')) return 'confidential';
    if (v.includes('restricted')) return 'restricted';
    return 'internal';
  };

  const [formData, setFormData] = useState(initialDocument ? {
    title: initialDocument.Title || initialDocument.title || "",
    document_type: normalizeDocumentType(initialDocument["Document Type"] || initialDocument.Document_Type || initialDocument.document_type),
    category: initialDocument.Category || initialDocument.category || "",
    resident_id: initialDocument["Resident ID"] || initialDocument.Resident_Id || initialDocument.resident_id || "",
    description: initialDocument.Description || initialDocument.description || "",
    confidentiality: normalizeConfidentiality(initialDocument.Confidentiality || initialDocument.confidentiality),
    expiry_date: initialDocument["Expiry Date"] || initialDocument.Expiry_Date || initialDocument.expiry_date || "",
    file_url: initialDocument["File URL"] || initialDocument.File_Url || initialDocument.file_url || "",
    tags: initialDocument.Tags || initialDocument.tags || [],
    logged_by: initialDocument["Logged By"] || initialDocument.Logged_By || initialDocument.logged_by || currentUser?.full_name || ""
  } : {
    title: "",
    document_type: "other",
    category: "",
    resident_id: "",
    description: "",
    confidentiality: "internal",
    expiry_date: "",
    file_url: "",
    tags: [],
    logged_by: currentUser?.full_name || ""
  });

  const [uploading, setUploading] = useState(false);
  const [tagInput, setTagInput] = useState("");

  // Update logged_by when currentUser becomes available
  useEffect(() => {
    if (currentUser?.full_name) {
      setFormData(prev => ({
        ...prev,
        logged_by: currentUser.full_name
      }));
    }
  }, [currentUser]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim().toLowerCase())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tagInput.trim().toLowerCase()]
      }));
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: (prev.tags || []).filter(tag => tag !== tagToRemove)
    }));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.file_url) {
      alert("Please enter a document URL.");
      return;
    }

    setUploading(true);
    
    // Ensure logged_by is set before submission
    let submissionData = {
      ...formData,
      logged_by: formData.logged_by || currentUser?.full_name || ""
    };

    // Helper to capitalize enum values for database
    const capitalizeEnum = (value) => {
      if (!value) return null;
      const enumMap = {
        'public': 'Public',
        'internal': 'Internal',
        'confidential': 'Confidential',
        'restricted': 'Restricted',
        'policy': 'Policy',
        'procedure': 'Procedure',
        'form': 'Form',
        'report': 'Report',
        'correspondence': 'Correspondence',
        'resident_file': 'Resident File',
        'other': 'Other'
      };
      return enumMap[value.toLowerCase()] || value;
    };

    // Convert to PascalCase with spaces for Supabase (matching the SQL schema)
    const supabaseData = {
      Title: submissionData.title,
      "Document Type": capitalizeEnum(submissionData.document_type),
      Category: submissionData.category || null,
      "File URL": submissionData.file_url,
      "Resident ID": submissionData.resident_id || null,
      Description: submissionData.description || null,
      Tags: submissionData.tags || [],
      Confidentiality: capitalizeEnum(submissionData.confidentiality),
      "Expiry Date": submissionData.expiry_date || null,
      "Logged By": submissionData.logged_by || null,
      "Updated Date": new Date().toISOString()
    };

    if (!initialDocument) {
      supabaseData["Created Date"] = new Date().toISOString();
      supabaseData["Created By"] = currentUser?.email || "Unknown";
      supabaseData.ID = crypto.randomUUID();
    }

    try {
      await onSubmit(supabaseData);
    } catch (error) {
      console.error("Error saving document:", error);
      alert("Failed to save document. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="mb-6 shadow-lg">
      <CardHeader className="bg-slate-50">
        <CardTitle className="flex items-center gap-2">
          <FilePlus2 className="w-5 h-5 text-blue-600" />
          {initialDocument ? "Edit Document" : "Add New Document"}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="title">Document Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleChange("title", e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="file_url">Document URL *</Label>
              <Input
                id="file_url"
                type="url"
                value={formData.file_url}
                onChange={(e) => handleChange("file_url", e.target.value)}
                placeholder="https://gdrive.com/document.pdf"
                required
              />
              <p className="text-xs text-slate-500 mt-1">
                Please enter a valid URL (must start with http:// or https://)
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <Label htmlFor="document_type">Document Type *</Label>
              <Select value={formData.document_type} onValueChange={(value) => handleChange("document_type", value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="policy">Policy</SelectItem>
                  <SelectItem value="procedure">Procedure</SelectItem>
                  <SelectItem value="form">Form</SelectItem>
                  <SelectItem value="report">Report</SelectItem>
                  <SelectItem value="correspondence">Correspondence</SelectItem>
                  <SelectItem value="resident_file">Resident File</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="resident_id">Related Resident (Optional)</Label>
              <Select value={formData.resident_id || ""} onValueChange={(value) => handleChange("resident_id", value)}>
                <SelectTrigger><SelectValue placeholder="Select a resident" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>None</SelectItem>
                  {residents?.map(resident => {
                    const residentId = resident.ID || resident.Id || resident.id;
                    const firstName = resident["First Name"] || resident.First_Name || resident.first_name || "";
                    const lastName = resident["Last Name"] || resident.Last_Name || resident.last_name || "";
                    return (
                      <SelectItem key={residentId} value={residentId}>
                        {firstName} {lastName}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="confidentiality">Confidentiality *</Label>
              <Select value={formData.confidentiality} onValueChange={(value) => handleChange("confidentiality", value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="internal">Internal</SelectItem>
                  <SelectItem value="confidential">Confidential</SelectItem>
                  <SelectItem value="restricted">Restricted</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="category">Category (Optional)</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => handleChange("category", e.target.value)}
                placeholder="e.g., HR, Finance, Legal"
              />
            </div>
            <div>
              <Label htmlFor="expiry_date">Expiry Date (Optional)</Label>
              <Input
                id="expiry_date"
                type="date"
                value={formData.expiry_date}
                onChange={(e) => handleChange("expiry_date", e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Provide a brief summary of the document's content"
              rows={3}
            />
          </div>

          {/* Tags Section */}
          <div>
            <Label htmlFor="tags" className="flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Tags (for search and organization)
            </Label>
            <div className="flex gap-2 mt-2">
              <Input
                id="tags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Add a tag (press Enter)"
              />
              <Button type="button" onClick={handleAddTag} variant="outline" size="icon">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {formData.tags && formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {formData.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <X
                      className="w-3 h-3 cursor-pointer hover:text-red-600"
                      onClick={() => handleRemoveTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
            )}
            <p className="text-xs text-slate-500 mt-1">
              Add keywords to make this document easier to find (e.g., "urgent", "financial", "medical")
            </p>
          </div>

          {/* Logged By Field */}
          <div>
            <Label htmlFor="logged_by">Logged By</Label>
            <Input
              id="logged_by"
              value={formData.logged_by}
              placeholder="Staff member name"
              readOnly
              className="bg-slate-50"
            />
            <p className="text-xs text-slate-500 mt-1">
              Automatically set to current user
            </p>
          </div>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={onCancel} disabled={uploading}>
              Cancel
            </Button>
            <Button type="submit" disabled={uploading} className="bg-blue-600 hover:bg-blue-700">
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Document
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}