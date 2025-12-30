"use client"

import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Shield, Download } from "lucide-react";
import { format } from "date-fns";
import IncidentForm from "@/components/Incidents/IncidentForm";
import IncidentCard from "@/components/Incidents/IncidentCard";
import IncidentDetailModal from "@/components/Incidents/IncidentDetailModal";

export default function IncidentsSupabase() {
  const [incidents, setIncidents] = useState([]);
  const [residents, setResidents] = useState([]);
  const [users, setUsers] = useState([]);
  const [properties, setProperties] = useState([]);
  const [filteredIncidents, setFilteredIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingIncident, setEditingIncident] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [viewingIncident, setViewingIncident] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  // Transform status from any format to database format
  const transformStatus = (status) => {
    if (!status) return 'Open';
    const statusMap = {
      'open': 'Open',
      'Open': 'Open',
      'under_investigation': 'Under Investigation',
      'Under Investigation': 'Under Investigation',
      'resolved': 'Resolved',
      'Resolved': 'Resolved',
      'closed': 'Closed',
      'Closed': 'Closed'
    };
    return statusMap[status] || 'Open';
  };

  // Transform status for filtering (lowercase with underscores)
  const normalizeStatusForFilter = (status) => {
    if (!status) return 'open';
    return status.toLowerCase().replace(/ /g, '_');
  };

  const filterIncidents = useCallback(() => {
    let filtered = incidents;

    if (activeTab !== "all") {
      filtered = filtered.filter(incident => {
        const incidentStatus = normalizeStatusForFilter(incident.Status || incident.status);
        return incidentStatus === activeTab;
      });
    }

    if (searchTerm) {
      filtered = filtered.filter(incident =>
        (incident.Description || incident.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (incident.Incident_Type || incident.incident_type || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (incident.Location || incident.location || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredIncidents(filtered);
  }, [incidents, searchTerm, activeTab]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterIncidents();
  }, [filterIncidents]);

  const loadData = async () => {
    setLoading(true);
    console.log("🔵 Starting to load incidents from Supabase...");

    try {
      // Load current user
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('email', authUser.email)
          .single();
        setCurrentUser(userData);
        console.log("👤 Current user:", userData?.email);
      }

      // Load incidents with direct Supabase query
      console.log("📊 Fetching incidents from Supabase...");
      const { data: incidentsData, error: incidentsError } = await supabase
        .from('incidents')
        .select('*')
        .order('"Incident Date"', { ascending: false });

      console.log("📊 Raw incidents data:", incidentsData);
      console.log("❌ Incidents error:", incidentsError);

      if (incidentsError) {
        console.error("❌ Error loading incidents:", incidentsError);
        throw incidentsError;
      }
      
      // Filter out soft-deleted incidents (only exclude if explicitly marked as deleted)
      const activeIncidents = (incidentsData || []).filter(i => {
        const isDeleted = i.Deleted || i["Deleted"];
        console.log(`Checking incident ${i.ID || i.id}: Deleted=${isDeleted}`);
        return isDeleted !== true;
      });
      console.log(`✅ Loaded ${activeIncidents.length} incidents (filtered out ${(incidentsData?.length || 0) - activeIncidents.length} deleted)`);

      // Load residents
      const { data: residentsData, error: residentsError } = await supabase
        .from('residents')
        .select('*');

      if (residentsError) throw residentsError;
      console.log(`✅ Loaded ${residentsData?.length || 0} residents`);

      // Load properties
      const { data: propertiesData, error: propertiesError } = await supabase
        .from('properties')
        .select('*');

      if (propertiesError) throw propertiesError;
      console.log(`✅ Loaded ${propertiesData?.length || 0} properties`);

      // Load users
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*');

      if (usersError) throw usersError;

      const activeUsers = usersData.filter(user => {
        const name = user?.Full_Name?.trim() || user?.full_name?.trim() || '';
        return (user.Is_Active !== false && user.is_active !== false) &&
               name &&
               !['Tair', 'Iveta lobinate', 'amit noach'].includes(name) &&
               !name.toLowerCase().includes('test') &&
               (user.Email || user.email) &&
               (user.ID || user.id);
      });
      console.log(`✅ Loaded ${activeUsers.length} active users`);

      setIncidents(activeIncidents);
      setResidents(residentsData || []);
      setProperties(propertiesData || []);
      setUsers(activeUsers);

    } catch (error) {
      console.error("❌ Critical error loading data:", error);
      alert("Error loading incidents: " + error.message + "\nCheck browser console for details.");
      setIncidents([]);
      setResidents([]);
      setProperties([]);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (incidentData) => {
    try {
      // Add logged_by field with current user's name if not already present
      if (!incidentData.Logged_By && currentUser?.Full_Name) {
        incidentData.Logged_By = currentUser.Full_Name;
      }

      if (editingIncident) {
        const { error } = await supabase
          .from('incidents')
          .update(incidentData)
          .eq('ID', editingIncident.ID || editingIncident.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('incidents')
          .insert([incidentData]);
        
        if (error) throw error;
      }
      
      setShowForm(false);
      setEditingIncident(null);
      loadData();
    } catch (error) {
      console.error("Error saving incident:", error);
      alert("Error saving incident: " + error.message);
    }
  };

  const handleEdit = (incident) => {
    setEditingIncident(incident);
    setShowForm(true);
  };

  const handleViewDetails = (incident) => {
    setViewingIncident(incident);
  };

  const handleDelete = async (incident) => {
    if (window.confirm(`Are you sure you want to delete this incident? It will be moved to deleted entries.`)) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        const { error } = await supabase
          .from('incidents')
          .update({
            "Deleted": true,
            "Deleted Date": new Date().toISOString(),
            "Deleted By": user?.email || 'unknown'
          })
          .eq('ID', incident.ID || incident.id);

        if (error) throw error;
        console.log(`✅ Soft deleted incident ${incident.ID || incident.id}`);
        setViewingIncident(null);
        await loadData();
      } catch (error) {
        console.error("Error deleting incident:", error);
        alert("Error deleting incident: " + error.message);
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

    const getResidentNameForExport = (residentId) => {
      const resident = residents.find(r => (r.ID || r.id) === residentId);
      if (!resident) return "";
      const firstName = resident["First Name"] || resident.first_name || "";
      const lastName = resident["Last Name"] || resident.last_name || "";
      return `${firstName} ${lastName}`.trim();
    };

    const getPropertyNameForExport = (residentId) => {
      const resident = residents.find(r => (r.ID || r.id) === residentId);
      if (!resident?.Property_Id && !resident?.property_id && !resident?.["Property ID"]) return "";
      const propertyId = resident["Property ID"] || resident.Property_Id || resident.property_id;
      const property = properties.find(p => (p.ID || p.id) === propertyId);
      return (property?.Name || property?.name) || "";
    };

    const formatStaffMembers = (staffMembers) => {
      if (!staffMembers || staffMembers.length === 0) return "";
      return staffMembers.join('; ');
    };

    const headers = [
      "ID",
      "Resident ID",
      "Resident Name",
      "Property",
      "Incident Type",
      "Severity",
      "Incident Date",
      "Location",
      "Description",
      "Action Taken",
      "Follow-up Required",
      "Follow-up Date",
      "Follow-up By",
      "Follow-up Completed",
      "Follow-up Comments",
      "Witnesses",
      "Staff Involved",
      "Staff Members Involved",
      "Authorities Notified",
      "Status",
      "Logged By",
      "Created Date",
      "Updated Date",
      "Created By"
    ];

    const rows = filteredIncidents.map(incident => [
      incident.ID || incident.id || "",
      incident.Resident_Id || incident.resident_id || "",
      getResidentNameForExport(incident.Resident_Id || incident.resident_id),
      getPropertyNameForExport(incident.Resident_Id || incident.resident_id),
      (incident.Incident_Type || incident.incident_type || '').replace(/_/g, ' '),
      incident.Severity || incident.severity || "",
      formatDateTime(incident.Incident_Date || incident.incident_date),
      incident.Location || incident.location || "",
      incident.Description || incident.description || "",
      incident.Action_Taken || incident.action_taken || "",
      (incident.Follow_Up_Required || incident.follow_up_required) ? "Yes" : "No",
      formatDate(incident.Follow_Up_Date || incident.follow_up_date),
      incident.Follow_Up_By_User_Id || incident.follow_up_by_user_id || "",
      (incident.Follow_Up_Completed || incident.follow_up_completed) ? "Yes" : "No",
      incident.Follow_Up_Comments || incident.follow_up_comments || "",
      incident.Witnesses || incident.witnesses || "",
      (incident.Staff_Involved || incident.staff_involved) ? "Yes" : "No",
      formatStaffMembers(incident.Staff_Members_Involved || incident.staff_members_involved),
      (incident.Authorities_Notified || incident.authorities_notified) ? "Yes" : "No",
      (incident.Status || incident.status || '').replace(/_/g, ' '),
      incident.Logged_By || incident.logged_by || "",
      formatDateTime(incident.Created_Date || incident.created_date),
      formatDateTime(incident.Updated_Date || incident.updated_date),
      incident.Created_By || incident.created_by || ""
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
    link.setAttribute('download', `incidents_export_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getSeverityColor = (severity) => {
    const normalizedSeverity = (severity || '').toLowerCase();
    const colors = {
      low: "bg-green-100 text-green-800 border-green-200",
      medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
      high: "bg-orange-100 text-orange-800 border-orange-200",
      critical: "bg-red-100 text-red-800 border-red-200"
    };
    return colors[normalizedSeverity] || colors.medium;
  };

  const getStatusColor = (status) => {
    const normalizedStatus = normalizeStatusForFilter(status);
    const colors = {
      open: "bg-red-100 text-red-800 border-red-200",
      under_investigation: "bg-yellow-100 text-yellow-800 border-yellow-200",
      resolved: "bg-blue-100 text-blue-800 border-blue-200",
      closed: "bg-gray-100 text-gray-800 border-gray-200"
    };
    return colors[normalizedStatus] || colors.open;
  };

  const getResidentName = (residentId) => {
    const resident = residents.find(r => (r.ID || r.id) === residentId);
    if (!resident) return "Unknown";
    
    // Handle both field name formats
    const firstName = resident["First Name"] || resident.first_name || "";
    const lastName = resident["Last Name"] || resident.last_name || "";
    
    return `${firstName} ${lastName}`.trim() || "Unknown";
  };

  const getPropertyName = (residentId) => {
    const resident = residents.find(r => (r.ID || r.id) === residentId);
    if (!resident?.Property_Id && !resident?.property_id && !resident?.["Property ID"]) return null;
    
    const propertyId = resident["Property ID"] || resident.Property_Id || resident.property_id;
    const property = properties.find(p => (p.ID || p.id) === propertyId);
    
    return (property?.Name || property?.name) || null;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 px-6 pt-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Incidents (Supabase)</h1>
          <p className="text-slate-600">Track and manage incidents across your supported housing</p>
          {currentUser && (
            <p className="text-xs text-slate-400 mt-1">Logged in as: {currentUser.Email || currentUser.email}</p>
          )}
        </div>
        <div className="flex gap-3">
          <Button
            onClick={exportToCSV}
            variant="outline"
            className="flex items-center gap-2"
            disabled={loading || filteredIncidents.length === 0}
          >
            <Download className="w-4 h-4" />
            Export to CSV
          </Button>
          <Button
            onClick={() => setShowForm(true)}
            className="bg-red-600 hover:bg-red-700 shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Report Incident
          </Button>
        </div>
      </div>

      <Card className="mb-6 mx-6">
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search incidents by description, type, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <div className="px-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:grid-cols-5">
            <TabsTrigger value="all">All Incidents ({incidents.length})</TabsTrigger>
            <TabsTrigger value="open">Open</TabsTrigger>
            <TabsTrigger value="under_investigation">Investigating</TabsTrigger>
            <TabsTrigger value="resolved">Resolved</TabsTrigger>
            <TabsTrigger value="closed">Closed</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {showForm && (
        <div className="px-6">
          <IncidentForm
            incident={editingIncident}
            residents={residents}
            users={users}
            currentUser={currentUser}
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowForm(false);
              setEditingIncident(null);
            }}
          />
        </div>
      )}

      {viewingIncident && (
        <IncidentDetailModal
          incident={viewingIncident}
          getSeverityColor={getSeverityColor}
          getStatusColor={getStatusColor}
          getResidentName={getResidentName}
          getPropertyName={getPropertyName}
          onClose={() => setViewingIncident(null)}
          onEdit={(incident) => {
            setViewingIncident(null);
            handleEdit(incident);
          }}
          onDelete={handleDelete}
        />
      )}

      {loading ? (
        <div className="px-6 text-center py-12">
          <p className="text-slate-500">Loading incidents...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 px-6">
          {filteredIncidents.map((incident) => (
            <IncidentCard
              key={incident.ID || incident.id}
              incident={incident}
              onEdit={handleEdit}
              onViewDetails={handleViewDetails}
              getSeverityColor={getSeverityColor}
              getStatusColor={getStatusColor}
              getResidentName={getResidentName}
              getPropertyName={getPropertyName}
            />
          ))}
        </div>
      )}

      {filteredIncidents.length === 0 && !loading && (
        <Card className="mx-6">
          <CardContent className="p-12 text-center">
            <Shield className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No incidents found</h3>
            <p className="text-slate-500 mb-4">
              {searchTerm ? "Try adjusting your search terms" : "No incidents have been reported yet"}
            </p>
            {!searchTerm && (
              <Button onClick={() => setShowForm(true)} className="bg-red-600 hover:bg-red-700">
                <Plus className="w-4 h-4 mr-2" />
                Report First Incident
              </Button>
            )}
            <div className="mt-4 text-xs text-slate-400">
              Total incidents in system: {incidents.length}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}