"use client";

export const dynamic = "force-dynamic";
import { useUser } from "@clerk/nextjs";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Home, Building2, MapPin, ChevronDown, ChevronRight, AlertTriangle, Download } from "lucide-react";
import AccommodationForm_Supabase from "@/components/accommodations/AccommodationForm";
import AccommodationCard from "@/components/accommodations/AccommodationCard";
import { format } from "date-fns";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import AccommodationDetailModal from "@/components/accommodations/AccommodationDetailModal";
 
// pages/accommodations.jsx


 export default function Accommodations() {
  const { user } = useUser();
  const [accommodations, setAccommodations] = useState([]);
  const [properties, setProperties] = useState([]);
  const [residents, setResidents] = useState([]);
  const [filteredAccommodations, setFilteredAccommodations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAccommodation, setEditingAccommodation] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [expandedProperties, setExpandedProperties] = useState(new Set());
  const [viewingAccommodation, setViewingAccommodation] = useState(null);

  const loadData = async () => {
    try {
      console.log("🔄 [SUPABASE] Loading accommodations data...");
      
      const [accommodationsRes, propertiesRes, residentsRes] = await Promise.all([
        supabase.from('accommodations').select('*').or('Deleted.is.null,Deleted.eq.false').order('Created Date', { ascending: false }),
        supabase.from('properties').select('*').or('Deleted.is.null,Deleted.eq.false'),
        supabase.from('residents').select('*').or('Deleted.is.null,Deleted.eq.false')
      ]);

      if (accommodationsRes.error) throw accommodationsRes.error;
      if (propertiesRes.error) throw propertiesRes.error;
      if (residentsRes.error) throw residentsRes.error;

      console.log("✅ [SUPABASE] Loaded accommodations:", accommodationsRes.data?.length);
      console.log("✅ [SUPABASE] Loaded properties:", propertiesRes.data?.length);
      console.log("✅ [SUPABASE] Loaded residents:", residentsRes.data?.length);

      const propertiesData = (propertiesRes.data || []).sort((a, b) => {
        const aIsRyland = a.Name?.toLowerCase().includes('ryland');
        const bIsRyland = b.Name?.toLowerCase().includes('ryland');
        if (aIsRyland && !bIsRyland) return 1;
        if (!aIsRyland && bIsRyland) return -1;
        return a.Name?.localeCompare(b.Name) || 0;
      });
      
      const activeProperties = propertiesData.filter(property => property.Status === 'Active');
      
      setAccommodations(accommodationsRes.data || []);
      setProperties(activeProperties);
      setResidents(residentsRes.data || []);
      setExpandedProperties(new Set(activeProperties.map(p => p.ID)));
      
      console.log("✅ [SUPABASE] All data loaded successfully");
    } catch (error) {
      console.error("❌ [SUPABASE] Error loading data:", error);
      setAccommodations([]);
      setProperties([]);
      setResidents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const accommodationsWithOccupancy = useMemo(() => {
    console.log("🔄 [SUPABASE] Calculating occupancy for accommodations...");
    console.log("   Total accommodations:", accommodations.length);
    console.log("   Total residents:", residents.length);
    
    return accommodations.map(accommodation => {
      const accommodationId = accommodation.ID;
      
      // Count active residents in this accommodation
      const activeResidentsCount = residents.filter(resident => {
        const residentAccommodationId = resident["Accommodation ID"];
        const residentStatus = (resident.Status || '').toLowerCase();
        const isMatch = residentAccommodationId === accommodationId && residentStatus === 'active';
        
        if (isMatch) {
          console.log(`   ✅ [SUPABASE] Resident "${resident["First Name"]} ${resident["Last Name"]}" in ${accommodation["Room Number"]}`);
        }
        return isMatch;
      }).length;
      
      console.log(`   [SUPABASE] ${accommodation["Room Number"]} (ID: ${accommodationId}): ${activeResidentsCount} active resident(s)`);
      
      // CRITICAL FIX: Override availability status if there are active residents
      let overriddenStatus = accommodation["Availability_Status"] || accommodation["Availability Status"] || accommodation.availability_status;
      if (activeResidentsCount > 0 && overriddenStatus?.toLowerCase() === 'available') {
        console.log(`   ⚠️  OVERRIDING ${accommodation["Room Number"]} status from ${overriddenStatus} to occupied`);
        overriddenStatus = 'occupied';
      }
      
      return {
        ...accommodation,
        current_occupancy: activeResidentsCount,
        "Availability_Status": overriddenStatus,
        "Availability Status": overriddenStatus
      };
    });
  }, [accommodations, residents]);

  const filterAccommodations = useCallback(() => {
    let filtered = accommodationsWithOccupancy;

    if (activeTab !== "all") {
      filtered = filtered.filter(accommodation => {
        const status = accommodation["Availability_Status"] || accommodation["Availability Status"] || accommodation.availability_status || "";
        return status.toLowerCase() === activeTab.toLowerCase();
      });
    }

    if (searchTerm) {
      filtered = filtered.filter(accommodation => {
        const property = properties.find(p => p.ID === accommodation["Property ID"]);
        const resident = residents.find(r => r.ID === accommodation["Current Resident ID"]);
        
        return accommodation["Room Number"]?.toLowerCase().includes(searchTerm.toLowerCase()) ||
               accommodation["Accommodation Type"]?.toLowerCase().includes(searchTerm.toLowerCase()) ||
               property?.Name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
               resident?.["First Name"]?.toLowerCase().includes(searchTerm.toLowerCase()) ||
               resident?.["Last Name"]?.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }

    setFilteredAccommodations(filtered);
  }, [accommodationsWithOccupancy, searchTerm, activeTab, properties, residents]);

  useEffect(() => {
    filterAccommodations();
  }, [filterAccommodations]);

  const handleSubmit = async (accommodationData) => {
    try {
      if (editingAccommodation) {
        const { error } = await supabase.from('accommodations').update(accommodationData).eq('ID', editingAccommodation.ID);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('accommodations').insert([accommodationData]);
        if (error) throw error;
      }
      setShowForm(false);
      setEditingAccommodation(null);
      await loadData();
    } catch (error) {
      console.error("Error saving accommodation:", error);
      alert("Error saving accommodation: " + error.message);
    }
  };

  const handleEdit = (accommodation) => {
    setEditingAccommodation(accommodation);
    setShowForm(true);
  };

  const handleViewDetails = (accommodation) => {
    setViewingAccommodation(accommodation);
  };

  const handleDelete = async (accommodation) => {
    const property = properties.find(p => p.ID === accommodation["Property ID"]);
    const propertyName = property?.Name || "Unknown Property";
    const residentName = accommodation["Current Resident ID"] ? getResidentName(accommodation["Current Resident ID"]) : null;
    
    let message = `Are you sure you want to delete accommodation "${accommodation["Room Number"]}" at ${propertyName}? This action cannot be undone.`;
    if (residentName) {
      message += `\n\nWarning: This accommodation is currently occupied by ${residentName}.`;
    }
    
    if (window.confirm(message)) {
      try {
        const { error } = await supabase.from('accommodations').delete().eq('ID', accommodation.ID);
        if (error) throw error;
        console.log(`Accommodation ${accommodation.ID} deleted successfully.`);
        setViewingAccommodation(null);
        await loadData();
      } catch (error) {
        console.error("Error deleting accommodation:", error);
        alert("Error deleting accommodation: " + error.message);
      }
    }
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

  const getStatusColor = (status) => {
    const statusLower = (status || "").toLowerCase().replace(/_/g, ' ');
    const colors = {
      "available": "bg-green-100 text-green-800 border-green-200",
      "occupied": "bg-blue-100 text-blue-800 border-blue-200",
      "reserved": "bg-yellow-100 text-yellow-800 border-yellow-200",
      "maintenance": "bg-orange-100 text-orange-800 border-orange-200",
      "out of service": "bg-red-100 text-red-800 border-red-200"
    };
    return colors[statusLower] || colors["available"];
  };

  const getConditionColor = (condition) => {
    const conditionLower = (condition || "").toLowerCase().replace(/_/g, ' ');
    const colors = {
      "excellent": "bg-green-100 text-green-800",
      "good": "bg-blue-100 text-blue-800",
      "fair": "bg-yellow-100 text-yellow-800",
      "needs repair": "bg-orange-100 text-orange-800",
      "out of order": "bg-red-100 text-red-800"
    };
    return colors[conditionLower] || colors["good"];
  };

  const getPropertyName = (propertyId) => {
    const property = properties.find(p => p.ID === propertyId);
    return property?.Name || "Unknown Property";
  };

  const getResidentName = (residentId) => {
    const resident = residents.find(r => r.ID === residentId);
    return resident ? `${resident["First Name"]} ${resident["Last Name"]}` : null;
  };

  const getAccommodationsByProperty = () => {
    const grouped = {};
    const validAccommodations = filteredAccommodations.filter(accommodation => {
      return accommodation["Property ID"] && properties.find(p => p.ID === accommodation["Property ID"]);
    });
    
    validAccommodations.forEach(accommodation => {
      const propertyId = accommodation["Property ID"];
      if (!grouped[propertyId]) {
        grouped[propertyId] = [];
      }
      grouped[propertyId].push(accommodation);
    });
    return grouped;
  };

  const accommodationsByProperty = getAccommodationsByProperty();

  const getPropertyOccupancy = (propertyId) => {
    const propertyAccommodations = accommodationsWithOccupancy.filter(a => 
      a["Property ID"] === propertyId && properties.some(p => p.ID === a["Property ID"])
    );
    const totalCapacity = propertyAccommodations.reduce((sum, a) => sum + (a["Max Occupancy"] || 0), 0);
    const currentOccupancy = propertyAccommodations.reduce((sum, a) => sum + (a.current_occupancy || 0), 0);
    return { currentOccupancy, totalCapacity };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 px-6 pt-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Accommodation Units</h1>
          <p className="text-slate-600">Manage individual units and rooms within your properties</p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => setShowForm(true)}
            className="bg-indigo-600 hover:bg-indigo-700 shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Unit
          </Button>
        </div>
      </div>

      <Card className="mb-6 mx-6">
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search units by room number, type, property, or resident..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <div className="px-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:grid-cols-6">
            <TabsTrigger value="all">All Units</TabsTrigger>
            <TabsTrigger value="available">Available</TabsTrigger>
            <TabsTrigger value="occupied">Occupied</TabsTrigger>
            <TabsTrigger value="reserved">Reserved</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
            <TabsTrigger value="out_of_service">Out of Service</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {showForm && (
        <div className="px-6">
          <AccommodationForm_Supabase
            accommodation={editingAccommodation}
            properties={properties}
            residents={residents}
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowForm(false);
              setEditingAccommodation(null);
            }}
          />
        </div>
      )}

      <div className="space-y-6 px-6">
        {properties.map((property) => {
          const propertyAccommodations = accommodationsByProperty[property.ID] || [];
          const { currentOccupancy, totalCapacity } = getPropertyOccupancy(property.ID);
          
          if (propertyAccommodations.length === 0 && (searchTerm || activeTab !== "all")) {
            return null;
          }

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
                        <div className="w-12 h-12 bg-gradient-to-r from-teal-500 to-blue-500 rounded-xl flex items-center justify-center shadow-sm">
                          <Building2 className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-xl text-slate-900">
                            {property.Name}
                          </CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <MapPin className="w-4 h-4 text-slate-400" />
                            <span className="text-sm text-slate-600 truncate" title={property.Address}>{property.Address}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="flex items-center gap-2 mb-1">
                            <Home className="w-4 h-4 text-slate-500" />
                            <span className="text-sm font-medium text-slate-700">
                              {currentOccupancy}/{totalCapacity} occupied
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Home className="w-4 h-4 text-slate-500" />
                            <span className="text-sm text-slate-600">
                              {propertyAccommodations.length} unit{propertyAccommodations.length !== 1 ? 's' : ''} shown
                            </span>
                          </div>
                        </div>
                        {expandedProperties.has(property.ID) ? (
                          <ChevronDown className="w-5 h-5 text-slate-400" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    {propertyAccommodations.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {propertyAccommodations.map((accommodation) => {
                          const roomNumberCounts = propertyAccommodations.reduce((acc, curr) => {
                            if(curr["Room Number"]) {
                              acc[curr["Room Number"]] = (acc[curr["Room Number"]] || 0) + 1;
                            }
                            return acc;
                          }, {});
                          
                          return (
                            <AccommodationCard
                              key={accommodation.ID}
                              accommodation={accommodation}
                              onEdit={handleEdit}
                              onViewDetails={handleViewDetails}
                              onDelete={handleDelete}
                              getStatusColor={getStatusColor}
                              getConditionColor={getConditionColor}
                              getPropertyName={getPropertyName}
                              getResidentName={getResidentName}
                              isDuplicate={accommodation["Room Number"] && roomNumberCounts[accommodation["Room Number"]] > 1}
                              isAdmin={true}
                              properties={properties}
                              residents={residents}
                            />
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-slate-500">
                        <Home className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                        <p>No accommodation units found for this property</p>
                        <p className="text-sm">
                          {searchTerm || activeTab !== "all" 
                            ? "Try adjusting your search or filters" 
                            : "Add accommodation units for this property"}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          );
        })}

        {accommodations.some(a => !a["Property ID"] || !properties.find(p => p.ID === a["Property ID"])) && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-amber-800">Data Integrity Issue</h3>
                  <p className="text-sm text-amber-700 mt-1">
                    Some accommodation units are missing valid property associations or are linked to non-existent properties and are therefore hidden from view. 
                    Please check the data and ensure all units are properly linked to properties.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {properties.length === 0 && !loading && (
        <Card className="mx-6">
          <CardContent className="p-12 text-center">
            <Building2 className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No properties found</h3>
            <p className="text-slate-500 mb-4">
              You need to add properties first before creating accommodation units
            </p>
            <Button className="bg-teal-600 hover:bg-teal-700">
              <Plus className="w-4 h-4 mr-2" />
              Add First Property
            </Button>
          </CardContent>
        </Card>
      )}

      {properties.length > 0 && Object.keys(accommodationsByProperty).length === 0 && !loading && (
        <Card className="mx-6">
          <CardContent className="p-12 text-center">
            <Home className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No accommodation units found</h3>
            <p className="text-slate-500 mb-4">
              {searchTerm || activeTab !== "all" 
                ? "Try adjusting your search terms or filters" 
                : "Get started by adding accommodation units to your properties"}
            </p>
            {!searchTerm && activeTab === "all" && (
              <Button onClick={() => setShowForm(true)} className="bg-indigo-600 hover:bg-indigo-700">
                <Plus className="w-4 h-4 mr-2" />
                Add First Unit
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {viewingAccommodation && (
        <AccommodationDetailModal
          accommodation={viewingAccommodation}
          properties={properties}
          residents={residents}
          getStatusColor={getStatusColor}
          getConditionColor={getConditionColor}
          getPropertyName={getPropertyName}
          getResidentName={getResidentName}
          onClose={() => setViewingAccommodation(null)}
          onEdit={(accommodation) => {
            setViewingAccommodation(null);
            handleEdit(accommodation);
          }}
          onDelete={handleDelete}
          isAdmin={true}
        />
      )}
    </div>
  );
}