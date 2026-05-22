"use client";

import React, { useState, useEffect } from "react";
import { useUser } from '@clerk/nextjs'
import { useClerkSupabaseClient } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Building2, MapPin, ChevronDown, ChevronRight, Download, AlertCircle, RefreshCw, UserX, Users } from "lucide-react";
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
  const [residents, setResidents] = useState([]);
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
    if (!supabase) {
      console.log("⏳ Supabase client not ready yet...");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      console.log("🔄 Loading allocated residents data...");

      const [allocatedRes, residentsRes, accsRes, propsRes] = await Promise.all([
        supabase.from('allocated_residents').select('*').order('"Created Date"', { ascending: false }),
        supabase.from('residents').select('*').or('Deleted.is.null,Deleted.eq.false'),
        supabase.from('accommodations').select('*').eq('"Deleted"', false),
        supabase.from('properties').select('*').eq('"Deleted"', false)
      ]);

      if (allocatedRes.error) {
        console.error("❌ Error fetching allocated residents:", allocatedRes.error);
        throw allocatedRes.error;
      }
      if (residentsRes.error) {
        console.error("❌ Error fetching residents:", residentsRes.error);
        throw residentsRes.error;
      }
      if (accsRes.error) {
        console.error("❌ Error fetching accommodations:", accsRes.error);
        // Fallback if accommodations.Deleted doesn't exist/work
        const retryAccs = await supabase.from('accommodations').select('*');
        if (!retryAccs.error) {
           console.log("✅ Accommodations loaded via fallback");
           accsRes.data = retryAccs.data;
        } else {
           throw accsRes.error;
        }
      }
      if (propsRes.error) {
        console.error("❌ Error fetching properties:", propsRes.error);
        const retryProps = await supabase.from('properties').select('*');
        if (!retryProps.error) {
           console.log("✅ Properties loaded via fallback");
           propsRes.data = retryProps.data;
        } else {
           throw propsRes.error;
        }
      }

      console.log(`✅ Loaded ${allocatedRes.data?.length || 0} raw allocated residents`);

      const active = (allocatedRes.data || []).filter(r => {
        const isDeleted = r.Deleted === true || r["Deleted"] === true || r.Deleted === 'true';
        return !isDeleted;
      });

      const rawProps = propsRes.data || [];
      const sortedProps = [...rawProps].sort((a, b) => {
        const nameA = a.Name || a.name || '';
        const nameB = b.Name || b.name || '';
        return nameA.localeCompare(nameB);
      });

      console.log(`👥 Active allocated residents: ${active.length}`);

      setAllocatedResidents(active);
      setResidents(residentsRes.data || []);
      setAccommodations(accsRes.data || []);
      setProperties(sortedProps);

      const propIds = sortedProps.map(p => p.ID || p.id).filter(Boolean);
      setExpandedProperties(new Set([...propIds, 'unassigned']));

    } catch (e) {
      console.error("❌ Error loading data:", e);
      setError(e.message || "Failed to load data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (supabase) {
      loadData();
    }
  }, [supabase]);

  useEffect(() => {
    let filtered = allocatedResidents;
    if (activeTab.toLowerCase() !== "all") {
      filtered = filtered.filter(r => {
        const status = (r.Status || r.status || '').toLowerCase();
        return status === activeTab.toLowerCase();
      });
    }
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      filtered = filtered.filter(r => {
        const firstName = r["First Name"] || r.first_name || '';
        const lastName = r["Last Name"] || r.last_name || '';
        const propAddr = r["Property Address"] || r.property_address || '';
        const sw = r["Support Worker"] || r.support_worker || '';
        const propName = r["Property Name"] || r.property_name || '';

        return `${firstName} ${lastName}`.toLowerCase().includes(s) ||
               propAddr.toLowerCase().includes(s) ||
               sw.toLowerCase().includes(s) ||
               propName.toLowerCase().includes(s);
      });
    }
    setFilteredAllocatedResidents(filtered);
  }, [allocatedResidents, activeTab, searchTerm]);

  const handleSubmit = async (residentData) => {
    if (!supabase) return;
    try {
      const now = new Date().toISOString();
      const cleanedData = { ...residentData };
      const cleanDates = (obj) => {
        Object.keys(obj).forEach(k => {
          if (typeof obj[k] === 'string' && obj[k] === '' && (k.toLowerCase().includes('date') || k === 'Date of Birth')) obj[k] = null;
          else if (obj[k] && typeof obj[k] === 'object' && obj[k] !== null) cleanDates(obj[k]);
        });
      };
      cleanDates(cleanedData);

      const residentId = editingResident?.ID || editingResident?.id;
      const original = residentId ? allocatedResidents.find(r => (r.ID || r.id) === residentId) : null;
      let saved;

      if (editingResident) {
        const { data, error } = await supabase.from('allocated_residents').update({
          ...cleanedData,
          "Updated Date": now
        }).eq('"ID"', residentId).select().single();
        if (error) throw error;
        saved = data;
      } else {
        const newId = crypto.randomUUID();
        const { data, error } = await supabase.from('allocated_residents').insert([{
          ...cleanedData,
          "ID": newId,
          "Created Date": now,
          "Updated Date": now
        }]).select().single();
        if (error) throw error;
        saved = data;
      }

      const oldAccId = original?.["Accommodation ID"] || original?.accommodation_id;
      const newAccId = saved["Accommodation ID"] || saved.accommodation_id;
      const firstName = saved["First Name"] || saved.first_name || '';
      const lastName = saved["Last Name"] || saved.last_name || '';
      const fullName = `${firstName} ${lastName}`.trim();
      const status = (saved.Status || saved.status || '');

      if (status === 'Moved On' && oldAccId) {
        const others = [
          ...residents.filter(r => (r["Accommodation ID"] || r.accommodation_id) === oldAccId && (r.Status || r.status || '').toLowerCase() === 'active'),
          ...allocatedResidents.filter(ar => (ar.ID || ar.id) !== residentId && (ar["Accommodation ID"] || ar.accommodation_id) === oldAccId && (ar.Status || ar.status || '').toLowerCase() === 'active')
        ];
        if (others.length === 0) {
          await supabase.from('accommodations').update({
            "Availability Status": 'Available',
            "Current Resident ID": null,
            "Current Resident Name": null,
            "Lease End Date": saved["Move-out Date"] || saved.move_out_date || now
          }).eq('"ID"', oldAccId);
        } else {
          const names = others.map(o => `${o["First Name"] || o.first_name} ${o["Last Name"] || o.last_name}`.trim());
          const hasAllocated = others.some(o => (allocatedResidents || []).some(ar => (ar.ID || ar.id) === (o.ID || o.id)));
          await supabase.from('accommodations').update({
            "Availability Status": hasAllocated ? 'Allocated Residents' : 'Occupied',
            "Current Resident ID": others[0].ID || others[0].id,
            "Current Resident Name": names.join(', ')
          }).eq('"ID"', oldAccId);
        }
      } else if (status === 'Active') {
        if (oldAccId && oldAccId !== newAccId) {
          const others = [
            ...residents.filter(r => (r["Accommodation ID"] || r.accommodation_id) === oldAccId && (r.Status || r.status || '').toLowerCase() === 'active'),
            ...allocatedResidents.filter(ar => (ar.ID || ar.id) !== residentId && (ar["Accommodation ID"] || ar.accommodation_id) === oldAccId && (ar.Status || ar.status || '').toLowerCase() === 'active')
          ];
          if (others.length === 0) {
            await supabase.from('accommodations').update({
              "Availability Status": 'Available',
              "Current Resident ID": null,
              "Current Resident Name": null,
              "Lease End Date": now
            }).eq('"ID"', oldAccId);
          } else {
            const names = others.map(o => `${o["First Name"] || o.first_name} ${o["Last Name"] || o.last_name}`.trim());
            const hasAllocated = (allocatedResidents || []).some(ar => (ar.ID || ar.id) !== residentId && (ar["Accommodation ID"] || ar.accommodation_id) === oldAccId && (ar.Status || ar.status || '').toLowerCase() === 'active');
            await supabase.from('accommodations').update({
              "Availability Status": hasAllocated ? 'Allocated Residents' : 'Occupied',
              "Current Resident ID": others[0].ID || others[0].id,
              "Current Resident Name": names.join(', ')
            }).eq('"ID"', oldAccId);
          }
        }
        if (newAccId) {
          const others = [
            ...residents.filter(r => (r["Accommodation ID"] || r.accommodation_id) === newAccId && (r.Status || r.status || '').toLowerCase() === 'active'),
            ...allocatedResidents.filter(ar => (ar.ID || ar.id) !== residentId && (ar["Accommodation ID"] || ar.accommodation_id) === newAccId && (ar.Status || ar.status || '').toLowerCase() === 'active')
          ];
          const allNames = [...others.map(o => `${o["First Name"] || o.first_name} ${o["Last Name"] || o.last_name}`.trim()), fullName];
          await supabase.from('accommodations').update({
            "Availability Status": 'Allocated Residents',
            "Current Resident ID": saved.ID || saved.id,
            "Current Resident Name": [...new Set(allNames)].join(', '),
            "Lease Start Date": saved["Move-in Date"] || saved.move_in_date || now
          }).eq('"ID"', newAccId);
        }
      }
      setShowForm(false); setEditingResident(null); await loadData();
    } catch (e) { alert("Error saving: " + e.message); }
  };

  const handleDelete = async (r) => {
    const rId = r.ID || r.id;
    const firstName = r["First Name"] || r.first_name || '';
    const lastName = r["Last Name"] || r.last_name || '';
    if (!supabase || !window.confirm(`Delete ${firstName} ${lastName}?`)) return;
    try {
      const { error } = await supabase.from('allocated_residents').update({
        "Deleted": true,
        "Deleted Date": new Date().toISOString(),
        "Deleted By": user?.primaryEmailAddress?.emailAddress
      }).eq('"ID"', rId);

      if (error) throw error;

      const accId = r["Accommodation ID"] || r.accommodation_id;
      if (accId) {
        const others = [
          ...residents.filter(res => (res["Accommodation ID"] || res.accommodation_id) === accId && (res.Status || res.status || '').toLowerCase() === 'active'),
          ...allocatedResidents.filter(ar => (ar.ID || ar.id) !== rId && (ar["Accommodation ID"] || ar.accommodation_id) === accId && (ar.Status || ar.status || '').toLowerCase() === 'active')
        ];
        if (others.length === 0) {
          await supabase.from('accommodations').update({
            "Availability Status": 'Available',
            "Current Resident ID": null,
            "Current Resident Name": null,
            "Lease End Date": new Date().toISOString().slice(0, 10)
          }).eq('"ID"', accId);
        } else {
          const names = others.map(o => `${o["First Name"] || o.first_name} ${o["Last Name"] || o.last_name}`.trim());
          const hasAllocated = (allocatedResidents || []).some(ar => (ar.ID || ar.id) !== rId && (ar["Accommodation ID"] || ar.accommodation_id) === accId && (ar.Status || ar.status || '').toLowerCase() === 'active');
          await supabase.from('accommodations').update({
            "Availability Status": hasAllocated ? 'Allocated Residents' : 'Occupied',
            "Current Resident ID": others[0].ID || others[0].id,
            "Current Resident Name": names.join(', ')
          }).eq('"ID"', accId);
        }
      }
      await loadData();
    } catch (e) { alert("Error deleting: " + e.message); }
  };

  const exportCSV = () => {
    const headers = ["ID", "First Name", "Last Name", "Resident Type", "Property Name", "Unit", "Status", "SW", "Sign Up Pack Link"];
    const rows = filteredAllocatedResidents.map(r => [
      r.ID || r.id,
      r["First Name"] || r.first_name,
      r["Last Name"] || r.last_name,
      r["Resident Type"] || r.resident_type,
      r["Property Name"] || r.property_name,
      r["Unit/Room Number"] || r.unit_room_number,
      r.Status || r.status,
      r["Support Worker"] || r.support_worker,
      r["Sign Up Pack Link"] || ""
    ]);
    const escape = (v) => { const s = String(v ?? ""); return (s.includes(',') || s.includes('"') || s.includes('\n')) ? `"${s.replace(/"/g, '""')}"` : s; };
    const csv = [headers.map(escape).join(','), ...rows.map(row => row.map(escape).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.body.appendChild(document.createElement('a'));
    link.href = url; link.download = `allocated_residents_${format(new Date(), 'yyyy-MM-dd')}.csv`; link.click();
    document.body.removeChild(link);
  };

  const grouped = filteredAllocatedResidents.reduce((acc, r) => {
    const pid = r["Property ID"] || r.property_id || 'unassigned';
    if (!acc[pid]) acc[pid] = [];
    acc[pid].push(r); return acc;
  }, {});

  if (error) return <div className="p-6"><Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert><Button onClick={loadData} className="mt-4"><RefreshCw className="w-4 h-4 mr-2" />Retry</Button></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center px-6">
        <div><h1 className="text-3xl font-bold">Allocated Residents</h1><p className="text-slate-600">Manage allocated residents separately.</p></div>
        <div className="flex gap-3"><Button variant="outline" onClick={exportCSV}><Download className="w-4 h-4 mr-2" />Export CSV</Button><Button onClick={() => setShowForm(true)} className="bg-blue-600"><Plus className="w-4 h-4 mr-2" />Add New</Button></div>
      </div>

      <Card className="mx-6"><CardContent className="p-6"><div className="relative"><Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" /><Input placeholder="Search residents..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" /></div></CardContent></Card>

      <div className="px-6"><Tabs value={activeTab} onValueChange={setActiveTab}><TabsList><TabsTrigger value="all">All Allocated</TabsTrigger><TabsTrigger value="Active">Active</TabsTrigger><TabsTrigger value="Moved On">Moved On</TabsTrigger></TabsList></Tabs></div>

      {showForm && <div className="px-6"><AllocatedResidentForm resident={editingResident} accommodations={accommodations} allocatedResidents={allocatedResidents} otherResidents={residents} onSubmit={handleSubmit} onCancel={() => { setShowForm(false); setEditingResident(null); }} /></div>}

      {viewingResident && (
        <AllocatedResidentDetailModal
          resident={viewingResident}
          properties={properties}
          accommodations={accommodations}
          onClose={() => setViewingResident(null)}
          onEdit={(r) => { setViewingResident(null); setEditingResident(r); setShowForm(true); }}
          onDelete={handleDelete}
        />
      )}

      {loading ? (
        <div className="px-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-64 rounded-xl" />)}
        </div>
      ) : filteredAllocatedResidents.length === 0 ? (
        <div className="mx-6">
          <Card className="p-12 text-center">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No allocated residents found</h3>
            <p className="text-slate-500 mb-6">
              {searchTerm ? "Try adjusting your search terms" : "Get started by adding your first allocated resident"}
            </p>
            {!searchTerm && (
              <Button onClick={() => setShowForm(true)} className="bg-blue-600">
                <Plus className="w-4 h-4 mr-2" />
                Add First Resident
              </Button>
            )}
          </Card>
        </div>
      ) : activeTab === 'all' ? (
        <div className="space-y-6 px-6">
          {properties.map(p => {
            const pId = p.ID || p.id;
            const res = grouped[pId] || []; if (res.length === 0) return null;
            return (
              <Card key={pId} className="overflow-hidden border-slate-200">
                <Collapsible open={expandedProperties.has(pId)} onOpenChange={() => setExpandedProperties(prev => { const s = new Set(prev); if (s.has(pId)) s.delete(pId); else s.add(pId); return s; })}>
                  <CollapsibleTrigger className="w-full text-left"><CardHeader className="flex flex-row items-center justify-between hover:bg-slate-50 py-4"><div className="flex items-center gap-4"><div className="p-2 bg-blue-50 rounded-lg"><Building2 className="w-6 h-6 text-blue-600" /></div><div><CardTitle className="text-lg">{p.Name || p.name}</CardTitle><div className="flex items-center gap-2 text-sm text-slate-500"><MapPin className="w-4 h-4" />{p.Address || p.address}</div></div></div><div className="flex items-center gap-4"><span className="text-sm font-medium text-slate-500">{res.length} Resident{res.length !== 1 ? 's' : ''}</span>{expandedProperties.has(pId) ? <ChevronDown className="text-slate-400" /> : <ChevronRight className="text-slate-400" />}</div></CardHeader></CollapsibleTrigger>
                  <CollapsibleContent className="p-6 pt-0"><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">{res.map(r => (<AllocatedResidentCard key={r.ID || r.id} resident={r} accommodations={accommodations} onEdit={(res) => { setEditingResident(res); setShowForm(true); }} onViewDetails={setViewingResident} onDelete={handleDelete} getStatusColor={s => (s === 'Active' || s === 'active') ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'} />))}</div></CollapsibleContent>
                </Collapsible>
              </Card>
            );
          })}
          {grouped['unassigned']?.length > 0 && (
            <Card className="overflow-hidden border-slate-200">
              <Collapsible open={expandedProperties.has('unassigned')} onOpenChange={() => setExpandedProperties(prev => { const s = new Set(prev); if (s.has('unassigned')) s.delete('unassigned'); else s.add('unassigned'); return s; })}>
                <CollapsibleTrigger className="w-full text-left"><CardHeader className="flex flex-row items-center justify-between hover:bg-slate-50 py-4"><div className="flex items-center gap-4"><div className="p-2 bg-slate-100 rounded-lg"><UserX className="w-6 h-6 text-slate-600" /></div><div><CardTitle className="text-lg">Unassigned Residents</CardTitle><div className="text-sm text-slate-500">Residents not assigned to a property.</div></div></div><div className="flex items-center gap-4"><span className="text-sm font-medium text-slate-500">{grouped['unassigned'].length} Resident{grouped['unassigned'].length !== 1 ? 's' : ''}</span>{expandedProperties.has('unassigned') ? <ChevronDown className="text-slate-400" /> : <ChevronRight className="text-slate-400" />}</div></CardHeader></CollapsibleTrigger>
                <CollapsibleContent className="p-6 pt-0"><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">{grouped['unassigned'].map(r => (<AllocatedResidentCard key={r.ID || r.id} resident={r} accommodations={accommodations} onEdit={(res) => { setEditingResident(res); setShowForm(true); }} onViewDetails={setViewingResident} onDelete={handleDelete} getStatusColor={s => (s === 'Active' || s === 'active') ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'} />))}</div></CollapsibleContent>
              </Collapsible>
            </Card>
          )}
        </div>
      ) : (
        <div className="px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{filteredAllocatedResidents.map(r => (<AllocatedResidentCard key={r.ID || r.id} resident={r} accommodations={accommodations} onEdit={(res) => { setEditingResident(res); setShowForm(true); }} onViewDetails={setViewingResident} onDelete={handleDelete} getStatusColor={s => (s === 'Active' || s === 'active') ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'} />))}</div>
      )}
    </div>
  );
}
