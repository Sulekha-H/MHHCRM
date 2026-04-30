 
"use client";

import React, { useState, useEffect } from "react"; 
import { useUser } from '@clerk/nextjs'
import { useClerkSupabaseClient } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Users, Building2, MapPin, ChevronDown, ChevronRight, Download, AlertCircle, RefreshCw } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { format } from "date-fns";
import AllocatedResidentForm from "@/components/AllocatedResident/AllocatedResidentForm";
import AllocatedResidentCard from "@/components/AllocatedResident/AllocatedResidentCard";
import AllocatedResidentDetailModal from "@/components/AllocatedResident/AllocatedResidentDetailModal";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

export default function AllocatedResidentsPage() {
  const supabase = useClerkSupabaseClient();
  const { user } = useUser();
  const [allocatedResidents, setAllocatedResidents] = useState([]);
  const [accommodations, setAccommodations] = useState([]);
  const [properties, setProperties] = useState([]);
  const [filteredAllocatedResidents, setFilteredAllocatedResidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingResident, setEditingResident] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [expandedProperties, setExpandedProperties] = useState(new Set());
  const [viewingResident, setViewingResident] = useState(null);
  
  const loadData = async () => {
    if (!supabase) return;
    try {
      setLoading(true);
      setError(null);
      const { data: allocatedData, error: allocatedError } = await supabase
        .from('allocated_residents')
        .select('*')
        .order('Created Date', { ascending: false });

      if (allocatedError) throw allocatedError;

      const activeAllocated = (allocatedData || []).filter(r => !r.Deleted);

      const { data: accommodationsData, error: accommodationsError } = await supabase
        .from('accommodations')
        .select('*');

      if (accommodationsError) throw accommodationsError;

      const { data: propertiesDataRaw, error: propertiesError } = await supabase
        .from('properties')
        .select('*');

      if (propertiesError) throw propertiesError;

      const propertiesData = (propertiesDataRaw || []).sort((a, b) =>
        (a.Name?.toLowerCase() || '').localeCompare(b.Name?.toLowerCase() || '')
      );

      setAllocatedResidents(activeAllocated);
      setAccommodations(accommodationsData || []);
      setProperties(propertiesData);
      setExpandedProperties(new Set(propertiesData.map(p => p.ID).concat('unassigned')));

    } catch (error) {
      console.error("❌ Error loading allocated residents:", error);
      setError(error.message || "Failed to load data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (supabase) loadData();
  }, [supabase]);

  useEffect(() => {
    let filtered = allocatedResidents;
    if (activeTab.toLowerCase() !== "all") {
      filtered = filtered.filter(r => r.Status?.toLowerCase() === activeTab.toLowerCase());
    }
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      filtered = filtered.filter(r =>
        `${r["First Name"]} ${r["Last Name"]}`.toLowerCase().includes(s) ||
        r["Property Address"]?.toLowerCase().includes(s) ||
        r["Support Worker"]?.toLowerCase().includes(s) ||
        r["Property Name"]?.toLowerCase().includes(s)
      );
    }
    setFilteredAllocatedResidents(filtered);
  }, [allocatedResidents, activeTab, searchTerm]);

  const handleSubmit = async (residentData) => {
    if (!supabase) return;
    try {
      const now = new Date().toISOString();
      const cleanedData = { ...residentData };
      
      const cleanDates = (obj) => {
        Object.keys(obj).forEach(key => {
          if (typeof obj[key] === 'string' && obj[key] === '' && (key.toLowerCase().includes('date') || key === 'Date of Birth')) {
            obj[key] = null;
          } else if (obj[key] && typeof obj[key] === 'object') {
            cleanDates(obj[key]);
          }
        });
      };
      cleanDates(cleanedData);

      let originalResident = null;
      if (editingResident) {
        originalResident = allocatedResidents.find(r => r.ID === editingResident.ID);
      }

      let savedResident;
      if (editingResident) {
        const { data, error } = await supabase
          .from('allocated_residents')
          .update({ ...cleanedData, "Updated Date": now })
          .eq('ID', editingResident.ID)
          .select().single();
        if (error) throw error;
        savedResident = data;
      } else {
        const { data, error } = await supabase
          .from('allocated_residents')
          .insert([{ ...cleanedData, ID: crypto.randomUUID(), "Created Date": now, "Updated Date": now }])
          .select().single();
        if (error) throw error;
        savedResident = data;
      }

      // Sync Accommodations
      const oldAccId = originalResident?.["Accommodation ID"];
      const newAccId = savedResident["Accommodation ID"];
      const status = savedResident["Status"];
      const fullName = `${savedResident["First Name"]} ${savedResident["Last Name"]}`;

      if (status === 'Moved On' && oldAccId) {
        await supabase.from('accommodations').update({
          "Availability Status": 'Available',
          "Current Resident ID": null,
          "Current Resident Name": null
        }).eq('ID', oldAccId);
      } else if (status === 'Active') {
        if (oldAccId && oldAccId !== newAccId) {
          await supabase.from('accommodations').update({
            "Availability Status": 'Available',
            "Current Resident ID": null,
            "Current Resident Name": null
          }).eq('ID', oldAccId);
        }
        if (newAccId) {
          await supabase.from('accommodations').update({
            "Availability Status": 'Occupied',
            "Current Resident ID": savedResident.ID,
            "Current Resident Name": fullName
          }).eq('ID', newAccId);
        }
      }
      
      setShowForm(false);
      setEditingResident(null);
      await loadData();
    } catch (error) {
      console.error("❌ Error saving resident:", error);
      alert("Error saving resident: " + error.message);
    }
  };

  const handleDelete = async (resident) => {
    if (!supabase) return;
    if (window.confirm(`Are you sure you want to delete ${resident["First Name"]} ${resident["Last Name"]}?`)) {
      try {
        const { error } = await supabase
          .from('allocated_residents')
          .update({ "Deleted": true, "Deleted Date": new Date().toISOString(), "Deleted By": user?.primaryEmailAddress?.emailAddress || 'unknown' })
          .eq('ID', resident.ID);
        if (error) throw error;

        if (resident["Accommodation ID"]) {
          await supabase.from('accommodations').update({
            "Availability Status": 'Available',
            "Current Resident ID": null,
            "Current Resident Name": null
          }).eq('ID', resident["Accommodation ID"]);
        }

        await loadData();
      } catch (error) {
        alert("Error deleting resident: " + error.message);
      }
    }
  };

  const exportToCSV = () => {
    try {
      const headers = [
        "First Name", "Last Name", "Date of Birth", "Phone Number", "Email Address",
        "Property Name", "Unit/Room Number", "Property Address", "Move-in Date", "Status",
        "Support Worker", "Claim Reference", "NI Number"
      ];

      const rows = filteredAllocatedResidents.map(r => [
        r["First Name"] || "",
        r["Last Name"] || "",
        r["Date of Birth"] || "",
        r["Phone Number"] || "",
        r["Email Address"] || "",
        r["Property Name"] || "",
        r["Unit/Room Number"] || "",
        r["Property Address"] || "",
        r["Move-in Date"] || "",
        r["Status"] || "",
        r["Support Worker"] || "",
        r["Claim Reference Number"] || "",
        r["National Insurance Number"] || ""
      ]);

      const escapeCSV = (val) => {
        const s = String(val ?? "");
        return (s.includes(',') || s.includes('"') || s.includes('\n')) ? `"${s.replace(/"/g, '""')}"` : s;
      };

      const csvContent = [headers.map(escapeCSV).join(','), ...rows.map(row => row.map(escapeCSV).join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `allocated_residents_${format(new Date(), 'yyyy-MM-dd')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      alert("Export failed: " + e.message);
    }
  };

  const toggleProperty = (propertyId) => {
    setExpandedProperties(prev => {
      const newSet = new Set(prev);
      if (newSet.has(propertyId)) newSet.delete(propertyId);
      else newSet.add(propertyId);
      return newSet;
    });
  };

  const residentsByProperty = filteredAllocatedResidents.reduce((acc, resident) => {
    const propertyId = resident["Property ID"] || 'unassigned';
    if (!acc[propertyId]) acc[propertyId] = [];
    acc[propertyId].push(resident);
    return acc;
  }, {});

  const getStatusColor = (status) => {
    return status === 'Active' ? "bg-green-100 text-green-800 border-green-200" : "bg-blue-100 text-blue-800 border-blue-200";
  };

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={() => loadData()} className="mt-4"><RefreshCw className="w-4 h-4 mr-2" />Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center px-6">
        <div>
          <h1 className="text-3xl font-bold">Allocated Residents</h1>
          <p className="text-slate-600">Manage allocated residents separately.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={exportToCSV}><Download className="w-4 h-4 mr-2" />Export CSV</Button>
          <Button onClick={() => setShowForm(true)} className="bg-blue-600"><Plus className="w-4 h-4 mr-2" />Add New Resident</Button>
        </div>
      </div>

      <Card className="mx-6">
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <Input placeholder="Search by name, address, or worker..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
          </div>
        </CardContent>
      </Card>

      <div className="px-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All Allocated</TabsTrigger>
            <TabsTrigger value="Active">Active</TabsTrigger>
            <TabsTrigger value="Moved On">Moved On</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {showForm && (
        <div className="px-6">
          <AllocatedResidentForm
            resident={editingResident}
            accommodations={accommodations}
            onSubmit={handleSubmit}
            onCancel={() => { setShowForm(false); setEditingResident(null); }}
          />
        </div>
      )}

      {viewingResident && (
        <AllocatedResidentDetailModal
          resident={viewingResident}
          onClose={() => setViewingResident(null)}
          onEdit={(r) => { setViewingResident(null); setEditingResident(r); setShowForm(true); }}
          onDelete={handleDelete}
        />
      )}

      {loading ? (
        <div className="px-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-64" />)}
        </div>
      ) : activeTab === 'all' ? (
        <div className="space-y-6 px-6">
          {properties.map(property => {
            const propertyResidents = residentsByProperty[property.ID] || [];
            if (propertyResidents.length === 0) return null;
            return (
              <Card key={property.ID}>
                <Collapsible open={expandedProperties.has(property.ID)} onOpenChange={() => toggleProperty(property.ID)}>
                  <CollapsibleTrigger className="w-full">
                    <CardHeader className="flex flex-row items-center justify-between hover:bg-slate-50">
                      <div className="flex items-center gap-4 text-left">
                        <Building2 className="w-6 h-6 text-blue-600" />
                        <div>
                          <CardTitle>{property.Name}</CardTitle>
                          <div className="flex items-center gap-2 text-sm text-slate-500"><MapPin className="w-4 h-4" />{property.Address}</div>
                        </div>
                      </div>
                      {expandedProperties.has(property.ID) ? <ChevronDown /> : <ChevronRight />}
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="p-6 pt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
                      {propertyResidents.map(r => (
                        <AllocatedResidentCard key={r.ID} resident={r} accommodations={accommodations} onEdit={(res) => { setEditingResident(res); setShowForm(true); }} onViewDetails={setViewingResident} onDelete={handleDelete} getStatusColor={getStatusColor} />
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAllocatedResidents.map(r => (
            <AllocatedResidentCard key={r.ID} resident={r} accommodations={accommodations} onEdit={(res) => { setEditingResident(res); setShowForm(true); }} onViewDetails={setViewingResident} onDelete={handleDelete} getStatusColor={getStatusColor} />
          ))}
        </div>
      )}
    </div>
  );
}
