"use client"

import { useUser } from "@clerk/nextjs";
import React, { useState, useEffect, useCallback } from "react";
import { useClerkSupabaseClient } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Download, Wrench, AlertCircle, Filter, List, RefreshCw } from "lucide-react";
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
import RepairFormSupabase from "@/components/repairs/RepairForm";
import RepairCard from "@/components/repairs/RepairCard";
import RepairDetailModal from "@/components/repairs/RepairDetailModal"; // New import
import { logActivity, ACTIONS, ENTITIES } from "@/lib/activityUtils";

export default function Repairs() { // Component name changed
  const supabase = useClerkSupabaseClient();
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
  const [activeMonthTab, setActiveMonthTab] = useState("all");
  const { user } = useUser();
  const client = useClerkSupabaseClient();
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [propertyFilter, setPropertyFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [isMigrating, setIsMigrating] = useState(false);
  const [groupBy, setGroupBy] = useState("status");

const fetchAllData = useCallback(async () => {
  if (!supabase) return;
  setLoading(true);
  try {
    const { data: repairsData, error: repairsError } = await supabase
      .from("repairs")
      .select("*")
      .or('"Deleted".is.null,"Deleted".eq.false')
      .order('"Created Date"', { ascending: false });
    if (repairsError) throw repairsError;
    setRepairs(repairsData || []);

    const { data: propertiesData, error: propertiesError } = await supabase
      .from('properties').select('*').or('"Deleted".is.null,"Deleted".eq.false');
    if (propertiesError) throw propertiesError;
    setProperties(propertiesData || []);

    const { data: accommodationsData, error: accommodationsError } = await supabase
      .from('accommodations').select('*').or('"Deleted".is.null,"Deleted".eq.false');
    if (accommodationsError) throw accommodationsError;
    setAccommodations(accommodationsData || []);

  } catch (err) {
    console.error("❌ Error loading data:", err);
    setRepairs([]);
    setProperties([]);
    setAccommodations([]);
  } finally {
    setLoading(false);
  }
}, [supabase, user]);

useEffect(() => {
  fetchAllData();
}, [fetchAllData]);

const handleMigrateSources = async () => {
  if (!supabase || isMigrating) return;
  if (!window.confirm("This will identify existing repairs from compliance checks and tag them correctly. Proceed?")) return;

  setIsMigrating(true);
  try {
    const { data: repairsData, error } = await supabase
      .from('repairs')
      .select('ID, Title')
      .or('"Deleted".is.null,"Deleted".eq.false');

    if (error) throw error;

    const complianceRepairs = (repairsData || []).filter(r =>
      r.Title && r.Title.startsWith("Repair from Compliance Check:")
    );

    console.log(`Found ${complianceRepairs.length} repairs to migrate.`);

    for (const repair of complianceRepairs) {
      await supabase
        .from('repairs')
        .update({ "Logged Via": "Compliance Check" })
        .eq('ID', repair.ID);
    }

    alert(`Successfully tagged ${complianceRepairs.length} repairs.`);
    fetchAllData();
  } catch (err) {
    console.error("Migration error:", err);
    alert("Error during migration: " + err.message);
  } finally {
    setIsMigrating(false);
  }
};

  
// Filter and sort repairs
const filterRepairs = useCallback(() => {
  let current = Array.isArray(repairs) ? [...repairs] : [];

  // Filter by status
  if (activeTab !== "all") {
    current = current.filter(repair => {
      const status = (repair["Status"] || repair.status || "")
        .toLowerCase()
        .replace(/ /g, "_");
      return status === activeTab.toLowerCase().replace(/ /g, "_");
    });
  }

  // Filter by priority
  if (priorityFilter !== "all") {
    current = current.filter(repair => {
      const priority = (repair["Priority"] || repair.priority || "").toLowerCase();
      return priority === priorityFilter.toLowerCase();
    });
  }

  // Filter by property
  if (propertyFilter !== "all") {
    current = current.filter(repair => {
      const propertyId = repair["Property ID"] || repair.property_id;
      return propertyId === propertyFilter;
    });
  }

  // Filter by source
  if (sourceFilter !== "all") {
    current = current.filter(repair => {
      const title = repair["Title"] || repair.title || "";
      const loggedVia = repair["Logged Via"] || repair.logged_via || (title.startsWith("Repair from Compliance Check:") ? "Compliance Check" : null);

      if (sourceFilter === "compliance") {
        return loggedVia === "Compliance Check";
      }
      if (sourceFilter === "manual") {
        return !loggedVia || loggedVia !== "Compliance Check";
      }
      return true;
    });
  }

  // Filter by search term
  if (searchTerm) {
    const search = searchTerm.toLowerCase();
    current = current.filter(repair => {
      const title = (repair["Title"] || repair.title || "").toLowerCase();
      const description = (repair["Description"] || repair.description || "").toLowerCase();
      const reportedBy = (repair["Reported By"] || repair.reported_by || "").toLowerCase();
      const contractor = (repair["Contractor"] || repair.contractor || "").toLowerCase();

      return title.includes(search) ||
             description.includes(search) ||
             reportedBy.includes(search) ||
             contractor.includes(search);
    });
  }

  // Filter by month
  if (activeMonthTab !== "all") {
    current = current.filter(repair => {
      const date = new Date(repair["Reported Date"] || repair.reported_date || repair["Created Date"] || repair.created_date);
      const monthKey = format(date, 'MMMM yyyy');
      return monthKey === activeMonthTab;
    });
  }

  setFilteredRepairs(current);
}, [repairs, searchTerm, activeTab, activeMonthTab, priorityFilter, propertyFilter, sourceFilter]);

// Apply filters whenever dependencies change
useEffect(() => {
  filterRepairs();
}, [filterRepairs]);

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
          'back_garden': 'Back Garden',
          'lounge': 'Lounge'
        };
        return map[val] || val;
      };
      
      // Convert from PascalCase_Underscore to "Space Separated" format for Supabase
      const formattedRepairData = {
        "Title": repairData.title,
        "Property ID": repairData.property_id,
        "Accommodation ID": repairData.accommodation_id || null,
        "Common Area": transformCommonArea(repairData.common_area),
        "Repair Type": transformRepairType(repairData.repair_type),
        "Priority": transformPriority(repairData.priority),
        "Status": transformStatus(repairData.status),
        "Description": repairData.description || null,
        "Reported By": repairData.reported_by,
        "Reported By Type": transformReportedByType(repairData.reported_by_type),
        "Logged By": repairData.logged_by || null,
        "Reported on Fiixit": transformFiixitValue(repairData.reported_on_fiixit),
        "Fiixit Updated": transformFiixitValue(repairData.fiixit_updated),
        "Reported Date": repairData.reported_date,
        "Assessed Date": repairData.assessed_date || null,
        "Scheduled Date": repairData.scheduled_date || null,
        "In Progress Date": repairData.in_progress_date || null,
        "Completed Date": repairData.completed_date || null,
        "Date Fixed": repairData.date_fixed || null,
        "Is Cancelled": repairData.is_cancelled,
        "Cancellation Reason": repairData.cancellation_reason || null,
        "Cancelled Date": repairData.cancelled_date || null,
        "Contractor": repairData.contractor || null,
        "Contractor Contact": repairData.contractor_contact || null,
        "Estimated Cost": repairData.estimated_cost,
        "Invoice Not Applicable": repairData.invoice_not_applicable,
        "Invoice Received Date": repairData.invoice_received_date || null,
        "Invoice Received From": repairData.invoice_received_from || null,
        "Invoice Amount": repairData.invoice_amount,
        "Payment Due Date": repairData.payment_due_date || null,
        "Date Invoice Paid": repairData.date_invoice_paid || null,
        "Invoice Number": repairData.invoice_number || null,
        "Invoice Payment Status": transformInvoicePaymentStatus(repairData.invoice_payment_status),
        "Invoice File URL": repairData.invoice_file_url || null,
        "Notes": repairData.notes || null,
        "Images": repairData.images || [],
        "Logged Via": repairData.logged_via || null,
        "Updated Date": repairData.updated_date
      };

      if (editingRepair) {
        const { error } = await supabase
          .from('repairs')
          .update(formattedRepairData)
          .eq('"ID"', editingRepair["ID"] || editingRepair.id);
        
        if (error) throw error;
        console.log("✅ Repair updated successfully");

        // Log activity
        logActivity(supabase, {
          userName: user.fullName || user.username || "Unknown",
          userEmail: user.primaryEmailAddress?.emailAddress,
          actionType: ACTIONS.UPDATE,
          entityType: ENTITIES.REPAIR,
          entityId: editingRepair["ID"] || editingRepair.id,
          description: `Updated repair: ${formattedRepairData["Title"]}`
        });
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

        // Log activity
        logActivity(supabase, {
          userName: user.fullName || user.username || "Unknown",
          userEmail: user.primaryEmailAddress?.emailAddress,
          actionType: ACTIONS.CREATE,
          entityType: ENTITIES.REPAIR,
          entityId: formattedRepairData.ID,
          description: `Created new repair: ${formattedRepairData["Title"]}`
        });
      }
      
      setShowForm(false);
      setEditingRepair(null);
      fetchAllData()
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
      images: repair["Images"] || repair.images,
      logged_via: repair["Logged Via"] || repair.logged_via
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
      images: repair["Images"] || repair.images,
      logged_via: repair["Logged Via"] || repair.logged_via
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
            "Deleted By": user?.primaryEmailAddress?.emailAddress || "unknown"
          })
          .eq('"ID"', repairId);
        
        if (error) throw error;
        
        console.log(`✅ Repair ${repairId} soft deleted successfully`);

        // Log activity
        logActivity(supabase, {
          userName: user.fullName || user.username || "Unknown",
          userEmail: user.primaryEmailAddress?.emailAddress,
          actionType: ACTIONS.DELETE,
          entityType: ENTITIES.REPAIR,
          entityId: repairId,
          description: `Soft deleted repair: ${repair["Title"] || repair.title}`
        });
        
        // Close detail modal if it's open and the deleted repair is being viewed
        if (viewingRepair && (viewingRepair.id === repairId || viewingRepair["ID"] === repairId)) {
          setViewingRepair(null);
        }
        
       fetchAllData()
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

    logActivity(supabase, {
      userName: user.fullName || user.username || "Unknown",
      userEmail: user.primaryEmailAddress?.emailAddress,
      actionType: ACTIONS.EXPORT,
      entityType: ENTITIES.REPAIR,
      description: `Exported repairs to CSV`
    });
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
      "Lounge": "Lounge",
      "General Property": "General Property",
      "communal_kitchen": "Communal Kitchen",
      "communal_bathroom": "Communal Bathroom",
      "hall_way": "Hall Way",
      "front_door": "Front Door",
      "back_door": "Back Door",
      "front_garden": "Front Garden",
      "back_garden": "Back Garden",
      "lounge": "Lounge",
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

  // Group repairs by status
  const groupedRepairs = filteredRepairs.reduce((acc, repair) => {
    const status = (repair["Status"] || repair.status || "reported").toString().trim().toLowerCase().replace(/ /g, '_');
    if (!acc[status]) {
      acc[status] = [];
    }
    acc[status].push(repair);
    return acc;
  }, {});

  // Group repairs by property
  const groupedByProperty = filteredRepairs.reduce((acc, repair) => {
    const propertyId = repair["Property ID"] || repair.property_id || "unknown";
    if (!acc[propertyId]) {
      acc[propertyId] = [];
    }
    acc[propertyId].push(repair);
    return acc;
  }, {});

  const statusLabels = {
    reported: "Reported",
    assessed: "Assessed",
    scheduled: "Scheduled",
    in_progress: "In Progress",
    completed: "Completed",
    cancelled: "Cancelled"
  };

  const currentYear = new Date().getFullYear();
  const monthsInYear = eachMonthOfInterval({
    start: startOfYear(new Date(currentYear, 0, 1)),
    end: endOfYear(new Date(currentYear, 11, 31))
  }).sort((a, b) => b - a); // Newest months first

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

      {/* Month Filter Tabs */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-slate-900">Filter by Month</h2>
        <Tabs value={activeMonthTab} onValueChange={setActiveMonthTab}>
          <TabsList className="flex h-auto flex-wrap justify-start gap-1 p-1">
            <TabsTrigger value="all" className="px-4 py-2 text-sm font-medium">All Months</TabsTrigger>
            {monthsInYear.map(monthDate => {
              const monthKey = format(monthDate, 'MMMM yyyy');
              return (
                <TabsTrigger key={monthKey} value={monthKey} className="px-4 py-2 text-sm font-medium">
                  {monthKey}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>
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
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="All Sources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="manual">Manual Entry</SelectItem>
                <SelectItem value="compliance">Compliance Checks</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={handleMigrateSources}
              disabled={isMigrating}
              title="Tag existing compliance repairs"
            >
              <RefreshCw className={`w-4 h-4 ${isMigrating ? 'animate-spin' : ''}`} />
            </Button>
            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
              <Button
                variant={groupBy === "status" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setGroupBy("status")}
                className={groupBy === "status" ? "bg-white shadow-sm" : ""}
              >
                By Status
              </Button>
              <Button
                variant={groupBy === "property" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setGroupBy("property")}
                className={groupBy === "property" ? "bg-white shadow-sm" : ""}
              >
                By Property
              </Button>
            </div>
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

      {/* Repairs Section - Grouped by Status or Property */}
      <div className="space-y-12">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-slate-500">Loading repairs...</p>
          </div>
        ) : (
          <>
            {/* Summary Table - Only show when "All" tab is active and grouped by property */}
            {activeTab === "all" && groupBy === "property" && (
              <Card>
                <CardHeader>
                  <CardTitle>Repairs Summary by Property</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Property</TableHead>
                        <TableHead className="text-center">Total</TableHead>
                        <TableHead className="text-center">Reported</TableHead>
                        <TableHead className="text-center">Assessed</TableHead>
                        <TableHead className="text-center">Scheduled</TableHead>
                        <TableHead className="text-center">In Progress</TableHead>
                        <TableHead className="text-center">Completed</TableHead>
                        <TableHead className="text-center">Cancelled</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[...properties]
                        .sort((a, b) => (a.Name || a.name || "").localeCompare(b.Name || b.name || ""))
                        .map(property => {
                          const propertyId = property.ID || property.id;
                          const propertyRepairs = filteredRepairs.filter(r => (r["Property ID"] || r.property_id) === propertyId);
                          const counts = propertyRepairs.reduce((c, r) => {
                            const s = (r["Status"] || r.status || "").toLowerCase().replace(/ /g, '_');
                            c[s] = (c[s] || 0) + 1;
                            return c;
                          }, {});
                          return (
                            <TableRow key={propertyId}>
                              <TableCell className="font-medium">{property.Name || property.name}</TableCell>
                              <TableCell className="text-center font-bold">{propertyRepairs.length}</TableCell>
                              <TableCell className="text-center text-yellow-600">{counts.reported || 0}</TableCell>
                              <TableCell className="text-center text-blue-600">{counts.assessed || 0}</TableCell>
                              <TableCell className="text-center text-indigo-600">{counts.scheduled || 0}</TableCell>
                              <TableCell className="text-center text-orange-600">{counts.in_progress || 0}</TableCell>
                              <TableCell className="text-center text-green-600">{counts.completed || 0}</TableCell>
                              <TableCell className="text-center text-gray-500">{counts.cancelled || 0}</TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {groupBy === "status" ? (
              // Group By Status View
              activeTab === "all" ? (
                Object.keys(groupedRepairs).length > 0 ? (
                  ['reported', 'assessed', 'scheduled', 'in_progress', 'completed', 'cancelled']
                    .filter(status => groupedRepairs[status])
                    .concat(Object.keys(groupedRepairs).filter(status => !['reported', 'assessed', 'scheduled', 'in_progress', 'completed', 'cancelled'].includes(status)))
                    .map(status => (
                    <div key={status} className="space-y-6">
                      <div className="flex items-center justify-between border-b pb-2">
                        <h3 className="text-2xl font-bold text-slate-900">
                          {statusLabels[status] || status.replace(/_/g, ' ')}
                          <span className="ml-3 text-lg font-normal text-slate-500">
                            ({groupedRepairs[status].length})
                          </span>
                        </h3>
                      </div>

                      <div className="flex flex-nowrap overflow-x-auto pb-6 gap-6 snap-x snap-mandatory">
                        {groupedRepairs[status].map((repair) => (
                          <div key={repair["ID"] || repair.id} className="flex-none w-full md:w-[450px] snap-start">
                            <RepairCard
                              repair={repair}
                              onEdit={handleEdit}
                              onViewDetails={handleViewDetails}
                              onDelete={handleDelete}
                              getPriorityColor={getPriorityColor}
                              getStatusColor={getStatusColor}
                              getPropertyName={getPropertyName}
                              getAccommodationName={() => getAccommodationName(repair)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <Card className="shadow-sm">
                    <CardContent className="p-12 text-center space-y-4">
                      <Wrench className="w-16 h-16 text-slate-400 mx-auto" />
                      <div className="space-y-2">
                        <h3 className="text-2xl font-semibold text-slate-900">No repairs found</h3>
                        <p className="text-lg text-slate-500 max-w-md mx-auto">
                          {searchTerm || activeMonthTab !== "all" || priorityFilter !== "all" || propertyFilter !== "all"
                            ? "No repairs match your current filters"
                            : "No repairs have been reported yet"}
                        </p>
                      </div>
                      {activeMonthTab === "all" && activeTab === "all" && priorityFilter === "all" && propertyFilter === "all" && !searchTerm && (
                        <Button onClick={() => setShowForm(true)} className="bg-orange-600 hover:bg-orange-700 px-6 py-3 text-base font-medium">
                          <Plus className="w-5 h-5 mr-2" />
                          Report First Repair
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )
              ) : (
                // Individual Status Tab View (Flat list when "By Status" is active)
                <div className="space-y-8">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h2 className="text-2xl font-bold text-slate-900">
                      {statusLabels[activeTab] || activeTab.replace(/_/g, ' ')}
                      <span className="ml-3 text-lg font-normal text-slate-500">
                        ({filteredRepairs.length})
                      </span>
                    </h2>
                  </div>

                  {filteredRepairs.length > 0 ? (
                    <div className="flex flex-nowrap overflow-x-auto pb-6 gap-6 snap-x snap-mandatory">
                      {filteredRepairs.map((repair) => (
                        <div key={repair["ID"] || repair.id} className="flex-none w-full md:w-[450px] snap-start">
                          <RepairCard
                            repair={repair}
                            onEdit={handleEdit}
                            onViewDetails={handleViewDetails}
                            onDelete={handleDelete}
                            getPriorityColor={getPriorityColor}
                            getStatusColor={getStatusColor}
                            getPropertyName={getPropertyName}
                            getAccommodationName={() => getAccommodationName(repair)}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-12 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center text-slate-500 italic">
                      No repairs found for criteria
                    </div>
                  )}
                </div>
              )
            ) : (
              // Group By Property View (Nested Statuses) - Applies to all tabs
              <div className="space-y-16">
                {[...properties]
                  .sort((a, b) => (a.Name || a.name || "").localeCompare(b.Name || b.name || ""))
                  .map(property => {
                    const propertyId = property.ID || property.id;
                    const propertyRepairs = filteredRepairs.filter(r => (r["Property ID"] || r.property_id) === propertyId);

                    // Group property repairs by status
                    const propertyGroupedByStatus = propertyRepairs.reduce((acc, repair) => {
                      const status = (repair["Status"] || repair.status || "reported").toString().trim().toLowerCase().replace(/ /g, '_');
                      if (!acc[status]) acc[status] = [];
                      acc[status].push(repair);
                      return acc;
                    }, {});

                    return (
                      <div key={propertyId} className="space-y-8">
                        <div className="flex items-center justify-between border-b-2 border-slate-200 pb-3">
                          <h3 className="text-3xl font-extrabold text-slate-900">
                            {property.Name || property.name}
                            <span className="ml-4 text-xl font-medium text-slate-400">
                              ({propertyRepairs.length})
                            </span>
                          </h3>
                        </div>

                        {propertyRepairs.length > 0 ? (
                          <div className="space-y-10 pl-4 md:pl-8 border-l-4 border-slate-100 ml-2">
                            {['reported', 'assessed', 'scheduled', 'in_progress', 'completed', 'cancelled']
                              .filter(status => propertyGroupedByStatus[status])
                              .concat(Object.keys(propertyGroupedByStatus).filter(status => !['reported', 'assessed', 'scheduled', 'in_progress', 'completed', 'cancelled'].includes(status)))
                              .map(status => (
                                <div key={status} className="space-y-4">
                                  <div className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full ${getStatusColor(status).split(' ')[0].replace('-100', '-500')}`} />
                                    <h4 className="text-xl font-bold text-slate-800">
                                      {statusLabels[status] || status.replace(/_/g, ' ')}
                                      <span className="ml-2 text-base font-normal text-slate-500">
                                        ({propertyGroupedByStatus[status].length})
                                      </span>
                                    </h4>
                                  </div>

                                  <div className="flex flex-nowrap overflow-x-auto pb-4 gap-6 snap-x snap-mandatory">
                                    {propertyGroupedByStatus[status].map((repair) => (
                                      <div key={repair["ID"] || repair.id} className="flex-none w-full md:w-[450px] snap-start">
                                        <RepairCard
                                          repair={repair}
                                          onEdit={handleEdit}
                                          onViewDetails={handleViewDetails}
                                          onDelete={handleDelete}
                                          getPriorityColor={getPriorityColor}
                                          getStatusColor={getStatusColor}
                                          getPropertyName={getPropertyName}
                                          getAccommodationName={() => getAccommodationName(repair)}
                                        />
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                          </div>
                        ) : (
                          <div className="pl-4 md:pl-8 py-4 text-slate-400 italic flex items-center gap-2">
                             <AlertCircle className="w-4 h-4" />
                             No repairs recorded for this property
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
