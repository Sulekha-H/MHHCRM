"use client"

import { useUser } from "@clerk/nextjs";
import React, { useState, useEffect, useCallback } from "react";
import { useClerkSupabaseClient } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Edit, FileCheck, AlertTriangle, Calendar, ExternalLink, Building2, MapPin, ChevronDown, ChevronRight, Download } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import ComplianceForm_Supabase from "@/components/compliance/ComplianceForm";
import ComplianceDetailModal from "@/components/compliance/ComplianceDetailModal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

// Helper function to normalize column names from Supabase
const normalizeData = (data) => {
  if (!data) return data;
  if (Array.isArray(data)) return data.map(normalizeData);
  
  const normalized = {};
  Object.keys(data).forEach(key => {
    // Convert "Property ID" to "property_id", "ID" to "id", etc.
    const normalizedKey = key.toLowerCase().replace(/ /g, '_');
    normalized[normalizedKey] = data[key];
  });
  return normalized;
};

export default function Compliance() {

  const { user, setUser } = useUser();
  const supabase = useClerkSupabaseClient()
  const [complianceLogs, setComplianceLogs] = useState([]);
  const [properties, setProperties] = useState([])
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingLog, setEditingLog] = useState(null);
  const [viewingLog, setViewingLog] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [expandedProperties, setExpandedProperties] = useState(new Set());
  const [currentUser, setCurrentUser] = useState(null);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState([]); // Add this line

