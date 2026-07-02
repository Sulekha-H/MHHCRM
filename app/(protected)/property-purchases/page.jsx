"use client"

import { useUser } from "@clerk/nextjs";
import React, { useState, useEffect, useCallback } from "react";
import { useClerkSupabaseClient } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Search,
  Download,
  ShoppingCart,
  Filter,
  List,
  AlertCircle,
  LayoutGrid
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format, startOfYear, endOfYear, eachMonthOfInterval } from "date-fns";
import { logActivity, ACTIONS, ENTITIES } from "@/lib/activityUtils";
import PropertyPurchaseForm from "@/components/properties/PropertyPurchaseForm";
import PropertyPurchaseCard from "@/components/properties/PropertyPurchaseCard";
import PropertyPurchaseDetailModal from "@/components/properties/PropertyPurchaseDetailModal";

export default function PropertyPurchases() {
  const supabase = useClerkSupabaseClient();
  const { user } = useUser();
  const [purchases, setPurchases] = useState([]);
  const [properties, setProperties] = useState([]);
  const [filteredPurchases, setFilteredPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState(null);
  const [viewingPurchase, setViewingPurchase] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [activeMonthTab, setActiveMonthTab] = useState("all");
  const [propertyFilter, setPropertyFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [groupBy, setGroupBy] = useState("property");

  const categories = [
    "Furniture",
    "Maintenance",
    "Office Supplies",
    "Cleaning Supplies",
    "Appliances",
    "Safety & Security",
    "Decor",
    "Other"
  ];

  const fetchAllData = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const { data: purchaseData, error: purchaseError } = await supabase
        .from("property_purchases")
        .select("*")
        .or('"Deleted".is.null,"Deleted".eq.false')
        .order('"Purchase Date"', { ascending: false });
      if (purchaseError) throw purchaseError;
      setPurchases(purchaseData || []);

      const { data: propertiesData, error: propertiesError } = await supabase
        .from('properties')
        .select('*')
        .or('"Deleted".is.null,"Deleted".eq.false');
      if (propertiesError) throw propertiesError;
      setProperties(propertiesData || []);

    } catch (err) {
      console.error("❌ Error loading data:", err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const filterPurchases = useCallback(() => {
    let current = Array.isArray(purchases) ? [...purchases] : [];

    // Filter by status tab
    if (activeTab !== "all") {
      current = current.filter(p => (p["Status"] || p.status || "").toLowerCase() === activeTab);
    }

    // Filter by property
    if (propertyFilter !== "all") {
      current = current.filter(p => (p["Property ID"] || p.property_id) === propertyFilter);
    }

    // Filter by category
    if (categoryFilter !== "all") {
      current = current.filter(p => (p["Category"] || p.category || "").toLowerCase() === categoryFilter.toLowerCase());
    }

    // Filter by search term
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      current = current.filter(p => {
        const itemName = (p["Item Name"] || p.item_name || "").toLowerCase();
        const supplier = (p["Supplier"] || p.supplier || "").toLowerCase();
        const notes = (p["Notes"] || p.notes || "").toLowerCase();
        return itemName.includes(search) || supplier.includes(search) || notes.includes(search);
      });
    }

    // Filter by month
    if (activeMonthTab !== "all") {
      current = current.filter(p => {
        const date = new Date(p["Purchase Date"] || p.purchase_date);
        return format(date, 'MMMM yyyy') === activeMonthTab;
      });
    }

    setFilteredPurchases(current);
  }, [purchases, searchTerm, activeTab, activeMonthTab, propertyFilter, categoryFilter]);

  useEffect(() => {
    filterPurchases();
  }, [filterPurchases]);

  const handleSubmit = async (formData) => {
    try {
      const supabaseData = {
        "Item Name": formData.item_name,
        "Purchase Date": formData.purchase_date,
        "Cost": parseFloat(formData.cost),
        "Property ID": formData.property_id,
        "Supplier": formData.supplier || null,
        "Category": formData.category,
        "Status": formData.status,
        "Receipt Link": formData.receipt_link || null,
        "Notes": formData.notes || null,
        "Logged By": formData.logged_by,
        "Updated Date": new Date().toISOString()
      };

      if (editingPurchase) {
        const purchaseId = editingPurchase["ID"] || editingPurchase.id;
        const { error } = await supabase
          .from('property_purchases')
          .update(supabaseData)
          .eq('"ID"', purchaseId);
        if (error) throw error;

        await logActivity(supabase, {
          userName: user.fullName || user.username || "Unknown",
          userEmail: user.primaryEmailAddress?.emailAddress,
          actionType: ACTIONS.UPDATE,
          entityType: ENTITIES.PROPERTY_PURCHASE,
          entityId: purchaseId,
          description: `Updated property purchase: ${formData.item_name} for ${getPropertyName(formData.property_id)}`
        });
      } else {
        const newId = crypto.randomUUID();
        supabaseData.ID = newId;
        supabaseData["Created Date"] = new Date().toISOString();
        const { error } = await supabase
          .from('property_purchases')
          .insert([supabaseData]);
        if (error) throw error;

        await logActivity(supabase, {
          userName: user.fullName || user.username || "Unknown",
          userEmail: user.primaryEmailAddress?.emailAddress,
          actionType: ACTIONS.CREATE,
          entityType: ENTITIES.PROPERTY_PURCHASE,
          entityId: newId,
          description: `Logged new property purchase: ${formData.item_name} for ${getPropertyName(formData.property_id)}`
        });
      }

      setShowForm(false);
      setEditingPurchase(null);
      fetchAllData();
    } catch (err) {
      console.error("Error saving purchase:", err);
      alert("Error saving purchase: " + err.message);
    }
  };

  const handleEdit = (purchase) => {
    setEditingPurchase(purchase);
    setShowForm(true);
    setViewingPurchase(null);
  };

  const handleDelete = async (purchase) => {
    if (window.confirm("Are you sure you want to delete this purchase log?")) {
      try {
        const { error } = await supabase
          .from('property_purchases')
          .update({
            "Deleted": true,
            "Deleted Date": new Date().toISOString(),
            "Deleted By": user?.primaryEmailAddress?.emailAddress || "unknown"
          })
          .eq('"ID"', purchase["ID"] || purchase.id);

        if (error) throw error;

        await logActivity(supabase, {
          userName: user.fullName || user.username || "Unknown",
          userEmail: user.primaryEmailAddress?.emailAddress,
          actionType: ACTIONS.DELETE,
          entityType: ENTITIES.PROPERTY_PURCHASE,
          entityId: purchase["ID"] || purchase.id,
          description: `Deleted property purchase: ${purchase["Item Name"] || purchase.item_name}`
        });

        setViewingPurchase(null);
        fetchAllData();
      } catch (err) {
        console.error("Error deleting purchase:", err);
        alert("Error deleting purchase: " + err.message);
      }
    }
  };

  const getPropertyName = (propertyId) => {
    const property = properties.find(p => (p.ID || p.id) === propertyId);
    return property?.Name || property?.name || "Unknown Property";
  };

  const exportToCSV = () => {
    const headers = ["Item Name", "Date", "Cost", "Property", "Supplier", "Category", "Status", "Logged By", "Link"];
    const rows = filteredPurchases.map(p => [
      p["Item Name"] || p.item_name,
      p["Purchase Date"] || p.purchase_date,
      p["Cost"] || p.cost,
      getPropertyName(p["Property ID"] || p.property_id),
      p["Supplier"] || p.supplier || "",
      p["Category"] || p.category,
      p["Status"] || p.status,
      p["Logged By"] || p.logged_by,
      p["Receipt Link"] || p.receipt_link || ""
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `property_purchases_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();

    logActivity(supabase, {
      userName: user.fullName || user.username || "Unknown",
      userEmail: user.primaryEmailAddress?.emailAddress,
      actionType: ACTIONS.EXPORT,
      entityType: ENTITIES.PROPERTY_PURCHASE,
      description: `Exported ${filteredPurchases.length} property purchases to CSV`
    });
  };

  const currentYear = new Date().getFullYear();
  const monthsInYear = eachMonthOfInterval({
    start: startOfYear(new Date(currentYear, 0, 1)),
    end: endOfYear(new Date(currentYear, 11, 31))
  }).sort((a, b) => b - a);

  const groupedByProperty = properties
    .sort((a, b) => (a.Name || a.name || "").localeCompare(b.Name || b.name || ""))
    .map(property => {
      const propertyId = property.ID || property.id;
      const propertyPurchases = filteredPurchases.filter(p => (p["Property ID"] || p.property_id) === propertyId);
      return { property, purchases: propertyPurchases };
    });

  const groupedByStatus = ["Ordered", "Pending", "Delivered", "Cancelled"].map(status => {
    const statusPurchases = filteredPurchases.filter(p => (p["Status"] || p.status || "").toLowerCase() === status.toLowerCase());
    return { status, purchases: statusPurchases };
  });

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
            <ShoppingCart className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 uppercase">Property Purchases</h1>
            <p className="text-sm text-slate-600 italic">Manage and track all property-related orders and purchases</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button onClick={exportToCSV} variant="outline" className="flex items-center gap-2" disabled={loading || filteredPurchases.length === 0}>
            <Download className="w-4 h-4" /> Export
          </Button>
          <Button onClick={() => setShowForm(true)} className="bg-orange-600 hover:bg-orange-700">
            <Plus className="w-4 h-4 mr-2" /> Log Purchase
          </Button>
        </div>
      </div>

      {/* Month Filter */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Filter by Month</h3>
        <Tabs value={activeMonthTab} onValueChange={setActiveMonthTab}>
          <TabsList className="flex h-auto flex-wrap justify-start gap-1 p-1 bg-slate-100/50">
            <TabsTrigger value="all" className="px-4 py-2 text-xs font-bold uppercase tracking-widest">All Time</TabsTrigger>
            {monthsInYear.map(monthDate => {
              const monthKey = format(monthDate, 'MMMM yyyy');
              return (
                <TabsTrigger key={monthKey} value={monthKey} className="px-4 py-2 text-xs font-bold uppercase tracking-widest">
                  {monthKey}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>
      </div>

      {/* Search and Filters */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search items, suppliers, or notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={propertyFilter} onValueChange={setPropertyFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <Filter className="w-4 h-4 mr-2 text-orange-500" />
                <SelectValue placeholder="All Properties" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Properties</SelectItem>
                {properties.map((p) => (
                  <SelectItem key={p.ID || p.id} value={p.ID || p.id}>{p.Name || p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <LayoutGrid className="w-4 h-4 mr-2 text-orange-500" />
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c} value={c.toLowerCase()}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
              <Button
                variant={groupBy === "property" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setGroupBy("property")}
                className={groupBy === "property" ? "bg-white shadow-sm font-bold text-xs uppercase" : "font-bold text-xs uppercase"}
              >
                Property
              </Button>
              <Button
                variant={groupBy === "status" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setGroupBy("status")}
                className={groupBy === "status" ? "bg-white shadow-sm font-bold text-xs uppercase" : "font-bold text-xs uppercase"}
              >
                Status
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-flex bg-slate-100/50">
          <TabsTrigger value="all" className="uppercase text-[10px] font-black tracking-tighter">All ({purchases.length})</TabsTrigger>
          <TabsTrigger value="ordered" className="uppercase text-[10px] font-black tracking-tighter">Ordered ({purchases.filter(p => (p.Status || p.status) === "Ordered").length})</TabsTrigger>
          <TabsTrigger value="pending" className="uppercase text-[10px] font-black tracking-tighter">Pending ({purchases.filter(p => (p.Status || p.status) === "Pending").length})</TabsTrigger>
          <TabsTrigger value="delivered" className="uppercase text-[10px] font-black tracking-tighter">Delivered ({purchases.filter(p => (p.Status || p.status) === "Delivered").length})</TabsTrigger>
          <TabsTrigger value="cancelled" className="uppercase text-[10px] font-black tracking-tighter text-red-500">Cancelled ({purchases.filter(p => (p.Status || p.status) === "Cancelled").length})</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Content */}
      <div className="space-y-12">
        {loading ? (
          <div className="text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed">
            <p className="text-slate-500 font-bold uppercase tracking-widest animate-pulse">Loading Purchase History...</p>
          </div>
        ) : filteredPurchases.length === 0 ? (
          <Card className="shadow-none border-2 border-dashed border-slate-200">
            <CardContent className="p-20 text-center space-y-4">
              <ShoppingCart className="w-16 h-16 text-slate-300 mx-auto" />
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-slate-900 uppercase">No Purchases Found</h3>
                <p className="text-slate-500 italic">Try adjusting your filters or search term</p>
              </div>
              <Button onClick={() => setShowForm(true)} className="bg-orange-600 hover:bg-orange-700 px-8">
                Log First Purchase
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {groupBy === "property" ? (
              groupedByProperty.filter(g => g.purchases.length > 0).map(({ property, purchases }) => (
                <div key={property.ID || property.id} className="space-y-6">
                  <div className="flex items-center justify-between border-b-2 border-orange-100 pb-3">
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
                      {property.Name || property.name}
                      <span className="ml-3 text-lg font-medium text-slate-400">({purchases.length})</span>
                    </h3>
                  </div>
                  <div className="flex flex-nowrap overflow-x-auto pb-6 gap-6 snap-x">
                    {purchases.map(purchase => (
                      <div key={purchase["ID"] || purchase.id} className="flex-none w-[350px] snap-start">
                        <PropertyPurchaseCard
                          purchase={purchase}
                          onEdit={handleEdit}
                          onViewDetails={setViewingPurchase}
                          onDelete={handleDelete}
                          getPropertyName={getPropertyName}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              groupedByStatus.filter(g => g.purchases.length > 0).map(({ status, purchases }) => (
                <div key={status} className="space-y-6">
                  <div className="flex items-center justify-between border-b-2 border-orange-100 pb-3">
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
                      {status}
                      <span className="ml-3 text-lg font-medium text-slate-400">({purchases.length})</span>
                    </h3>
                  </div>
                  <div className="flex flex-nowrap overflow-x-auto pb-6 gap-6 snap-x">
                    {purchases.map(purchase => (
                      <div key={purchase["ID"] || purchase.id} className="flex-none w-[350px] snap-start">
                        <PropertyPurchaseCard
                          purchase={purchase}
                          onEdit={handleEdit}
                          onViewDetails={setViewingPurchase}
                          onDelete={handleDelete}
                          getPropertyName={getPropertyName}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </div>

      {/* Modals */}
      {showForm && (
        <PropertyPurchaseForm
          purchase={editingPurchase}
          properties={properties}
          currentUser={user}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingPurchase(null);
          }}
          hideCard={true}
        />
      )}

      {viewingPurchase && (
        <PropertyPurchaseDetailModal
          purchase={viewingPurchase}
          getPropertyName={getPropertyName}
          onClose={() => setViewingPurchase(null)}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
