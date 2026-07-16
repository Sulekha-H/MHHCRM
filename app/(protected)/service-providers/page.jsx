"use client"

import React, { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { useClerkSupabaseClient } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Search,
  Users,
  Filter,
  Loader2,
  RefreshCw
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { logActivity, ACTIONS, ENTITIES } from "@/lib/activityUtils";
import { isOfficeStaff } from "@/lib/permissions";

import ServiceProviderForm from "@/components/work-bookings/ServiceProviderForm";
import ServiceProviderList from "@/components/work-bookings/ServiceProviderList";

export default function ServiceProvidersPage() {
  const { user } = useUser();
  const supabase = useClerkSupabaseClient();

  const [loading, setLoading] = useState(true);
  const [providers, setProviders] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingProvider, setEditingProvider] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const canEdit = isOfficeStaff(user);

  const fetchData = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('service_providers')
        .select('*')
        .eq('Deleted', false)
        .order('Name');

      if (error) throw error;
      setProviders(data || []);
    } catch (err) {
      console.error("Error fetching providers:", err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = async (formData) => {
    try {
      const data = {
        "Name": formData.name,
        "Category": formData.category,
        "Contact Number": formData.contact_number,
        "Email": formData.email,
        "Default Hourly Rate": formData.default_hourly_rate || "",
        "Default Day Rate": formData.default_day_rate || "",
        "Notes": formData.notes,
        "Unavailable Dates": formData.unavailable_dates || [],
        "Updated Date": new Date().toISOString()
      };

      if (editingProvider) {
        const { error } = await supabase
          .from('service_providers')
          .update(data)
          .eq('ID', editingProvider.ID || editingProvider.id);
        if (error) throw error;

        logActivity(supabase, {
          userName: user.fullName || "Unknown",
          userEmail: user.primaryEmailAddress?.emailAddress,
          actionType: ACTIONS.UPDATE,
          entityType: ENTITIES.SERVICE_PROVIDER,
          entityId: editingProvider.ID || editingProvider.id,
          description: `Updated service provider: ${data.Name}`
        });
      } else {
        const { data: newProvider, error } = await supabase
          .from('service_providers')
          .insert([{ ...data, "ID": crypto.randomUUID(), "Created Date": new Date().toISOString() }])
          .select();
        if (error) throw error;

        logActivity(supabase, {
          userName: user.fullName || "Unknown",
          userEmail: user.primaryEmailAddress?.emailAddress,
          actionType: ACTIONS.CREATE,
          entityType: ENTITIES.SERVICE_PROVIDER,
          entityId: newProvider[0].ID,
          description: `Created service provider: ${data.Name}`
        });
      }
      setShowForm(false);
      setEditingProvider(null);
      fetchData();
    } catch (err) {
      alert("Error saving provider: " + err.message);
    }
  };

  const handleDelete = async (provider) => {
    if (!window.confirm(`Are you sure you want to delete ${provider.Name || provider.name}?`)) return;
    try {
      const { error } = await supabase
        .from('service_providers')
        .update({ Deleted: true, "Deleted Date": new Date().toISOString(), "Deleted By": user.primaryEmailAddress?.emailAddress })
        .eq('ID', provider.ID || provider.id);
      if (error) throw error;
      fetchData();
    } catch (err) {
      alert("Error deleting provider: " + err.message);
    }
  };

  const filteredProviders = providers.filter(p => {
    const matchesSearch = (p.Name || p.name || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || (p.Category || p.category || "").toLowerCase() === categoryFilter.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Service Providers</h1>
            <p className="text-sm text-slate-600">Manage handyman, plumbers, electricians, decorators, cleaners, and other service providers</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {canEdit && (
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => setShowForm(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Provider
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full md:w-[200px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="Handyman">Handyman</SelectItem>
            <SelectItem value="Plumber">Plumber</SelectItem>
            <SelectItem value="Electrician">Electrician</SelectItem>
            <SelectItem value="Decorator">Decorator</SelectItem>
            <SelectItem value="Gas Engineer">Gas Engineer</SelectItem>
            <SelectItem value="Cleaner">Cleaner</SelectItem>
            <SelectItem value="Gardener">Gardener</SelectItem>
            <SelectItem value="Translator">Translator</SelectItem>
            <SelectItem value="Rubbish Collector">Rubbish Collector</SelectItem>
            <SelectItem value="Delivery Person">Delivery Person</SelectItem>
            <SelectItem value="Pest Control">Pest Control</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {showForm && (
        <ServiceProviderForm
          provider={editingProvider}
          onSubmit={handleSubmit}
          onCancel={() => { setShowForm(false); setEditingProvider(null); }}
        />
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <Loader2 className="w-10 h-10 animate-spin mb-4" />
          <p>Loading service providers...</p>
        </div>
      ) : (
        <ServiceProviderList
          providers={filteredProviders}
          onEdit={(p) => { setEditingProvider(p); setShowForm(true); }}
          onDelete={handleDelete}
          canEdit={canEdit}
        />
      )}
    </div>
  );
}
