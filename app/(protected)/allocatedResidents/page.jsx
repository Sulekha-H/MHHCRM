
"use client";

import React, { useState, useEffect } from "react";
import { useUser } from '@clerk/nextjs'
import { useClerkSupabaseClient } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Building2, MapPin, ChevronDown, ChevronRight, Download, AlertCircle, RefreshCw, UserX } from "lucide-react";
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
      setLoading(true); setError(null);
      const [allocatedRes, accsRes, propsRes] = await Promise.all([
        supabase.from('allocated_residents').select('*').order('Created Date', { ascending: false }),
        supabase.from('accommodations').select('*'),
        supabase.from('properties').select('*')
      ]);

      if (allocatedRes.error) throw allocatedRes.error;
      if (accsRes.error) throw accsRes.error;
      if (propsRes.error) throw propsRes.error;

      const active = (allocatedRes.data || []).filter(r => !r.Deleted);
      const sortedProps = (propsRes.data || []).sort((a, b) => (a.Name || '').localeCompare(b.Name || ''));

      setAllocatedResidents(active);
      setAccommodations(accsRes.data || []);
      setProperties(sortedProps);
      setExpandedProperties(new Set(sortedProps.map(p => p.ID).concat('unassigned')));
    } catch (e) {
      console.error("❌ Error loading data:", e);
      setError(e.message || "Failed to load data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (supabase) loadData(); }, [supabase]);

  useEffect(() => {
    let filtered = allocatedResidents;
    if (activeTab.toLowerCase() !== "all") filtered = filtered.filter(r => r.Status?.toLowerCase() === activeTab.toLowerCase());
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      filtered = filtered.filter(r => `${r["First Name"]} ${r["Last Name"]}`.toLowerCase().includes(s) || r["Property Address"]?.toLowerCase().includes(s) || r["Support Worker"]?.toLowerCase().includes(s));
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
          else if (obj[k] && typeof obj[k] === 'object') cleanDates(obj[k]);
        });
      };
      cleanDates(cleanedData);

      const original = editingResident ? allocatedResidents.find(r => r.ID === editingResident.ID) : null;
      let saved;
      if (editingResident) {
        const { data, error } = await supabase.from('allocated_residents').update({ ...cleanedData, "Updated Date": now }).eq('ID', editingResident.ID).select().single();
        if (error) throw error;
        saved = data;
      } else {
        const { data, error } = await supabase.from('allocated_residents').insert([{ ...cleanedData, ID: crypto.randomUUID(), "Created Date": now, "Updated Date": now }]).select().single();
        if (error) throw error;
        saved = data;
      }

      const oldId = original?.["Accommodation ID"];
      const newId = saved["Accommodation ID"];
      const name = `${saved["First Name"]} ${saved["Last Name"]}`;

      if (saved.Status === 'Moved On' && oldId) {
        await supabase.from('accommodations').update({ "Availability Status": 'Available', "Current Resident ID": null, "Current Resident Name": null, "Lease End Date": saved["Move-out Date"] || now }).eq('ID', oldId);
      } else if (saved.Status === 'Active') {
        if (oldId && oldId !== newId) await supabase.from('accommodations').update({ "Availability Status": 'Available', "Current Resident ID": null, "Current Resident Name": null, "Lease End Date": now }).eq('ID', oldId);
        if (newId) await supabase.from('accommodations').update({ "Availability Status": 'Occupied', "Current Resident ID": saved.ID, "Current Resident Name": name, "Lease Start Date": saved["Move-in Date"] || now }).eq('ID', newId);
      }
      setShowForm(false); setEditingResident(null); await loadData();
    } catch (e) { alert("Error saving: " + e.message); }
  };

  const handleDelete = async (r) => {
    if (!supabase || !window.confirm(`Delete ${r["First Name"]} ${r["Last Name"]}?`)) return;
    try {
      await supabase.from('allocated_residents').update({ "Deleted": true, "Deleted Date": new Date().toISOString(), "Deleted By": user?.primaryEmailAddress?.emailAddress }).eq('ID', r.ID);
      if (r["Accommodation ID"]) await supabase.from('accommodations').update({ "Availability Status": 'Available', "Current Resident ID": null, "Current Resident Name": null, "Lease End Date": new Date().toISOString().slice(0, 10) }).eq('ID', r["Accommodation ID"]);
      await loadData();
    } catch (e) { alert("Error deleting: " + e.message); }
  };

  const exportCSV = () => {
    const headers = ["ID", "First Name", "Last Name", "Resident Type", "Property Name", "Unit", "Status", "SW"];
    const rows = filteredAllocatedResidents.map(r => [r.ID, r["First Name"], r["Last Name"], r["Resident Type"], r["Property Name"], r["Unit/Room Number"], r.Status, r["Support Worker"]]);
    const escape = (v) => { const s = String(v ?? ""); return (s.includes(',') || s.includes('"') || s.includes('\n')) ? `"${s.replace(/"/g, '""')}"` : s; };
    const csv = [headers.map(escape).join(','), ...rows.map(row => row.map(escape).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.body.appendChild(document.createElement('a'));
    link.href = url; link.download = `allocated_residents_${format(new Date(), 'yyyy-MM-dd')}.csv`; link.click();
    document.body.removeChild(link);
  };

  const grouped = filteredAllocatedResidents.reduce((acc, r) => {
    const pid = r["Property ID"] || 'unassigned';
    if (!acc[pid]) acc[pid] = [];
    acc[pid].push(r); return acc;
  }, {});

  if (error) return <div className="p-6"><Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert><Button onClick={loadData} className="mt-4">Retry</Button></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center px-6">
        <div><h1 className="text-3xl font-bold">Allocated Residents</h1><p className="text-slate-600">Manage allocated residents separately.</p></div>
        <div className="flex gap-3"><Button variant="outline" onClick={exportCSV}><Download className="w-4 h-4 mr-2" />Export CSV</Button><Button onClick={() => setShowForm(true)} className="bg-blue-600"><Plus className="w-4 h-4 mr-2" />Add New</Button></div>
      </div>
      <Card className="mx-6"><CardContent className="p-6"><div className="relative"><Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" /><Input placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" /></div></CardContent></Card>
      <div className="px-6"><Tabs value={activeTab} onValueChange={setActiveTab}><TabsList><TabsTrigger value="all">All Allocated</TabsTrigger><TabsTrigger value="Active">Active</TabsTrigger><TabsTrigger value="Moved On">Moved On</TabsTrigger></TabsList></Tabs></div>
      {showForm && <div className="px-6"><AllocatedResidentForm resident={editingResident} accommodations={accommodations} onSubmit={handleSubmit} onCancel={() => { setShowForm(false); setEditingResident(null); }} /></div>}
      {viewingResident && <AllocatedResidentDetailModal resident={viewingResident} onClose={() => setViewingResident(null)} onEdit={(r) => { setViewingResident(null); setEditingResident(r); setShowForm(true); }} onDelete={handleDelete} />}
      {loading ? <div className="px-6 grid grid-cols-1 md:grid-cols-3 gap-6">{[1, 2, 3].map(i => <Skeleton key={i} className="h-64" />)}</div> : activeTab === 'all' ? (
        <div className="space-y-6 px-6">
          {properties.map(p => {
            const res = grouped[p.ID] || []; if (res.length === 0) return null;
            return (
              <Card key={p.ID}>
                <Collapsible open={expandedProperties.has(p.ID)} onOpenChange={() => setExpandedProperties(prev => { const s = new Set(prev); if (s.has(p.ID)) s.delete(p.ID); else s.add(p.ID); return s; })}>
                  <CollapsibleTrigger className="w-full text-left"><CardHeader className="flex flex-row items-center justify-between hover:bg-slate-50"><div className="flex items-center gap-4"><Building2 className="w-6 h-6 text-blue-600" /><div><CardTitle>{p.Name}</CardTitle><div className="flex items-center gap-2 text-sm text-slate-500"><MapPin className="w-4 h-4" />{p.Address}</div></div></div>{expandedProperties.has(p.ID) ? <ChevronDown /> : <ChevronRight />}</CardHeader></CollapsibleTrigger>
                  <CollapsibleContent className="p-6 pt-0"><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">{res.map(r => (<AllocatedResidentCard key={r.ID} resident={r} accommodations={accommodations} onEdit={(res) => { setEditingResident(res); setShowForm(true); }} onViewDetails={setViewingResident} onDelete={handleDelete} getStatusColor={s => s === 'Active' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'} />))}</div></CollapsibleContent>
                </Collapsible>
              </Card>
            );
          })}
          {grouped['unassigned']?.length > 0 && (
            <Card>
              <Collapsible open={expandedProperties.has('unassigned')} onOpenChange={() => setExpandedProperties(prev => { const s = new Set(prev); if (s.has('unassigned')) s.delete('unassigned'); else s.add('unassigned'); return s; })}>
                <CollapsibleTrigger className="w-full text-left"><CardHeader className="flex flex-row items-center justify-between hover:bg-slate-50"><div className="flex items-center gap-4"><UserX className="w-6 h-6 text-slate-600" /><div><CardTitle>Unassigned Residents</CardTitle><div className="text-sm text-slate-500">Residents not assigned to a property.</div></div></div>{expandedProperties.has('unassigned') ? <ChevronDown /> : <ChevronRight />}</CardHeader></CollapsibleTrigger>
                <CollapsibleContent className="p-6 pt-0"><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">{grouped['unassigned'].map(r => (<AllocatedResidentCard key={r.ID} resident={r} accommodations={accommodations} onEdit={(res) => { setEditingResident(res); setShowForm(true); }} onViewDetails={setViewingResident} onDelete={handleDelete} getStatusColor={s => s === 'Active' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'} />))}</div></CollapsibleContent>
              </Collapsible>
            </Card>
          )}
        </div>
      ) : (
        <div className="px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{filteredAllocatedResidents.map(r => (<AllocatedResidentCard key={r.ID} resident={r} accommodations={accommodations} onEdit={(res) => { setEditingResident(res); setShowForm(true); }} onViewDetails={setViewingResident} onDelete={handleDelete} getStatusColor={s => s === 'Active' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'} />))}</div>
      )}
    </div>
  );
}
