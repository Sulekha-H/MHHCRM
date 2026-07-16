"use client"

import React, { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { useClerkSupabaseClient } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Search,
  Download,
  Calendar as CalendarIcon,
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

import WorkBookingForm from "@/components/work-bookings/WorkBookingForm";
import WorkBookingList from "@/components/work-bookings/WorkBookingList";

export default function WorkBookingsPage() {
  const { user } = useUser();
  const supabase = useClerkSupabaseClient();

  const [loading, setLoading] = useState(true);
  const [providers, setProviders] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [properties, setProperties] = useState([]);
  const [accommodations, setAccommodations] = useState([]);

  const [showBookingForm, setShowBookingForm] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [propertyFilter, setPropertyFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");

  const canEdit = isOfficeStaff(user);

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

  const handleBookingSubmit = async (formData) => {
    try {
      // Validate that provider is not unavailable on selected date
      const provider = providers.find(p => (p.ID || p.id) === formData.service_provider_id);
      if (provider) {
        let unavail = provider["Unavailable Dates"] || provider.unavailable_dates || [];
        if (typeof unavail === 'string') {
          try {
            unavail = JSON.parse(unavail);
          } catch (e) {
            unavail = unavail.split(',').map(d => d.trim()).filter(Boolean);
          }
        }
        const targetDate = formData.date.split('T')[0];
        if (Array.isArray(unavail) && unavail.some(d => d.split('T')[0] === targetDate)) {
          alert(`Error: ${provider.Name || "Selected provider"} is marked as unavailable on ${formData.date}.`);
          return;
        }
      }

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
        "Invoice File URL": formData.invoice_file_url || null,
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
    const headers = ["Date", "Provider", "Property", "Area", "Duration", "Total Pay", "Payment Status", "Work Status", "Invoice Number", "Invoice Document Link"];

    const escapeCSV = (val) => {
      if (val === null || val === undefined) return '';
      const stringVal = String(val);
      if (stringVal.includes(',') || stringVal.includes('"') || stringVal.includes('\n')) {
        return `"${stringVal.replace(/"/g, '""')}"`;
      }
      return stringVal;
    };

    const rows = filteredBookings.map(b => {
      const p = providers.find(pr => (pr.ID || pr.id) === (b["Service Provider ID"] || b.service_provider_id));
      const prop = properties.find(pr => (pr.ID || pr.id) === (b["Property ID"] || b.property_id));
      return [
        escapeCSV(b.Date || b.date),
        escapeCSV(p ? p.Name || p.name : "Unknown"),
        escapeCSV(prop ? prop.Name || prop.name : "Unknown"),
        escapeCSV(b.Area || b.area),
        escapeCSV(`${b["Duration Hours"] || 0}h ${b["Duration Minutes"] || 0}m`),
        escapeCSV(b["Total Pay"] || 0),
        escapeCSV(b["Payment Status"] || "Pending"),
        escapeCSV(b["Work Status"] || "Scheduled"),
        escapeCSV(b["Invoice Number"] || b.invoice_number || ""),
        escapeCSV(b["Invoice File URL"] || b.invoice_file_url || "")
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
            <CalendarIcon className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Work Bookings</h1>
            <p className="text-sm text-slate-600">Track logs and payments for service work</p>
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
              onClick={() => setShowBookingForm(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Booking
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search by provider or work..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={propertyFilter} onValueChange={setPropertyFilter}>
          <SelectTrigger className="w-full md:w-[200px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Property" />
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
        <Select value={paymentFilter} onValueChange={setPaymentFilter}>
          <SelectTrigger className="w-full md:w-[150px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Payment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Paid">Paid</SelectItem>
          </SelectContent>
        </Select>
      </div>

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

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <Loader2 className="w-10 h-10 animate-spin mb-4" />
          <p>Loading bookings...</p>
        </div>
      ) : (
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
    </div>
  );
}
