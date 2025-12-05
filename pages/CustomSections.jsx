"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Download, FolderOpen, Settings, Eye, Trash2, Edit } from "lucide-react";
import { format } from "date-fns";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import CustomSectionForm_Supabase from "../components/custom-sections/csForm";

export default function CustomSections() {
  const [sections, setSections] = useState([]);
  const [filteredSections, setFilteredSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [sectionToDelete, setSectionToDelete] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUser(user);
      } catch (error) {
        console.error("Error loading user:", error);
      }
    };
    loadUser();
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    console.log("Loading custom sections...");
    
    try {
      const { data: sectionsData, error } = await supabase
        .from('custom_sections')
        .select('*')
        .order('"Created Date"', { ascending: false });
      
      if (error) throw error;
      
      // Filter out deleted sections
      const activeSections = (sectionsData || []).filter(s => {
        const isDeleted = s.Deleted || s.deleted || s["Deleted"];
        return !isDeleted;
      });
      
      console.log(`✅ Loaded ${activeSections.length} active custom sections`);
      setSections(activeSections);
      setFilteredSections(activeSections);
    } catch (error) {
      console.error("❌ Error loading custom sections:", error);
      setSections([]);
      setFilteredSections([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = sections;

    if (searchTerm) {
      filtered = filtered.filter(section =>
        section["Section Name"]?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        section["Description"]?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredSections(filtered);
  }, [sections, searchTerm]);

  const handleSubmit = async (sectionData) => {
    try {
      if (editingSection) {
        const { error } = await supabase
          .from('custom_sections')
          .update(sectionData)
          .eq('ID', editingSection.ID);
        
        if (error) throw error;
        console.log("✅ Custom section updated successfully");
      } else {
        const { error } = await supabase
          .from('custom_sections')
          .insert([sectionData]);
        
        if (error) throw error;
        console.log("✅ Custom section created successfully");
      }
      
      setShowForm(false);
      setEditingSection(null);
      loadData();
    } catch (error) {
      console.error("❌ Error saving custom section:", error);
      alert("Error saving custom section: " + error.message);
    }
  };

  const handleEdit = (section) => {
    setEditingSection(section);
    setShowForm(true);
  };

  const handleDelete = (section) => {
    setSectionToDelete(section);
  };

  const confirmDelete = async () => {
    if (sectionToDelete) {
      try {
        // Soft delete - mark as deleted
        const { error } = await supabase
          .from('custom_sections')
          .update({
            "Deleted": true,
            "Deleted Date": new Date().toISOString(),
            "Deleted By": currentUser?.email || "unknown_user"
          })
          .eq('ID', sectionToDelete.ID);
        
        if (error) throw error;
        
        console.log(`✅ Custom section ${sectionToDelete.ID} soft deleted successfully.`);
        setSectionToDelete(null);
        loadData();
      } catch (error) {
        console.error("❌ Error deleting custom section:", error);
        alert("Error deleting custom section: " + error.message);
      }
    }
  };

  const exportToCSV = () => {
    const formatDateTime = (dateString) => {
      if (!dateString) return null;
      try {
        return format(new Date(dateString), 'yyyy-MM-dd HH:mm:ss');
      } catch {
        return null;
      }
    };

    const formatBoolean = (value) => {
      if (value === true) return 'TRUE';
      if (value === false) return 'FALSE';
      return 'FALSE';
    };

    const formatFields = (fields) => {
      if (!fields || fields.length === 0) return null;
      try {
        return JSON.stringify(fields);
      } catch {
        return null;
      }
    };

    const formatPermissions = (permissions) => {
      if (!permissions || permissions.length === 0) return null;
      return permissions.join('; ');
    };

    const headers = [
      "ID",
      "Created Date",
      "Updated Date",
      "Created By",
      "Section Name",
      "Description",
      "Icon",
      "Color",
      "Fields",
      "Permissions",
      "Is Active",
      "Deleted",
      "Deleted Date",
      "Deleted By"
    ];

    const rows = filteredSections.map(section => [
      section.ID || null,
      formatDateTime(section["Created Date"]),
      formatDateTime(section["Updated Date"]),
      section["Created By"] || null,
      section["Section Name"] || null,
      section["Description"] || null,
      section["Icon"] || null,
      section["Color"] || null,
      formatFields(section["Fields"]),
      formatPermissions(section["Permissions"]),
      formatBoolean(section["Is Active"]),
      formatBoolean(section["Deleted"]),
      formatDateTime(section["Deleted Date"]),
      section["Deleted By"] || null
    ]);

    const escapeCSV = (value) => {
      if (value === null || value === undefined) return '';
      if (typeof value === 'number') return String(value);
      if (value === 'TRUE' || value === 'FALSE') return value;
      if (value === '') return '';
      
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n') || stringValue.includes('\r')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      
      return stringValue;
    };

    const csvContent = [
      headers.map(h => `"${h}"`).join(','),
      ...rows.map(row => row.map(escapeCSV).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    const timestamp = format(new Date(), 'yyyy-MM-dd_HHmmss');
    
    link.setAttribute('href', url);
    link.setAttribute('download', `custom_sections_export_${timestamp}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log("✅ Custom Sections CSV export completed successfully");
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Custom Sections</h1>
          <p className="text-slate-600">Create custom forms and manage dynamic data fields</p>
          {currentUser && (
            <p className="text-xs text-slate-400 mt-1">Logged in as: {currentUser.email}</p>
          )}
        </div>
        <div className="flex gap-3">
          <Button
            onClick={exportToCSV}
            variant="outline"
            className="flex items-center gap-2"
            disabled={loading || filteredSections.length === 0}
          >
            <Download className="w-4 h-4" />
            Export to CSV
          </Button>
          <Button 
            onClick={() => setShowForm(true)}
            className="bg-indigo-600 hover:bg-indigo-700 shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Custom Section
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search custom sections..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {showForm && (
        <CustomSectionForm_Supabase
          section={editingSection}
          currentUser={currentUser}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingSection(null);
          }}
        />
      )}

      {loading ? (
        <div className="text-center py-12">
          <p className="text-slate-600">Loading custom sections...</p>
        </div>
      ) : filteredSections.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FolderOpen className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No custom sections found</h3>
            <p className="text-slate-500 mb-4">
              {searchTerm ? "Try adjusting your search terms" : "Start by adding your first custom section"}
            </p>
            {!searchTerm && (
              <Button onClick={() => setShowForm(true)} className="bg-indigo-600 hover:bg-indigo-700">
                <Plus className="w-4 h-4 mr-2" />
                Add First Section
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSections.map((section) => (
            <Card key={section.ID} className="hover:shadow-md transition-shadow duration-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Settings className="w-5 h-5" style={{ color: section["Color"] || '#64748b' }} />
                    {section["Section Name"]}
                  </CardTitle>
                  <Badge variant={section["Is Active"] ? "default" : "secondary"}>
                    {section["Is Active"] ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {section["Description"] && (
                  <p className="text-sm text-slate-600">{section["Description"]}</p>
                )}
                <div className="text-sm">
                  <span className="font-medium text-slate-700">Fields: </span>
                  <span className="text-slate-600">{section["Fields"]?.length || 0}</span>
                </div>
                {section["Permissions"] && section["Permissions"].length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {section["Permissions"].map((perm, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {perm}
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <a href={`/CustomSectionDetail?id=${section.ID}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      <Eye className="w-4 h-4 mr-2" />
                      View Data
                    </Button>
                  </a>
                  <Button variant="outline" size="sm" onClick={() => handleEdit(section)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleDelete(section)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!sectionToDelete} onOpenChange={(open) => !open && setSectionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Custom Section</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{sectionToDelete?.["Section Name"]}"? This action cannot be undone and will permanently remove this custom section. Note: This will NOT delete the data entries associated with this section.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete Section
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}