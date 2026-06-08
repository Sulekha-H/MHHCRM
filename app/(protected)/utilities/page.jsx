"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { useClerkSupabaseClient } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Zap, Building2, Download } from "lucide-react";
import UtilityForm from "@/components/utilities/UtilityForm";
import UtilityCard from "@/components/utilities/UtilityCard";
import UtilityDetailModal from "@/components/utilities/UtilityDetailModal";
import { format } from "date-fns";

export default function UtilitiesPage() {
  const { user } = useUser();
  const supabase = useClerkSupabaseClient();

  const isManagement = useMemo(() => {
    const email = user?.primaryEmailAddress?.emailAddress?.toLowerCase();
    return email === 'amaani@myhopehousing.org.uk' || email === 'sulekha@myhopehousing.org.uk';
  }, [user]);

  const [utilities, setUtilities] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUtility, setEditingUtility] = useState(null);
  const [viewingUtility, setViewingUtility] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [propertyFilter, setPropertyFilter] = useState("all");

  const loadData = useCallback(async () => {
    if (!supabase) return;
    try {
      setLoading(true);

      const [utilitiesRes, propertiesRes] = await Promise.all([
        supabase.from("Utilities").select("*").or('Deleted.is.null,Deleted.eq.false').order("Created Date", { ascending: false }),
        supabase.from("properties").select("ID, Name").or('Deleted.is.null,Deleted.eq.false')
      ]);

      if (utilitiesRes.error) throw utilitiesRes.error;
      if (propertiesRes.error) throw propertiesRes.error;

      setUtilities(utilitiesRes.data || []);
      setProperties(propertiesRes.data || []);
    } catch (error) {
      console.error("Error loading utilities data:", error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredUtilities = useMemo(() => {
    return utilities.filter(utility => {
      const matchesSearch =
        (utility["Company Name"]?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (utility["Utility Type"]?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (utility["Account Number"]?.toLowerCase() || "").includes(searchTerm.toLowerCase());

      const matchesProperty = propertyFilter === "all" || utility["Property ID"] === propertyFilter;

      return matchesSearch && matchesProperty;
    });
  }, [utilities, searchTerm, propertyFilter]);

  const groupedUtilities = useMemo(() => {
    const groups = {};
    filteredUtilities.forEach(utility => {
      const propertyId = utility["Property ID"];
      if (!groups[propertyId]) {
        groups[propertyId] = [];
      }
      groups[propertyId].push(utility);
    });

    // Convert to array and sort by property name
    return Object.entries(groups).sort(([idA], [idB]) => {
      const nameA = properties.find(p => (p.ID || p.id) === idA)?.Name || "";
      const nameB = properties.find(p => (p.ID || p.id) === idB)?.Name || "";
      return nameA.localeCompare(nameB);
    });
  }, [filteredUtilities, properties]);

  const handleSubmit = async (utilityData) => {
    try {
      if (editingUtility) {
        const { error } = await supabase
          .from("Utilities")
          .update(utilityData)
          .eq("ID", editingUtility.ID);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("Utilities")
          .insert([utilityData]);
        if (error) throw error;
      }
      setShowForm(false);
      setEditingUtility(null);
      loadData();
    } catch (error) {
      console.error("Error saving utility:", error);
      alert("Error saving utility: " + error.message);
    }
  };

  const handleDelete = async (utility) => {
    if (!window.confirm("Are you sure you want to delete this utility record?")) return;

    try {
      const { error } = await supabase
        .from("Utilities")
        .update({
          Deleted: true,
          "Deleted Date": new Date().toISOString()
        })
        .eq("ID", utility.ID);

      if (error) throw error;
      setViewingUtility(null);
      loadData();
    } catch (error) {
      console.error("Error deleting utility:", error);
      alert("Error deleting utility: " + error.message);
    }
  };

  const exportToCSV = () => {
    const headers = [
      "Property", "Utility Type", "Company Name", "Account Number",
      "Login Email", "Login Username", "Login Password", "Notes"
    ];

    const rows = filteredUtilities.map(u => {
      const property = properties.find(p => (p.ID || p.id) === u["Property ID"]);
      return [
        property?.Name || "Unknown",
        u["Utility Type"],
        u["Company Name"],
        u["Account Number"] || u["Company Account Number"],
        u["Login Email Address"],
        u["Login Username"],
        u["Login Password"],
        u["Notes"]
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${(cell || "").toString().replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `utilities_export_${format(new Date(), "yyyy-MM-dd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Utilities</h1>
          <p className="text-slate-600">Manage property utility providers and account details</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={exportToCSV} variant="outline" className="flex items-center gap-2">
            <Download className="w-4 h-4" /> Export CSV
          </Button>
          <Button onClick={() => setShowForm(true)} className="bg-teal-600 hover:bg-teal-700">
            <Plus className="w-4 h-4 mr-2" /> Add Utility
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by company, type, or account number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={propertyFilter} onValueChange={setPropertyFilter}>
              <SelectTrigger>
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-slate-400" />
                  <SelectValue placeholder="Filter by Property" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Properties</SelectItem>
                {properties.map(p => (
                  <SelectItem key={p.ID || p.id} value={p.ID || p.id}>
                    {p.Name || p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {showForm && (
        <UtilityForm
          utility={editingUtility}
          properties={properties}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingUtility(null);
          }}
        />
      )}

      {viewingUtility && (
        <UtilityDetailModal
          utility={viewingUtility}
          propertyName={properties.find(p => (p.ID || p.id) === viewingUtility["Property ID"])?.Name}
          onEdit={(u) => {
            setViewingUtility(null);
            setEditingUtility(u);
            setShowForm(true);
          }}
          onDelete={handleDelete}
          onClose={() => setViewingUtility(null)}
          isManagement={isManagement}
        />
      )}

      {loading ? (
        <div className="text-center py-12">
          <p className="text-slate-500">Loading utilities...</p>
        </div>
      ) : filteredUtilities.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Zap className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No utilities found</h3>
            <p className="text-slate-500 mb-4">
              {searchTerm || propertyFilter !== "all"
                ? "Try adjusting your filters"
                : "Get started by adding your first utility record"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-10">
          {groupedUtilities.map(([propertyId, propertyUtilities]) => {
            const property = properties.find(p => (p.ID || p.id) === propertyId);
            return (
              <div key={propertyId} className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b-2 border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center shadow-sm">
                      <Building2 className="w-6 h-6 text-teal-600" />
                    </div>
                    <div className="flex items-baseline gap-3">
                      <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
                        {property?.Name || "Unknown Property"}
                      </h2>
                      <Badge variant="secondary" className="bg-teal-100/50 text-teal-700 border-teal-200 font-semibold px-2.5 py-0.5 rounded-full text-xs">
                        {propertyUtilities.length} {propertyUtilities.length === 1 ? 'Utility' : 'Utilities'}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {propertyUtilities.map((utility) => (
                    <UtilityCard
                      key={utility.ID}
                      utility={utility}
                      propertyName={property?.Name}
                      onEdit={(u) => {
                        setEditingUtility(u);
                        setShowForm(true);
                      }}
                      onViewDetails={(u) => setViewingUtility(u)}
                      onDelete={handleDelete}
                      isManagement={isManagement}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
