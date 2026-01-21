"use client"

import { useUser } from "@clerk/nextjs";
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Search, ArrowLeft, Settings, FolderOpen, Download } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { useParams, useRouter} from "next/navigation";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import CustomSectionDataForm_Supabase from "@/components/custom-sections/csdataform";
import CustomSectionDataCard from "@/components/custom-sections/cssectioncard";
import CustomSectionDataDetailModal from "@/components/custom-sections/CustomSectionDetailModal";

export default function CustomSectionDetail() {
  const { user } = useUser();
  const router = useRouter();
  const { id: sectionId } = useParams;
  const [section, setSection] = useState(null);
  const [dataRecords, setDataRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [viewingRecord, setViewingRecord] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [recordToDelete, setRecordToDelete] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  const normalizeData = (data) => {
    if (!data) return null;
    const normalized = {};
    for (const key in data) {
      const lowerKey = key.toLowerCase().replace(/\s+/g, '_');
      normalized[lowerKey] = data[key];
    }
    normalized.id = normalized.id || data.ID || data.Id;
    return normalized;
  };

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
  }, []);

  useEffect(() => {
    if (sectionId) {
      console.log("Loading section data for ID:", sectionId);
      loadData();
    } else {
      setLoading(false);
    }
  }, [sectionId]);

  useEffect(() => {
    if (!searchTerm) {
      setFilteredRecords(dataRecords);
    } else {
      const filtered = dataRecords.filter(record => {
        const searchLower = searchTerm.toLowerCase();
        if (record.title?.toLowerCase().includes(searchLower)) return true;
        if (record.notes?.toLowerCase().includes(searchLower)) return true;
        if (record.data) {
          const dataString = JSON.stringify(record.data).toLowerCase();
          if (dataString.includes(searchLower)) return true;
        }
        return false;
      });
      setFilteredRecords(filtered);
    }
  }, [searchTerm, dataRecords]);

  const loadData = async () => {
    setLoading(true);
    try {
      console.log("Loading section data for ID:", sectionId);
      
      const { data: sectionData, error: sectionError } = await supabase
        .from('custom_sections')
        .select('*')
        .eq('ID', sectionId)
        .single();

      if (sectionError) throw sectionError;

      if (sectionData) {
        const normalizedSection = normalizeData(sectionData);
        setSection(normalizedSection);
        console.log("Section loaded successfully:", normalizedSection.section_name);
        
        const { data: records, error: recordsError } = await supabase
          .from('custom_section_data')
          .select('*')
          .eq('Custom Section ID', sectionId)
          .order('Created Date', { ascending: false });

        if (recordsError) throw recordsError;

        const normalizedRecords = records ? records.map(normalizeData) : [];
        console.log("Records loaded:", normalizedRecords.length);
        
        setDataRecords(normalizedRecords);
        setFilteredRecords(normalizedRecords);
      } else {
        console.error("No section found");
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (recordData) => {
    try {
      if (editingRecord) {
        const { error } = await supabase
          .from('custom_section_data')
          .update({
            ...recordData,
            'Updated Date': new Date().toISOString()
          })
          .eq('ID', editingRecord.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('custom_section_data')
          .insert([{
            ...recordData,
            'Custom Section ID': sectionId,
            'ID': crypto.randomUUID(),
            'Created Date': new Date().toISOString(),
            'Created By': currentUser?.email || null
          }]);

        if (error) throw error;
      }
      setShowForm(false);
      setEditingRecord(null);
      await loadData();
    } catch (error) {
      console.error("Error saving record:", error);
      alert("Failed to save entry. Please try again.");
    }
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    setShowForm(true);
  };

  const handleViewDetails = (record) => {
    setViewingRecord(record);
  };

  const handleDelete = (record) => {
    setRecordToDelete(record);
  };

  const confirmDelete = async () => {
    if (recordToDelete) {
      try {
        const { error } = await supabase
          .from('custom_section_data')
          .update({
            'Deleted': true,
            'Deleted Date': new Date().toISOString(),
            'Deleted By': currentUser?.email || 'unknown_user'
          })
          .eq('ID', recordToDelete.id);

        if (error) throw error;
        
        console.log(`✅ Custom section data record ${recordToDelete.id} soft deleted successfully.`);
        setRecordToDelete(null);
        setViewingRecord(null);
        await loadData();
      } catch (error) {
        console.error("Error deleting custom section data record:", error);
        alert("Error deleting entry: " + error.message);
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

    const formatStatus = (status) => {
      if (!status) return 'Active';
      const statusMap = {
        'active': 'Active',
        'archived': 'Archived'
      };
      return statusMap[status] || 'Active';
    };

    const formatData = (data) => {
      if (!data) return null;
      try {
        return JSON.stringify(data);
      } catch {
        return null;
      }
    };

    const formatBoolean = (value) => {
      if (value === true) return 'TRUE';
      if (value === false) return 'FALSE';
      return 'FALSE';
    };

    const headers = [
      "ID",
      "Created Date",
      "Updated Date",
      "Created By",
      "Custom Section ID",
      "Custom Section Name",
      "Title",
      "Status",
      "Data",
      "Notes",
      "Deleted",
      "Deleted Date",
      "Deleted By"
    ];

    const rows = filteredRecords.map(record => [
      record.id || null,
      formatDateTime(record.created_date),
      formatDateTime(record.updated_date),
      record.created_by || null,
      record.custom_section_id || null,
      section?.section_name || null,
      record.title || null,
      formatStatus(record.status),
      formatData(record.data),
      record.notes || null,
      formatBoolean(record.deleted),
      formatDateTime(record.deleted_date),
      record.deleted_by || null
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
    const sectionName = section?.section_name?.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'custom_section';
    link.setAttribute('href', url);
    link.setAttribute('download', `${sectionName}_data_export_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log("✅ Custom Section Data CSV export completed successfully");
  };

  console.log("Render - Loading:", loading, "Section:", !!section);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-slate-600 text-lg">Loading section data...</div>
      </div>
    );
  }

  if (!section) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Settings className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">Section not found</h3>
            <p className="text-slate-500 mb-4">The custom section you're looking for doesn't exist.</p>
            <Link href="/CustomSections">
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Custom Sections
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link href="/CustomSections">
            <Button variant="outline" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2" style={{ color: section.color || '#64748b' }}>
              {section.section_name}
            </h1>
            {section.description && (
              <p className="text-slate-600">{section.description}</p>
            )}
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={exportToCSV}
            variant="outline"
            className="flex items-center gap-2"
            disabled={loading || filteredRecords.length === 0}
          >
            <Download className="w-4 h-4" />
            Export to CSV
          </Button>
          <Button
            onClick={() => setShowForm(true)}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Entry
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search entries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {showForm && (
        <CustomSectionDataForm_Supabase
          entry={editingRecord}
          section={section}
          currentUser={currentUser}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingRecord(null);
          }}
        />
      )}

      {viewingRecord && (
        <CustomSectionDataDetailModal
          entry={viewingRecord}
          section={section}
          onClose={() => setViewingRecord(null)}
          onEdit={(record) => {
            setViewingRecord(null);
            handleEdit(record);
          }}
          onDelete={handleDelete}
        />
      )}

      {filteredRecords.length === 0 && !showForm ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FolderOpen className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No entries found</h3>
            <p className="text-slate-500 mb-4">
              {searchTerm ? "Try adjusting your search terms" : "Start by adding your first entry"}
            </p>
            {!searchTerm && (
              <Button onClick={() => setShowForm(true)} className="bg-indigo-600 hover:bg-indigo-700">
                <Plus className="w-4 h-4 mr-2" />
                Add First Entry
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecords.map((record) => (
            <CustomSectionDataCard
              key={record.id}
              entry={record}
              section={section}
              onEdit={handleEdit}
              onViewDetails={handleViewDetails}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <AlertDialog open={!!recordToDelete} onOpenChange={(open) => !open && setRecordToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Entry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this entry{recordToDelete?.title ? ` "${recordToDelete.title}"` : ''}? This action cannot be undone and will permanently remove all data associated with this entry.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete Entry
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}