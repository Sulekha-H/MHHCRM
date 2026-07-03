"use client"

import React, { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { useClerkSupabaseClient } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Search,
  Download,
  Calendar as CalendarIcon,
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

import ServiceProviderForm from "@/components/work-bookings/ServiceProviderForm";
import ServiceProviderList from "@/components/work-bookings/ServiceProviderList";
import WorkBookingForm from "@/components/work-bookings/WorkBookingForm";
import WorkBookingList from "@/components/work-bookings/WorkBookingList";

export default function WorkBookingsPage() {
  const { user } = useUser();
  const supabase = useClerkSupabaseClient();

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("bookings");

  const [providers, setProviders] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [properties, setProperties] = useState([]);
  const [accommodations, setAccommodations] = useState([]);

  const [showProviderForm, setShowProviderForm] = useState(false);
  const [editingProvider, setEditingProvider] = useState(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [propertyFilter, setPropertyFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");

  const isOfficeStaff = useCallback(() => {
    if (!user?.emailAddresses?.[0]?.emailAddress) return false;
    const officeStaff = [
      'burton@myhopehousing.org.uk',
      'leticia@myhopehousing.org.uk',
      'amaani@myhopehousing.org.uk',
      'sulekha@myhopehousing.org.uk'
    ].map(email => email.toLowerCase());
    const userEmail = user.emailAddresses[0].emailAddress?.trim().toLowerCase();
    return officeStaff.includes(userEmail);
  }, [user]);

  const canEdit = isOfficeStaff();

  const fetchData = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const [
        { data: providersData, error: providersError },
        { data: bookingsData, error: bookingsError },
        { data: propertiesData, error: propertiesError },
        { data: accommodationsData, error: accommodationsError }
      ] = await Promise.all([
        supabase.from('service_providers').select('*').eq('Deleted', false).order('Name'),
        supabase.from('work_bookings').select('*').eq('Deleted', false).order('Date', { ascending: false }),
        supabase.from('properties').select('*').eq('Deleted', false).order('Name'),
        supabase.from('accommodations').select('*').eq('Deleted', false)
      ]);

      if (providersError) throw providersError;
      if (bookingsError) throw bookingsError;
      if (propertiesError) throw propertiesError;
      if (accommodationsError) throw accommodationsError;

      setProviders(providersData || []);
      setBookings(bookingsData || []);
      setProperties(propertiesData || []);
      setAccommodations(accommodationsData || []);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle Provider Submission
  const handleProviderSubmit = async (formData) => {
    try {
      const data = {
        "Name": formData.name,
        "Category": formData.category,
        "Contact Number": formData.contact_number,
        "Email": formData.email,
        "Default Hourly Rate": formData.default_hourly_rate || 0,
        "Notes": formData.notes,
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
      setShowProviderForm(false);
      setEditingProvider(null);
      fetchData();
    } catch (err) {
      alert("Error saving provider: " + err.message);
    }
  };

  // Handle Booking Submission
  const handleBookingSubmit = async (formData) => {
    try {
      const data = {
        "Service Provider ID": formData.service_provider_id,
        "Property ID": formData.property_id,
        "Accommodation ID": formData.accommodation_id,
        "Area": formData.area,
        "Date": formData.date,
        "Duration Hours": parseInt(formData.duration_hours || 0),
        "Duration Minutes": parseInt(formData.duration_minutes || 0),
        "Hourly Rate": formData.hourly_rate || 0,
        "Total Pay": formData.total_pay || 0,
        "Payment Status": formData.payment_status,
        "Work Status": formData.work_status,
        "Invoice Number": formData.invoice_number,
        "Description of Work": formData.description_of_work,
        "Notes": formData.notes,
        "Logged By": user.fullName || user.username,
        "Updated Date": new Date().toISOString()
      };

      if (editingBooking) {
        const { error } = await supabase
          .from('work_bookings')
          .update(data)
          .eq('ID', editingBooking.ID || editingBooking.id);
        if (error) throw error;

        logActivity(supabase, {
          userName: user.fullName || "Unknown",
          userEmail: user.primaryEmailAddress?.emailAddress,
          actionType: ACTIONS.UPDATE,
          entityType: ENTITIES.WORK_BOOKING,
          entityId: editingBooking.ID || editingBooking.id,
          description: `Updated work booking for ${data.Date}`
        });
      } else {
        const { data: newBooking, error } = await supabase
          .from('work_bookings')
          .insert([{ ...data, "ID": crypto.randomUUID(), "Created Date": new Date().toISOString() }])
          .select();
        if (error) throw error;

        logActivity(supabase, {
          userName: user.fullName || "Unknown",
          userEmail: user.primaryEmailAddress?.emailAddress,
          actionType: ACTIONS.CREATE,
          entityType: ENTITIES.WORK_BOOKING,
          entityId: newBooking[0].ID,
          description: `Created work booking for ${data.Date}`
        });
      }
      setShowBookingForm(false);
      setEditingBooking(null);
      fetchData();
    } catch (err) {
      alert("Error saving booking: " + err.message);
    }
  };

  const handleDeleteProvider = async (provider) => {
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

  const handleDeleteBooking = async (booking) => {
    if (!window.confirm(`Are you sure you want to delete this booking?`)) return;
    try {
      const { error } = await supabase
        .from('work_bookings')
        .update({ Deleted: true, "Deleted Date": new Date().toISOString(), "Deleted By": user.primaryEmailAddress?.emailAddress })
        .eq('ID', booking.ID || booking.id);
      if (error) throw error;
      fetchData();
    } catch (err) {
      alert("Error deleting booking: " + err.message);
    }
  };

  // Filter Logic
  const filteredProviders = providers.filter(p => {
    const matchesSearch = (p.Name || p.name || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || (p.Category || p.category) === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const filteredBookings = bookings.filter(b => {
    const provider = providers.find(p => (p.ID || p.id) === (b["Service Provider ID"] || b.service_provider_id));
    const providerName = provider ? (provider.Name || provider.name || "") : "";
    const matchesSearch = providerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (b["Description of Work"] || b.description_of_work || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProperty = propertyFilter === "all" || (b["Property ID"] || b.property_id) === propertyFilter;
    const matchesPayment = paymentFilter === "all" || (b["Payment Status"] || b.payment_status) === paymentFilter;
    return matchesSearch && matchesProperty && matchesPayment;
  });

  const exportToCSV = () => {
    // Basic CSV export logic
    const headers = ["Date", "Provider", "Property", "Area", "Duration", "Total Pay", "Payment Status", "Work Status"];
    const rows = filteredBookings.map(b => {
      const p = providers.find(pr => (pr.ID || pr.id) === (b["Service Provider ID"] || b.service_provider_id));
      const prop = properties.find(pr => (pr.ID || pr.id) === (b["Property ID"] || b.property_id));
      return [
        b.Date || b.date,
        p ? p.Name || p.name : "Unknown",
        prop ? prop.Name || prop.name : "Unknown",
        b.Area || b.area,
        `${b["Duration Hours"] || 0}h ${b["Duration Minutes"] || 0}m`,
        b["Total Pay"] || 0,
        b["Payment Status"] || "Pending",
        b["Work Status"] || "Scheduled"
      ];
    });

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `work_bookings_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
            <CalendarIcon className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Work Bookings</h1>
            <p className="text-sm text-slate-600">Manage cleaners, tradesmen, and gardeners</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={exportToCSV} disabled={loading || bookings.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          {canEdit && (
            <Button
              size="sm"
              className="bg-orange-600 hover:bg-orange-700 text-white"
              onClick={() => {
                if (activeTab === "bookings") setShowBookingForm(true);
                else setShowProviderForm(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              {activeTab === "bookings" ? "New Booking" : "Add Provider"}
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
          <TabsList className="bg-white border border-slate-200">
            <TabsTrigger value="bookings" className="data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700">
              <CalendarIcon className="w-4 h-4 mr-2" />
              Bookings
            </TabsTrigger>
            <TabsTrigger value="providers" className="data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700">
              <Users className="w-4 h-4 mr-2" />
              Service Providers
            </TabsTrigger>
          </TabsList>

          <div className="flex flex-1 w-full md:w-auto items-center gap-2 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder={activeTab === "bookings" ? "Search by provider or work..." : "Search by name..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            {activeTab === "bookings" ? (
              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger className="w-[130px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Payment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[130px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="Cleaner">Cleaner</SelectItem>
                  <SelectItem value="Tradesman">Tradesman</SelectItem>
                  <SelectItem value="Gardener">Gardener</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <Loader2 className="w-10 h-10 animate-spin mb-4" />
            <p>Loading data...</p>
          </div>
        )}

        {/* Bookings Tab */}
        <TabsContent value="bookings" className="m-0">
          {showBookingForm && (
            <WorkBookingForm
              booking={editingBooking}
              providers={providers}
              properties={properties}
              accommodations={accommodations}
              onSubmit={handleBookingSubmit}
              onCancel={() => { setShowBookingForm(false); setEditingBooking(null); }}
            />
          )}
          {!loading && (
            <WorkBookingList
              bookings={filteredBookings}
              providers={providers}
              properties={properties}
              accommodations={accommodations}
              onEdit={(b) => { setEditingBooking(b); setShowBookingForm(true); }}
              onDelete={handleDeleteBooking}
              canEdit={canEdit}
            />
          )}
        </TabsContent>

        {/* Providers Tab */}
        <TabsContent value="providers" className="m-0">
          {showProviderForm && (
            <ServiceProviderForm
              provider={editingProvider}
              onSubmit={handleProviderSubmit}
              onCancel={() => { setShowProviderForm(false); setEditingProvider(null); }}
            />
          )}
          {!loading && (
            <ServiceProviderList
              providers={filteredProviders}
              onEdit={(p) => { setEditingProvider(p); setShowProviderForm(true); }}
              onDelete={handleDeleteProvider}
              canEdit={canEdit}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
