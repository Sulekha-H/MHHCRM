"use client";

import React, { useState, useEffect } from "react";
import { useSession, useUser } from "@clerk/nextjs";
import { useClerkSupabaseClient } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Building2, MapPin, Users, Calendar, Download, X, Edit, Trash2 } from "lucide-react";
import PropertyForm from "@/components/properties/PropertyForm";
import PropertyCard from "@/components/properties/PropertyCard";
import PropertyDetailModal from "@/components/properties/PropertyDetailModal";
import { format } from 'date-fns';

export default function Properties() {
  const supabase = useClerkSupabaseClient()
  const {session} = useSession();
  const { user } = useUser();
  const [properties, setProperties] = useState([]);
  const [accommodations, setAccommodations] = useState([]);
  const [residents, setResidents] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [viewingProperty, setViewingProperty] = useState(null);
  const [propertyToDelete, setPropertyToDelete] = useState(null);

  // Load data only once on mount
  useEffect(() => {
    if (!supabase) return;
  
    let mounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        console.log("🔄 Starting data load...");
        
        // Load current user
        try {
          const { data: { user: authUser } = {} } = await supabase.auth.getUser(); // Add default empty object for data
          if (authUser && mounted) {
            const { data, error } = await supabase
              .from('users')
              .select('*')
              .eq('ID', authUser.id)
              .single();
            if (error) throw error; // Handle user fetch error
            if (mounted) {
              setCurrentUser(data);
              console.log("✅ Current user loaded");
            }
          }
        } catch (userError) {
          console.error("⚠️ Error loading current user:", userError);
        }

        // Load properties
        console.log("📥 Loading properties...");
        const { data: propertiesData, error: propertiesError } = await supabase
          .from('properties')
          .select('*')
          .or('Deleted.is.null,Deleted.eq.false')
          .order('Created Date', { ascending: false });

        if (propertiesError) throw propertiesError;
        console.log(`✅ Loaded ${propertiesData?.length || 0} properties`);
        
        // Debug: Log first property to check field names and values
        if (propertiesData && propertiesData.length > 0) {
          console.log("🔍 Sample property data:", propertiesData[0]);
          console.log("🔍 Rent Per Week field:", propertiesData[0]["Rent Per Week"]);
          console.log("🔍 All property keys:", Object.keys(propertiesData[0]));
        }

        // Load accommodations
        console.log("📥 Loading accommodations...");
        const { data: accommodationsData, error: accommodationsError } = await supabase
          .from('accommodations')
          .select('*')
          .or('Deleted.is.null,Deleted.eq.false');

        if (accommodationsError) throw accommodationsError;
        console.log(`✅ Loaded ${accommodationsData?.length || 0} accommodations`);

        // Load residents
        console.log("📥 Loading residents...");
        const { data: residentsData, error: residentsError } = await supabase
          .from('residents')
          .select('*')
          .or('Deleted.is.null,Deleted.eq.false');

        if (residentsError) throw residentsError;
        console.log(`✅ Loaded ${residentsData?.length || 0} residents`);

        if (mounted) {
          setProperties(propertiesData || []);
          setAccommodations(accommodationsData || []);
          setResidents(residentsData || []);
          console.log("✅ All data loaded successfully");
        }
      } catch (error) {
        console.error("❌ Error loading data:", error);
        if (mounted) {
          alert("Error loading data: " + error.message);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, [supabase]);

  // Update properties with accurate occupancy data - MEMOIZED to prevent infinite loops
  const propertiesWithOccupancy = useMemo(() => {
    return properties.map((property) => {
      const propertyId = property["ID"] || property.id;
      
      // Get all accommodations for this property
      const propertyAccommodations = accommodations.filter(a => {
        const accPropertyId = a["Property ID"] || a.property_id;
        return accPropertyId === propertyId;
      });
      
      // Count active residents for this property
      // Check both direct property_id assignment and accommodation-based assignment
      const activeResidents = residents.filter(resident => {
        const residentStatus = (resident["Status"] || resident.status || '').toLowerCase();
        
        // Must be active status
        if (residentStatus !== 'active') return false;
        
        // Check direct property assignment
        const residentPropertyId = resident["Property ID"] || resident.property_id;
        if (residentPropertyId === propertyId) return true;
        
        // Check accommodation-based assignment
        const residentAccommodationId = resident["Accommodation ID"] || resident.accommodation_id;
        if (residentAccommodationId) {
          const residentAccommodation = accommodations.find(a => {
            const accId = a["ID"] || a.id;
            return accId === residentAccommodationId;
          });
          const accPropertyId = residentAccommodation?.["Property ID"] || residentAccommodation?.property_id;
          if (accPropertyId === propertyId) return true;
        }
        
        return false;
      });

      // Use the count of accommodations as total capacity if property doesn't have total_capacity set
      const totalCapacity = property["Total Capacity"] || property.total_capacity || propertyAccommodations.length;
      
      return { 
        ...property, 
        current_occupancy: activeResidents.length,
        total_capacity: totalCapacity
      };
    });
  }, [properties, accommodations, residents]);

  const filterProperties = useCallback(() => {
    let filtered = propertiesWithOccupancy;

    if (activeTab !== "all") {
      const tabStatusMap = {
        active: "Active",
        temporarily_closed: "Temporarily Closed",
        under_renovation: "Under Renovation",
        decommissioned: "Decommissioned"
      };
      
      filtered = filtered.filter(property => {
        const status = property["Status"] || property.status || '';
        return status.toLowerCase() === activeTab || status === tabStatusMap[activeTab];
      });
    }

    if (searchTerm) {
      filtered = filtered.filter(property => {
        const name = property["Name"] || property.name || '';
        const address = property["Address"] || property.address || '';
        const manager = property["Property Manager"] || property.property_manager || '';
        
        return name.toLowerCase().includes(searchTerm.toLowerCase()) ||
               address.toLowerCase().includes(searchTerm.toLowerCase()) ||
               manager.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }

    setFilteredProperties(filtered);
  }, [propertiesWithOccupancy, searchTerm, activeTab]);

  useEffect(() => {
    filterProperties();
  }, [filterProperties]);

  const handleSubmit = async (propertyData) => {
    try {
      if (editingProperty) {
        const { error } = await supabase
          .from('properties')
          .update(propertyData)
          .eq('ID', editingProperty["ID"] || editingProperty.id);

        if (error) throw error;
      } else {
        // Generate UUID for new property
        const insertData = {
          ...propertyData,
          ID: crypto.randomUUID()
        };
        
        const { error } = await supabase
          .from('properties')
          .insert([insertData]);

        if (error) throw error;
      }
      
      setShowForm(false);
      setEditingProperty(null);
      window.location.reload();
    } catch (error) {
      console.error("Error saving property:", error);
      alert("Error saving property: " + error.message);
    }
  };

  const handleEdit = (property) => {
    setEditingProperty(property);
    setShowForm(true);
    setViewingProperty(null);
  };

  const handleViewDetails = (property) => {
    setViewingProperty(property);
    setShowForm(false);
    setEditingProperty(null);
  };

  const handleDelete = (property) => {
    const propertyName = property["Name"] || property.name;
    if (window.confirm(`Are you sure you want to delete "${propertyName}"? This action cannot be undone.`)) {
      confirmDelete(property);
    }
  };

  const confirmDelete = async (property) => {
    if (property) {
      try {
        // Soft delete - mark as deleted instead of removing from database
        const { error } = await supabase
          .from('properties')
          .update({
            "Deleted": true,
            "Deleted Date": new Date().toISOString(),
            "Deleted By": currentUser?.email || currentUser?.Email || "Unknown"
          })
          .eq('ID', property["ID"] || property.id);

        if (error) throw error;
        
        console.log(`Property ${property["ID"] || property.id} soft deleted successfully.`);
        setPropertyToDelete(null);
        setViewingProperty(null);
        window.location.reload();
      } catch (error) {
        console.error("Error deleting property:", error);
        alert("Error deleting property: " + error.message);
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

    const formatFacilities = (facilities) => {
      if (!facilities || facilities.length === 0) return "[]";
      return JSON.stringify(facilities);
    };

    const formatPropertyType = (type) => {
      const typeMap = {
        'Shared': 'Shared',
        'En Suite Rooms': 'En Suite Rooms',
        'Shared/En Suite Mixed': 'Shared/En Suite Mixed',
        'Self Contained': 'Self Contained',
        'Apartment': 'Apartment'
      };
      return typeMap[type] || 'Shared';
    };

    const formatMaintenanceStatus = (status) => {
      const statusMap = {
        'Good': 'Good',
        'Needs Attention': 'Needs Attention',
        'Under Repair': 'Under Repair',
        'Major Works Required': 'Major Works Required'
      };
      return statusMap[status] || 'Good';
    };

    const formatStatus = (status) => {
      const statusMap = {
        'Active': 'Active',
        'Temporarily Closed': 'Temporarily Closed',
        'Under Renovation': 'Under Renovation',
        'Decommissioned': 'Decommissioned'
      };
      return statusMap[status] || 'Active';
    };

    const formatSupportWorker = (worker) => {
      if (!worker || worker === 'none' || worker === 'None') return "";
      return worker;
    };

    const headers = [
      "ID",
      "Name",
      "Address",
      "Property Type",
      "Total Capacity",
      "Current Occupancy",
      "Property Manager",
      "Support Worker",
      "Maintenance Status",
      "Weekly Rent",
      "Monthly Service Charge",
      "Facilities",
      "Accessibility Features",
      "Last Inspection Date",
      "Next Inspection Due",
      "Contact Phone",
      "Emergency Contact",
      "Status",
      "Notes",
      "Created Date",
      "Updated Date",
      "Created By",
      "Deleted",
      "Deleted Date",
      "Deleted By"
    ];

    const rows = filteredProperties.map(property => [
      property["ID"] || property.id || "",
      property["Name"] || property.name || "",
      property["Address"] || property.address || "",
      formatPropertyType(property["Property Type"] || property.property_type),
      property["Total Capacity"] || property.total_capacity || "",
      property.current_occupancy || 0,
      property["Property Manager"] || property.property_manager || "",
      formatSupportWorker(property["Support Worker"] || property.support_worker),
      formatMaintenanceStatus(property["Maintenance Status"] || property.maintenance_status),
      property["Rent Per Week"] || property.rent_per_week || "",
      property["Service Charge Per Month"] || property.service_charge_per_month || "",
      formatFacilities(property["Facilities"] || property.facilities),
      property["Accessibility Features"] || property.accessibility_features || "",
      formatDate(property["Last Inspection Date"] || property.last_inspection_date),
      formatDate(property["Next Inspection Due"] || property.next_inspection_due),
      property["Contact Phone"] || property.contact_phone || "",
      property["Emergency Contact"] || property.emergency_contact || "",
      formatStatus(property["Status"] || property.status),
      property["Notes"] || property.notes || "",
      formatDateTime(property["Created Date"] || property.created_date),
      formatDateTime(property["Updated Date"] || property.updated_date),
      property["Created By"] || property.created_by || "",
      property["Deleted"] ? "Yes" : "No",
      formatDateTime(property["Deleted Date"] || property.deleted_date),
      property["Deleted By"] || property.deleted_by || ""
    ]);

    const escapeCSV = (value) => {
      if (value === null || value === undefined) return '';
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n') || stringValue.includes('\r')) {
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
    link.setAttribute('download', `properties_export_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log("✅ Properties CSV export completed successfully");
  };

  const getStatusColor = (status) => {
    const normalizedStatus = (status || '').toLowerCase();
    const colors = {
      active: "bg-green-100 text-green-800 border-green-200",
      temporarily_closed: "bg-yellow-100 text-yellow-800 border-yellow-200",
      'temporarily closed': "bg-yellow-100 text-yellow-800 border-yellow-200",
      under_renovation: "bg-blue-100 text-blue-800 border-blue-200",
      'under renovation': "bg-blue-100 text-blue-800 border-blue-200",
      decommissioned: "bg-gray-100 text-gray-800 border-gray-200"
    };
    return colors[normalizedStatus] || colors.active;
  };

  const getMaintenanceColor = (status) => {
    const normalizedStatus = (status || '').toLowerCase();
    const colors = {
      good: "bg-green-100 text-green-800",
      needs_attention: "bg-yellow-100 text-yellow-800",
      'needs attention': "bg-yellow-100 text-yellow-800",
      under_repair: "bg-orange-100 text-orange-800",
      'under repair': "bg-orange-100 text-orange-800",
      major_works_required: "bg-red-100 text-red-800",
      'major works required': "bg-red-100 text-red-800"
    };
    return colors[normalizedStatus] || colors.good;
  };

  const getOccupancyColor = (current, total) => {
    if (total === 0) return "bg-gray-100 text-gray-800";
    const percentage = (current / total) * 100;
    if (percentage >= 90) return "bg-green-100 text-green-800";
    if (percentage >= 75) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Properties</h1>
          <p className="text-slate-600">Manage supported housing properties and their details</p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={exportToCSV}
            variant="outline"
            className="flex items-center gap-2"
            disabled={loading || filteredProperties.length === 0}
          >
            <Download className="w-4 h-4" />
            Export to CSV
          </Button>
          <Button
            onClick={() => setShowForm(true)}
            className="bg-teal-600 hover:bg-teal-700 shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Property
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search properties by name, address, or manager..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:grid-cols-5">
          <TabsTrigger value="all">All Properties</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="temporarily_closed">Temporarily Closed</TabsTrigger>
          <TabsTrigger value="under_renovation">Under Renovation</TabsTrigger>
          <TabsTrigger value="decommissioned">Decommissioned</TabsTrigger>
        </TabsList>
      </Tabs>

      {showForm && (
        <PropertyForm
          property={editingProperty}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingProperty(null);
          }}
        />
      )}

      {viewingProperty && (
        <PropertyDetailModal
          property={viewingProperty}
          accommodations={accommodations}
          residents={residents}
          getStatusColor={getStatusColor}
          getMaintenanceColor={getMaintenanceColor}
          onClose={() => setViewingProperty(null)}
          onEdit={(property) => {
            setViewingProperty(null);
            handleEdit(property);
          }}
          onDelete={handleDelete}
          isAdmin={true}
        />
      )}

      {loading ? (
        <div className="text-center py-12">
          <p className="text-slate-500">Loading properties...</p>
        </div>
      ) : filteredProperties.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Building2 className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No properties found</h3>
            <p className="text-slate-500 mb-4">
              {searchTerm ? "Try adjusting your search terms" : "Get started by adding your first property"}
            </p>
            {!searchTerm && (
              <Button onClick={() => setShowForm(true)} className="bg-teal-600 hover:bg-teal-700">
                <Plus className="w-4 h-4 mr-2" />
                Add First Property
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProperties.map((property) => (
            <PropertyCard
              key={property["ID"] || property.id}
              property={property}
              accommodations={accommodations}
              residents={residents}
              onEdit={handleEdit}
              onViewDetails={handleViewDetails}
              getStatusColor={getStatusColor}
              getMaintenanceColor={getMaintenanceColor}
              getOccupancyColor={getOccupancyColor}
              onDelete={handleDelete}
              isAdmin={true}
            />
          ))}
        </div>
      )}
    </div>
  );
}
