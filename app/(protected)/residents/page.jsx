
"use client";

import React, { useState, useEffect } from "react";
import { useSession, useUser } from '@clerk/nextjs'
import { createClient } from "@supabase/supabase-js";
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

  // Create a custom Supabase client that injects the Clerk session token into the request headers
  function createClerkSupabaseClient() {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_KEY,
      {
        async accessToken() {
          return session?.getToken() ?? null
        },
      },
    )
  }

const client = createClerkSupabaseClient()

export default function Residents_Supabase() {
  const { user } = useUser();
  const { session } = useSession()
  const [residents, setResidents] = useState([]);
  const [accommodations, setAccommodations] = useState([]);
  const [properties, setProperties] = useState([]);
  const [filteredResidents, setFilteredResidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('')
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingResident, setEditingResident] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [expandedProperties, setExpandedProperties] = useState(new Set());
  const [viewingResident, setViewingResident] = useState(null);

useEffect(() => {
  if (!user) return; // wait for Clerk user

  async function loadAndFilterResidents() {
    setLoading(true);

    // 1️⃣ Fetch residents from Supabase
    const { data, error } = await supabase.from("residents").select("*");

    if (!error && data) {
      // 2️⃣ Filter the fetched data immediately
      let filtered = data;

      if (activeTab !== "all") {
        filtered = filtered.filter(resident => resident.Status === activeTab);
      }

      if (searchTerm) {
        filtered = filtered.filter(resident =>
          `${resident["First Name"]} ${resident["Last Name"]}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
          resident["Property Address"]?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          resident["Key Worker"]?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      // 3️⃣ Update state
      setResidents(data); // raw data
      setFilteredResidents(filtered); // filtered view
    } else if (error) {
      console.error("Error fetching residents:", error);
    }

    setLoading(false);
  }

  loadAndFilterResidents();
}, [user, activeTab, searchTerm]); // rerun if user, tab, or search changes

  const loadData = async () => {
    if (!supabase) return;
    try {
      setLoading(true);
      setError(null);

      const { data: residentsData, error: residentsError } = await supabase
        .from('residents')
        .select('*')
        .order('Created Date', { ascending: false });

      if (residentsError) throw residentsError;
      
      // Filter out soft-deleted residents
      const activeResidents = (residentsData || []).filter(r => !r.Deleted && !r["Deleted"]);
      console.log("✅ Loaded residents:", activeResidents.length, `(filtered out ${(residentsData?.length || 0) - activeResidents.length} deleted)`);

      const { data: accommodationsData, error: accommodationsError } = await supabase
        .from('accommodations')
        .select('*');

      if (accommodationsError) throw accommodationsError;
      console.log("✅ Loaded accommodations:", accommodationsData?.length);

      const { data: propertiesDataRaw, error: propertiesError } = await supabase
        .from('properties')
        .select('*');

      if (propertiesError) throw propertiesError;
      console.log("✅ Loaded properties:", propertiesDataRaw?.length);

      const propertiesData = (propertiesDataRaw || []).sort((a, b) => {
        const nameA = a.Name?.toLowerCase();
        const nameB = b.Name?.toLowerCase();

        if (nameA && nameA.includes('ryland') && (!nameB || !nameB.includes('ryland'))) return 1;
        if (nameB && nameB.includes('ryland') && (!nameA || !nameA.includes('ryland'))) return -1;
        return nameA?.localeCompare(nameB) || 0;
      });

      setResidents(activeResidents);
      setAccommodations(accommodationsData || []);
      setProperties(propertiesData);
      setExpandedProperties(new Set(propertiesData.map(p => p.ID).concat('unassigned')));

    } catch (error) {
      console.error("❌ Error loading data:", error);
      setError(error.message || "Failed to load data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getResidentPropertyId = (resident) => {
    if (resident["Property ID"]) {
      return resident["Property ID"];
    }
    
    if (resident["Accommodation ID"]) {
      const accommodation = accommodations.find(a => a.ID === resident["Accommodation ID"]);
      return accommodation?.["Property ID"] || null;
    }
    
    return null;
  };

  const handleSubmit = async (residentData) => {
    if (!supabase) {
      alert("Authentication client not initialized");
      return;
    }
    try {
      const now = new Date().toISOString().slice(0, 10);
      
      // Convert empty date strings to null for Supabase
      const cleanedData = JSON.parse(JSON.stringify(residentData)); // Deep clone
      
      const cleanDates = (obj) => {
        if (Array.isArray(obj)) {
          obj.forEach(item => cleanDates(item));
        } else if (obj && typeof obj === 'object') {
          Object.keys(obj).forEach(key => {
            if (typeof obj[key] === 'string' && obj[key] === '' && 
                (key.toLowerCase().includes('date') || key === 'Date of Birth')) {
              obj[key] = null;
            } else if (typeof obj[key] === 'object') {
              cleanDates(obj[key]);
            }
          });
        }
      };
      
      cleanDates(cleanedData);
      
      // For new residents, remove ID field completely if it's empty
      if (!editingResident && (!cleanedData.ID || cleanedData.ID === '')) {
        delete cleanedData.ID;
      }

      // Comprehensive foreign key cleaning - converts empty strings to null
      const cleanForeignKeys = (obj) => {
        if (Array.isArray(obj)) {
          obj.forEach(item => cleanForeignKeys(item));
        } else if (obj && typeof obj === 'object') {
          Object.keys(obj).forEach(key => {
            if (typeof obj[key] === 'string' && obj[key] === '' && 
                (key === 'Property ID' || key === 'Accommodation ID' || 
                 key === 'property_id' || key === 'accommodation_id' ||
                 key === 'from_property_id' || key === 'to_property_id' ||
                 key === 'from_accommodation_id' || key === 'to_accommodation_id')) {
              obj[key] = null;
            } else if (typeof obj[key] === 'object') {
              cleanForeignKeys(obj[key]);
            }
          });
        }
      };
      
      cleanForeignKeys(cleanedData);
      
      let savedResident;

      if (editingResident) {
        const originalResident = residents.find(r => r.ID === editingResident.ID);
        const originalAccommodationId = originalResident?.["Accommodation ID"];
        const newAccommodationId = residentData["Accommodation ID"];
        const originalStatus = originalResident?.Status;
        const newStatus = residentData.Status;

        console.log("🔄 Updating resident:", {
          originalAccommodationId,
          newAccommodationId,
          originalStatus,
          newStatus
        });

        // Update the resident
        const { data: updatedData, error: updateError } = await supabase
          .from('residents')
          .update(cleanedData)
          .eq('ID', editingResident.ID)
          .select()
          .single();

        if (updateError) throw updateError;
        savedResident = updatedData;
        console.log("✅ Resident updated");

        // Handle accommodation updates
        if (newStatus === 'Moved On' && originalStatus === 'Active' && originalAccommodationId) {
          console.log("📍 Marking old accommodation as available:", originalAccommodationId);
          // Mark old accommodation as available
          await supabase
            .from('accommodations')
            .update({
              "Availability Status": 'Available',
              "Current Resident ID": null,
              "Lease Start Date": null,
              "Lease End Date": residentData["Move-out Date"] || now
            })
            .eq('ID', originalAccommodationId);
        }
        else if (newStatus === 'Active' && originalStatus !== 'Active' && newAccommodationId) {
          console.log("📍 Marking new accommodation as occupied:", newAccommodationId);
          // Mark new accommodation as occupied
          await supabase
            .from('accommodations')
            .update({
              "Availability Status": 'Occupied',
              "Current Resident ID": editingResident.ID,
              "Lease Start Date": residentData["Move-in Date"] || now
            })
            .eq('ID', newAccommodationId);
        }
        else if (newStatus === 'Active' && originalStatus === 'Active' && 
                 newAccommodationId !== originalAccommodationId &&
                 (residentData["Accommodation Transfers"] || []).length === ((editingResident?.["Accommodation Transfers"]) || []).length &&
                 (residentData["Room Transfers"] || []).length === ((editingResident?.["Room Transfers"]) || []).length) {
          
          console.log("📍 Direct accommodation change without transfer");
          // Free up old accommodation
          if (originalAccommodationId) {
            console.log("  - Freeing old accommodation:", originalAccommodationId);
            await supabase
              .from('accommodations')
              .update({
                "Availability Status": 'Available',
                "Current Resident ID": null,
                "Lease Start Date": null,
                "Lease End Date": now
              })
              .eq('ID', originalAccommodationId);
          }
          
          // Assign new accommodation
          if (newAccommodationId) {
            console.log("  - Assigning new accommodation:", newAccommodationId);
            await supabase
              .from('accommodations')
              .update({
                "Availability Status": 'Occupied',
                "Current Resident ID": editingResident.ID,
                "Lease Start Date": residentData["Move-in Date"] || now
              })
              .eq('ID', newAccommodationId);
          }
        }
        else if ((residentData["Accommodation Transfers"] || []).length > ((editingResident?.["Accommodation Transfers"]) || []).length) {
          const latestTransfer = residentData["Accommodation Transfers"][residentData["Accommodation Transfers"].length - 1];
          console.log("📍 New accommodation transfer added:", latestTransfer);
          
          // Free up old accommodation
          if (latestTransfer.from_accommodation_id) {
            console.log("  - Freeing old accommodation:", latestTransfer.from_accommodation_id);
            await supabase
              .from('accommodations')
              .update({
                "Availability Status": 'Available',
                "Current Resident ID": null,
                "Lease Start Date": null,
                "Lease End Date": latestTransfer.move_out_date || latestTransfer.transfer_date || now
              })
              .eq('ID', latestTransfer.from_accommodation_id);
          }
          
          // Assign new accommodation
          if (latestTransfer.to_accommodation_id) {
            console.log("  - Assigning new accommodation:", latestTransfer.to_accommodation_id);
            await supabase
              .from('accommodations')
              .update({
                "Availability Status": 'Occupied',
                "Current Resident ID": editingResident.ID,
                "Lease Start Date": latestTransfer.transfer_date || now
              })
              .eq('ID', latestTransfer.to_accommodation_id);
          }
        }
        else if ((residentData["Room Transfers"] || []).length > ((editingResident?.["Room Transfers"]) || []).length) {
          const latestRoomTransfer = residentData["Room Transfers"][residentData["Room Transfers"].length - 1];
          console.log("📍 New room transfer added:", latestRoomTransfer);
          
          // Free up old room
          if (latestRoomTransfer.from_accommodation_id) {
            console.log("  - Freeing old room:", latestRoomTransfer.from_accommodation_id);
            await supabase
              .from('accommodations')
              .update({
                "Availability Status": 'Available',
                "Current Resident ID": null,
                "Lease Start Date": null,
                "Lease End Date": latestRoomTransfer.transfer_date || now
              })
              .eq('ID', latestRoomTransfer.from_accommodation_id);
          }
          
          // Assign new room
          if (latestRoomTransfer.to_accommodation_id) {
            console.log("  - Assigning new room:", latestRoomTransfer.to_accommodation_id);
            await supabase
              .from('accommodations')
              .update({
                "Availability Status": 'Occupied',
                "Current Resident ID": editingResident.ID,
                "Lease Start Date": latestRoomTransfer.transfer_date || now
              })
              .eq('ID', latestRoomTransfer.to_accommodation_id);
          }
        }
        else if (newStatus === 'Active' && !newAccommodationId && originalAccommodationId) {
          console.log("📍 Removing accommodation assignment:", originalAccommodationId);
          // Remove accommodation assignment
          await supabase
            .from('accommodations')
            .update({
              "Availability Status": 'Available',
              "Current Resident ID": null,
              "Lease Start Date": null,
              "Lease End Date": residentData["Move-out Date"] || now
            })
            .eq('ID', originalAccommodationId);
        }

      } else {
        console.log("🆕 Creating new resident with accommodation:", cleanedData["Accommodation ID"]);
        
        // Generate UUID for new resident
        const newResidentId = crypto.randomUUID();
        const insertData = {
          ...cleanedData,
          ID: newResidentId,
          "Created Date": new Date().toISOString(),
          "Updated Date": new Date().toISOString()
        };
        
        console.log("✅ Inserting new resident with ID:", newResidentId);
        
        // Create new resident
        const { data: newData, error: insertError } = await supabase
          .from('residents')
          .insert([insertData])
          .select()
          .single();

        if (insertError) throw insertError;
        savedResident = newData;
        console.log("✅ New resident created:", savedResident.ID);
        
        // Mark accommodation as occupied if assigned
        if (savedResident.Status === 'Active' && savedResident["Accommodation ID"]) {
          console.log("📍 Marking accommodation as occupied:", savedResident["Accommodation ID"]);
          await supabase
            .from('accommodations')
            .update({
              "Availability Status": 'Occupied',
              "Current Resident ID": savedResident.ID,
              "Lease Start Date": savedResident["Move-in Date"] || now
            })
            .eq('ID', savedResident["Accommodation ID"]);
        }
      }
      
      console.log("✅ All accommodation updates complete");
      setShowForm(false);
      setEditingResident(null);
      await loadData();
      
      return savedResident;
    } catch (error) {
      console.error("❌ Error saving resident:", error);
      throw error;
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
    if (!supabase) {
      alert("Authentication client not initialized");
      return;
    }
    if (window.confirm(`Are you sure you want to delete ${resident["First Name"]} ${resident["Last Name"]}? It will be moved to deleted entries.`)) {
      try {
        const { error } = await supabase
          .from('residents')
          .update({
            "Deleted": true,
            "Deleted Date": new Date().toISOString(),
            "Deleted By": user?.primaryEmailAddress?.emailAddress || 'unknown'
          })
          .eq('ID', resident.ID);

        if (error) throw error;
        console.log(`✅ Soft deleted resident ${resident.ID}`);
        await loadData();
      } catch (error) {
        console.error("Error deleting resident:", error);
        alert("Error deleting resident: " + error.message);
      }
    }
  };

  const exportToCSV = () => {
    
    try {
      console.log("Starting CSV export...");
      console.log("Filtered residents count:", filteredResidents.length);
      
      const getPropertyName = (propertyId) => {
        const property = properties.find(p => p.ID === propertyId);
        return property?.Name || "";
      };
      
      const getPropertyAddress = (propertyId) => {
        const property = properties.find(p => p.ID === propertyId);
        return property?.Address || "";
      };
      
      const getAccommodationUnit = (accommodationId) => {
        const accommodation = accommodations.find(a => a.ID === accommodationId);
        return accommodation?.["Room Number"] || "";
      };
      
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

      const formatBenefits = (benefits) => {
        if (!benefits || benefits.length === 0) return "[]";
        return JSON.stringify(benefits);
      };

      const formatRoomTransfers = (transfers) => {
        if (!transfers || transfers.length === 0) return "[]";
        return JSON.stringify(transfers);
      };

      const formatAccommodationTransfers = (transfers) => {
        if (!transfers || transfers.length === 0) return "[]";
        return JSON.stringify(transfers);
      };

      const headers = [
        "ID",
        "First Name",
        "Last Name",
        "Date of Birth",
        "Phone Number",
        "Email Address", 
        "Claim Reference Number",
        "Submission Reference",
        "National Insurance Number",
        "Accommodation Type",
        "Property ID",
        "Property Name",
        "Property Address",
        "Accommodation ID",
        "Unit/Room Number",
        "Move-in Date",
        "Move-out Date",
        "Support Level",
        "Support Worker",
        "Status",
        "Emergency Contact Name",
        "Emergency Contact Phone",
        "Fluent English",
        "Partial English",
        "Language Spoken",
        "Communication Needs",
        "Medical Conditions",
        "Benefits",
        "Room Transfers",
        "Accommodation Transfers",
        "Sign-up Documents URL",
        "Photo ID URL",
        "Notes",
        "PA/Worker Name",
        "PA/Worker Contact",
        "PA/Worker Email",
        "PA/Worker Borough",
        "PA/Worker Team",
        "PA/Worker Duty Line",
        "Created Date",
        "Updated Date",
        "Created By",
        "Deleted",
        "Deleted Date",
        "Deleted By"
      ];

      const rows = filteredResidents.map(resident => [
        resident.ID || "",
        resident["First Name"] || "",
        resident["Last Name"] || "",
        formatDate(resident["Date of Birth"]),
        resident["Phone Number"] || "",
        resident["Email Address"] || "", 
        resident["Claim Reference Number"] || "",
        resident["Submission Reference"] || "",
        resident["National Insurance Number"] || "",
        resident["Accommodation Type"] || "",
        resident["Property ID"] || "",
        getPropertyName(resident["Property ID"]),
        getPropertyAddress(resident["Property ID"]),
        resident["Accommodation ID"] || "",
        getAccommodationUnit(resident["Accommodation ID"]),
        formatDate(resident["Move-in Date"]),
        formatDate(resident["Move-out Date"]),
        resident["Support Level"] || "",
        resident["Support Worker"] || "",
        resident.Status || "",
        resident["Emergency Contact Name"] || "",
        resident["Emergency Contact Phone"] || "",
        resident["Fluent English"] ? "Yes" : "No",
        resident["Partial English"] ? "Yes" : "No",
        resident["Language Spoken"] || "",
        resident["Communication Needs"] || "",
        resident["Medical Conditions"] || "",
        formatBenefits(resident["Benefits"]),
        formatRoomTransfers(resident["Room Transfers"]),
        formatAccommodationTransfers(resident["Accommodation Transfers"]),
        resident["Sign-up Documents URL"] || "",
        resident["Photo ID URL"] || "",
        resident.Notes || "",
        resident["PA/Worker Name"] || "",
        resident["PA/Worker Contact"] || "",
        resident["PA/Worker Email"] || "",
        resident["PA/Worker Borough"] || "",
        resident["PA/Worker Team"] || "",
        resident["PA/Worker Duty Line"] || "",
        formatDateTime(resident["Created Date"]),
        formatDateTime(resident["Updated Date"]),
        resident["Created By"] || "",
        resident.Deleted ? "Yes" : "No",
        formatDateTime(resident["Deleted Date"]),
        resident["Deleted By"] || ""
      ]);

      console.log("Headers:", headers.length);
      console.log("Rows:", rows.length);

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

      console.log("CSV content length:", csvContent.length);

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `residents_export_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      console.log("✅ CSV export completed successfully");
    } catch (error) {
      console.error("❌ Error exporting CSV:", error);
      alert("Error exporting CSV: " + error.message);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      Active: "bg-green-100 text-green-800 border-green-200",
      "Temporary Leave": "bg-yellow-100 text-yellow-800 border-yellow-200",
      "Moved On": "bg-blue-100 text-blue-800 border-blue-200",
      Inactive: "bg-gray-100 text-gray-800 border-gray-200"
    };
    return colors[status] || colors.Active;
  };

  const getSupportLevelColor = (level) => {
    const colors = {
      Low: "bg-green-100 text-green-800",
      Medium: "bg-yellow-100 text-yellow-800",
      High: "bg-orange-100 text-orange-800",
      Intensive: "bg-red-100 text-red-800"
    };
    return colors[level] || colors.Medium;
  };

  const toggleProperty = (propertyId) => {
    setExpandedProperties(prev => {
      const newSet = new Set(prev);
      if (newSet.has(propertyId)) {
        newSet.delete(propertyId);
      } else {
        newSet.add(propertyId);
      }
      return newSet;
    });
  };

  const residentsByProperty = filteredResidents.reduce((acc, resident) => {
    const propertyId = getResidentPropertyId(resident) || 'unassigned';
    if (!acc[propertyId]) {
      acc[propertyId] = [];
    }
    acc[propertyId].push(resident);
    return acc;
  }, {});

  const getActiveResidentCount = (propertyId) => {
    const propertyResidents = residentsByProperty[propertyId] || [];
    return propertyResidents.filter(r => r.Status === 'Active').length;
  };

  const unassignedResidents = residentsByProperty['unassigned'] || [];

  if (error) {
    return (
      <div className="space-y-6 p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
        <div className="flex justify-center mt-4">
          <Button onClick={() => loadData()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry Loading Data
          </Button>
        </div>
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
          <Button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Resident
          </Button>
        </div>
      </div>

      <Card className="mb-6 mx-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search residents by name, address, or key worker..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
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

      {showForm && editingResident && (
        <Dialog open={showForm} onOpenChange={(open) => {
          setShowForm(open);
          if (!open) setEditingResident(null);
        }}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <ResidentForm_Supabase
              resident={editingResident}
              accommodations={accommodations}
              onSubmit={handleSubmit}
              onCancel={() => {
                setShowForm(false);
                setEditingResident(null);
              }}
            />
          </DialogContent>
        </Dialog>
      )}

      {showForm && !editingResident && (
        <div className="px-6">
          <ResidentForm_Supabase
            resident={null}
            accommodations={accommodations}
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowForm(false);
              setEditingResident(null);
            }}
          />
        </div>
      )}
      
      {viewingResident && (
        <ResidentDetailModal
          resident={viewingResident}
          accommodations={accommodations}
          properties={properties}
          onClose={() => setViewingResident(null)}
          onEdit={(resident) => {
            setViewingResident(null);
            handleEdit(resident);
          }}
          onDelete={handleDelete}
          isAdmin={true}
        />
      )}

      {loading ? (
        <div className="px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Card key={i} className="h-64">
                <CardContent className="p-6">
                  <Skeleton className="h-full w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : activeTab === 'all' ? (
        <div className="space-y-6 px-6">
          {properties.map((property) => {
            const propertyResidents = residentsByProperty[property.ID] || [];
            if (propertyResidents.length === 0) return null;

            const activeCount = getActiveResidentCount(property.ID);

            return (
              <Card key={property.ID} className="overflow-hidden">
                <Collapsible
                  open={expandedProperties.has(property.ID)}
                  onOpenChange={() => toggleProperty(property.ID)}
                >
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-slate-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-sm">
                            <Building2 className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-xl text-slate-900">{property.Name}</CardTitle>
                            <div className="flex items-center gap-2 mt-1">
                              <MapPin className="w-4 h-4 text-slate-400" />
                              <span className="text-sm text-slate-600">{property.Address}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                           <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                              <Users className="w-4 h-4" />
                              <span>{activeCount} Active Resident{activeCount !== 1 ? 's' : ''}</span>
                           </div>
                          {expandedProperties.has(property.ID) ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      {propertyResidents.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
                          {propertyResidents.map(resident => (
                            <ResidentCard
                              key={resident.ID}
                              resident={resident}
                              accommodations={accommodations}
                              onEdit={handleEdit}
                              onViewDetails={handleViewDetails}
                              onDelete={handleDelete}
                              getSupportLevelColor={getSupportLevelColor}
                              getStatusColor={getStatusColor}
                              isAdmin={true}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-slate-500">
                          <Users className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                          <p>No residents found for this property.</p>
                        </div>
                      )}
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            );
          })}

          {unassignedResidents.length > 0 && (
              <Card className="overflow-hidden">
                 <Collapsible
                    open={expandedProperties.has('unassigned')}
                    onOpenChange={() => toggleProperty('unassigned')}
                  >
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-slate-50 transition-colors">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gradient-to-r from-slate-500 to-gray-500 rounded-xl flex items-center justify-center shadow-sm">
                                  <UserX className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                  <CardTitle className="text-xl text-slate-900">Unassigned Residents</CardTitle>
                                  <span className="text-sm text-slate-600">Residents not assigned to a specific property.</span>
                                </div>
                            </div>
                           <div className="flex items-center gap-4">
                               <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                                  <Users className="w-4 h-4" />
                                  <span>{unassignedResidents.filter(r => r.Status === 'Active').length} Active Resident{unassignedResidents.filter(r => r.Status === 'Active').length !== 1 ? 's' : ''}</span>
                               </div>
                              {expandedProperties.has('unassigned') ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
                           </div>
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0">
                         {unassignedResidents.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
                              {unassignedResidents.map(resident => (
                                <ResidentCard
                                  key={resident.ID}
                                  resident={resident}
                                  accommodations={accommodations}
                                  onEdit={handleEdit}
                                  onViewDetails={handleViewDetails}
                                  onDelete={handleDelete}
                                  getSupportLevelColor={getSupportLevelColor}
                                  getStatusColor={getStatusColor}
                                  isAdmin={true}
                                />
                              ))}
                            </div>
                         ) : (
                           <div className="text-center py-8 text-slate-500">
                              <Users className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                              <p>No unassigned residents found.</p>
                           </div>
                         )}
                      </CardContent>
                    </CollapsibleContent>
                 </Collapsible>
              </Card>
          )}

        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-6">
          {filteredResidents.map((resident) => (
            <ResidentCard
              key={resident.ID}
              resident={resident}
              accommodations={accommodations}
              onEdit={handleEdit}
              onViewDetails={handleViewDetails}
              onDelete={handleDelete}
              getSupportLevelColor={getSupportLevelColor}
              getStatusColor={getStatusColor}
              isAdmin={true}
            />
          ))}
        </div>
      )}

      {filteredResidents.length === 0 && !loading && (
        <Card className="mx-6">
          <CardContent className="p-12 text-center">
            <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No residents found</h3>
            <p className="text-slate-500 mb-4">
              {searchTerm ? "Try adjusting your search terms" : "Get started by adding your first resident"}
            </p>
            {!searchTerm && (
              <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Add First Resident
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
