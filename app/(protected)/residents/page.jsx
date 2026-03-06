
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useUser } from '@clerk/nextjs'
import { useClerkSupabaseClient } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Users, Building2, MapPin, ChevronDown, ChevronRight, UserX, Download, AlertCircle, RefreshCw } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { format } from "date-fns";
import ResidentForm_Supabase from "@/components/Resident/ResidentForm";
import ResidentCard from "@/components/Resident/ResidentCard";
import ResidentDetailModal from "@/components/Resident/ResidentDetailModal";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

// Helper function to normalize column names from Supabase
const normalizeData = (data) => {
  if (!data) return data;
  if (Array.isArray(data)) return data.map(normalizeData);

  const normalized = {};
  Object.keys(data).forEach(key => {
    // Convert "First Name" to "first_name", "ID" to "id", etc.
    const normalizedKey = key.toLowerCase().trim().replace(/ /g, '_');
    normalized[normalizedKey] = data[key];
  });
  return normalized;
};

export default function Residents_Supabase() {
  const supabase = useClerkSupabaseClient()
  const { user } = useUser()
  const [residents, setResidents] = useState([]);
  const [accommodations, setAccommodations] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingResident, setEditingResident] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [expandedProperties, setExpandedProperties] = useState(new Set());
  const [viewingResident, setViewingResident] = useState(null);

  const loadData = useCallback(async () => {
    if (!supabase) return;
    try {
      setLoading(true);
      setError(null);

      console.log("🔄 Loading residents data from Supabase...");

      const [residentsResult, accommodationsResult, propertiesResult] = await Promise.all([
        supabase.from('residents').select('*').order('"Created Date"', { ascending: false }),
        supabase.from('accommodations').select('*'),
        supabase.from('properties').select('*')
      ]);

      if (residentsResult.error) throw residentsResult.error;
      if (accommodationsResult.error) throw accommodationsResult.error;
      if (propertiesResult.error) throw propertiesResult.error;

      // Normalize all data first
      const normalizedResidents = normalizeData(residentsResult.data || []);
      const normalizedAccommodations = normalizeData(accommodationsResult.data || []);
      const normalizedProperties = normalizeData(propertiesResult.data || []);

      // Filter out soft-deleted residents using normalized keys
      const activeResidents = normalizedResidents.filter(r => {
        const isDeleted = r.deleted === true || r.deleted === 'true' || r.deleted === '1';
        return !isDeleted;
      });

      console.log(`✅ Loaded ${activeResidents.length} active residents, ${normalizedAccommodations.length} accommodations, ${normalizedProperties.length} properties`);

      const sortedProperties = normalizedProperties.sort((a, b) => {
        const nameA = (a.name || "").toLowerCase();
        const nameB = (b.name || "").toLowerCase();
        if (nameA.includes('ryland') && !nameB.includes('ryland')) return 1;
        if (nameB.includes('ryland') && !nameA.includes('ryland')) return -1;
        return nameA.localeCompare(nameB);
      });

      setResidents(activeResidents);
      setAccommodations(normalizedAccommodations);
      setProperties(sortedProperties);

      // Default expand all properties + unassigned
      const propertyIds = sortedProperties.map(p => String(p.id));
      setExpandedProperties(new Set([...propertyIds, 'unassigned']));

    } catch (error) {
      console.error("❌ Error loading data:", error);
      setError(error.message || "Failed to load data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    if (supabase) {
      loadData();
    }
  }, [supabase, loadData]);

  const filteredResidents = useMemo(() => {
    let filtered = residents;

    if (activeTab !== "all") {
      filtered = filtered.filter(r => {
        const status = (r.status || "").toLowerCase().trim().replace(/ /g, '_');
        const target = activeTab.toLowerCase().trim().replace(/ /g, '_');
        return status === target;
      });
    }

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(r => {
        const fullName = `${r.first_name || ''} ${r.last_name || ''}`.toLowerCase();
        const address = (r.property_address || '').toLowerCase();
        const kw = (r.key_worker || r.support_worker || '').toLowerCase();
        const ni = (r.national_insurance_number || '').toLowerCase();
        const claim = (r.claim_reference_number || '').toLowerCase();
        return fullName.includes(search) || address.includes(search) || kw.includes(search) || ni.includes(search) || claim.includes(search);
      });
    }

    return filtered;
  }, [residents, activeTab, searchTerm]);

  const getResidentPropertyId = useCallback((resident) => {
    const pId = resident.property_id;
    if (pId) return String(pId).trim();
    
    const accoId = resident.accommodation_id;
    if (accoId) {
      const accommodation = accommodations.find(a => String(a.id).trim() === String(accoId).trim());
      const apId = accommodation?.property_id;
      return apId ? String(apId).trim() : null;
    }
    
    return null;
  }, [accommodations]);

  const residentsByProperty = useMemo(() => {
    const acc = { unassigned: [] };

    // Initialize groups for all properties
    properties.forEach(p => {
        const id = String(p.id).trim();
        if (id) acc[id] = [];
    });

    filteredResidents.forEach(resident => {
      const pId = getResidentPropertyId(resident);
      if (pId && acc[pId]) {
        acc[pId].push(resident);
      } else {
        acc.unassigned.push(resident);
      }
    });
    return acc;
  }, [filteredResidents, properties, getResidentPropertyId]);

  const getActiveResidentCount = (propertyId) => {
    const propertyResidents = residentsByProperty[String(propertyId).trim()] || [];
    return propertyResidents.filter(r => {
      const status = (r.status || "").toLowerCase().trim();
      return status === 'active';
    }).length;
  };

  const handleSubmit = async (residentData) => {
    if (!supabase) {
      alert("Authentication client not initialized");
      return;
    }
    try {
      const now = new Date().toISOString().slice(0, 10);
      const cleanedData = JSON.parse(JSON.stringify(residentData));
      
      const cleanDates = (obj) => {
        if (Array.isArray(obj)) obj.forEach(item => cleanDates(item));
        else if (obj && typeof obj === 'object') {
          Object.keys(obj).forEach(key => {
            if (typeof obj[key] === 'string' && obj[key] === '' && (key.toLowerCase().includes('date') || key === 'Date of Birth')) obj[key] = null;
            else if (typeof obj[key] === 'object') cleanDates(obj[key]);
          });
        }
      };
      cleanDates(cleanedData);
      
      const resId = editingResident?.id;
      if (!editingResident && (!cleanedData.ID && !cleanedData.id)) {
          // If neither is present, it's a new record and ID will be generated
      }

      // Comprehensive foreign key cleaning
      const cleanForeignKeys = (obj) => {
        if (Array.isArray(obj)) obj.forEach(item => cleanForeignKeys(item));
        else if (obj && typeof obj === 'object') {
          Object.keys(obj).forEach(key => {
            const isForeignKey = key === 'Property ID' || key === 'Accommodation ID' || key === 'property_id' || key === 'accommodation_id';
            if (isForeignKey && obj[key] === '') obj[key] = null;
            else if (typeof obj[key] === 'object' && obj[key] !== null) cleanForeignKeys(obj[key]);
          });
        }
      };
      cleanForeignKeys(cleanedData);
      
      let savedResident;
      if (editingResident) {
        const originalResident = residents.find(r => String(r.id) === String(resId));
        const originalAccommodationId = originalResident?.accommodation_id;
        const newAccommodationId = cleanedData["Accommodation ID"] || cleanedData.accommodation_id;
        const originalStatus = (originalResident?.status || "").toLowerCase().trim();
        const newStatus = (cleanedData.Status || cleanedData.status || "").toLowerCase().trim();

        const { data: updatedData, error: updateError } = await supabase.from('residents').update(cleanedData).eq('ID', resId).select().single();
        if (updateError) throw updateError;
        savedResident = updatedData;

        // Handle accommodation updates
        if (newStatus === 'moved on' && originalStatus === 'active' && originalAccommodationId) {
          await supabase.from('accommodations').update({ "Availability Status": 'Available', "Current Resident ID": null, "Lease Start Date": null, "Lease End Date": cleanedData["Move-out Date"] || cleanedData.move_out_date || now }).eq('ID', originalAccommodationId);
        }
        else if (newStatus === 'active' && originalStatus !== 'active' && newAccommodationId) {
          await supabase.from('accommodations').update({ "Availability Status": 'Occupied', "Current Resident ID": resId, "Lease Start Date": cleanedData["Move-in Date"] || cleanedData.move_in_date || now }).eq('ID', newAccommodationId);
        }
        else if (newStatus === 'active' && originalStatus === 'active' && String(newAccommodationId) !== String(originalAccommodationId)) {
          if (originalAccommodationId) await supabase.from('accommodations').update({ "Availability Status": 'Available', "Current Resident ID": null, "Lease Start Date": null, "Lease End Date": now }).eq('ID', originalAccommodationId);
          if (newAccommodationId) await supabase.from('accommodations').update({ "Availability Status": 'Occupied', "Current Resident ID": resId, "Lease Start Date": cleanedData["Move-in Date"] || cleanedData.move_in_date || now }).eq('ID', newAccommodationId);
        }
      } else {
        const newResidentId = crypto.randomUUID();
        const { data: newData, error: insertError } = await supabase.from('residents').insert([{ ...cleanedData, ID: newResidentId, "Created Date": new Date().toISOString(), "Updated Date": new Date().toISOString() }]).select().single();
        if (insertError) throw insertError;
        savedResident = newData;
        
        const resStatus = (savedResident.Status || savedResident.status || "").toLowerCase().trim();
        const accoId = savedResident["Accommodation ID"] || savedResident.accommodation_id;
        if (resStatus === 'active' && accoId) {
          await supabase.from('accommodations').update({ "Availability Status": 'Occupied', "Current Resident ID": savedResident.ID, "Lease Start Date": savedResident["Move-in Date"] || savedResident.move_in_date || now }).eq('ID', accoId);
        }
      }
      
      setShowForm(false);
      setEditingResident(null);
      await loadData();
      return savedResident;
    } catch (error) {
      console.error("❌ Error saving resident:", error);
      alert("Error saving: " + error.message);
    }
  };

  const handleEdit = (resident) => {
    setEditingResident(resident);
    setShowForm(true);
  };
  
  const handleViewDetails = (resident) => {
    setViewingResident(resident);
  };

  const handleDelete = async (resident) => {
    if (!supabase) return;
    const name = `${resident.first_name || ''} ${resident.last_name || ''}`;
    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
      try {
        const resId = resident.id;
        const { error } = await supabase.from('residents').update({
          "Deleted": true,
          "Deleted Date": new Date().toISOString(),
          "Deleted By": user?.primaryEmailAddress?.emailAddress || 'unknown'
        }).eq('ID', resId);
        if (error) throw error;
        await loadData();
      } catch (error) {
        console.error("Error deleting resident:", error);
        alert("Error deleting resident: " + error.message);
      }
    }
  };

  const exportToCSV = () => {
    try {
      const getPropertyNameForCSV = (r) => {
          const id = getResidentPropertyId(r);
          return properties.find(p => String(p.id) === String(id))?.name || "";
      }
      const getAccommodationUnitForCSV = (r) => {
          const id = r.accommodation_id;
          return accommodations.find(a => String(a.id) === String(id))?.room_number || "";
      }
      const formatDateForCSV = (d) => {
          if (!d) return "";
          try {
              return format(new Date(d), 'yyyy-MM-dd');
          } catch(e) {
              return "";
          }
      }

      const headers = [
        "ID", "First Name", "Last Name", "Date of Birth", "Phone Number", "Email Address",
        "Claim Reference Number", "Submission Reference", "National Insurance Number",
        "Accommodation Type", "Property Name", "Unit/Room Number", "Move-in Date",
        "Status", "Support Level", "Key Worker"
      ];

      const rows = filteredResidents.map(r => [
        r.id,
        r.first_name,
        r.last_name,
        formatDateForCSV(r.date_of_birth),
        r.phone_number,
        r.email_address,
        r.claim_reference_number,
        r.submission_reference,
        r.national_insurance_number,
        r.accommodation_type,
        getPropertyNameForCSV(r),
        getAccommodationUnitForCSV(r),
        formatDateForCSV(r.move_in_date),
        r.status,
        r.support_level,
        r.key_worker || r.support_worker || ""
      ]);

      const csvContent = [headers.join(','), ...rows.map(row => row.map(v => `"${(v || '').toString().replace(/"/g, '""')}"`).join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', `residents_export_${format(new Date(), 'yyyy-MM-dd')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("❌ Error exporting CSV:", error);
    }
  };

  const getStatusColor = (status) => {
    const s = (status || "").toLowerCase().trim();
    if (s === "active") return "bg-green-100 text-green-800 border-green-200";
    if (s === "moved_on" || s === "moved on") return "bg-blue-100 text-blue-800 border-blue-200";
    if (s === "temporary_leave" || s === "temporary leave") return "bg-yellow-100 text-yellow-800 border-yellow-200";
    return "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getSupportLevelColor = (level) => {
    const l = (level || "").toLowerCase().trim();
    if (l === "low") return "bg-green-100 text-green-800";
    if (l === "high") return "bg-orange-100 text-orange-800";
    if (l === "intensive") return "bg-red-100 text-red-800";
    return "bg-yellow-100 text-yellow-800";
  };

  const toggleProperty = (propertyId) => {
    setExpandedProperties(prev => {
      const newSet = new Set(prev);
      const id = String(propertyId).trim();
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  if (error) {
    return (
      <div className="space-y-6 p-6">
        <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>
        <Button onClick={() => loadData()} className="mt-4"><RefreshCw className="w-4 h-4 mr-2" /> Retry Loading Data</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 px-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Residents</h1>
          <p className="text-slate-600">Manage supported housing residents and their information</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={exportToCSV} variant="outline" className="flex items-center gap-2"><Download className="w-4 h-4" /> Export CSV</Button>
          <Button onClick={() => { setEditingResident(null); setShowForm(true); }} className="bg-blue-600 hover:bg-blue-700 shadow-sm"><Plus className="w-4 h-4 mr-2" /> Add Resident</Button>
        </div>
      </div>

      <Card className="mb-6 mx-6">
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <Input placeholder="Search residents by name, address, insurance or claim ref..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6 px-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-3">
          <TabsTrigger value="all">All Residents</TabsTrigger>
          <TabsTrigger value="Active">Active</TabsTrigger>
          <TabsTrigger value="Moved On">Moved On</TabsTrigger>
        </TabsList>
      </Tabs>

      {showForm && (
        <Dialog open={showForm} onOpenChange={(open) => { setShowForm(open); if (!open) setEditingResident(null); }}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <ResidentForm_Supabase resident={editingResident} accommodations={accommodations} onSubmit={handleSubmit} onCancel={() => setShowForm(false)} />
          </DialogContent>
        </Dialog>
      )}
      
      {viewingResident && (
        <ResidentDetailModal resident={viewingResident} accommodations={accommodations} properties={properties} onClose={() => setViewingResident(null)} onEdit={(r) => { setViewingResident(null); handleEdit(r); }} onDelete={handleDelete} isAdmin={true} />
      )}

      {loading ? (
        <div className="px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-64 w-full" />)}
        </div>
      ) : activeTab === 'all' ? (
        <div className="space-y-6 px-6">
          {properties.map((property) => {
            const pId = String(property.id).trim();
            const propertyResidents = residentsByProperty[pId] || [];
            if (propertyResidents.length === 0) return null;
            const activeCount = getActiveResidentCount(pId);
            const pName = property.name || 'Unknown Property';
            const pAddress = property.address || '';

            return (
              <Card key={pId} className="overflow-hidden">
                <Collapsible open={expandedProperties.has(pId)} onOpenChange={() => toggleProperty(pId)}>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-slate-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-sm"><Building2 className="w-6 h-6 text-white" /></div>
                          <div>
                            <CardTitle className="text-xl text-slate-900">{pName}</CardTitle>
                            <div className="flex items-center gap-2 mt-1"><MapPin className="w-4 h-4 text-slate-400" /><span className="text-sm text-slate-600">{pAddress}</span></div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                           <div className="flex items-center gap-2 text-sm font-medium text-slate-700"><Users className="w-4 h-4" /><span>{activeCount} Active Resident{activeCount !== 1 ? 's' : ''}</span></div>
                          {expandedProperties.has(pId) ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 border-t">
                      {propertyResidents.map(resident => (
                        <ResidentCard key={String(resident.id)} resident={resident} accommodations={accommodations} onEdit={handleEdit} onViewDetails={handleViewDetails} onDelete={handleDelete} getSupportLevelColor={getSupportLevelColor} getStatusColor={getStatusColor} isAdmin={true} />
                      ))}
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            );
          })}
          {(residentsByProperty.unassigned || []).length > 0 && (
              <Card className="overflow-hidden">
                 <Collapsible open={expandedProperties.has('unassigned')} onOpenChange={() => toggleProperty('unassigned')}>
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-slate-50 transition-colors">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4"><div className="w-12 h-12 bg-slate-500 rounded-xl flex items-center justify-center shadow-sm"><UserX className="w-6 h-6 text-white" /></div><div><CardTitle className="text-xl text-slate-900">Unassigned Residents</CardTitle></div></div>
                           <div className="flex items-center gap-4"><div className="flex items-center gap-2 text-sm font-medium text-slate-700"><Users className="w-4 h-4" /><span>{residentsByProperty.unassigned.filter(r => (r.status || "").toLowerCase().trim() === 'active').length} Active</span></div>{expandedProperties.has('unassigned') ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}</div>
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent><CardContent className="pt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 border-t">{residentsByProperty.unassigned.map(resident => (<ResidentCard key={String(resident.id)} resident={resident} accommodations={accommodations} onEdit={handleEdit} onViewDetails={handleViewDetails} onDelete={handleDelete} getSupportLevelColor={getSupportLevelColor} getStatusColor={getStatusColor} isAdmin={true} />))}</CardContent></CollapsibleContent>
                 </Collapsible>
              </Card>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-6">
          {filteredResidents.map((resident) => (<ResidentCard key={String(resident.id)} resident={resident} accommodations={accommodations} onEdit={handleEdit} onViewDetails={handleViewDetails} onDelete={handleDelete} getSupportLevelColor={getSupportLevelColor} getStatusColor={getStatusColor} isAdmin={true} />))}
        </div>
      )}
      {filteredResidents.length === 0 && !loading && (
        <Card className="mx-6 p-12 text-center">
            <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No residents found</h3>
            <p className="text-slate-500">Try adjusting your search or filters to find what you're looking for.</p>
        </Card>
      )}
    </div>
  );
}
