"use client"

import { useUser } from "@clerk/nextjs";
import React, { useState, useEffect, useCallback } from "react";
import { useClerkSupabaseClient } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, CheckCircle, AlertTriangle, FileStack, XCircle, Download, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import WeeklySWDocLogForm_Supabase from "@/components/weekly-sw-docs/WeeklySWDocLogForm";
import WeeklySWDocLogDetailModal from "@/components/weekly-sw-docs/WeeklySWDocLogDetailModal";

export default function WeeklySWDocs() {
    
    const { user } = useUser();
    const supabase = useClerkSupabaseClient()
    const [properties, setProperties] = useState([]);
    const [swDocuments, setSwDocuments] = useState([]);
    const [logs, setLogs] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [editingLog, setEditingLog] = useState(null);
    const [formContext, setFormContext] = useState({ documentName: '', weekDate: null });
    const [viewingLog, setViewingLog] = useState(null);
    const [logToDelete, setLogToDelete] = useState(null);

// First, define loadData at the top of your component
const loadData = async () => {
  if (!supabase) return; // ensure Supabase client is ready

  setLoading(true);
  setError(null);

  try {
    console.log("🔄 Loading Weekly SW Docs data...");

    // Load current user
    let userData = null;
    try {
      const userEmail = user?.primaryEmailAddress?.emailAddress;
      if (userEmail) {
        const { data } = await supabase
          .from('users')
          .select('*')
          .eq('Email', userEmail)
          .single();
        userData = data;
      }
    } catch (userError) {
      console.error("⚠️ Error loading user:", userError);
    }
    setCurrentUser(userData);
    console.log("✅ User loaded");

    // Load properties
    const { data: propertiesData, error: propsError } = await supabase
  .from('properties')
  .select('*');
if (propsError) throw propsError;

    const activeProperties = (propertiesData || []).filter(p =>
      p['Status'] === 'Active' && !p['Name']?.toLowerCase().includes('ryland')
    );
    setProperties(activeProperties);
    console.log(`✅ Loaded ${activeProperties.length} active properties`);

    // Load SW documents
const { data: swDocumentsData, error: docsError } = await supabase
  .from('sw_documents')
  .select('*');
if (docsError) throw docsError;


    const normalizedDocs = (swDocumentsData || []).map(d => ({
      id: d.ID,
      name: d.Name,
      category: d.Category,
      description: d.Description,
      is_active: d['Is Active']
    })).sort((a, b) => a.name.localeCompare(b.name));
    setSwDocuments(normalizedDocs);
    console.log(`✅ Loaded ${normalizedDocs.length} SW documents`);

  // Load weekly SW doc logs
const { data: logsData, error: logsError } = await supabase
  .from('weekly_sw_doc_logs')
  .select('*');
if (logsError) throw logsError;
      
    const statusMap = {
      'Completed': 'completed',
      'Issue Raised': 'issue_raised',
      'Incomplete': 'incomplete'
    };

    const normalizedLogs = (logsData || [])
      .filter(l => !l.Deleted)
      .map(l => ({
        id: l.ID,
        property_id: l['Property ID'],
        sw_document_id: l['SW Document ID'],
        week_start_date: l['Week Start Date'],
        log_date: l['Log Date'],
        status: statusMap[l.Status] || l.Status?.toLowerCase() || 'incomplete',
        notes: l.Notes,
        staff_member: l['Staff Member'],
        file_url: l['File URL'],
        deleted: l.Deleted,
        deleted_date: l['Deleted Date'],
        deleted_by: l['Deleted By'],
        created_date: l['Created Date'],
        updated_date: l['Updated Date'],
        created_by: l['Created By']
      }));
    setLogs(normalizedLogs);
    console.log(`✅ Loaded ${normalizedLogs.length} logs`);

    console.log("✅ All data loaded successfully");
  } catch (error) {
    console.error("❌ Error loading Weekly SW Docs data:", error);
    setError(error.message || "Failed to load data.");
  } finally {
    setLoading(false);
  }
};

// Then use useEffect to call it once on mount
useEffect(() => {
  loadData();
}, [supabase]); // only run when supabase client is ready
    
    const generateWeekDates = (startDate, numWeeks) => {
        const weeks = [];
        let currentDate = new Date(startDate);
        for (let i = 0; i < numWeeks; i++) {
            weeks.push(new Date(currentDate));
            currentDate.setDate(currentDate.getDate() + 7);
        }
        return weeks;
    };
    
    const weekDates = generateWeekDates('2025-12-29', 24);

    const handleEdit = useCallback((logData) => {
        setViewingLog(null);
        setEditingLog(logData);
        const doc = swDocuments.find(d => d.id === logData.sw_document_id); 
        setFormContext({
            documentName: doc?.name || 'Unknown Document',
            weekDate: logData.week_start_date
        });
        setShowForm(true);
    }, [swDocuments]);

    const handleViewDetails = useCallback((logData) => {
        setShowForm(false);
        setEditingLog(null);
        const doc = swDocuments.find(d => d.id === logData.sw_document_id); 
        setFormContext({
            documentName: doc?.name || 'Unknown Document',
            weekDate: logData.week_start_date
        });
        setViewingLog(logData);
    }, [swDocuments]);

    const handleSubmit = async (logData) => {
        try {
            console.log("📝 Submitting log data:", logData);
            
            // Map form status values to Supabase database format
            const statusMap = {
                'completed': 'Completed',
                'issue_raised': 'Issue Raised',
                'incomplete': 'Incomplete'
            };
            const dbStatus = statusMap[logData.status] || logData.status;

            if (logData.id) {
                console.log("✏️ Updating existing log:", logData.id);
                const { error } = await supabase
                        .from('weekly_sw_doc_logs')
                        .update({
                            'Status': dbStatus,
                            'Notes': logData.notes || null,
                            'Staff Member': logData.staff_member,
                            'File URL': logData.file_url || null,
                            'Updated Date': new Date().toISOString()
                        })
                        .eq('ID', logData.id);
                if (error) throw error;
                console.log("✅ Log updated successfully");
            } else {
                console.log("➕ Creating new log");
                const newLog = {
                    'ID': crypto.randomUUID(),
                    'Property ID': logData.property_id,
                    'SW Document ID': logData.sw_document_id,
                    'Week Start Date': logData.week_start_date,
                    'Log Date': new Date().toISOString(),
                    'Status': dbStatus,
                    'Notes': logData.notes || null,
                    'Staff Member': logData.staff_member,
                    'File URL': logData.file_url || null,
                    'Created Date': new Date().toISOString(),
                    'Created By': currentUser?.Email || 'Unknown'
                };
                console.log("📤 Inserting log:", newLog);
                const { error } = await supabase
                        .from('weekly_sw_doc_logs')
                        .insert([newLog]);
                if (error) throw error;
                console.log("✅ Log created successfully");
            }
            setShowForm(false);
            setEditingLog(null);
            setViewingLog(null);
            await loadData();
        } catch (error) {
            console.error("❌ Error saving Weekly SW Doc Log:", error);
            alert("Error saving log: " + error.message);
        }
    };

    const handleDelete = useCallback((logData) => {
        setLogToDelete(logData);
    }, []);

    const confirmDelete = async () => {
        if (logToDelete) {
            try {
                const { error } = await supabase
                        .from('weekly_sw_doc_logs')
                        .update({
                            'Deleted': true,
                            'Deleted Date': new Date().toISOString(),
                            'Deleted By': currentUser?.Email || 'unknown_user'
                        })
                        .eq('ID', logToDelete.id);
                if (error) throw error;
                
                console.log(`Weekly SW Doc Log ${logToDelete.id} soft deleted successfully.`);
                setLogToDelete(null);
                setViewingLog(null);
                setShowForm(false);
                await loadData();
            } catch (error) {
                console.error("Error deleting weekly SW doc log:", error);
                alert("Error deleting log entry: " + error.message);
            }
        }
    };

    const exportLogsToCSV = () => {
        console.log("🔵 Starting CSV export...");
        
        // Filter logs to only include the documents we're tracking
        const requiredDocsNames = [
            "Weekly inspections",
            "Weekly schedule"
        ];
        const trackedDocumentIds = swDocuments
            .filter(d => d.is_active && requiredDocsNames.includes(d.name))
            .map(d => d.id);
        
        const filteredLogs = logs.filter(log => trackedDocumentIds.includes(log.sw_document_id));
        
        console.log("🔵 Total logs in system:", logs.length);
        console.log("🔵 Tracked document IDs:", trackedDocumentIds);
        console.log("🔵 Filtered logs to export:", filteredLogs.length);
        
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
            return null;
        };

        const getPropertyName = (propertyId) => {
            const property = properties.find(p => p.ID === propertyId);
            return property?.Name || null;
        };

        const getDocumentName = (docId) => {
            const doc = swDocuments.find(d => d.id === docId);
            return doc?.name || null;
        };

        const formatStatus = (status) => {
            if (!status) return null;
            const statusMap = {
                'completed': 'Completed',
                'issue_raised': 'Issue Raised',
                'incomplete': 'Incomplete'
            };
            return statusMap[status] || null;
        };

        const headers = [
            "ID",
            "Created Date",
            "Updated Date",
            "Created By",
            "Property ID",
            "Property Name",
            "SW Document ID",
            "Document Name",
            "Week Start Date",
            "Log Date",
            "Status",
            "Notes",
            "Staff Member",
            "File URL",
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
            getPropertyName(log.property_id),
            log.sw_document_id || null,
            getDocumentName(log.sw_document_id),
            formatDate(log.week_start_date),
            formatDateTime(log.log_date),
            formatStatus(log.status),
            log.notes || null,
            log.staff_member || null,
            log.file_url || null,
            formatBoolean(log.deleted),
            formatDateTime(log.deleted_date),
            log.deleted_by || null
        ]);

        console.log("🔵 Rows prepared:", rows.length);

        if (filteredLogs.length === 0) {
            alert("No logs found for Weekly risk assessment and Weekly schedule documents to export.");
            return;
        }

        const escapeCSV = (value) => {
            if (value === null || value === undefined) {
                return '';
            }
            if (value === '') {
                return '';
            }
            const stringValue = String(value);
            if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
                return `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
        };

        const csvContent = [
            headers.map(h => `"${h}"`).join(','),
            ...rows.map(row => row.map(escapeCSV).join(','))
        ].join('\n');

        console.log("🔵 CSV content prepared, length:", csvContent.length);

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `weekly_sw_doc_logs_export_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        console.log("✅ Weekly SW Doc Logs CSV export completed successfully");
        console.log(`✅ Exported ${filteredLogs.length} logs for Weekly risk assessment and Weekly schedule`);
    };

    // Filter documents to only show "Weekly risk assessment" and "Weekly schedule"
    const requiredDocsNames = [
        "Weekly inspections",
        "Weekly schedule"
    ];
    
    console.log("🔍 ALL SW Documents:", swDocuments);
    console.log("🔍 Required document names:", requiredDocsNames);
    
    const documentsForTracking = swDocuments.filter(d => {
        const nameMatch = requiredDocsNames.includes(d.name);
        const trimmedNameMatch = requiredDocsNames.includes(d.name?.trim());
        console.log(`📋 Document: "${d.name}", ID: ${d.id}, Active: ${d.is_active}, Name Match: ${nameMatch}, Trimmed Match: ${trimmedNameMatch}`);
        return d.is_active && (nameMatch || trimmedNameMatch);
    });

    console.log("✅ Documents for tracking:", documentsForTracking.map(d => ({ id: d.id, name: d.name })));
    console.log("📊 Total logs:", logs.length);

    // Debug: Check log matching
    if (logs.length > 0 && documentsForTracking.length > 0 && properties.length > 0) {
        const sampleLog = logs[0];
        console.log("🔍 Sample log:", sampleLog);
        console.log("🔍 Property IDs:", properties.map(p => p.ID));
        console.log("🔍 Document IDs:", documentsForTracking.map(d => d.id));
        console.log("🔍 Week date format example:", format(weekDates[0], 'yyyy-MM-dd'));
    }
    
    // Debug: Find all logs for Weekly schedule
    const weeklyScheduleDocs = swDocuments.filter(d => d.name?.toLowerCase().includes('schedule'));
    console.log("📅 Weekly schedule documents found:", weeklyScheduleDocs);
    
    if (weeklyScheduleDocs.length > 0) {
        const scheduleDocIds = weeklyScheduleDocs.map(d => d.id);
        const scheduleLogsAll = logs.filter(l => scheduleDocIds.includes(l.sw_document_id));
        console.log("📅 All logs for Weekly schedule documents:", scheduleLogsAll);
        
        // Debug: Find apt 94 property
        const apt94Property = properties.find(p => p.Name?.toLowerCase().includes('94') || p.Address?.toLowerCase().includes('94'));
        console.log("🏢 Apt 94 property:", apt94Property);
        
        if (apt94Property) {
            const apt94ScheduleLogs = scheduleLogsAll.filter(l => l.property_id === apt94Property.ID);
            console.log("🏢📅 Apt 94 Weekly schedule logs:", apt94ScheduleLogs);
        }
    }


    if (error) {
        return (
            <div className="space-y-6 p-6">
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
                <div className="flex justify-center">
                    <Button onClick={loadData} disabled={loading}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Retry Loading Data
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Weekly Support Worker Documents</h1>
                    <p className="text-slate-600">Track weekly document checks across all properties.</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        onClick={exportLogsToCSV}
                        variant="outline"
                        className="flex items-center gap-2"
                        disabled={loading || logs.length === 0}
                    >
                        <Download className="w-4 h-4" />
                        Export Logs
                    </Button>
                </div>
            </div>

            {showForm && (
                <WeeklySWDocLogForm_Supabase
                    log={editingLog}
                    documentName={formContext.documentName}
                    weekDate={formContext.weekDate}
                    onSubmit={handleSubmit}
                    onCancel={() => { 
                        setShowForm(false); 
                        setEditingLog(null); 
                        setViewingLog(null);
                    }}
                    currentUser={currentUser}
                />
            )}

            {viewingLog && (
                <WeeklySWDocLogDetailModal
                    log={viewingLog}
                    documentName={formContext.documentName}
                    propertyName={properties.find(p => p.ID === viewingLog.property_id)?.Name || 'Unknown Property'}
                    weekDate={formContext.weekDate}
                    onClose={() => setViewingLog(null)}
                    onEdit={() => handleEdit(viewingLog)}
                    onDelete={() => handleDelete(viewingLog)}
                />
            )}

            {loading && (
                <div className="flex flex-col items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mb-4"></div>
                    <p className="text-slate-600">Loading weekly documents data...</p>
                </div>
            )}
            
            {!loading && properties.length === 0 && (
                <Card>
                    <CardContent className="p-8 text-center">
                        <FileStack className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-slate-900 mb-2">No active properties found</h3>
                        <p className="text-slate-500">Add some active properties to begin tracking weekly documents.</p>
                    </CardContent>
                </Card>
            )}

            {!loading && documentsForTracking.length === 0 && (
                <Card>
                    <CardContent className="p-8 text-center">
                        <FileStack className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-slate-900 mb-2">No document types configured</h3>
                        <p className="text-slate-500">Required document types (Weekly risk assessment, Weekly schedule) are not found in the system.</p>
                        <p className="text-xs text-slate-400 mt-2">Total documents loaded: {swDocuments.length}</p>
                        <p className="text-xs text-slate-400">Documents: {swDocuments.map(d => d.name).join(', ')}</p>
                    </CardContent>
                </Card>
            )}

            {!loading && properties.length > 0 && documentsForTracking.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileStack className="w-5 h-5 text-cyan-600" />
                            Weekly Document Tracking
                        </CardTitle>
                        <p className="text-slate-600">Click on any cell to log or update a document check for that week and property.</p>
                    </CardHeader>
                    <CardContent className="space-y-8 overflow-x-auto">
                        {properties.sort((a, b) => {
                            const order = ['Geraldine', 'Springfield', 'Little Green Lanes', 'Apt 94', 'Apartment 108'];
                            const indexA = order.findIndex(name => a.Name?.toLowerCase().includes(name.toLowerCase()));
                            const indexB = order.findIndex(name => b.Name?.toLowerCase().includes(name.toLowerCase()));
                            if (indexA === -1) return 1;
                            if (indexB === -1) return -1;
                            return indexA - indexB;
                        }).map(property => (
                            <div key={property.ID}>
                                <h3 className="text-xl font-semibold mb-4 text-slate-800">{property.Name}</h3>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="min-w-[200px] sticky left-0 bg-white z-10">Document Type</TableHead>
                                            {weekDates.map(date => (
                                                <TableHead key={date.toISOString()} className="text-center min-w-[100px]">
                                                    W/C {format(date, 'dd/MM/yy')}
                                                </TableHead>
                                            ))}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {documentsForTracking.map(doc => (
                                            <TableRow key={doc.id}>
                                                <TableCell className="font-medium sticky left-0 bg-white">{doc.name}</TableCell>
                                                {weekDates.map(weekStartDate => {
                                                    const weekStartString = format(weekStartDate, 'yyyy-MM-dd');
                                                    const logForWeek = logs.find(l => 
                                                        l.property_id === property.ID &&
                                                        l.sw_document_id === doc.id &&
                                                        format(new Date(l.week_start_date), 'yyyy-MM-dd') === weekStartString
                                                    );

                                                    return (
                                                        <TableCell key={weekStartDate.toISOString()} className="text-center">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="w-full"
                                                                onClick={() => {
                                                                    if (logForWeek) {
                                                                        handleViewDetails(logForWeek);
                                                                    } else {
                                                                        const logToInteractWith = {
                                                                            property_id: property.ID,
                                                                            sw_document_id: doc.id,
                                                                            week_start_date: weekStartString,
                                                                            staff_member: currentUser?.['Full Name'] || "",
                                                                            status: "incomplete"
                                                                        };
                                                                        handleEdit(logToInteractWith);
                                                                    }
                                                                }}
                                                            >
                                                                {logForWeek ? (
                                                                    logForWeek.status === 'issue_raised' ?
                                                                    <AlertTriangle className="w-5 h-5 text-orange-500" /> :
                                                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                                                ) : (
                                                                    <PlusCircle className="w-5 h-5 text-slate-400 hover:text-slate-600" />
                                                                )}
                                                            </Button>
                                                        </TableCell>
                                                    );
                                                })}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            <AlertDialog open={!!logToDelete} onOpenChange={(open) => !open && setLogToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Weekly Document Log</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this weekly document log entry? This action cannot be undone and will permanently remove all data associated with this log.
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
