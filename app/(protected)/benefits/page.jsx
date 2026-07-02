"use client"


import { useUser } from "@clerk/nextjs";
import React, { useState, useEffect, useCallback } from "react";
import { useClerkSupabaseClient } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, HandCoins, Edit, Building2, Users, Download, Calendar, User as UserIcon, FileText, Banknote } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import BenefitLogForm_Supabase from "@/components/Benefits/BenefitLogForm";
import BenefitLogCard from "@/components/Benefits/BenefitLogCard";
import BenefitLogDetailModal from "@/components/Benefits/BenefitLogDetailModal";
import { format } from "date-fns";
import { logActivity, ACTIONS, ENTITIES } from "@/lib/activityUtils";

// Helper function to normalize column names from Supabase
const normalizeData = (data) => {
  if (!data) return data;
  if (Array.isArray(data)) return data.map(normalizeData);
  
  const normalized = {};
  Object.keys(data).forEach(key => {
    const normalizedKey = key.toLowerCase().replace(/ /g, '_');
    normalized[normalizedKey] = data[key];
  });
  return normalized;
}; 

export default function Benefits() {
  const { user } = useUser();
  const supabase = useClerkSupabaseClient()
  const [logs, setLogs] = useState([]);
  const [residents, setResidents] = useState([]);
  const [properties, setProperties] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingLog, setEditingLog] = useState(null);
  const [viewingLog, setViewingLog] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("housing_benefit");
  const [logToDelete, setLogToDelete] = useState(null);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [error, setError] = useState(null);

  const getResidentName = useCallback((residentId) => {
    const resident = residents.find(r => r.id === residentId || r.ID === residentId);
    return resident ? `${resident.first_name || resident["First Name"]} ${resident.last_name || resident["Last Name"]}` : "Unknown Resident";
  }, [residents]);

 // 1️⃣ Define loadData BEFORE useEffect
const loadData = async () => {
  if (!supabase || !user) return;
  setLoading(true);
  setError(null);

  try {
    console.log("🔄 Loading Benefits page data...");

    // --- Load current user safely ---
    setCurrentUser(user);

    // --- Load residents & properties in parallel ---
    const [residentsRes, propertiesRes] = await Promise.all([
      supabase.from('residents').select('*'),
      supabase.from('properties').select('*')
    ]);

    if (residentsRes.error) console.error("❌ Residents error:", residentsRes.error);
    if (propertiesRes.error) console.error("❌ Properties error:", propertiesRes.error);

    const residentsData = normalizeData(residentsRes.data || []);
    const propertiesData = normalizeData(propertiesRes.data || []);

    setResidents(residentsData);
    setProperties(propertiesData);

    console.log(`✅ Loaded ${residentsData.length} residents`);
    console.log(`✅ Loaded ${propertiesData.length} properties`);

    // --- Load Benefit logs in parallel ---
    const [hbRes, ucRes, pipRes, wcaRes] = await Promise.all([
      supabase.from('housing_benefit_logs').select('*').or('"Deleted".eq.false,"Deleted".is.null'),
      supabase.from('universal_credit_logs').select('*').or('"Deleted".eq.false,"Deleted".is.null'),
      supabase.from('pip_logs').select('*').or('"Deleted".eq.false,"Deleted".is.null'),
      supabase.from('wca_logs').select('*').or('"Deleted".eq.false,"Deleted".is.null')
    ]);

    if (hbRes.error) console.error("❌ HB logs error:", hbRes.error);
    if (ucRes.error) console.error("❌ UC logs error:", ucRes.error);
    if (pipRes.error) console.error("❌ PIP logs error:", pipRes.error);
    if (wcaRes.error) console.error("❌ WCA logs error:", wcaRes.error);

    const hbLogs = normalizeData(hbRes.data || []).map(log => ({ ...log, benefit_type: 'housing_benefit' }));
    const ucLogs = normalizeData(ucRes.data || []).map(log => ({ ...log, benefit_type: 'universal_credit' }));
    const pipLogs = normalizeData(pipRes.data || []).map(log => ({ ...log, benefit_type: 'pip' }));
    const wcaLogs = normalizeData(wcaRes.data || []).map(log => ({ ...log, benefit_type: 'wca' }));

    const combinedLogs = [...hbLogs, ...ucLogs, ...pipLogs, ...wcaLogs]
      .filter(log => !log.deleted)
      .sort((a, b) => new Date(b.log_date) - new Date(a.log_date));

    setLogs(combinedLogs);

    console.log(`✅ Loaded ${hbLogs.length} HB logs and ${ucLogs.length} UC logs`);
    console.log(`✅ Combined logs count: ${combinedLogs.length}`);

  } catch (error) {
    console.error("❌ Error loading Benefits page data:", error);
    setError(error.message || "Failed to load data.");
  } finally {
    setLoading(false);
  }
};

