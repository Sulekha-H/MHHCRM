"use client"

import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, RotateCcw, Trash2, Calendar, User as UserIcon, Download } from "lucide-react";
import { format } from "date-fns";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export default function DeletedEntries() {
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("residents");
  const [restoreItem, setRestoreItem] = useState(null);
  const [permanentDeleteItem, setPermanentDeleteItem] = useState(null);
  
  const [deletedResidents, setDeletedResidents] = useState([]);
  const [deletedProperties, setDeletedProperties] = useState([]);
  const [deletedAccommodations, setDeletedAccommodations] = useState([]);
  const [deletedBenefits, setDeletedBenefits] = useState([]);
  const [deletedIncidents, setDeletedIncidents] = useState([]);
  const [deletedTasks, setDeletedTasks] = useState([]);
  const [deletedRepairs, setDeletedRepairs] = useState([]);
  const [deletedSupportPlans, setDeletedSupportPlans] = useState([]);
  const [deletedOfficeLogs, setDeletedOfficeLogs] = useState([]);
  const [deletedServiceCharges, setDeletedServiceCharges] = useState([]);
  const [deletedCashLogs, setDeletedCashLogs] = useState([]);
  const [deletedReferrals, setDeletedReferrals] = useState([]);
  const [deletedDocuments, setDeletedDocuments] = useState([]);
  const [deletedWarranties, setDeletedWarranties] = useState([]);
  const [deletedInsurances, setDeletedInsurances] = useState([]);
  const [deletedAppliances, setDeletedAppliances] = useState([]);
  const [deletedWeeklySWDocs, setDeletedWeeklySWDocs] = useState([]);
  const [deletedCompliance, setDeletedCompliance] = useState([]);
  const [deletedPropertyOnboarding, setDeletedPropertyOnboarding] = useState([]);
  const [deletedLandlordEnquiries, setDeletedLandlordEnquiries] = useState([]);
  const [deletedCustomSections, setDeletedCustomSections] = useState([]);
  const [deletedCustomSectionData, setDeletedCustomSectionData] = useState([]);
  const [deletedLandlordPortal, setDeletedLandlordPortal] = useState([]);

  const normalizeData = (data) => {
    if (!data) return null;
    const normalized = {};
    for (const key in data) {
      const lowerKey = key.toLowerCase().replace(/\s+/g, '_');
      normalized[lowerKey] = data[key];
    }
    normalized.id = normalized.id || data.ID || data.Id;
    return normalized;
  };

  useEffect(() => {
    loadAllDeletedData().finally(() => setLoading(false));
  }, []);

  const loadAllDeletedData = async () => {
    try {
      const tables = [
        { name: 'residents', setter: setDeletedResidents },
        { name: 'properties', setter: setDeletedProperties },
        { name: 'accommodations', setter: setDeletedAccommodations },
        { name: 'incidents', setter: setDeletedIncidents },
        { name: 'tasks', setter: setDeletedTasks },
        { name: 'repairs', setter: setDeletedRepairs },
        { name: 'support_notes', setter: setDeletedSupportPlans },
        { name: 'office_logs', setter: setDeletedOfficeLogs },
        { name: 'service_charges', setter: setDeletedServiceCharges },
        { name: 'cash_logs', setter: setDeletedCashLogs },
        { name: 'documents', setter: setDeletedDocuments },
        { name: 'warranties', setter: setDeletedWarranties },
        { name: 'insurances', setter: setDeletedInsurances },
        { name: 'appliances', setter: setDeletedAppliances },
        { name: 'weekly_sw_doc_logs', setter: setDeletedWeeklySWDocs },
        { name: 'compliance_logs', setter: setDeletedCompliance },
        { name: 'property_onboarding', setter: setDeletedPropertyOnboarding },
        { name: 'landlord_enquiries', setter: setDeletedLandlordEnquiries },
        { name: 'custom_sections', setter: setDeletedCustomSections },
        { name: 'custom_section_data', setter: setDeletedCustomSectionData },
        { name: 'landlord_portal', setter: setDeletedLandlordPortal },
      ];

      for (const table of tables) {
        try {
          const { data, error } = await supabase
            .from(table.name)
            .select('*')
            .eq('"Deleted"', true)
            .order('"Deleted Date"', { ascending: false });

          if (error) {
            console.error(`❌ Error loading ${table.name}:`, error);
            throw error;
          }
          
          console.log(`✅ Loaded ${data?.length || 0} deleted records from ${table.name}`);
          table.setter(data ? data.map(normalizeData) : []);
        } catch (err) {
          console.error(`❌ Error loading ${table.name}:`, err);
          table.setter([]);
        }
      }

      // Load deleted HB and UC logs
      try {
        const [hbResponse, ucResponse] = await Promise.all([
          supabase.from('housing_benefit_logs').select('*').eq('"Deleted"', true).order('"Deleted Date"', { ascending: false }),
          supabase.from('universal_credit_logs').select('*').eq('"Deleted"', true).order('"Deleted Date"', { ascending: false })
        ]);

        if (hbResponse.error) throw hbResponse.error;
        if (ucResponse.error) throw ucResponse.error;

        const hbLogs = hbResponse.data || [];
        const ucLogs = ucResponse.data || [];
        
        // Combine and filter out landlord portal logs
        const allBenefitLogs = [
          ...hbLogs.map(log => ({ ...normalizeData(log), benefit_type: 'housing_benefit' })),
          ...ucLogs.map(log => ({ ...normalizeData(log), benefit_type: 'universal_credit' }))
        ].filter(log => log.benefit_type !== 'landlord_portal');

        setDeletedBenefits(allBenefitLogs);
      } catch (err) {
        console.error('Error loading benefit logs:', err);
        setDeletedBenefits([]);
      }

      // Load deleted referrals from both organisation_referrals and self_referrals tables
      try {
        const [orgResponse, selfResponse] = await Promise.all([
          supabase.from('organisation_referrals').select('*').eq('"Deleted"', true).order('"Deleted Date"', { ascending: false }),
          supabase.from('self_referrals').select('*').eq('"Deleted"', true).order('"Deleted Date"', { ascending: false })
        ]);

        if (orgResponse.error) throw orgResponse.error;
        if (selfResponse.error) throw selfResponse.error;

        const orgReferrals = (orgResponse.data || []).map(ref => ({
          ...normalizeData(ref),
          referral_type: 'organisation'
        }));
        
        const selfReferrals = (selfResponse.data || []).map(ref => ({
          ...normalizeData(ref),
          referral_type: 'self-referral'
        }));

        const allReferrals = [...orgReferrals, ...selfReferrals];
        setDeletedReferrals(allReferrals);
      } catch (err) {
        console.error('Error loading deleted referrals:', err);
        setDeletedReferrals([]);
      }
    } catch (error) {
      console.error("Error loading deleted data:", error);
    }
  };

  const handleRestore = (tableName, item) => {
    setRestoreItem({ tableName, item });
  };

  const confirmRestore = async () => {
    if (restoreItem) {
      try {
        // Determine correct table for benefits and insurances
        let actualTable = restoreItem.tableName;
        if (restoreItem.tableName === 'benefit_logs') {
          const normalizedBenefitType = restoreItem.item.benefit_type?.toLowerCase().replace(/\s+/g, '_');
          actualTable = normalizedBenefitType === 'universal_credit' ? 'universal_credit_logs' : 'housing_benefit_logs';
        } else if (restoreItem.tableName === 'referrals') {
          // Determine correct referrals table
          actualTable = restoreItem.item.referral_type === 'organisation' ? 'organisation_referrals' : 'self_referrals';
        } else if (restoreItem.tableName === 'insurance') {
          actualTable = 'insurances';
        } else if (restoreItem.tableName === 'cash_logs') {
          actualTable = 'cash_logs';
        } else if (restoreItem.tableName === 'landlord_portal') {
          actualTable = 'landlord_portal';
        }

        const { error } = await supabase
          .from(actualTable)
          .update({
            '"Deleted"': false,
            '"Deleted Date"': null,
            '"Deleted By"': null
          })
          .eq('"ID"', restoreItem.item.id);

        if (error) throw error;
        
        await loadAllDeletedData();
        setRestoreItem(null);
      } catch (error) {
        console.error("Error restoring item:", error);
        alert("Error restoring item: " + error.message);
      }
    }
  };

  const handlePermanentDelete = (tableName, item) => {
    setPermanentDeleteItem({ tableName, item });
  };

  const confirmPermanentDelete = async () => {
    if (permanentDeleteItem) {
      try {
        // Determine correct table for benefits and insurances
        let actualTable = permanentDeleteItem.tableName;
        if (permanentDeleteItem.tableName === 'benefit_logs') {
          const normalizedBenefitType = permanentDeleteItem.item.benefit_type?.toLowerCase().replace(/\s+/g, '_');
          actualTable = normalizedBenefitType === 'universal_credit' ? 'universal_credit_logs' : 'housing_benefit_logs';
        } else if (permanentDeleteItem.tableName === 'referrals') {
          // Determine correct referrals table
          actualTable = permanentDeleteItem.item.referral_type === 'organisation' ? 'organisation_referrals' : 'self_referrals';
        } else if (permanentDeleteItem.tableName === 'insurance') {
          actualTable = 'insurances';
        } else if (permanentDeleteItem.tableName === 'cash_logs') {
          actualTable = 'cash_logs';
        } else if (permanentDeleteItem.tableName === 'landlord_portal') {
          actualTable = 'landlord_portal';
        }

        const { error } = await supabase
          .from(actualTable)
          .delete()
          .eq('"ID"', permanentDeleteItem.item.id);

        if (error) throw error;

        await loadAllDeletedData();
        setPermanentDeleteItem(null);
      } catch (error) {
        console.error("Error permanently deleting item:", error);
        alert("Error permanently deleting item: " + error.message);
      }
    }
  };

  const filterItems = (items) => {
    if (!searchTerm) return items;
    const searchLower = searchTerm.toLowerCase();
    return items.filter(item => 
      (item.title || item.name || item.first_name || item.last_name || item.room_number || item.section_name || item.landlord_name || item.certificate_name || "").toLowerCase().includes(searchLower) ||
      (item.description || "").toLowerCase().includes(searchLower) ||
      (item.deleted_by || "").toLowerCase().includes(searchLower)
    );
  };

  const formatDeletedBy = (deletedBy) => {
    if (!deletedBy) return "Unknown";
    if (deletedBy.includes('@')) {
      const namePart = deletedBy.split('@')[0];
      return namePart
        .replace(/[._]/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    }
    return deletedBy;
  };

  const exportAllToCSV = () => {
    console.log("🔵 Starting separate CSV exports for deleted entries");
    
    const formatDate = (dateString) => {
      if (!dateString) return "";
      try {
        return format(new Date(dateString), 'yyyy-MM-dd');
      } catch {
        return "";
      }
    };

    const formatDateTime = (dateString) => {
      if (!dateString) return "";
      try {
        return format(new Date(dateString), 'yyyy-MM-dd HH:mm:ss');
      } catch {
        return "";
      }
    };

    const escapeCSV = (value) => {
      if (value === null || value === undefined) return '';
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n') || stringValue.includes('\r')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    const exportEntityToCSV = (entityData, entityName, fileName) => {
      if (entityData.length === 0) return;

      console.log(`📄 Exporting ${entityName}: ${entityData.length} records to ${fileName}`);

      const allKeys = new Set();
      entityData.forEach(item => {
        Object.keys(item).forEach(key => allKeys.add(key));
      });

      const headers = Array.from(allKeys);

      const rows = entityData.map(item => {
        return headers.map(header => {
          const value = item[header];
          
          if (header.toLowerCase().includes('date') && value) {
            if (header.toLowerCase().includes('time') || header === 'created_date' || header === 'updated_date' || header === 'deleted_date') {
              return formatDateTime(value);
            }
            return formatDate(value);
          }
          
          if (Array.isArray(value)) {
            return JSON.stringify(value);
          }
          
          if (typeof value === 'object' && value !== null) {
            return JSON.stringify(value);
          }
          
          return value;
        });
      });

      const csvContent = [
        headers.map(escapeCSV).join(','),
        ...rows.map(row => row.map(escapeCSV).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    };

    const entityExports = [
      { data: deletedResidents, name: 'Residents', baseFileName: 'residents.csv' },
      { data: deletedProperties, name: 'Properties', baseFileName: 'properties.csv' },
      { data: deletedAccommodations, name: 'Accommodations', baseFileName: 'accommodations.csv' },
      { data: deletedBenefits, name: 'Benefits', baseFileName: 'benefits.csv' },
      { data: deletedIncidents, name: 'Incidents', baseFileName: 'incidents.csv' },
      { data: deletedTasks, name: 'Tasks', baseFileName: 'tasks.csv' },
      { data: deletedRepairs, name: 'Repairs', baseFileName: 'repairs.csv' },
      { data: deletedSupportPlans, name: 'Support Plans', baseFileName: 'support_plans.csv' },
      { data: deletedOfficeLogs, name: 'Office Logs', baseFileName: 'office_logs.csv' },
      { data: deletedServiceCharges, name: 'Service Charges', baseFileName: 'service_charges.csv' },
      { data: deletedCashLogs, name: 'Cash Logs', baseFileName: 'cash_logs.csv' },
      { data: deletedReferrals, name: 'Referrals', baseFileName: 'referrals.csv' },
      { data: deletedDocuments, name: 'Documents', baseFileName: 'documents.csv' },
      { data: deletedWarranties, name: 'Warranties', baseFileName: 'warranties.csv' },
      { data: deletedInsurances, name: 'Insurance', baseFileName: 'insurance.csv' },
      { data: deletedAppliances, name: 'Appliances', baseFileName: 'appliances.csv' },
      { data: deletedWeeklySWDocs, name: 'Weekly SW Docs', baseFileName: 'weekly_sw_docs.csv' },
      { data: deletedCompliance, name: 'Compliance', baseFileName: 'compliance.csv' },
      { data: deletedPropertyOnboarding, name: 'Property Onboarding', baseFileName: 'property_onboarding.csv' },
      { data: deletedLandlordEnquiries, name: 'Landlord Enquiries', baseFileName: 'landlord_enquiries.csv' },
      { data: deletedCustomSections, name: 'Custom Sections', baseFileName: 'custom_sections.csv' },
      { data: deletedCustomSectionData, name: 'Custom Section Data', baseFileName: 'custom_section_data.csv' },
      { data: deletedLandlordPortal, name: 'Landlord Portal', baseFileName: 'landlord_portal_checks.csv' },
    ];

    const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss');
    let exportedFileCount = 0;
    let totalRecordsExported = 0;

    entityExports.forEach((entity, index) => {
      if (entity.data && entity.data.length > 0) {
        setTimeout(() => {
          const filename = `deleted_${entity.baseFileName.replace('.csv', '')}_${timestamp}.csv`;
          exportEntityToCSV(entity.data, entity.name, filename);
        }, index * 300);
        exportedFileCount++;
        totalRecordsExported += entity.data.length;
      }
    });

    if (exportedFileCount === 0) {
      alert("No deleted entries found across all categories to export.");
      return;
    }

    console.log(`✅ Exporting ${exportedFileCount} files with ${totalRecordsExported} total records`);
    
    setTimeout(() => {
      alert(`Successfully triggered download for ${exportedFileCount} CSV files containing ${totalRecordsExported} deleted records.\n\nCheck your browser's downloads for the files (e.g., 'deleted_residents_${timestamp}.csv', 'deleted_properties_${timestamp}.csv', etc.).`);
    }, (exportedFileCount * 300) + 500);
  };

  const renderDeletedItem = (item, tableName, entityLabel) => (
    <Card key={item.id} className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="destructive">Deleted</Badge>
            <Badge variant="outline">{entityLabel}</Badge>
          </div>
          <h3 className="font-semibold text-slate-900 text-base leading-tight break-words">
            {item.title || item.name || item.section_name || (item.first_name && item.last_name ? `${item.first_name} ${item.last_name}` : null) || item.room_number || item.product_name || item.policy_name || item.appliance_name || item.landlord_name || item.certificate_name || `${entityLabel} #${item.id}`}
          </h3>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {item.description && (
          <p className="text-sm text-slate-700 line-clamp-3 break-words">{item.description}</p>
        )}
        
        {tableName === 'residents' && (
          <div className="text-sm text-slate-600 space-y-1">
            {item.address && <p className="break-words">Address: {item.address}</p>}
            {item.phone_number && <p>Phone: {item.phone_number}</p>}
          </div>
        )}

        {tableName === 'properties' && (
          <div className="text-sm text-slate-600 space-y-1">
            {item.address && <p className="break-words">Address: {item.address}</p>}
            {item.property_type && <p>Type: {item.property_type.replace(/_/g, ' ')}</p>}
          </div>
        )}

        {tableName === 'accommodations' && (
          <div className="text-sm text-slate-600 space-y-1">
            {item.accommodation_type && <p>Type: {item.accommodation_type.replace(/_/g, ' ')}</p>}
            {item.availability_status && <p>Status: {item.availability_status.replace(/_/g, ' ')}</p>}
          </div>
        )}

        {tableName === 'compliance_logs' && (
          <div className="text-sm text-slate-600 space-y-1">
            {item.compliance_type && <p>Type: {item.compliance_type.replace(/_/g, ' ')}</p>}
            {item.expiry_date && <p>Expiry: {format(new Date(item.expiry_date), 'PP')}</p>}
          </div>
        )}

        {tableName === 'landlord_enquiries' && (
          <div className="text-sm text-slate-600 space-y-1">
            {item.property_address && <p className="break-words">Address: {item.property_address}</p>}
            {item.contact_email && <p>Email: {item.contact_email}</p>}
          </div>
        )}

        {tableName === 'property_onboarding' && (
          <div className="text-sm text-slate-600 space-y-1">
            {item.property_address && <p className="break-words">Address: {item.property_address}</p>}
            {item.onboarding_status && <p>Status: {item.onboarding_status.replace(/_/g, ' ')}</p>}
          </div>
        )}

        {tableName === 'custom_sections' && (
          <div className="text-sm text-slate-600 space-y-1">
            {item.section_name && <p>Section: {item.section_name}</p>}
            {item.is_active !== undefined && <p>Active: {item.is_active ? 'Yes' : 'No'}</p>}
          </div>
        )}
        
        <div className="space-y-2 pt-2 border-t">
          {item.deleted_date && (
            <div className="flex items-start gap-2 text-sm text-slate-600">
              <Calendar className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
              <span className="break-words">Deleted: {format(new Date(item.deleted_date), 'PPp')}</span>
            </div>
          )}
          
          {item.deleted_by && (
            <div className="flex items-start gap-2 text-sm text-slate-600">
              <UserIcon className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
              <span className="break-words">Deleted by: {formatDeletedBy(item.deleted_by)}</span>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleRestore(tableName, item)}
            className="flex-1 w-full sm:w-auto"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Restore
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => handlePermanentDelete(tableName, item)}
            className="flex-1 w-full sm:w-auto"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Permanently
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  const totalDeletedCount = deletedResidents.length + deletedProperties.length + deletedAccommodations.length + 
    deletedBenefits.length + deletedIncidents.length + deletedTasks.length + deletedRepairs.length + 
    deletedSupportPlans.length + deletedOfficeLogs.length + deletedServiceCharges.length + deletedCashLogs.length + 
    deletedReferrals.length + deletedDocuments.length + deletedWarranties.length + deletedInsurances.length + 
    deletedAppliances.length + deletedWeeklySWDocs.length + deletedCompliance.length + deletedPropertyOnboarding.length + 
    deletedLandlordEnquiries.length + deletedCustomSections.length + deletedCustomSectionData.length + deletedLandlordPortal.length;

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Deleted Entries</h1>
          <p className="text-slate-600 mt-1">View and restore deleted records from across the system.</p>
          <p className="text-sm text-slate-500 mt-1">Total deleted entries: <span className="font-semibold">{totalDeletedCount}</span></p>
        </div>
        <Button
          onClick={exportAllToCSV}
          className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
          disabled={totalDeletedCount === 0}
        >
          <Download className="w-4 h-4" />
          Export All to CSV
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search deleted entries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="overflow-x-auto">
          <TabsList className="inline-flex w-auto min-w-full h-auto flex-wrap gap-1 p-1">
            <TabsTrigger value="residents" className="whitespace-nowrap px-3 py-2 text-xs sm:text-sm">
              Residents ({deletedResidents.length})
            </TabsTrigger>
            <TabsTrigger value="properties" className="whitespace-nowrap px-3 py-2 text-xs sm:text-sm">
              Properties ({deletedProperties.length})
            </TabsTrigger>
            <TabsTrigger value="accommodations" className="whitespace-nowrap px-3 py-2 text-xs sm:text-sm">
              Accommodations ({deletedAccommodations.length})
            </TabsTrigger>
            <TabsTrigger value="benefits" className="whitespace-nowrap px-3 py-2 text-xs sm:text-sm">
              Benefits ({deletedBenefits.length})
            </TabsTrigger>
            <TabsTrigger value="incidents" className="whitespace-nowrap px-3 py-2 text-xs sm:text-sm">
              Incidents ({deletedIncidents.length})
            </TabsTrigger>
            <TabsTrigger value="tasks" className="whitespace-nowrap px-3 py-2 text-xs sm:text-sm">
              Tasks ({deletedTasks.length})
            </TabsTrigger>
            <TabsTrigger value="repairs" className="whitespace-nowrap px-3 py-2 text-xs sm:text-sm">
              Repairs ({deletedRepairs.length})
            </TabsTrigger>
            <TabsTrigger value="support_plans" className="whitespace-nowrap px-3 py-2 text-xs sm:text-sm">
              Support Plans ({deletedSupportPlans.length})
            </TabsTrigger>
            <TabsTrigger value="office_logs" className="whitespace-nowrap px-3 py-2 text-xs sm:text-sm">
              Office Logs ({deletedOfficeLogs.length})
            </TabsTrigger>
            <TabsTrigger value="service_charges" className="whitespace-nowrap px-3 py-2 text-xs sm:text-sm">
              Service Charges ({deletedServiceCharges.length})
            </TabsTrigger>
            <TabsTrigger value="cash_logs" className="whitespace-nowrap px-3 py-2 text-xs sm:text-sm">
              Cash Logs ({deletedCashLogs.length})
            </TabsTrigger>
            <TabsTrigger value="referrals" className="whitespace-nowrap px-3 py-2 text-xs sm:text-sm">
              Referrals ({deletedReferrals.length})
            </TabsTrigger>
            <TabsTrigger value="documents" className="whitespace-nowrap px-3 py-2 text-xs sm:text-sm">
              Documents ({deletedDocuments.length})
            </TabsTrigger>
            <TabsTrigger value="warranties" className="whitespace-nowrap px-3 py-2 text-xs sm:text-sm">
              Warranties ({deletedWarranties.length})
            </TabsTrigger>
            <TabsTrigger value="insurances" className="whitespace-nowrap px-3 py-2 text-xs sm:text-sm">
              Insurance ({deletedInsurances.length})
            </TabsTrigger>
            <TabsTrigger value="appliances" className="whitespace-nowrap px-3 py-2 text-xs sm:text-sm">
              Appliances ({deletedAppliances.length})
            </TabsTrigger>
            <TabsTrigger value="weekly_sw_docs" className="whitespace-nowrap px-3 py-2 text-xs sm:text-sm">
              Weekly SW Docs ({deletedWeeklySWDocs.length})
            </TabsTrigger>
            <TabsTrigger value="compliance" className="whitespace-nowrap px-3 py-2 text-xs sm:text-sm">
              Compliance ({deletedCompliance.length})
            </TabsTrigger>
            <TabsTrigger value="property_onboarding" className="whitespace-nowrap px-3 py-2 text-xs sm:text-sm">
              Property Onboarding ({deletedPropertyOnboarding.length})
            </TabsTrigger>
            <TabsTrigger value="landlord_enquiries" className="whitespace-nowrap px-3 py-2 text-xs sm:text-sm">
              Landlord Enquiries ({deletedLandlordEnquiries.length})
            </TabsTrigger>
            <TabsTrigger value="custom_sections" className="whitespace-nowrap px-3 py-2 text-xs sm:text-sm">
              Custom Sections ({deletedCustomSections.length})
            </TabsTrigger>
            <TabsTrigger value="custom_section_data" className="whitespace-nowrap px-3 py-2 text-xs sm:text-sm">
              Custom Section Data ({deletedCustomSectionData.length})
            </TabsTrigger>
            <TabsTrigger value="landlord_portal" className="whitespace-nowrap px-3 py-2 text-xs sm:text-sm">
              Landlord Portal ({deletedLandlordPortal.length})
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="residents" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {filterItems(deletedResidents).map(item => renderDeletedItem(item, 'residents', 'Resident'))}
          </div>
          {filterItems(deletedResidents).length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-slate-500">No deleted residents found.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="properties" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {filterItems(deletedProperties).map(item => renderDeletedItem(item, 'properties', 'Property'))}
          </div>
          {filterItems(deletedProperties).length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-slate-500">No deleted properties found.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="accommodations" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {filterItems(deletedAccommodations).map(item => renderDeletedItem(item, 'accommodations', 'Accommodation'))}
          </div>
          {filterItems(deletedAccommodations).length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-slate-500">No deleted accommodations found.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="benefits" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {filterItems(deletedBenefits).map(item => renderDeletedItem(item, 'benefit_logs', 'Benefit Log'))}
          </div>
          {filterItems(deletedBenefits).length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-slate-500">No deleted benefit logs found.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="incidents" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {filterItems(deletedIncidents).map(item => renderDeletedItem(item, 'incidents', 'Incident'))}
          </div>
          {filterItems(deletedIncidents).length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-slate-500">No deleted incidents found.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="tasks" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {filterItems(deletedTasks).map(item => renderDeletedItem(item, 'tasks', 'Task'))}
          </div>
          {filterItems(deletedTasks).length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-slate-500">No deleted tasks found.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="repairs" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {filterItems(deletedRepairs).map(item => renderDeletedItem(item, 'repairs', 'Repair'))}
          </div>
          {filterItems(deletedRepairs).length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-slate-500">No deleted repairs found.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="support_plans" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {filterItems(deletedSupportPlans).map(item => renderDeletedItem(item, 'support_plans', 'Support Plan'))}
          </div>
          {filterItems(deletedSupportPlans).length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-slate-500">No deleted support plans found.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="office_logs" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {filterItems(deletedOfficeLogs).map(item => renderDeletedItem(item, 'office_logs', 'Office Log'))}
          </div>
          {filterItems(deletedOfficeLogs).length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-slate-500">No deleted office logs found.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="service_charges" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {filterItems(deletedServiceCharges).map(item => renderDeletedItem(item, 'service_charges', 'Service Charge'))}
          </div>
          {filterItems(deletedServiceCharges).length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-slate-500">No deleted service charges found.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="cash_logs" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {filterItems(deletedCashLogs).map(item => renderDeletedItem(item, 'cash_logs', 'Cash Log'))}
          </div>
          {filterItems(deletedCashLogs).length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-slate-500">No deleted cash logs found.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="referrals" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {filterItems(deletedReferrals).map(item => renderDeletedItem(item, 'referrals', 'Referral'))}
          </div>
          {filterItems(deletedReferrals).length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-slate-500">No deleted referrals found.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="documents" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {filterItems(deletedDocuments).map(item => renderDeletedItem(item, 'documents', 'Document'))}
          </div>
          {filterItems(deletedDocuments).length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-slate-500">No deleted documents found.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="warranties" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {filterItems(deletedWarranties).map(item => renderDeletedItem(item, 'warranties', 'Warranty'))}
          </div>
          {filterItems(deletedWarranties).length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-slate-500">No deleted warranties found.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="insurances" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {filterItems(deletedInsurances).map(item => renderDeletedItem(item, 'insurance', 'Insurance Policy'))}
          </div>
          {filterItems(deletedInsurances).length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-slate-500">No deleted insurance policies found.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="appliances" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {filterItems(deletedAppliances).map(item => renderDeletedItem(item, 'appliances', 'Appliance'))}
          </div>
          {filterItems(deletedAppliances).length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-slate-500">No deleted appliances found.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="weekly_sw_docs" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {filterItems(deletedWeeklySWDocs).map(item => renderDeletedItem(item, 'weekly_sw_doc_logs', 'Weekly SW Doc'))}
          </div>
          {filterItems(deletedWeeklySWDocs).length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-slate-500">No deleted weekly SW docs found.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="compliance" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {filterItems(deletedCompliance).map(item => renderDeletedItem(item, 'compliance_logs', 'Compliance Log'))}
          </div>
          {filterItems(deletedCompliance).length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-slate-500">No deleted compliance logs found.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="property_onboarding" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {filterItems(deletedPropertyOnboarding).map(item => renderDeletedItem(item, 'property_onboarding', 'Property Onboarding'))}
          </div>
          {filterItems(deletedPropertyOnboarding).length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-slate-500">No deleted property onboarding cases found.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="landlord_enquiries" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {filterItems(deletedLandlordEnquiries).map(item => renderDeletedItem(item, 'landlord_enquiries', 'Landlord Enquiry'))}
          </div>
          {filterItems(deletedLandlordEnquiries).length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-slate-500">No deleted landlord enquiries found.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="custom_sections" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {filterItems(deletedCustomSections).map(item => renderDeletedItem(item, 'custom_sections', 'Custom Section'))}
          </div>
          {filterItems(deletedCustomSections).length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-slate-500">No deleted custom sections found.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="custom_section_data" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {filterItems(deletedCustomSectionData).map(item => renderDeletedItem(item, 'custom_section_data', 'Custom Section Data'))}
          </div>
          {filterItems(deletedCustomSectionData).length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-slate-500">No deleted custom section data found.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="landlord_portal" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {filterItems(deletedLandlordPortal).map(item => renderDeletedItem(item, 'landlord_portal', 'Landlord Portal Check'))}
          </div>
          {filterItems(deletedLandlordPortal).length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-slate-500">No deleted landlord portal checks found.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!restoreItem} onOpenChange={(open) => !open && setRestoreItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore Entry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to restore this entry? It will be moved back to its original location.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRestore} className="bg-green-600 hover:bg-green-700">
              Restore
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!permanentDeleteItem} onOpenChange={(open) => !open && setPermanentDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Permanently Delete Entry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete this entry? This action cannot be undone and all data will be lost forever.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmPermanentDelete} className="bg-red-600 hover:bg-red-700">
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}