useEffect(() => {
  if (!supabase) return;

  // Wrap async call inside a function
  const fetchData = async () => {
    await loadData();
  };

  fetchData();
}, [supabase]);
  const getPropertyName = useCallback((propertyId) => {
    const property = properties.find(p => p.id === propertyId);
    return property?.name || "Unknown Property";
  }, [properties]);

  const getLoggedByName = useCallback((log) => {
    if (log.logged_by) {
      return log.logged_by;
    }
    
    if (log.created_by) {
      if (user?.email ===log.created_by ){
        return user.fullName || user.firstName; //clerk user info
      }
      return log.created_by.split('@')[0];
    }
    
    return '-';
  }, [user]);

  const filterLogs = useCallback(() => {
    let filtered = complianceLogs;

    if (activeTab !== "all") {
      if (activeTab === "expired") {
        filtered = filtered.filter(log => log.status === "expired" && !log.actioned);
      } else if (activeTab === "expiring") {
        filtered = filtered.filter(log => log.status === "expiring_soon" && !log.actioned);
      } else {
        filtered = filtered.filter(log => log.compliance_type === activeTab);
      }
    }

    if (searchTerm) {
      const lowercasedTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(log =>
        log.certificate_name?.toLowerCase().includes(lowercasedTerm) ||
        getPropertyName(log.property_id)?.toLowerCase().includes(lowercasedTerm) ||
        log.contractor_company?.toLowerCase().includes(lowercasedTerm) ||
        log.certificate_number?.toLowerCase().includes(lowercasedTerm)
      );
    }
    setFilteredLogs(filtered);
  }, [complianceLogs, searchTerm, activeTab, getPropertyName]);

  useEffect(() => {
    filterLogs();
  }, [filterLogs]);

  const getPropertyLogs = (propertyId) => {
    return filteredLogs.filter(log => log.property_id === propertyId);
  };

  const getNextActionDue = (propertyId) => {
    const propertyLogs = complianceLogs.filter(log => log.property_id === propertyId);
    const actionDueDates = propertyLogs
      .filter(log => log.next_action_due && !log.actioned)
      .map(log => new Date(log.next_action_due))
      .sort((a, b) => a - b);
    
    return actionDueDates.length > 0 ? actionDueDates[0] : null;
  };

  const loadData = async () => {
 if (!supabase || !user) return; // Keep the guard as requested
    
   setCurrentUser(user);

    
      const [logsResult, propertiesResult, usersResult] = await Promise.all([
        supabase.from('compliance_logs').select('*').or('Deleted.is.null,Deleted.eq.false').order('"Expiry Date"', { ascending: false }),
        supabase.from('properties').select('*').or('Deleted.is.null,Deleted.eq.false'),
        supabase.from('users').select('*')
      ]);

      console.log('✅ Compliance logs loaded:', logsResult.data?.length || 0);
      console.log('✅ Properties loaded:', propertiesResult.data?.length || 0);
      console.log('✅ Users loaded:', usersResult.data?.length || 0);
      
      if (logsResult.error) console.error('❌ Logs error:', logsResult.error);
      if (propertiesResult.error) console.error('❌ Properties error:', propertiesResult.error);
      if (usersResult.error) console.error('❌ Users error:', usersResult.error);

      // Normalize and add status to logs
      const normalizedLogs = normalizeData(logsResult.data || []).map(log => {
        if (log.expiry_date) {
          const daysUntilExpiry = differenceInDays(new Date(log.expiry_date), new Date());
          if (daysUntilExpiry < 0) {
            log.status = 'expired';
          } else if (daysUntilExpiry <= 30) {
            log.status = 'expiring_soon';
          } else {
            log.status = 'valid';
          }
        }
        return log;
      });

      const normalizedProperties = normalizeData(propertiesResult.data || []).sort((a, b) => {
        const aIsRyland = a.name?.toLowerCase().includes('ryland');
        const bIsRyland = b.name?.toLowerCase().includes('ryland');
        
        if (aIsRyland && !bIsRyland) return 1;
        if (!aIsRyland && bIsRyland) return -1;
        
        return a.name?.localeCompare(b.name) || 0;
      });

      setComplianceLogs(normalizedLogs);
      setProperties(normalizedProperties);
      setUsers(normalizeData(usersResult.data) || []);
      
      setExpandedProperties(new Set(normalizedProperties.map(p => p.id)));
      
      console.log('✅ All data normalized and loaded');
    } catch (error) {
      console.error("❌ Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (logData) => {
    try {
      if (!logData["Logged By"] && currentUser?.email) {
        const userRecord = users.find(u => u.email === currentUser.email);
        logData["Logged By"] = userRecord?.full_name || currentUser.email;
      }

      if (editingLog && editingLog.id) {
        const { error } = await supabase.from('compliance_logs').update(logData).eq('ID', editingLog.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('compliance_logs').insert([logData]);
        if (error) throw error;
      }
      setShowForm(false);
      setEditingLog(null);
      setViewingLog(null);
      loadData();
    } catch (error) {
      console.error("Error saving compliance log:", error);
      alert("Error saving compliance record: " + error.message);
    }
  };

  const handleEdit = (log) => {
    setViewingLog(null);
    setEditingLog(log);
    setShowForm(true);
  };

  const handleViewDetails = (log) => {
    setViewingLog(log);
  };

  const handleDelete = async (log) => {
    if (window.confirm(`Are you sure you want to delete this compliance record for ${getPropertyName(log.property_id)} (${log.certificate_name})? This action cannot be undone.`)) {
      try {
        const { error } = await supabase.from('compliance_logs').update({
          'Deleted': true,
          'Deleted Date': new Date().toISOString(),
          'Deleted By': currentUser?.email || "Unknown User"
        }).eq('"ID"', log.id);
        
        if (error) throw error;
        
        setViewingLog(null);
        loadData();
      } catch (error) {
        console.error("Error deleting compliance record:", error);
        alert("Error deleting compliance record: " + error.message);
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
    const colors = {
      valid: "bg-green-100 text-green-800",
      expiring_soon: "bg-yellow-100 text-yellow-800",
      expired: "bg-red-100 text-red-800",
      pending_renewal: "bg-blue-100 text-blue-800",
      not_required: "bg-gray-100 text-gray-800"
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: "bg-blue-100 text-blue-800",
      medium: "bg-yellow-100 text-yellow-800",
      high: "bg-orange-100 text-orange-800",
      critical: "bg-red-100 text-red-800"
    };
    return colors[priority] || "bg-gray-100 text-gray-800";
  };

  const getComplianceTypeLabel = (type) => {
    const labels = {
      gas_safety: "Gas Safety",
      emergency_lighting: "Emergency Lighting",
      eicr: "EICR",
      pat_tests: "PAT Tests",
      fire_detection_alarm_system: "Fire Detection & Alarm",
      fire_risk_assessment: "Fire Risk Assessment",
      energy_performance: "EPC",
      legionella_risk: "Legionella",
      asbestos_survey: "Asbestos",
      other: "Other"
    };
    return labels[type] || type?.replace(/_/g, ' ');
  };

  const exportToCSV = () => {
    const formatDate = (dateString) => {
      if (!dateString) return null;
      try {
        return format(new Date(dateString), 'yyyy-MM-dd');
      } catch {
        return null;
      }
    };

    const formatDateTime = (dateString) => {
      if (!dateString) return null;
      try {
        return format(new Date(dateString), 'yyyy-MM-dd HH:mm:ss');
      } catch {
        return null;
      }
    };

    const formatBoolean = (value) => {
      if (value === true) return 'TRUE';
      if (value === false) return 'FALSE';
      return 'FALSE';
    };

    const getPropertyDetails = (propertyId, field) => {
      const property = properties.find(p => p.id === propertyId);
      return property ? property[field] || null : null;
    };

    const formatComplianceType = (type) => {
      const typeMap = {
        'gas_safety': 'Gas Safety',
        'emergency_lighting': 'Emergency Lighting',
        'eicr': 'EICR',
        'pat_tests': 'PAT Tests',
        'fire_detection_alarm_system': 'Fire Detection & Alarm System',
        'fire_risk_assessment': 'Fire Risk Assessment',
        'energy_performance': 'EPC',
        'legionella_risk': 'Legionella',
        'asbestos_survey': 'Asbestos',
        'other': 'Other'
      };
      return typeMap[type] || type;
    };

    const formatStatus = (status) => {
      const statusMap = {
        'valid': 'Valid',
        'expiring_soon': 'Expiring Soon',
        'expired': 'Expired',
        'pending_renewal': 'Pending Renewal',
        'not_required': 'Not Required'
      };
      return statusMap[status] || status;
    };

    const formatPriority = (priority) => {
      const priorityMap = {
        'low': 'Low',
        'medium': 'Medium',
        'high': 'High',
        'critical': 'Critical'
      };
      return priorityMap[priority] || priority;
    };

    const headers = [
      "ID",
      "Created Date",
      "Updated Date",
      "Created By",
      "Property ID",
      "Property Name",
      "Property Address",
      "Compliance Type",
      "Certificate Name",
      "Issued Date",
      "Expiry Date",
      "Status",
      "Actioned",
      "Actioned Date",
      "Actioned Notes",
      "Contractor Company",
      "Certificate Number",
      "Cost",
      "Next Action Due",
      "File URL",
      "Notes",
      "Priority",
      "Logged By",
      "Deleted",
      "Deleted Date",
      "Deleted By"
    ];

    const rows = filteredLogs.map(log => [
      log.id || null,
      formatDateTime(log.created_date),
      formatDateTime(log.updated_date),
      log.created_by || null,
      log.property_id || null,
      getPropertyDetails(log.property_id, 'name'),
      getPropertyDetails(log.property_id, 'address'),
      formatComplianceType(log.compliance_type),
      log.certificate_name || null,
      formatDate(log.issued_date),
      formatDate(log.expiry_date),
      formatStatus(log.status),
      formatBoolean(log.actioned),
      formatDate(log.actioned_date),
      log.actioned_notes || null,
      log.contractor_company || null,
      log.certificate_number || null,
      log.cost !== null && log.cost !== undefined ? log.cost : null,
      formatDate(log.next_action_due),
      log.file_url || null,
      log.notes || null,
      formatPriority(log.priority),
      log.logged_by || null,
      formatBoolean(log.deleted),
      formatDateTime(log.deleted_date),
      log.deleted_by || null
    ]);

    const escapeCSV = (value) => {
      if (value === null || value === undefined) return '';
      if (typeof value === 'number') return String(value);
      if (value === 'TRUE' || value === 'FALSE') return value;
      if (value === '') return '';
      
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n') || stringValue.includes('\r')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      
      return stringValue;
    };

    const csvContent = [
      headers.map(h => `"${h}"`).join(','),
      ...rows.map(row => row.map(escapeCSV).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `compliance_logs_export_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log("✅ Compliance logs CSV export completed successfully");
  };

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Property Compliance</h1>
          <p className="text-slate-600">Track property certificates, safety checks, and compliance requirements</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={exportToCSV}
            variant="outline"
            className="flex items-center gap-2"
            disabled={loading || filteredLogs.length === 0}
          >
            <Download className="w-4 h-4" />
            Export to CSV
          </Button>
          <Button onClick={() => { setEditingLog(null); setShowForm(true); }} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Compliance Record
          </Button>
        </div>
      </div>

      {viewingLog && (
        <ComplianceDetailModal
          log={viewingLog}
          getPropertyName={getPropertyName}
          getComplianceTypeLabel={getComplianceTypeLabel}
          getStatusColor={getStatusColor}
          getPriorityColor={getPriorityColor}
          getLoggedByName={getLoggedByName}
          onClose={() => setViewingLog(null)}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {showForm && (
        <ComplianceForm_Supabase
          log={editingLog}
          properties={properties}
          currentUser={currentUser}
          onSubmit={handleSubmit}
          onCancel={() => { setShowForm(false); setEditingLog(null); }}
        />
      )}

      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search by certificate, property, contractor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="flex h-auto flex-wrap justify-start gap-1 p-1">
          <TabsTrigger value="all" className="px-4 py-2 text-sm font-medium">All</TabsTrigger>
          <TabsTrigger value="expired" className="px-4 py-2 text-sm font-medium">Expired</TabsTrigger>
          <TabsTrigger value="expiring" className="px-4 py-2 text-sm font-medium">Expiring</TabsTrigger>
          <TabsTrigger value="gas_safety" className="px-4 py-2 text-sm font-medium">Gas</TabsTrigger>
          <TabsTrigger value="emergency_lighting" className="px-4 py-2 text-sm font-medium">Emergency Lighting</TabsTrigger>
          <TabsTrigger value="eicr" className="px-4 py-2 text-sm font-medium">EICR</TabsTrigger>
          <TabsTrigger value="pat_tests" className="px-4 py-2 text-sm font-medium">PAT Tests</TabsTrigger>
          <TabsTrigger value="fire_detection_alarm_system" className="px-4 py-2 text-sm font-medium">Fire Detection</TabsTrigger>
          <TabsTrigger value="fire_risk_assessment" className="px-4 py-2 text-sm font-medium">Fire Risk Assessment</TabsTrigger>
          <TabsTrigger value="energy_performance" className="px-4 py-2 text-sm font-medium">EPC</TabsTrigger>
          <TabsTrigger value="legionella_risk" className="px-4 py-2 text-sm font-medium">Legionella</TabsTrigger>
          <TabsTrigger value="asbestos_survey" className="px-4 py-2 text-sm font-medium">Asbestos</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="space-y-6">
        {properties.map((property) => {
          const propertyLogs = filteredLogs.filter(log => log.property_id === property.id);
          const totalLogs = complianceLogs.filter(log => log.property_id === property.id).length;
          const expiredLogs = complianceLogs.filter(log => log.property_id === property.id && log.status === 'expired' && !log.actioned).length;
          const expiringSoonLogs = complianceLogs.filter(log => log.property_id === property.id && log.status === 'expiring_soon' && !log.actioned).length;
          const actionedLogs = complianceLogs.filter(log => log.property_id === property.id && log.actioned).length;
          const nextActionDue = getNextActionDue(property.id);
          
          if (propertyLogs.length === 0 && (searchTerm || activeTab !== "all")) {
            return null;
          }

          return (
            <Card key={property.id} className="overflow-hidden">
              <Collapsible 
                open={expandedProperties.has(property.id)}
                onOpenChange={() => toggleProperty(property.id)}
              >
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-sm">
                          <Building2 className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-xl text-slate-900">
                            {property.name}
                          </CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <MapPin className="w-4 h-4 text-slate-400" />
                            <span className="text-sm text-slate-600">{property.address}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="flex items-center gap-2 mb-1">
                            <FileCheck className="w-4 h-4 text-slate-500" />
                            <span className="text-sm font-medium text-slate-700">
                              {totalLogs} certificate{totalLogs !== 1 ? 's' : ''}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs mb-1 flex-wrap">
                            {expiredLogs > 0 && (
                              <Badge className="bg-red-100 text-red-800 text-xs">
                                {expiredLogs} expired
                              </Badge>
                            )}
                            {expiringSoonLogs > 0 && (
                              <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                                {expiringSoonLogs} expiring
                              </Badge>
                            )}
                            {actionedLogs > 0 && (
                              <Badge className="bg-green-100 text-green-800 text-xs">
                                {actionedLogs} actioned
                              </Badge>
                            )}
                            <span className="text-slate-600">
                              {propertyLogs.length} shown
                            </span>
                          </div>
                          {nextActionDue && (
                            <div className="flex items-center gap-2 text-xs">
                              <Calendar className="w-3 h-3 text-orange-500" />
                              <span className="text-orange-700 font-medium">
                                Next Action: {format(nextActionDue, 'MMM d, yyyy')}
                              </span>
                            </div>
                          )}
                        </div>
                        {expandedProperties.has(property.id) ? (
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
                    {propertyLogs.length > 0 ? (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Certificate Type</TableHead>
                              <TableHead>Certificate Name</TableHead>
                              <TableHead>Issued Date</TableHead>
                              <TableHead>Expiry Date</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Contractor</TableHead>
                              <TableHead>Next Action Due</TableHead>
                              <TableHead>Priority</TableHead>
                              <TableHead>Logged By</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {propertyLogs.map((log) => (
                              <TableRow 
                                key={log.id} 
                                className={`hover:bg-slate-50 cursor-pointer ${log.actioned ? 'opacity-60' : ''}`}
                                onClick={() => handleViewDetails(log)}
                              >
                                <TableCell>{getComplianceTypeLabel(log.compliance_type)}</TableCell>
                                <TableCell className="max-w-xs truncate">{log.certificate_name}</TableCell>
                                <TableCell>{log.issued_date ? format(new Date(log.issued_date), "PP") : '-'}</TableCell>
                                <TableCell>
                                  {log.expiry_date ? (
                                    <div className="flex items-center gap-2">
                                      <span>{format(new Date(log.expiry_date), "PP")}</span>
                                      {log.status === 'expired' && !log.actioned && <AlertTriangle className="w-4 h-4 text-red-500" />}
                                      {log.status === 'expiring_soon' && !log.actioned && <Calendar className="w-4 h-4 text-yellow-500" />}
                                    </div>
                                  ) : (
                                    <span className="text-slate-400">No expiry</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-col gap-1">
                                    <Badge className={getStatusColor(log.status)}>
                                      {log.status.replace(/_/g, ' ')}
                                    </Badge>
                                    {log.actioned && (
                                      <Badge className="bg-green-100 text-green-800 text-xs">
                                        ✓ Actioned
                                      </Badge>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="max-w-xs truncate">{log.contractor_company || '-'}</TableCell>
                                <TableCell>
                                  {log.next_action_due && !log.actioned ? format(new Date(log.next_action_due), "PP") : '-'}
                                </TableCell>
                                <TableCell>
                                  <Badge className={getPriorityColor(log.priority)}>
                                    {log.priority}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <span className="text-sm text-purple-700 font-medium">
                                    {getLoggedByName(log)}
                                  </span>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex items-center gap-2 justify-end">
                                    {log.file_url && (
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          window.open(log.file_url, '_blank');
                                        }}
                                      >
                                        <ExternalLink className="w-4 h-4" />
                                      </Button>
                                    )}
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEdit(log);
                                      }}
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-slate-500">
                        <FileCheck className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                        <p>No compliance records found for this property</p>
                        <p className="text-sm">
                          {searchTerm || activeTab !== "all" 
                            ? "Try adjusting your search or filters" 
                            : "Add compliance certificates for this property"}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          );
        })}
      </div>

      {properties.length === 0 && !loading && (
        <Card>
          <CardContent className="p-12 text-center">
            <Building2 className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No properties found</h3>
            <p className="text-slate-500 mb-4">
              Please add properties to track their compliance records.
            </p>
          </CardContent>
        </Card>
      )}

      {properties.length > 0 && filteredLogs.length === 0 && !loading && (
        <Card>
          <CardContent className="p-12 text-center">
            <FileCheck className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No compliance records found</h3>
            <p className="text-slate-500 mb-4">
              {searchTerm || activeTab !== "all" 
                ? "Try adjusting your search terms or filters" 
                : "Get started by adding compliance certificates to your properties"}
            </p>
            {!searchTerm && activeTab === "all" && (
              <Button onClick={() => setShowForm(true)} className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="w-4 h-4 mr-2" />
                Add First Compliance Record
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