// 2️⃣ Call loadData safely on mount
useEffect(() => {
  if (supabase && user) {
    loadData();
  }
}, [supabase, user]);

useEffect(() => {
  let filtered = logs.filter(log => log.benefit_type === activeTab);

  if (searchTerm) {
    const searchLower = searchTerm.toLowerCase();
    filtered = filtered.filter(log =>
      log.title?.toLowerCase().includes(searchLower) ||
      log.description?.toLowerCase().includes(searchLower) ||
      getResidentName(log.resident_id).toLowerCase().includes(searchLower)
    );
  }

  setFilteredLogs(filtered);
}, [logs, activeTab, searchTerm, getResidentName]);

  const handleSubmit = async (logData) => {
    try {
      console.log("🔍 RAW logData from form:", logData);

      // Always update "Logged By" to current user
      if (currentUser) {
        const userEmail = currentUser.primaryEmailAddress?.emailAddress || currentUser.email;
        const { data: userRecordData } = await supabase.from('users').select('full_name').eq('email', userEmail).single();
        const loggedBy = userRecordData?.full_name || currentUser.fullName || userEmail;
        logData["Logged By"] = loggedBy;
      }

      // Determine benefit type and table
      const benefitType = logData["Benefit Type"] || logData.benefit_type;
      // Normalize benefit type for comparison
      const normalizedBenefitType = benefitType?.toLowerCase().replace(/\s+/g, '_');
      let tableName = 'housing_benefit_logs';
      if (normalizedBenefitType === 'universal_credit') tableName = 'universal_credit_logs';
      else if (normalizedBenefitType === 'pip') tableName = 'pip_logs';
      else if (normalizedBenefitType === 'wca') tableName = 'wca_logs';
      
      console.log(`📤 Inserting/updating to table: ${tableName}`);
      console.log(`📤 Data being sent:`, logData);

      if (editingLog && (editingLog.id || editingLog.ID)) {
        const logId = editingLog.id || editingLog.ID;
        const { data, error } = await supabase.from(tableName).update(logData).eq('ID', logId);
        if (error) {
          console.error(`❌ Update error:`, error);
          throw error;
        }
        console.log(`✅ Log updated in ${tableName}:`, logId);

        // Log activity
        logActivity(supabase, {
          userName: user.fullName || user.username || "Unknown",
          userEmail: user.primaryEmailAddress?.emailAddress,
          actionType: ACTIONS.UPDATE,
          entityType: ENTITIES.BENEFIT,
          entityId: logId,
          description: `Updated benefit log: ${logData.Title || logData.title}`
        });
      } else {
        // Ensure ID exists for new records
        const newId = logData.ID || logData.id || crypto.randomUUID();
        const dataToInsert = { ...logData, ID: newId };
        if (!dataToInsert["Created Date"]) {
          dataToInsert["Created Date"] = new Date().toISOString();
        }
        
        const { data, error } = await supabase.from(tableName).insert([dataToInsert]);
        if (error) {
          console.error(`❌ Insert error:`, error);
          throw error;
        }
        console.log(`✅ Log inserted into ${tableName}`, data);

        // Log activity
        logActivity(supabase, {
          userName: user.fullName || user.username || "Unknown",
          userEmail: user.primaryEmailAddress?.emailAddress,
          actionType: ACTIONS.CREATE,
          entityType: ENTITIES.BENEFIT,
          entityId: newId,
          description: `Created new benefit log: ${logData.Title || logData.title}`
        });
      }

      // Auto-create "Awaiting Activation" log when Housing Benefit Application Log is marked as "Completed Application Submitted"
      const currentBenefitType = logData["Benefit Type"] || logData.benefit_type;
      const currentLogType = logData["Log Type"] || logData.log_type;
      const currentStatus = logData.Status || logData.status;

      const isHousingBenefit = currentBenefitType === 'Housing Benefit' || currentBenefitType === 'housing_benefit';
      const isApplicationLog = currentLogType === 'Application Log' || currentLogType === 'application_log';
      const isCompletedStatus = currentStatus === 'Completed Application Submitted' || currentStatus === 'completed_application_submitted';

      // Duplicate prevention: Only trigger if it's a new log OR if the status is changing to Completed
      const isNewLog = !editingLog;
      const wasNotCompletedBefore = editingLog && editingLog.status !== 'Completed Application Submitted' && editingLog.status !== 'completed_application_submitted';

      if (isHousingBenefit && isApplicationLog && isCompletedStatus && (isNewLog || wasNotCompletedBefore)) {
        const resId = logData["Resident ID"] || logData.resident_id;
        const resident = residents.find(r => r.id === resId || r.ID === resId);
        const residentFullName = resident ? `${resident.first_name || resident["First Name"]} ${resident.last_name || resident["Last Name"]}` : 'Resident';

        const awaitingActivationLog = {
          "ID": crypto.randomUUID(),
          "Resident ID": resId,
          "Benefit Type": 'Housing Benefit',
          "Log Type": 'Awaiting Activation',
          "Title": `Awaiting Activation - ${residentFullName}`,
          "Description": `Auto-generated: Awaiting activation for Housing Benefit application submitted on ${logData["Completed Application Submitted Date"] || logData.completed_application_submitted_date ? format(new Date(logData["Completed Application Submitted Date"] || logData.completed_application_submitted_date), 'dd/MM/yyyy') : 'pending'}`,
          "Log Date": new Date().toISOString().slice(0, 16),
          "Status": 'Awaiting Activation',
          "Logged By": logData["Logged By"] || logData.logged_by || '',
          "Notes": `Linked to application: ${logData.Title || logData.title || 'HB Application'}`,
          "Created Date": new Date().toISOString()
        };

        await supabase.from('housing_benefit_logs').insert([awaitingActivationLog]);
        console.log('✅ Auto-created Awaiting Activation log for resident:', resId);
      }

      setShowForm(false);
      setEditingLog(null);
      setViewingLog(null);
      loadData();
    } catch (error) {
      console.error("Error saving benefit log:", error);
      alert("Error saving benefit log: " + error.message);
    }
  };

  const handleEdit = (log) => {
    setViewingLog(null);
    setEditingLog(log);
    setShowForm(true);
  };

  const handleViewDetails = (log) => {
    setShowForm(false);
    setEditingLog(null);
    setViewingLog(log);
  };

  const handleDelete = (log) => {
    setLogToDelete(log);
  };

  const confirmDelete = async () => {
    if (logToDelete) {
      // Normalize benefit_type for table determination (handle both "Universal Credit" and "universal_credit")
      const normalizedBenefitType = logToDelete.benefit_type?.toLowerCase().replace(/\s+/g, '_');
      let targetTable = 'housing_benefit_logs';
      if (normalizedBenefitType === 'universal_credit') targetTable = 'universal_credit_logs';
      else if (normalizedBenefitType === 'pip') targetTable = 'pip_logs';
      else if (normalizedBenefitType === 'wca') targetTable = 'wca_logs';
      
      try {
        console.log('🗑️ Deleting log:', { 
          table: targetTable, 
          id: logToDelete.id, 
          benefit_type: logToDelete.benefit_type,
          normalized: normalizedBenefitType 
        });
        
        const { data, error } = await supabase
          .from(targetTable)
          .update({
            "Deleted": true,
            "Deleted Date": new Date().toISOString(),
            "Deleted By": currentUser?.email || "Unknown User"
          })
          .eq('"ID"', logToDelete.id)
          .select();
        
        if (error) {
          console.error('❌ Delete error:', error);
          throw error;
        }

        // Log activity
        logActivity(supabase, {
          userName: user.fullName || user.username || "Unknown",
          userEmail: user.primaryEmailAddress?.emailAddress,
          actionType: ACTIONS.DELETE,
          entityType: ENTITIES.BENEFIT,
          entityId: logToDelete.id,
          description: `Soft deleted benefit log: ${logToDelete.title}`
        });
        
        console.log('✅ Delete response:', data);
        
        setLogToDelete(null);
        setViewingLog(null);
        await loadData();
        console.log(`✅ Log soft-deleted from ${targetTable}:`, logToDelete.id);
      } catch (error) {
        console.error("❌ Error deleting benefit log:", error);
        alert("Error deleting benefit log: " + error.message);
      }
    }
  };

  const exportHousingBenefitToCSV = () => {
    // CSV export implementation - same as Base44 version
    const housingBenefitLogs = logs.filter(log => log.benefit_type === 'housing_benefit' && !log.deleted);
    const formatDate = (dateString) => dateString ? format(new Date(dateString), 'yyyy-MM-dd') : null;
    const formatDateTime = (dateString) => dateString ? format(new Date(dateString), 'yyyy-MM-dd HH:mm:ss') : null;
    const formatBoolean = (value) => value === true ? 'TRUE' : value === false ? 'FALSE' : null;
    const getResidentNameForExport = (residentId) => {
      const resident = residents.find(r => r.id === residentId);
      return resident ? `${resident.first_name} ${resident.last_name}` : null;
    };

    const csvContent = "Housing Benefit Logs Export"; // Simplified for now
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `housing_benefit_logs_export_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportPIPToCSV = () => {
    const pipLogs = logs.filter(log => log.benefit_type === 'pip' && !log.deleted);
    const csvContent = "PIP Logs Export"; // Simplified for now
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `pip_logs_export_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportWCAToCSV = () => {
    const wcaLogs = logs.filter(log => log.benefit_type === 'wca' && !log.deleted);
    const csvContent = "WCA Logs Export"; // Simplified for now
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `wca_logs_export_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportUniversalCreditToCSV = () => {
    // CSV export implementation - same as Base44 version
    const universalCreditLogs = logs.filter(log => log.benefit_type === 'universal_credit' && !log.deleted);
    const csvContent = "Universal Credit Logs Export"; // Simplified for now
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `universal_credit_logs_export_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "issue_raised":
        return "bg-red-100 text-red-800";
      case "closed":
        return "bg-gray-100 text-gray-800";
      case "awaiting_activation":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  function renderHousingBenefitContent() {
    // Normalize log_type for filtering
    const normalizeLogType = (logType) => {
      if (!logType) return '';
      return logType.toLowerCase().replace(/\s+/g, '_');
    };

    const applicationLogs = filteredLogs.filter(log => normalizeLogType(log.log_type) === 'application_log');
    const requestedSupportNotes = filteredLogs.filter(log => normalizeLogType(log.log_type) === 'requested_support_notes');
    const requestedDocuments = filteredLogs.filter(log => normalizeLogType(log.log_type) === 'requested_documents');
    const suspendedClaims = filteredLogs.filter(log => normalizeLogType(log.log_type) === 'suspended_claims');
    const awaitingActivation = filteredLogs.filter(log => normalizeLogType(log.log_type) === 'awaiting_activation');
    const missingPayments = filteredLogs.filter(log => normalizeLogType(log.log_type) === 'missing_payments');
    const changeOfAddresses = filteredLogs.filter(log => normalizeLogType(log.log_type) === 'change_of_addresses');
    const roomTransfers = filteredLogs.filter(log => normalizeLogType(log.log_type) === 'room_transfers');
    const hbCalls = filteredLogs.filter(log => normalizeLogType(log.log_type) === 'hb_calls');
    const hbLeavers = filteredLogs.filter(log => normalizeLogType(log.log_type) === 'hb_leavers');

    console.log('🔍 Section counts:', {
      applicationLogs: applicationLogs.length,
      requestedSupportNotes: requestedSupportNotes.length,
      requestedDocuments: requestedDocuments.length,
      suspendedClaims: suspendedClaims.length,
      awaitingActivation: awaitingActivation.length,
      missingPayments: missingPayments.length,
      changeOfAddresses: changeOfAddresses.length,
      roomTransfers: roomTransfers.length,
      hbCalls: hbCalls.length,
      hbLeavers: hbLeavers.length
    });

    const renderScrollableSection = (title, logs) => (
      <section>
        <h2 className="text-xl font-semibold text-slate-800 mb-4">{title}</h2>
        {logs.length > 0 ? (
          <div className="flex gap-4 pb-4 scrollbar-visible">
            {logs.map(log => (
              <div key={log.id} className="min-w-[280px] max-w-[280px] flex-shrink-0">
                <BenefitLogCard log={log} onViewDetails={handleViewDetails} onDelete={handleDelete} getResidentName={getResidentName} />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 text-sm">No {title} for Housing Benefit found.</p>
        )}
      </section>
    );

    return (
      <div className="space-y-10">
        {renderScrollableSection("Application Logs", applicationLogs)}
        {renderScrollableSection("Requested Support Notes", requestedSupportNotes)}
        {renderScrollableSection("Requested Documents", requestedDocuments)}
        {renderScrollableSection("Suspended Claims", suspendedClaims)}
        {renderScrollableSection("Awaiting Activation", awaitingActivation)}
        {renderScrollableSection("Missing Payments", missingPayments)}
        {renderScrollableSection("Change of Addresses to Complete", changeOfAddresses)}
        {renderScrollableSection("Room Transfers to Update HB", roomTransfers)}
        {renderScrollableSection("HB Calls", hbCalls)}
        {renderScrollableSection("HB Leavers", hbLeavers)}

        {filteredLogs.length === 0 && !loading && (
          <Card>
            <CardContent className="p-12 text-center">
              <HandCoins className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No logs found for Housing Benefit</h3>
              <p className="text-slate-500">Get started by adding a new log entry.</p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  function renderPIPContent() {
    const normalizeLogType = (logType) => {
      if (!logType) return '';
      return logType.toLowerCase().replace(/\s+/g, '_');
    };

    const applicationLogs = filteredLogs.filter(log => normalizeLogType(log.log_type) === 'application_log');
    const assessmentOutcomes = filteredLogs.filter(log => normalizeLogType(log.log_type) === 'assessment_outcome');
    const otherLogs = filteredLogs.filter(log => normalizeLogType(log.log_type) !== 'application_log' && normalizeLogType(log.log_type) !== 'assessment_outcome');

    return (
      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-semibold text-slate-800 mb-4">Application Logs</h2>
          {applicationLogs.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {applicationLogs.map(log => (
                <BenefitLogCard key={log.id} log={log} onViewDetails={handleViewDetails} onDelete={handleDelete} getResidentName={getResidentName} />
              ))}
            </div>
          ) : (
            <p className="text-slate-500">No application logs for PIP found.</p>
          )}
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-slate-800 mb-4">Assessment Outcomes</h2>
          {assessmentOutcomes.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {assessmentOutcomes.map(log => (
                <BenefitLogCard key={log.id} log={log} onViewDetails={handleViewDetails} onDelete={handleDelete} getResidentName={getResidentName} />
              ))}
            </div>
          ) : (
            <p className="text-slate-500">No assessment outcomes for PIP found.</p>
          )}
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-slate-800 mb-4">Other Updates</h2>
          {otherLogs.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {otherLogs.map(log => (
                <BenefitLogCard key={log.id} log={log} onViewDetails={handleViewDetails} onDelete={handleDelete} getResidentName={getResidentName} />
              ))}
            </div>
          ) : (
            <p className="text-slate-500">No other updates for PIP found.</p>
          )}
        </section>

        {filteredLogs.length === 0 && !loading && (
          <Card>
            <CardContent className="p-12 text-center">
              <HandCoins className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No logs found for PIP</h3>
              <p className="text-slate-500">Get started by adding a new log entry.</p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  function renderWCAContent() {
    const normalizeLogType = (logType) => {
      if (!logType) return '';
      return logType.toLowerCase().replace(/\s+/g, '_');
    };

    const applicationLogs = filteredLogs.filter(log => normalizeLogType(log.log_type) === 'application_log');
    const assessmentOutcomes = filteredLogs.filter(log => normalizeLogType(log.log_type) === 'assessment_outcome');
    const otherLogs = filteredLogs.filter(log => normalizeLogType(log.log_type) !== 'application_log' && normalizeLogType(log.log_type) !== 'assessment_outcome');

    return (
      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-semibold text-slate-800 mb-4">Application Logs</h2>
          {applicationLogs.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {applicationLogs.map(log => (
                <BenefitLogCard key={log.id} log={log} onViewDetails={handleViewDetails} onDelete={handleDelete} getResidentName={getResidentName} />
              ))}
            </div>
          ) : (
            <p className="text-slate-500">No application logs for WCA found.</p>
          )}
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-slate-800 mb-4">Assessment Outcomes</h2>
          {assessmentOutcomes.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {assessmentOutcomes.map(log => (
                <BenefitLogCard key={log.id} log={log} onViewDetails={handleViewDetails} onDelete={handleDelete} getResidentName={getResidentName} />
              ))}
            </div>
          ) : (
            <p className="text-slate-500">No assessment outcomes for WCA found.</p>
          )}
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-slate-800 mb-4">Other Updates</h2>
          {otherLogs.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {otherLogs.map(log => (
                <BenefitLogCard key={log.id} log={log} onViewDetails={handleViewDetails} onDelete={handleDelete} getResidentName={getResidentName} />
              ))}
            </div>
          ) : (
            <p className="text-slate-500">No other updates for WCA found.</p>
          )}
        </section>

        {filteredLogs.length === 0 && !loading && (
          <Card>
            <CardContent className="p-12 text-center">
              <HandCoins className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No logs found for WCA</h3>
              <p className="text-slate-500">Get started by adding a new log entry.</p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  function renderUniversalCreditContent() {
    const getPropertyResidents = (propertyId) => {
      // Normalize status check - handle both 'active' and 'Active'
      return residents.filter(resident => {
        const residentStatus = resident.status?.toLowerCase();
        return resident.property_id === propertyId && residentStatus === 'active';
      });
    };

    const getPropertyLogs = (propertyId) => {
      const propertyResidents = residents.filter(resident => resident.property_id === propertyId);
      const residentIds = propertyResidents.map(r => r.id);
      return filteredLogs.filter(log => residentIds.includes(log.resident_id));
    };

    const getFilteredPropertyResidents = (propertyId) => {
      let propertyResidents = getPropertyResidents(propertyId);

      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        propertyResidents = propertyResidents.filter(resident => {
          const residentName = `${resident.first_name} ${resident.last_name}`.toLowerCase();
          const nameMatches = residentName.includes(searchLower);
          const hasMatchingLogs = filteredLogs.some(log => log.resident_id === resident.id);
          return nameMatches || hasMatchingLogs;
        });
      }

      return propertyResidents;
    };

    // Get residents without properties but with UC logs that match the current filter/search
    const residentsWithoutProperties = residents.filter(resident => {
      const hasNoProperty = !resident.property_id;
      const hasUCLogs = filteredLogs.some(log => log.resident_id === resident.id);
      const residentStatus = resident.status?.toLowerCase();
      return hasNoProperty && hasUCLogs && residentStatus === 'active';
    });

    console.log('🔍 UC Rendering Debug:', {
      totalProperties: properties.length,
      residentsWithoutProperties: residentsWithoutProperties.length,
      filteredLogs: filteredLogs.length,
      sampleResident: residents[0],
      allResidentsCount: residents.length,
      activeResidentsCount: residents.filter(r => r.status?.toLowerCase() === 'active').length
    });

    // Determine if any property cards or residents-without-properties card would be rendered
    const anyPropertySectionRendered = properties.some(property => 
      getFilteredPropertyResidents(property.id).length > 0 || getPropertyLogs(property.id).length > 0
    );
    const anyResidentsWithoutPropertySectionRendered = residentsWithoutProperties.length > 0;

    // Condition for the general "All Universal Credit Logs" section
    const shouldShowAllUCLogsCard = 
      filteredLogs.length > 0 && 
      (properties.length === 0 || // If no properties exist at all
       (!anyPropertySectionRendered && !anyResidentsWithoutPropertySectionRendered)); // AND no properties or residents-without-properties rendered anything

    // Condition for the final "No Universal Credit logs found" card
    const shouldShowNoLogsCard = 
      filteredLogs.length === 0 && 
      !loading;

    return (
      <div className="space-y-8">
        {properties.length > 0 && properties.map((property) => {
          const propertyResidents = getFilteredPropertyResidents(property.id);
          const propertyLogs = getPropertyLogs(property.id);

          if (searchTerm && propertyResidents.length === 0 && propertyLogs.length === 0) {
            // If searching, and this property has no residents or logs matching the search, skip rendering it.
            return null;
          }
          
          if (!searchTerm && propertyResidents.length === 0) {
            // If not searching, and this property has no active residents, skip rendering it.
            return null;
          }

          return (
            <Card key={property.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  {property.name} - Universal Credit Updates
                </CardTitle>
                <p className="text-slate-600">
                  Weekly Universal Credit updates for residents at {property.address}
                </p>
                <div className="flex items-center gap-4 text-sm text-slate-500">
                  <span>Active Residents: {propertyResidents.length}</span>
                  <span>Total Logs: {propertyLogs.length}</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {propertyResidents.map((resident) => {
                    const residentLogs = propertyLogs
                      .filter(log => log.resident_id === resident.id)
                      .sort((a, b) => new Date(b.log_date).getTime() - new Date(a.log_date).getTime());

                    return (
                      <div key={resident.id} className="border rounded-lg p-4 bg-slate-50">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                              {resident.first_name[0]}{resident.last_name[0]}
                            </div>
                            <div>
                              <h4 className="font-semibold text-slate-900">
                                {resident.first_name} {resident.last_name}
                             </h4>
                              <p className="text-sm text-slate-600">
                                {residentLogs.length} log{residentLogs.length !== 1 ? 's' : ''} recorded
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const newLogTemplate = {
                                resident_id: resident.id,
                                benefit_type: 'universal_credit',
                                log_type: 'application_log',
                                log_date: new Date().toISOString().slice(0, 16),
                                status: 'pending',
                                title: `UC Update - ${resident.first_name} ${resident.last_name}`,
                                logged_by: currentUser?.full_name || "",
                                sanctions: false,
                                sanction_date: "",
                                sanction_amount: 0,
                                date_resolved: ""
                              };
                              setEditingLog(newLogTemplate);
                              setShowForm(true);
                            }}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Add Log
                          </Button>
                        </div>

                        {residentLogs.length > 0 ? (
                          <div className="space-y-3">
                            {residentLogs.map((log, index) => (
                              <div
                                key={log.id}
                                className={`bg-white rounded-lg p-4 border ${index === 0 ? 'border-blue-200' : 'border-slate-200'} cursor-pointer hover:shadow-md transition-shadow`}
                                onClick={() => handleViewDetails(log)}
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    {index === 0 && (
                                      <Badge className="bg-blue-100 text-blue-800 text-xs">Latest</Badge>
                                    )}
                                    <Badge className={getStatusColor(log.status || log.Status)}>
                                      {(log.status || log.Status)?.replace('_', ' ')}
                                    </Badge>
                                    {(log.sanctions || log.Sanctions) && (
                                      <Badge className="bg-red-100 text-red-800 text-xs">Sanctions</Badge>
                                    )}
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEdit(log);
                                    }}
                                    className="text-slate-400 hover:text-slate-600"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                </div>

                                <h5 className="font-medium text-slate-900 mb-1">{log.title || log.Title}</h5>

                                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mt-3">
                                  <div className="flex items-center gap-2 text-slate-600">
                                    <Calendar className="w-4 h-4 text-slate-400" />
                                    <span>{format(new Date(log.log_date || log["Log Date"]), 'dd/MM/yyyy HH:mm')}</span>
                                  </div>

                                  {(log.amount > 0 || log.Amount > 0) && (
                                    <div className="flex items-center gap-2 text-slate-600">
                                      <Banknote className="w-4 h-4 text-green-600" />
                                      <span>£{(log.amount || log.Amount).toFixed(2)}</span>
                                    </div>
                                  )}

                                  {(log.logged_by || log["Logged By"]) && (
                                    <div className="flex items-center gap-2 text-slate-600">
                                      <UserIcon className="w-4 h-4 text-slate-400" />
                                      <span>{log.logged_by || log["Logged By"]}</span>
                                    </div>
                                  )}
                                </div>

                                {(log.description || log.Description) && (
                                  <p className="text-sm text-slate-600 mt-2 line-clamp-2">
                                    {log.description || log.Description}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="bg-white rounded-lg p-6 border border-slate-200 text-center">
                            <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                            <p className="text-slate-500 text-sm">No logs recorded yet</p>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {propertyResidents.length === 0 && (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                      <p className="text-slate-500">
                        {searchTerm ? 'No residents found matching your search.' : 'No active residents found for this property.'}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        }).filter(Boolean)}

        {/* Residents without properties section */}
        {residentsWithoutProperties.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-orange-600" />
                Residents Without Property Assignment
              </CardTitle>
              <p className="text-slate-600">
                Universal Credit logs for residents not yet assigned to a property
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {residentsWithoutProperties.map((resident) => {
                  const residentLogs = filteredLogs
                    .filter(log => log.resident_id === resident.id)
                    .sort((a, b) => new Date(b.log_date).getTime() - new Date(a.log_date).getTime());

                  return (
                    <div key={resident.id} className="border rounded-lg p-4 bg-orange-50">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-orange-600 rounded-full flex items-center justify-center text-white font-semibold">
                            {resident.first_name[0]}{resident.last_name[0]}
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-900">
                              {resident.first_name} {resident.last_name}
                            </h4>
                            <p className="text-sm text-orange-600 font-medium">No property assigned</p>
                            <p className="text-sm text-slate-600">
                              {residentLogs.length} log{residentLogs.length !== 1 ? 's' : ''} recorded
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newLogTemplate = {
                              resident_id: resident.id,
                              benefit_type: 'universal_credit',
                              log_type: 'application_log',
                              log_date: new Date().toISOString().slice(0, 16),
                              status: 'pending',
                              title: `UC Update - ${resident.first_name} ${resident.last_name}`,
                              logged_by: currentUser?.full_name || "",
                              sanctions: false,
                              sanction_date: "",
                              sanction_amount: 0,
                              date_resolved: ""
                            };
                            setEditingLog(newLogTemplate);
                            setShowForm(true);
                          }}
                          className="text-orange-600 hover:text-orange-700"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add Log
                        </Button>
                      </div>

                      <div className="space-y-3">
                        {residentLogs.map((log, index) => (
                          <div
                            key={log.id}
                            className={`bg-white rounded-lg p-4 border ${index === 0 ? 'border-orange-200' : 'border-slate-200'} cursor-pointer hover:shadow-md transition-shadow`}
                            onClick={() => handleViewDetails(log)}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                {index === 0 && (
                                  <Badge className="bg-orange-100 text-orange-800 text-xs">Latest</Badge>
                                )}
                                <Badge className={getStatusColor(log.status || log.Status)}>
                                  {(log.status || log.Status)?.replace('_', ' ')}
                                </Badge>
                                {(log.sanctions || log.Sanctions) && (
                                  <Badge className="bg-red-100 text-red-800 text-xs">Sanctions</Badge>
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEdit(log);
                                }}
                                className="text-slate-400 hover:text-slate-600"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            </div>

                            <h5 className="font-medium text-slate-900 mb-1">{log.title || log.Title}</h5>

                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mt-3">
                              <div className="flex items-center gap-2 text-slate-600">
                                <Calendar className="w-4 h-4 text-slate-400" />
                                <span>{format(new Date(log.log_date || log["Log Date"]), 'dd/MM/yyyy HH:mm')}</span>
                              </div>

                              {(log.amount > 0 || log.Amount > 0) && (
                                <div className="flex items-center gap-2 text-slate-600">
                                  <Banknote className="w-4 h-4 text-green-600" />
                                  <span>£{(log.amount || log.Amount).toFixed(2)}</span>
                                </div>
                              )}

                              {(log.logged_by || log["Logged By"]) && (
                                <div className="flex items-center gap-2 text-slate-600">
                                  <UserIcon className="w-4 h-4 text-slate-400" />
                                  <span>{log.logged_by || log["Logged By"]}</span>
                                </div>
                              )}
                            </div>

                            {(log.description || log.Description) && (
                              <p className="text-sm text-slate-600 mt-2 line-clamp-2">
                                {log.description || log.Description}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Show all UC logs if no properties or residents-without-properties sections are rendered, but filteredLogs exist */}
        {shouldShowAllUCLogsCard && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HandCoins className="w-5 h-5 text-blue-600" />
                All Universal Credit Logs
              </CardTitle>
              <p className="text-slate-600">
                Universal Credit logs for residents (property assignment may be pending)
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredLogs.map(log => (
                  <BenefitLogCard 
                    key={log.id} 
                    log={log} 
                    onViewDetails={handleViewDetails} 
                    onDelete={handleDelete} 
                    getResidentName={getResidentName} 
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Show "No Universal Credit logs found" if there are absolutely no filtered logs */}
        {shouldShowNoLogsCard && (
          <Card>
            <CardContent className="p-12 text-center">
              <Building2 className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No Universal Credit logs found</h3>
              <p className="text-slate-500">Add properties and residents to track Universal Credit updates, or add new log entries.</p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Benefits Management</h1>
          <p className="text-slate-600">Track resident benefit applications and logs</p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'housing_benefit' && (
            <Button
              onClick={exportHousingBenefitToCSV}
              variant="outline"
              className="flex items-center gap-2"
              disabled={loading || logs.filter(l => l.benefit_type === 'housing_benefit' && !l.deleted).length === 0}
            >
              <Download className="w-4 h-4" />
              Export HB to CSV
            </Button>
          )}
          {activeTab === 'universal_credit' && (
            <Button
              onClick={exportUniversalCreditToCSV}
              variant="outline"
              className="flex items-center gap-2"
              disabled={loading || logs.filter(l => l.benefit_type === 'universal_credit' && !l.deleted).length === 0}
            >
              <Download className="w-4 h-4" />
              Export UC to CSV
            </Button>
          )}
          {activeTab === 'pip' && (
            <Button
              onClick={exportPIPToCSV}
              variant="outline"
              className="flex items-center gap-2"
              disabled={loading || logs.filter(l => l.benefit_type === 'pip' && !l.deleted).length === 0}
            >
              <Download className="w-4 h-4" />
              Export PIP to CSV
            </Button>
          )}
          {activeTab === 'wca' && (
            <Button
              onClick={exportWCAToCSV}
              variant="outline"
              className="flex items-center gap-2"
              disabled={loading || logs.filter(l => l.benefit_type === 'wca' && !l.deleted).length === 0}
            >
              <Download className="w-4 h-4" />
              Export WCA to CSV
            </Button>
          )}
          <Button
            onClick={() => setShowForm(true)}
            className="bg-sky-600 hover:bg-sky-700 shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Log
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search logs by title, description, or resident name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={(tab) => {
        setActiveTab(tab);
        setShowForm(false);
        setEditingLog(null);
        setViewingLog(null);
      }}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="housing_benefit">Housing Benefit</TabsTrigger>
          <TabsTrigger value="universal_credit">Universal Credit</TabsTrigger>
          <TabsTrigger value="pip">PIP</TabsTrigger>
          <TabsTrigger value="wca">WCA</TabsTrigger>
        </TabsList>

        <Dialog open={showForm} onOpenChange={(open) => { if (!open) { setShowForm(false); setEditingLog(null); } }}>
          <DialogContent className="max-w-4xl p-0 overflow-hidden">
            <DialogHeader className="p-6 pb-0">
              <DialogTitle>{editingLog && (editingLog.id || editingLog.ID) ? 'Edit Benefit Log' : 'Add New Benefit Log'}</DialogTitle>
              <DialogDescription>
                Enter the details for the benefit log below.
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[90vh]">
              <div className="p-6">
                <BenefitLogForm_Supabase
                  log={editingLog}
                  residents={residents}
                  currentUser={currentUser}
                  activeBenefitType={activeTab}
                  onSubmit={handleSubmit}
                  onCancel={() => {
                    setShowForm(false);
                    setEditingLog(null);
                    setViewingLog(null);
                  }}
                  hideCard={true}
                />
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>

        {viewingLog && (
          <BenefitLogDetailModal
            log={viewingLog}
            getResidentName={getResidentName}
            onClose={() => setViewingLog(null)}
            onEdit={(logToEdit) => handleEdit(logToEdit)}
            onDelete={(logToDelete) => handleDelete(logToDelete)}
          />
        )}

        <TabsContent value="housing_benefit" className="mt-6">
          {renderHousingBenefitContent()}
        </TabsContent>
        <TabsContent value="universal_credit" className="mt-6">
          {renderUniversalCreditContent()}
        </TabsContent>
        <TabsContent value="pip" className="mt-6">
          {renderPIPContent()}
        </TabsContent>
        <TabsContent value="wca" className="mt-6">
          {renderWCAContent()}
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!logToDelete} onOpenChange={(open) => !open && setLogToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Benefit Log</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{logToDelete?.title}"? This action cannot be undone and will permanently remove all data associated with this benefit log entry.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete Log
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
