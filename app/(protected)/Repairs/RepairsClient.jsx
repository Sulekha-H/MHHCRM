import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient"; // Updated import path
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Download, Wrench, AlertCircle, Filter, List } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import RepairFormSupabase from "../components/repairs/RepairForm";
import RepairCard from "../components/repairs/RepairCard";
import RepairDetailModal from "../components/repairs/RepairDetailModal"; // New import

export default function Repairs() { // Component name changed
  const [repairs, setRepairs] = useState([]);
  const [properties, setProperties] = useState([]);
  const [accommodations, setAccommodations] = useState([]);
  const [filteredRepairs, setFilteredRepairs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRepair, setEditingRepair] = useState(null);
  const [viewingRepair, setViewingRepair] = useState(null); // New state variable
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [user, setUser] = useState(null);
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [propertyFilter, setPropertyFilter] = useState("all");

  const filterRepairs = useCallback(() => {
    let filtered = repairs;

    // Filter by status tab - Handle both PostgreSQL format (with spaces) and base44 format
    if (activeTab !== "all") {
      filtered = filtered.filter(repair => {
        const status = (repair["Status"] || repair.status || "").toLowerCase().replace(/ /g, '_');
        return status === activeTab.toLowerCase().replace(/ /g, '_');
      });
    }

    // Filter by priority
    if (priorityFilter !== "all") {
      filtered = filtered.filter(repair => {
        const priority = (repair["Priority"] || repair.priority || "").toLowerCase();
        return priority === priorityFilter.toLowerCase();
      });
    }

    // Filter by property
    if (propertyFilter !== "all") {
      filtered = filtered.filter(repair => {
        const propertyId = repair["Property ID"] || repair.property_id;
        return propertyId === propertyFilter;
      });
    }

    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(repair => {
        const title = (repair["Title"] || repair.title || "").toLowerCase();
        const description = (repair["Description"] || repair.description || "").toLowerCase();
        const reportedBy = (repair["Reported By"] || repair.reported_by || "").toLowerCase();
        const contractor = (repair["Contractor"] || repair.contractor || "").toLowerCase();
        
        return title.includes(searchLower) ||
               description.includes(searchLower) ||
               reportedBy.includes(searchLower) ||
               contractor.includes(searchLower);
      });
    }

    setFilteredRepairs(filtered);
  }, [repairs, searchTerm, activeTab, priorityFilter, propertyFilter]);

  useEffect(() => {
    filterRepairs();
  }, [filterRepairs]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load current user
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('email', authUser.email)
          .single();
        
        setUser(userData);
      }

      // Load repairs - using PostgreSQL column names with spaces
      const { data: repairsData, error: repairsError } = await supabase
        .from('repairs')
        .select('*')
        .eq('"Deleted"', false)
        .order('"Reported Date"', { ascending: false });

      if (repairsError) throw repairsError;
      console.log(`✅ Loaded ${repairsData?.length || 0} repairs from Supabase`);

      // Load properties
      const { data: propertiesData, error: propertiesError } = await supabase
        .from('properties')
        .select('*');

      if (propertiesError) throw propertiesError;

      // Load accommodations
      const { data: accommodationsData, error: accommodationsError } = await supabase
        .from('accommodations')
        .select('*');

      if (accommodationsError) throw accommodationsError;

      setRepairs(repairsData || []);
      setProperties(propertiesData || []);
      setAccommodations(accommodationsData || []);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (repairData) => {
    try {
      console.log("📝 Received repair data:", repairData);
      
      // Transform enum values to match database check constraints
      const transformFiixitValue = (val) => {
        const map = { 'yes': 'Yes', 'no': 'No', 'n_a': 'N/A' };
        return map[val] || val;
      };
      
      const transformInvoicePaymentStatus = (val) => {
        const map = { 
          'unpaid': 'Unpaid', 
          'paid': 'Paid', 
          'partially_paid': 'Partially Paid' 
        };
        return map[val] || val;
      };
      
      const transformPriority = (val) => {
        const map = {
          'low': 'Low',
          'medium': 'Medium',
          'high': 'High',
          'urgent': 'Urgent',
          'emergency': 'Emergency'
        };
        return map[val] || val;
      };
      
      const transformRepairType = (val) => {
        const map = {
          'plumbing': 'Plumbing',
          'electrical': 'Electrical',
          'heating': 'Heating',
          'decoration': 'Decoration',
          'appliance': 'Appliance',
          'structural': 'Structural',
          'security': 'Security',
          'other': 'Other'
        };
        return map[val] || val;
      };
      
      const transformStatus = (val) => {
        const map = {
          'reported': 'Reported',
          'assessed': 'Assessed',
          'scheduled': 'Scheduled',
          'in_progress': 'In Progress',
          'completed': 'Completed',
          'cancelled': 'Cancelled'
        };
        return map[val] || val;
      };
      
      const transformReportedByType = (val) => {
        const map = {
          'staff': 'Staff',
          'support_worker': 'Support Worker',
          'tenant': 'Tenant'
        };
        return map[val] || val;
      };
      
      const transformCommonArea = (val) => {
        if (!val) return null;
        const map = {
          'general_property': 'General Property',
          'communal_kitchen': 'Communal Kitchen',
          'communal_bathroom': 'Communal Bathroom',
          'hall_way': 'Hall Way',
          'front_door': 'Front Door',
          'back_door': 'Back Door',
          'front_garden': 'Front Garden',
          'back_garden': 'Back Garden'
        };
        return map[val] || val;
      };
      
      // Convert from PascalCase_Underscore to "Space Separated" format for Supabase
      const formattedRepairData = {
        "Title": repairData.Title,
        "Property ID": repairData.Property_Id,
        "Accommodation ID": repairData.Accommodation_Id || null,
        "Common Area": transformCommonArea(repairData.Common_Area),
        "Repair Type": transformRepairType(repairData.Repair_Type),
        "Priority": transformPriority(repairData.Priority),
        "Status": transformStatus(repairData.Status),
        "Description": repairData.Description || null,
        "Reported By": repairData.Reported_By,
        "Reported By Type": transformReportedByType(repairData.Reported_By_Type),
        "Logged By": repairData.Logged_By || null,
        "Reported on Fiixit": transformFiixitValue(repairData.Reported_On_Fiixit),
        "Fiixit Updated": transformFiixitValue(repairData.Fiixit_Updated),
        "Reported Date": repairData.Reported_Date,
        "Assessed Date": repairData.Assessed_Date || null,
        "Scheduled Date": repairData.Scheduled_Date || null,
        "In Progress Date": repairData.In_Progress_Date || null,
        "Completed Date": repairData.Completed_Date || null,
        "Date Fixed": repairData.Date_Fixed || null,
        "Is Cancelled": repairData.Is_Cancelled,
        "Cancellation Reason": repairData.Cancellation_Reason || null,
        "Cancelled Date": repairData.Cancelled_Date || null,
        "Contractor": repairData.Contractor || null,
        "Contractor Contact": repairData.Contractor_Contact || null,
        "Estimated Cost": repairData.Estimated_Cost,
        "Invoice Not Applicable": repairData.Invoice_Not_Applicable,
        "Invoice Received Date": repairData.Invoice_Received_Date || null,
        "Invoice Received From": repairData.Invoice_Received_From || null,
        "Invoice Amount": repairData.Invoice_Amount,
        "Payment Due Date": repairData.Payment_Due_Date || null,
        "Date Invoice Paid": repairData.Date_Invoice_Paid || null,
        "Invoice Number": repairData.Invoice_Number || null,
        "Invoice Payment Status": transformInvoicePaymentStatus(repairData.Invoice_Payment_Status),
        "Invoice File URL": repairData.Invoice_File_Url || null,
        "Notes": repairData.Notes || null,
        "Images": repairData.Images || [],
        "Updated Date": repairData.Updated_Date
      };

      if (editingRepair) {
        const { error } = await supabase
          .from('repairs')
          .update(formattedRepairData)
          .eq('"ID"', editingRepair["ID"] || editingRepair.id);
        
        if (error) throw error;
        console.log("✅ Repair updated successfully");
      } else {
        // Generate UUID and add Created Date for new repair
        formattedRepairData.ID = crypto.randomUUID();
        formattedRepairData["Created Date"] = new Date().toISOString();
        
        console.log("📤 Sending to Supabase:", formattedRepairData);
        
        const { error } = await supabase
          .from('repairs')
          .insert([formattedRepairData]);
        
        if (error) throw error;
        console.log("✅ Repair created successfully");
      }
      
      setShowForm(false);
      setEditingRepair(null);
      loadData();
    } catch (error) {
      console.error("Error saving repair:", error);
      alert("Error saving repair: " + error.message);
    }
  };

  const handleEdit = (repair) => {
    // Convert PostgreSQL format to form format (lowercase with underscores)
    const formattedRepair = {
      id: repair["ID"] || repair.id,
      title: repair["Title"] || repair.title,
      property_id: repair["Property ID"] || repair.property_id,
      accommodation_id: repair["Accommodation ID"] || repair.accommodation_id,
      common_area: repair["Common Area"] || repair.common_area,
      repair_type: repair["Repair Type"] || repair.repair_type,
      priority: repair["Priority"] || repair.priority,
      status: repair["Status"] || repair.status,
      description: repair["Description"] || repair.description,
      reported_by: repair["Reported By"] || repair.reported_by,
      reported_by_type: repair["Reported By Type"] || repair.reported_by_type,
      logged_by: repair["Logged By"] || repair.logged_by,
      reported_on_fiixit: repair["Reported on Fiixit"] || repair.reported_on_fiixit,
      fiixit_updated: repair["Fiixit Updated"] || repair.fiixit_updated,
      reported_date: repair["Reported Date"] || repair.reported_date,
      assessed_date: repair["Assessed Date"] || repair.assessed_date,
      scheduled_date: repair["Scheduled Date"] || repair.scheduled_date,
      in_progress_date: repair["In Progress Date"] || repair.in_progress_date,
      completed_date: repair["Completed Date"] || repair.completed_date,
      date_fixed: repair["Date Fixed"] || repair.date_fixed,
      is_cancelled: repair["Is Cancelled"] || repair.is_cancelled,
      cancellation_reason: repair["Cancellation Reason"] || repair.cancellation_reason,
      cancelled_date: repair["Cancelled Date"] || repair.cancelled_date,
      contractor: repair["Contractor"] || repair.contractor,
      contractor_contact: repair["Contractor Contact"] || repair.contractor_contact,
      estimated_cost: repair["Estimated Cost"] || repair.estimated_cost,
      invoice_not_applicable: repair["Invoice Not Applicable"] || repair.invoice_not_applicable,
      invoice_received_date: repair["Invoice Received Date"] || repair.invoice_received_date,
      invoice_received_from: repair["Invoice Received From"] || repair.invoice_received_from,
      invoice_amount: repair["Invoice Amount"] || repair.invoice_amount,
      payment_due_date: repair["Payment Due Date"] || repair.payment_due_date,
      date_invoice_paid: repair["Date Invoice Paid"] || repair.date_invoice_paid,
      invoice_number: repair["Invoice Number"] || repair.invoice_number,
      invoice_payment_status: repair["Invoice Payment Status"] || repair.invoice_payment_status,
      invoice_file_url: repair["Invoice File URL"] || repair.invoice_file_url,
      notes: repair["Notes"] || repair.notes,
      images: repair["Images"] || repair.images
    };
    
    setEditingRepair(formattedRepair);
    setShowForm(true);
    setViewingRepair(null); // Close detail modal when editing
  };

  const handleViewDetails = (repair) => {
    // Convert PostgreSQL format to form format for viewing
    const formattedRepair = {
      id: repair["ID"] || repair.id,
      title: repair["Title"] || repair.title,
      property_id: repair["Property ID"] || repair.property_id,
      accommodation_id: repair["Accommodation ID"] || repair.accommodation_id,
      common_area: repair["Common Area"] || repair.common_area,
      repair_type: repair["Repair Type"] || repair.repair_type,
      priority: repair["Priority"] || repair.priority,
      status: repair["Status"] || repair.status,
      description: repair["Description"] || repair.description,
      reported_by: repair["Reported By"] || repair.reported_by,
      reported_by_type: repair["Reported By Type"] || repair.reported_by_type,
      logged_by: repair["Logged By"] || repair.logged_by,
      reported_on_fiixit: repair["Reported on Fiixit"] || repair.reported_on_fiixit,
      fiixit_updated: repair["Fiixit Updated"] || repair.fiixit_updated,
      reported_date: repair["Reported Date"] || repair.reported_date,
      assessed_date: repair["Assessed Date"] || repair.assessed_date,
      scheduled_date: repair["Scheduled Date"] || repair.scheduled_date,
      in_progress_date: repair["In Progress Date"] || repair.in_progress_date,
      completed_date: repair["Completed Date"] || repair.completed_date,
      date_fixed: repair["Date Fixed"] || repair.date_fixed,
      is_cancelled: repair["Is Cancelled"] || repair.is_cancelled,
      cancellation_reason: repair["Cancellation Reason"] || repair.cancellation_reason,
      cancelled_date: repair["Cancelled Date"] || repair.cancelled_date,
      contractor: repair["Contractor"] || repair.contractor,
      contractor_contact: repair["Contractor Contact"] || repair.contractor_contact,
      estimated_cost: repair["Estimated Cost"] || repair.estimated_cost,
      invoice_not_applicable: repair["Invoice Not Applicable"] || repair.invoice_not_applicable,
      invoice_received_date: repair["Invoice Received Date"] || repair.invoice_received_date,
      invoice_received_from: repair["Invoice Received From"] || repair.invoice_received_from,
      invoice_amount: repair["Invoice Amount"] || repair.invoice_amount,
      payment_due_date: repair["Payment Due Date"] || repair.payment_due_date,
      date_invoice_paid: repair["Date Invoice Paid"] || repair.date_invoice_paid,
      invoice_number: repair["Invoice Number"] || repair.invoice_number,
      invoice_payment_status: repair["Invoice Payment Status"] || repair.invoice_payment_status,
      invoice_file_url: repair["Invoice File URL"] || repair.invoice_file_url,
      notes: repair["Notes"] || repair.notes,
      images: repair["Images"] || repair.images
    };
    
    setViewingRepair(formattedRepair);
    setShowForm(false);
    setEditingRepair(null);
  };

  const handleDelete = async (repair) => {
    if (window.confirm(`Are you sure you want to delete this repair? This action cannot be undone.`)) {
      try {
        const repairId = repair["ID"] || repair.id;
        
        // Soft delete by updating deleted fields
        const { error } = await supabase
          .from('repairs')
          .update({
            "Deleted": true,
            "Deleted Date": new Date().toISOString(),
            "Deleted By": user?.email || "unknown"
          })
          .eq('"ID"', repairId);
        
        if (error) throw error;
        
        console.log(`✅ Repair ${repairId} soft deleted successfully`);
        
        // Close detail modal if it's open and the deleted repair is being viewed
        if (viewingRepair && (viewingRepair.id === repairId || viewingRepair["ID"] === repairId)) {
          setViewingRepair(null);
        }
        
        loadData();
      } catch (error) {
        console.error("Error deleting repair:", error);
        alert("Error deleting repair: " + error.message);
      }
    }
  };

  const exportToCSV = () => {
    const formatDate = (dateString) => {
      if (!dateString) return "";
      try {
        return format(new Date(dateString), 'yyyy-MM-dd');
      } catch {
        return dateString;
      }
    };

    const formatDateTime = (dateString) => {
      if (!dateString) return "";
      try {
        return format(new Date(dateString), 'yyyy-MM-dd HH:mm:ss');
      } catch {
        return dateString;
      }
    };

    const formatImages = (images) => {
      if (!images || images.length === 0) return "[]";
      return JSON.stringify(images);
    };

    const headers = [
      "ID",
      "Title",
      "Property ID",
      "Accommodation ID",
      "Common Area",
      "Repair Type",
      "Priority",
      "Status",
      "Description",
      "Reported By",
      "Reported By Type",
      "Logged By",
      "Reported on Fiixit",
      "Fiixit Updated",
      "Reported Date",
      "Assessed Date",
      "Scheduled Date",
      "In Progress Date",
      "Completed Date",
      "Date Fixed",
      "Is Cancelled",
      "Cancellation Reason",
      "Cancelled Date",
      "Contractor",
      "Contractor Contact",
      "Estimated Cost",
      "Invoice Not Applicable",
      "Invoice Received Date",
      "Invoice Received From",
      "Invoice Amount",
      "Payment Due Date",
      "Date Invoice Paid",
      "Invoice Number",
      "Invoice Payment Status",
      "Invoice File URL",
      "Notes",
      "Images",
      "Created Date",
      "Updated Date",
      "Created By",
      "Deleted",
      "Deleted Date",
      "Deleted By"
    ];

    const rows = filteredRepairs.map(repair => [
      repair["ID"] || repair.id || "",
      repair["Title"] || repair.title || "",
      repair["Property ID"] || repair.property_id || "",
      repair["Accommodation ID"] || repair.accommodation_id || "",
      repair["Common Area"] || repair.common_area || "",
      repair["Repair Type"] || repair.repair_type || "",
      repair["Priority"] || repair.priority || "",
      repair["Status"] || repair.status || "",
      repair["Description"] || repair.description || "",
      repair["Reported By"] || repair.reported_by || "",
      repair["Reported By Type"] || repair.reported_by_type || "",
      repair["Logged By"] || repair.logged_by || "",
      repair["Reported on Fiixit"] || repair.reported_on_fiixit || "",
      repair["Fiixit Updated"] || repair.fiixit_updated || "",
      formatDateTime(repair["Reported Date"] || repair.reported_date),
      formatDateTime(repair["Assessed Date"] || repair.assessed_date),
      formatDateTime(repair["Scheduled Date"] || repair.scheduled_date),
      formatDateTime(repair["In Progress Date"] || repair.in_progress_date),
      formatDateTime(repair["Completed Date"] || repair.completed_date),
      formatDateTime(repair["Date Fixed"] || repair.date_fixed),
      (repair["Is Cancelled"] || repair.is_cancelled) ? "Yes" : "No",
      repair["Cancellation Reason"] || repair.cancellation_reason || "",
      formatDateTime(repair["Cancelled Date"] || repair.cancelled_date),
      repair["Contractor"] || repair.contractor || "",
      repair["Contractor Contact"] || repair.contractor_contact || "",
      repair["Estimated Cost"] || repair.estimated_cost || "",
      (repair["Invoice Not Applicable"] || repair.invoice_not_applicable) ? "Yes" : "No",
      formatDate(repair["Invoice Received Date"] || repair.invoice_received_date),
      repair["Invoice Received From"] || repair.invoice_received_from || "",
      repair["Invoice Amount"] || repair.invoice_amount || "",
      formatDate(repair["Payment Due Date"] || repair.payment_due_date),
      formatDate(repair["Date Invoice Paid"] || repair.date_invoice_paid),
      repair["Invoice Number"] || repair.invoice_number || "",
      repair["Invoice Payment Status"] || repair.invoice_payment_status || "",
      repair["Invoice File URL"] || repair.invoice_file_url || "",
      repair["Notes"] || repair.notes || "",
      formatImages(repair["Images"] || repair.images),
      formatDateTime(repair["Created Date"] || repair.created_date),
      formatDateTime(repair["Updated Date"] || repair.updated_date),
      repair["Created By"] || repair.created_by || "",
      (repair["Deleted"] || repair.deleted) ? "Yes" : "No",
      formatDateTime(repair["Deleted Date"] || repair.deleted_date),
      repair["Deleted By"] || repair.deleted_by || ""
    ]);

    const escapeCSV = (value) => {
      if (value === null || value === undefined) return '';
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    const csvContent = [
      headers.map(escapeCSV).join(','),
      ...rows.map(row => row.map(escapeCSV).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `repairs_export_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: "bg-green-100 text-green-800 border-green-200",
      medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
      high: "bg-orange-100 text-orange-800 border-orange-200",
      urgent: "bg-red-100 text-red-800 border-red-200",
      emergency: "bg-purple-100 text-purple-800 border-purple-200"
    };
    return colors[priority?.toLowerCase()] || colors.medium;
  };

  const getStatusColor = (status) => {
    const colors = {
      reported: "bg-yellow-100 text-yellow-800 border-yellow-200",
      assessed: "bg-blue-100 text-blue-800 border-blue-200",
      scheduled: "bg-indigo-100 text-indigo-800 border-indigo-200",
      in_progress: "bg-orange-100 text-orange-800 border-orange-200",
      completed: "bg-green-100 text-green-800 border-green-200",
      cancelled: "bg-gray-100 text-gray-800 border-gray-200"
    };
    return colors[status?.toLowerCase().replace(/ /g, '_')] || colors.reported;
  };

  const getPropertyName = (propertyId) => {
    if (!propertyId) return "N/A";
    const property = properties.find(p => p.id === propertyId || p.ID === propertyId);
    return property?.name || property?.Name || "Unknown Property";
  };

  const getAccommodationUnit = (accommodationId) => {
    if (!accommodationId) return null;
    const accommodation = accommodations.find(a => a.id === accommodationId || a.ID === accommodationId);
    return accommodation?.room_number || accommodation?.["Room Number"] || null;
  };

  const getAccommodationName = (repair) => {
    const commonAreas = {
      "Communal Kitchen": "Communal Kitchen",
      "Communal Bathroom": "Communal Bathroom",
      "Hall Way": "Hall Way",
      "Front Door": "Front Door",
      "Back Door": "Back Door",
      "Front Garden": "Front Garden",
      "Back Garden": "Back Garden",
      "General Property": "General Property",
      "communal_kitchen": "Communal Kitchen",
      "communal_bathroom": "Communal Bathroom",
      "hall_way": "Hall Way",
      "front_door": "Front Door",
      "back_door": "Back Door",
      "front_garden": "Front Garden",
      "back_garden": "Back Garden",
      "general_property": "General Property"
    };
    
    const commonArea = repair["Common Area"] || repair.common_area;
    if (commonArea) {
      return commonAreas[commonArea] || commonArea;
    }
    
    const accommodationId = repair["Accommodation ID"] || repair.accommodation_id;
    if (accommodationId) {
      const accommodation = accommodations.find(a => 
        (a.id === accommodationId || a.ID === accommodationId || a["ID"] === accommodationId)
      );
      if (accommodation) {
        return accommodation["Room Number"] || accommodation.room_number || "Unknown Room";
      }
    }
    
    return "General Property";
  };

  const getStatusCounts = () => {
    return {
      all: repairs.length,
      reported: repairs.filter(r => (r["Status"] || r.status || "").toLowerCase() === "reported").length,
      assessed: repairs.filter(r => (r["Status"] || r.status || "").toLowerCase() === "assessed").length,
      scheduled: repairs.filter(r => (r["Status"] || r.status || "").toLowerCase() === "scheduled").length,
      in_progress: repairs.filter(r => (r["Status"] || r.status || "").toLowerCase().replace(/ /g, '_') === "in_progress").length,
      completed: repairs.filter(r => (r["Status"] || r.status || "").toLowerCase() === "completed").length,
      cancelled: repairs.filter(r => (r["Status"] || r.status || "").toLowerCase() === "cancelled").length,
    };
  };

  const statusCounts = getStatusCounts();

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
            <Wrench className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Repairs</h1>
            <p className="text-sm text-slate-600">Track and manage property repairs</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={exportToCSV}
            variant="outline"
            className="flex items-center gap-2"
            disabled={loading || filteredRepairs.length === 0}
          >
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button
            onClick={() => setShowForm(true)}
            className="bg-orange-600 hover:bg-orange-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Report Repair
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search repairs by title, description, type, or contractor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="All Priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="emergency">Emergency</SelectItem>
              </SelectContent>
            </Select>
            <Select value={propertyFilter} onValueChange={setPropertyFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="All Properties" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Properties</SelectItem>
                {properties.map((property) => (
                  <SelectItem key={property.ID || property.id} value={property.ID || property.id}>
                    {property.Name || property.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon">
              <List className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Status Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-7 lg:w-auto lg:inline-flex">
          <TabsTrigger value="all" className="flex flex-col gap-1 h-auto py-2">
            <span className="text-xs font-normal text-slate-500">All</span>
            <span className="text-lg font-semibold">{statusCounts.all}</span>
          </TabsTrigger>
          <TabsTrigger value="reported" className="flex flex-col gap-1 h-auto py-2">
            <span className="text-xs font-normal text-slate-500">Reported</span>
            <span className="text-lg font-semibold">{statusCounts.reported}</span>
          </TabsTrigger>
          <TabsTrigger value="assessed" className="flex flex-col gap-1 h-auto py-2">
            <span className="text-xs font-normal text-slate-500">Assessed</span>
            <span className="text-lg font-semibold">{statusCounts.assessed}</span>
          </TabsTrigger>
          <TabsTrigger value="scheduled" className="flex flex-col gap-1 h-auto py-2">
            <span className="text-xs font-normal text-slate-500">Scheduled</span>
            <span className="text-lg font-semibold">{statusCounts.scheduled}</span>
          </TabsTrigger>
          <TabsTrigger value="in_progress" className="flex flex-col gap-1 h-auto py-2">
            <span className="text-xs font-normal text-slate-500">In Progress</span>
            <span className="text-lg font-semibold">{statusCounts.in_progress}</span>
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex flex-col gap-1 h-auto py-2">
            <span className="text-xs font-normal text-slate-500">Completed</span>
            <span className="text-lg font-semibold">{statusCounts.completed}</span>
          </TabsTrigger>
          <TabsTrigger value="cancelled" className="flex flex-col gap-1 h-auto py-2">
            <span className="text-xs font-normal text-slate-500">Cancelled</span>
            <span className="text-lg font-semibold">{statusCounts.cancelled}</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Repair Form */}
      {showForm && (
        <RepairFormSupabase
          repair={editingRepair}
          properties={properties}
          accommodations={accommodations}
          currentUser={user}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingRepair(null);
          }}
        />
      )}

      {/* Repair Detail Modal */}
      {viewingRepair && (
        <RepairDetailModal
          repair={viewingRepair}
          getAccommodationName={() => getAccommodationName(viewingRepair)}
          getPropertyName={getPropertyName}
          onClose={() => setViewingRepair(null)}
          onEdit={(repair) => {
            setViewingRepair(null); // Close detail modal
            handleEdit(repair); // Open edit form
          }}
          onDelete={handleDelete}
        />
      )}

      {/* Repairs Grid */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-slate-500">Loading repairs...</p>
        </div>
      ) : filteredRepairs.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Wrench className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No repairs found</h3>
            <p className="text-slate-500 mb-4">
              {searchTerm ? "Try adjusting your search terms" : "No repairs have been reported yet"}
            </p>
            {!searchTerm && (
              <Button onClick={() => setShowForm(true)} className="bg-orange-600 hover:bg-orange-700">
                <Plus className="w-4 h-4 mr-2" />
                Report First Repair
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredRepairs.map((repair) => (
            <RepairCard
              key={repair["ID"] || repair.id}
              repair={repair}
              onEdit={handleEdit}
              onViewDetails={handleViewDetails}
              onDelete={handleDelete}
              getPriorityColor={getPriorityColor}
              getStatusColor={getStatusColor}
              getPropertyName={getPropertyName}
              getAccommodationName={() => getAccommodationName(repair)}
            />
          ))}
        </div>
      )}
    </div>
  );
}