"use client"

import { useUser } from "@clerk/nextjs";
import React, { useState, useEffect, useCallback } from "react";
import { useClerkSupabaseClient } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Edit, CheckCircle, PlusCircle, XCircle, Download, Calendar, FileText } from "lucide-react";
import { format } from "date-fns";
import SupportPlanForm_Supabase from "@/components/support-plans/SupportPlanForm";
import SupportPlanDetailModal from "@/components/support-plans/SupportPlanDetailModal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

// Helper function to normalize column names from Supabase
const normalizeData = (data) => {
  if (!data) return data;
  if (Array.isArray(data)) return data.map(normalizeData);
  
  const normalized = {};
  Object.keys(data).forEach(key => {
    // Convert "First Name" to "first_name", "ID" to "id", etc.
    const normalizedKey = key.toLowerCase().replace(/ /g, '_');
    normalized[normalizedKey] = data[key];
  });
  return normalized;
};

export default function SupportPlans_Supabase() {
  const { user } = useUser();
  const supabase = useClerkSupabaseClient();
  const [supportPlans, setSupportPlans] = useState([]);
  const [residents, setResidents] = useState([]);
  const [properties, setProperties] = useState([]);
  const [accommodations, setAccommodations] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [filteredPlans, setFilteredPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("support_notes");
  const [viewingPlan, setViewingPlan] = useState(null);
  const [planToDelete, setPlanToDelete] = useState(null);
  const [quarterlyReviews, setQuarterlyReviews] = useState([]);

  useEffect(() => {
  if (!supabase) return;
  loadData();
}, [supabase]);

// Helper: Get resident full name
const getResidentName = useCallback((residentId) => {
  const resident = residents.find(r => r.id === residentId);
  return resident ? `${resident.first_name} ${resident.last_name}` : "Unknown Resident";
}, [residents]);

// Filter plans based on tab, search, and resident status
const filterPlans = useCallback(() => {
  let current = Array.isArray(supportPlans) ? [...supportPlans] : [];

  current = current.filter(plan => {
    if (!plan || plan.deleted) return false;

    const resident = residents.find(r => r.id === plan.resident_id);
    const residentStatus = (resident?.status || resident?.Status || '').toLowerCase().replace(/ /g, '_');

    // Archive tab shows only moved_on residents
    if (activeTab === "archive") return residentStatus === 'moved_on';

    // Other tabs filter by plan type and active residents
    if (plan.plan_type !== activeTab && activeTab !== "archive") return false;
    return residentStatus === 'active' || !resident;
  });

  // Search filter
  if (searchTerm) {
    const search = searchTerm.toLowerCase();
    current = current.filter(plan => {
      const residentName = getResidentName(plan.resident_id).toLowerCase();
      const accommodation = accommodations.find(a => a.id === residents.find(r => r.id === plan.resident_id)?.accommodation_id);
      const property = accommodation ? properties.find(p => p.id === accommodation.property_id) : null;
      const accommodationName = property && accommodation ? `${property.name} - ${accommodation.room_number}` : 'unassigned';

      return plan.title?.toLowerCase().includes(search) ||
             plan.description?.toLowerCase().includes(search) ||
             residentName.includes(search) ||
             plan.key_worker?.toLowerCase().includes(search) ||
             plan.support_worker_name?.toLowerCase().includes(search) ||
             accommodationName.includes(search);
    });
  }

  setFilteredPlans(current);
}, [supportPlans, activeTab, searchTerm, getResidentName, residents, accommodations, properties]);

// Apply filters whenever dependencies change
useEffect(() => {
  filterPlans();
  console.log('🎯 Filtered Plans:', {
    activeTab,
    totalSupportPlans: supportPlans.length,
    filteredCount: filteredPlans.length,
    supportNotesCount: supportPlans.filter(p => p.plan_type === 'support_notes').length
  });
}, [filterPlans]);
  
  const loadData = async () => {
    setLoading(true);
    try {
      setCurrentUser(user);

      const [supportNotesResult, quarterlyReviewsResult, residentsResult, propertiesResult, accommodationsResult, usersResult] = await Promise.all([
        supabase.from('support_notes').select('*').eq('"Deleted"', false).order('"Created Date"', { ascending: false }),
        supabase.from('quarterly_reviews').select('*').eq('"Deleted"', false).order('"Created Date"', { ascending: false }),
        supabase.from('residents').select('*').eq('Deleted', false),
        supabase.from('properties').select('*').eq('Deleted', false),
        supabase.from('accommodations').select('*').eq('Deleted', false),
        supabase.from('users').select('*')
      ]);

      console.log('✅ Support notes loaded:', supportNotesResult.data?.length || 0);
      console.log('📋 Raw support notes data sample:', supportNotesResult.data?.[0]);
      console.log('✅ Quarterly reviews loaded:', quarterlyReviewsResult.data?.length || 0);
      console.log('✅ Residents loaded:', residentsResult.data?.length || 0);
      console.log('📋 Raw residents data sample:', residentsResult.data?.[0]);
      console.log('✅ Properties loaded:', propertiesResult.data?.length || 0);
      console.log('✅ Accommodations loaded:', accommodationsResult.data?.length || 0);
      console.log('✅ Users loaded:', usersResult.data?.length || 0);
      
      if (supportNotesResult.error) console.error('❌ Support notes error:', supportNotesResult.error);
      if (quarterlyReviewsResult.error) console.error('❌ Quarterly reviews error:', quarterlyReviewsResult.error);
      if (residentsResult.error) console.error('❌ Residents error:', residentsResult.error);
      if (propertiesResult.error) console.error('❌ Properties error:', propertiesResult.error);
      if (accommodationsResult.error) console.error('❌ Accommodations error:', accommodationsResult.error);
      if (usersResult.error) console.error('❌ Users error:', usersResult.error);

      // Combine support notes and quarterly reviews, adding plan_type field and normalizing
      // Helper function to normalize boolean values from database
      const normalizeBool = (value) => {
        if (value === true || value === 'true' || value === 'TRUE' || value === 1 || value === '1') return true;
        if (value === false || value === 'false' || value === 'FALSE' || value === 0 || value === '0') return false;
        return false; // Default to false for null/undefined
      };

      const supportNotesWithType = (supportNotesResult.data || [])
        .filter(note => note.Deleted !== true && note.Deleted !== 'true')
        .map(note => {
        // Normalize status from database format to snake_case
        const normalizeStatus = (status) => {
          if (!status) return 'document_combined_uploaded';
          const statusLower = status.toLowerCase().replace(/ /g, '_').replace(/\//g, '_');
          return statusLower;
        };
        
        const mapped = {
          id: note.ID,
          resident_id: note['Resident ID'],
          plan_type: 'support_notes',
          title: note.Title,
          description: note.Description,
          log_date: note['Log Date'],
          date_logged_by_office: note['Date Logged by Office'],
          key_worker: note['Key Worker'],
          status: normalizeStatus(note.Status),
          file_url: note['File URL'],
          attended_in_person: normalizeBool(note['Attended In Person']),
          attended_telephone: normalizeBool(note['Attended Telephone']),
          did_not_attend: normalizeBool(note['Did Not Attend']),
          authorised_absence: normalizeBool(note['Authorised Absence']),
          signature_page_missing: normalizeBool(note['Signature Page Missing']),
          signature_page_missing_comments: note['Signature Page Missing Comments'],
          support_hours: note['Support Hours'],
          deleted: note.Deleted,
          deleted_date: note['Deleted Date'],
          deleted_by: note['Deleted By'],
          created_date: note['Created Date'],
          updated_date: note['Updated Date'],
          created_by: note['Created By']
        };
        
        console.log('📋 Support Note Mapping:', note.ID, {
          rawAttendedInPerson: note['Attended In Person'],
          rawAttendedTelephone: note['Attended Telephone'],
          rawDidNotAttend: note['Did Not Attend'],
          rawSignatureMissing: note['Signature Page Missing'],
          status: mapped.status,
          attended_in_person: mapped.attended_in_person,
          attended_telephone: mapped.attended_telephone,
          did_not_attend: mapped.did_not_attend,
          signature_page_missing: mapped.signature_page_missing
        });
        
        return mapped;
      });

      const quarterlyReviewsWithType = (quarterlyReviewsResult.data || [])
        .filter(review => review.Deleted !== true && review.Deleted !== 'true')
        .map(review => ({
        id: review.ID,
        resident_id: review['Resident ID'],
        plan_type: 'quarterly_reviews',
        title: review.Title,
        description: review.Description,
        log_date: review['Log Date'],
        date_logged_by_office: review['Date Logged by Office'],
        key_worker: review['Key Worker'],
        status: review.Status?.toLowerCase() || 'up_to_date',
        file_url: review['File URL'],
        next_review_date: review['Next Review Date'],
        review_completed_date: review['Review Completed Date'],
        support_worker_name: review['Support Worker Name'],
        goals_discussed: review['Goals Discussed'],
        action_points: review['Action Points'],
        resident_feedback: review['Resident Feedback'],
        deleted: review.Deleted,
        deleted_date: review['Deleted Date'],
        deleted_by: review['Deleted By'],
        created_date: review['Created Date'],
        updated_date: review['Updated Date'],
        created_by: review['Created By']
      }));

      const combinedPlans = [
        ...supportNotesWithType,
        ...quarterlyReviewsWithType
      ];
      
      console.log('🔥 Combined Plans Sample:', combinedPlans?.[0]);
      console.log('🔥 Total Combined Plans:', combinedPlans.length);
      console.log('🔥 Support Notes with resident_id:', supportNotesWithType.filter(n => n.resident_id).map(n => ({ id: n.id, resident_id: n.resident_id })));
      
      setSupportPlans(combinedPlans);
      
      const normalizedResidents = normalizeData(residentsResult.data) || [];
      console.log('🔥 Normalized Residents Sample:', normalizedResidents?.[0]);
      console.log('🔥 Resident IDs:', normalizedResidents.map(r => ({ name: r.first_name, id: r.id })));
      
      setResidents(normalizedResidents);
      setProperties(normalizeData(propertiesResult.data) || []);
      setAccommodations(normalizeData(accommodationsResult.data) || []);
      setUsers(normalizeData(usersResult.data) || []);


    } catch (error) {
      console.error("❌ Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (planData) => {
    try {
      console.log('📝 Received planData from form:', planData);
      
      const tableName = planData["Plan Type"] === 'quarterly_reviews' ? 'quarterly_reviews' : 'support_notes';
      console.log('🗃️ Using table:', tableName);
      console.log('✏️ Edit mode:', !!editingPlan, editingPlan?.id);
      
      let result;
      if (editingPlan && editingPlan.id) {
        result = await supabase.from(tableName).update(planData).eq('"ID"', editingPlan.id);
      } else {
        // Ensure ID is present before insert
        if (!planData.ID) {
          console.error('❌ Missing ID in planData before insert');
          alert('Error: Missing ID field. Please try again.');
          return;
        }
        result = await supabase.from(tableName).insert([planData]);
      }
      
      if (result.error) {
        console.error('❌ Supabase error:', result.error);
        alert(`Error saving: ${result.error.message}`);
        return;
      }
      
      console.log('✅ Successfully saved to Supabase:', result);
      setShowForm(false);
      setEditingPlan(null);
      loadData();
    } catch (error) {
      console.error("❌ Error saving support plan:", error);
      alert(`Error: ${error.message}`);
    }
  };

  const handleEdit = (plan) => {
    setViewingPlan(null);
    setEditingPlan(plan);
    setShowForm(true);
  };
  
  const handleViewDetails = (plan) => {
    setShowForm(false);
    setEditingPlan(null);
    setViewingPlan(plan);
  };

  const handleDelete = (plan) => {
    setPlanToDelete(plan);
  };

  const confirmDelete = async () => {
    if (planToDelete) {
      try {
        const tableName = planToDelete.plan_type === 'quarterly_reviews' ? 'quarterly_reviews' : 'support_notes';
        
        await supabase.from(tableName).update({
          "Deleted": true,
          "Deleted Date": new Date().toISOString(),
          "Deleted By": currentUser?.email || "Unknown User"
        }).eq('"ID"', planToDelete.id);
        
        setPlanToDelete(null);
        setViewingPlan(null);
        loadData();
      } catch (error) {
        console.error("Error deleting support plan:", error);
      }
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      in_progress: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
      up_to_date: "bg-green-100 text-green-800",
      overdue: "bg-red-100 text-red-800",
      no_review: "bg-gray-100 text-gray-800",
      document_missing: "bg-red-100 text-red-800",
      document_combined_uploaded: "bg-green-100 text-green-800",
      signature_missing: "bg-orange-100 text-orange-800",
      due: "bg-yellow-100 text-yellow-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const exportSupportNotesToCSV = () => {
    const supportNotesData = supportPlans.filter(plan => 
      plan.plan_type === 'support_notes' && 
      !plan.deleted && 
      plan.resident_id && 
      plan.resident_id.trim() !== ''
    );
    
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

    const getResidentNameForCSV = (residentId) => {
      const resident = residents.find(r => r.id === residentId);
      return resident ? `${resident.first_name} ${resident.last_name}` : null;
    };

    const getPropertyName = (residentId) => {
      const resident = residents.find(r => r.id === residentId);
      if (!resident?.accommodation_id) return null;
      const accommodation = accommodations.find(a => a.id === resident.accommodation_id);
      if (!accommodation?.property_id) return null;
      const property = properties.find(p => p.id === accommodation.property_id);
      return property?.name || null;
    };

    const getRoomNumber = (residentId) => {
      const resident = residents.find(r => r.id === residentId);
      if (!resident?.accommodation_id) return null;
      const accommodation = accommodations.find(a => a.id === resident.accommodation_id);
      return accommodation?.room_number || null;
    };

    const formatStatus = (status) => {
      if (!status) return 'Document Combined/Uploaded';
      const statusMap = {
        'document_missing': 'Document Missing',
        'document_combined_uploaded': 'Document Combined/Uploaded',
        'signature_missing': 'Signature Missing',
        'pending': 'Document Combined/Uploaded',
        'in_progress': 'Document Combined/Uploaded',
        'completed': 'Document Combined/Uploaded',
      };
      return statusMap[status] || 'Document Combined/Uploaded';
    };

    const headers = [
      "ID", "Created Date", "Updated Date", "Created By", "Resident ID", "Resident Name",
      "Property Name", "Room Number", "Plan Type", "Title", "Description", "Log Date",
      "Date Logged by Office", "Key Worker", "Status", "File URL", "Attended In Person",
      "Attended Telephone", "Did Not Attend", "Authorised Absence", "Signature Page Missing",
      "Signature Page Missing Comments", "Support Hours", "Deleted", "Deleted Date", "Deleted By"
    ];

    const rows = supportNotesData.map((plan) => [
      plan.id || null,
      formatDateTime(plan.created_date),
      formatDateTime(plan.updated_date),
      plan.created_by || null,
      plan.resident_id || null,
      getResidentNameForCSV(plan.resident_id),
      getPropertyName(plan.resident_id),
      getRoomNumber(plan.resident_id),
      'support_notes',
      plan.title || null,
      plan.description || null,
      formatDateTime(plan.log_date),
      formatDateTime(plan.date_logged_by_office),
      plan.key_worker || null,
      formatStatus(plan.status),
      plan.file_url || null,
      formatBoolean(plan.attended_in_person),
      formatBoolean(plan.attended_telephone),
      formatBoolean(plan.did_not_attend),
      formatBoolean(plan.authorised_absence),
      formatBoolean(plan.signature_page_missing),
      plan.signature_page_missing_comments || null,
      plan.support_hours !== null && plan.support_hours !== undefined ? plan.support_hours : null,
      formatBoolean(plan.deleted),
      formatDateTime(plan.deleted_date),
      plan.deleted_by || null
    ]);

    const escapeCSV = (value) => {
      if (value === null || value === undefined) return '';
      if (value === '') return '';
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n') || stringValue.includes('\r')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    const csvRows = [headers.join(',')];
    rows.forEach(row => {
      const csvRow = row.map(escapeCSV).join(',');
      csvRows.push(csvRow);
    });
    const csvContent = csvRows.join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `support_notes_export_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportQuarterlyReviewsToCSV = () => {
    const quarterlyReviewsData = supportPlans.filter(plan => 
      plan.plan_type === 'quarterly_reviews' && 
      !plan.deleted && 
      plan.resident_id && 
      plan.resident_id.trim() !== ''
    );

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

    const getResidentNameForCSV = (residentId) => {
      const resident = residents.find(r => r.id === residentId);
      return resident ? `${resident.first_name} ${resident.last_name}` : null;
    };

    const getPropertyName = (residentId) => {
      const resident = residents.find(r => r.id === residentId);
      if (!resident?.accommodation_id) return null;
      const accommodation = accommodations.find(a => a.id === resident.accommodation_id);
      if (!accommodation?.property_id) return null;
      const property = properties.find(p => p.id === accommodation.property_id);
      return property?.name || null;
    };

    const getRoomNumber = (residentId) => {
      const resident = residents.find(r => r.id === residentId);
      if (!resident?.accommodation_id) return null;
      const accommodation = accommodations.find(a => a.id === resident.accommodation_id);
      return accommodation?.room_number || null;
    };

    const formatStatus = (status) => {
      if (!status) return null;
      const statusMap = {
        'up_to_date': 'Up To Date',
        'due': 'Due',
        'overdue': 'Overdue',
        'no_review': 'No Review',
        'pending': 'Pending',
        'in_progress': 'In Progress',
        'completed': 'Completed'
      };
      return statusMap[status] || null;
    };

    const headers = [
      "ID", "Created Date", "Updated Date", "Created By", "Resident ID", "Resident Name",
      "Property Name", "Room Number", "Plan Type", "Title", "Description", "Log Date",
      "Date Logged by Office", "Key Worker", "Status", "Review Completed Date", "Next Review Date",
      "Support Worker Name", "Goals Discussed", "Action Points", "Resident Feedback", "File URL",
      "Deleted", "Deleted Date", "Deleted By"
    ];

    const rows = quarterlyReviewsData.map((plan) => [
      plan.id || null,
      formatDateTime(plan.created_date),
      formatDateTime(plan.updated_date),
      plan.created_by || null,
      plan.resident_id || null,
      getResidentNameForCSV(plan.resident_id),
      getPropertyName(plan.resident_id),
      getRoomNumber(plan.resident_id),
      plan.plan_type || null,
      plan.title || null,
      plan.description || null,
      formatDateTime(plan.log_date),
      formatDate(plan.date_logged_by_office),
      plan.key_worker || null,
      formatStatus(plan.status),
      formatDate(plan.review_completed_date),
      formatDate(plan.next_review_date),
      plan.support_worker_name || null,
      plan.goals_discussed || null,
      plan.action_points || null,
      plan.resident_feedback || null,
      plan.file_url || null,
      formatBoolean(plan.deleted),
      formatDateTime(plan.deleted_date),
      plan.deleted_by || null
    ]);

    const escapeCSV = (value) => {
      if (value === null || value === undefined) return '';
      if (value === '') return '';
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n') || stringValue.includes('\r')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    const csvRows = [headers.join(',')];
    rows.forEach(row => {
      const csvRow = row.map(escapeCSV).join(',');
      csvRows.push(csvRow);
    });
    const csvContent = csvRows.join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `quarterly_reviews_export_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Support Plans & Notes</h1>
          <p className="text-slate-600">Track daily support notes and quarterly reviews for residents</p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={exportSupportNotesToCSV}
            variant="outline"
            className="flex items-center gap-2"
            disabled={loading || supportPlans.filter(plan => plan.plan_type === 'support_notes' && !plan.deleted).length === 0}
          >
            <Download className="w-4 h-4" />
            Export Support Notes
          </Button>
          <Button
            onClick={exportQuarterlyReviewsToCSV}
            variant="outline"
            className="flex items-center gap-2"
            disabled={loading || supportPlans.filter(plan => plan.plan_type === 'quarterly_reviews' && !plan.deleted).length === 0}
          >
            <Download className="w-4 h-4" />
            Export Quarterly Reviews
          </Button>
          <Button
            onClick={() => setShowForm(true)}
            className="bg-indigo-600 hover:bg-indigo-700 shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Entry
          </Button>
        </div>
      </div>

      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-start gap-3 mb-3">
            <FileText className="w-5 h-5 text-indigo-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">Entry Status Legend</h3>
              <p className="text-sm text-slate-600 mb-4">Use this guide to understand the status of each weekly support note:</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 bg-white rounded-lg p-3 border border-slate-200">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
              <div>
                <div className="font-medium text-sm text-slate-900">Attended - In Person</div>
                <div className="text-xs text-slate-500">Document uploaded</div>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white rounded-lg p-3 border border-slate-200">
              <CheckCircle className="w-5 h-5 text-blue-400 flex-shrink-0" />
              <div>
                <div className="font-medium text-sm text-slate-900">Attended - Telephone</div>
                <div className="text-xs text-slate-500">Phone session completed</div>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white rounded-lg p-3 border border-slate-200">
              <CheckCircle className="w-5 h-5 text-blue-900 flex-shrink-0" />
              <div>
                <div className="font-medium text-sm text-slate-900">Did Not Attend</div>
                <div className="text-xs text-slate-500">Resident absent</div>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white rounded-lg p-3 border border-slate-200">
              <XCircle className="w-5 h-5 text-orange-500 flex-shrink-0" />
              <div>
                <div className="font-medium text-sm text-slate-900">Signature Missing</div>
                <div className="text-xs text-slate-500">Requires signature</div>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white rounded-lg p-3 border border-slate-200">
              <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <div>
                <div className="font-medium text-sm text-slate-900">Document Missing</div>
                <div className="text-xs text-slate-500">Document not uploaded</div>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white rounded-lg p-3 border border-slate-200">
              <PlusCircle className="w-5 h-5 text-slate-400 flex-shrink-0" />
              <div>
                <div className="font-medium text-sm text-slate-900">Not Logged</div>
                <div className="text-xs text-slate-500">Click to add entry</div>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white rounded-lg p-3 border border-slate-200">
              <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                <span className="text-xs text-slate-400 font-medium">N/A</span>
              </div>
              <div>
                <div className="font-medium text-sm text-slate-900">Not Applicable</div>
                <div className="text-xs text-slate-500">Before move-in date</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search by resident name, title, description, or key worker..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={(tab) => { setActiveTab(tab); setShowForm(false); setEditingPlan(null); setViewingPlan(null); }}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="support_notes">Weekly Support Notes</TabsTrigger>
          <TabsTrigger value="quarterly_reviews">Quarterly Reviews</TabsTrigger>
          <TabsTrigger value="archive">Archive</TabsTrigger>
        </TabsList>
        
        {viewingPlan && (
          <div className="mt-6">
            <SupportPlanDetailModal
              plan={viewingPlan}
              getResidentName={getResidentName}
              onClose={() => setViewingPlan(null)}
              onEdit={handleEdit}
              onDelete={handleDelete}
              residents={residents}
              properties={properties}
              accommodations={accommodations}
            />
          </div>
        )}

        {showForm && (
          <div className="mt-6">
            <SupportPlanForm_Supabase
              plan={editingPlan}
              residents={residents}
              users={users}
              currentUser={currentUser}
              activePlanType={activeTab}
              onSubmit={handleSubmit}
              onCancel={() => { setShowForm(false); setEditingPlan(null); setViewingPlan(null); }}
            />
          </div>
        )}

        <TabsContent value="support_notes" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                Weekly Support Notes
              </CardTitle>
              <p className="text-slate-600">Track weekly support notes for residents, organised by property.</p>
            </CardHeader>
            <CardContent className="space-y-8 overflow-x-auto">
              {loading && <p>Loading weekly notes...</p>}
              {!loading && properties.length === 0 && (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">No properties found</h3>
                  <p className="text-slate-500">Add properties and assign residents to them to see weekly support notes.</p>
                </div>
              )}
              {!loading && properties.length > 0 && (
                properties.map(property => {
                  const residentsInThisProperty = residents.filter(r => r.property_id === property.id);
                  
                  let residentsToDisplayForProperty = [];

                  if (searchTerm) {
                    const lowercasedTerm = searchTerm.toLowerCase();
                    residentsToDisplayForProperty = residentsInThisProperty.filter(resident => {
                      const residentName = getResidentName(resident.id).toLowerCase();
                      const claimRef = resident.claim_reference_number?.toLowerCase() || '';
                      if (residentName.includes(lowercasedTerm) || claimRef.includes(lowercasedTerm)) {
                        return true;
                      }
                      const hasMatchingNote = filteredPlans.some(
                        plan => plan.resident_id === resident.id && plan.plan_type === 'support_notes'
                      );
                      return hasMatchingNote;
                    });
                  } else {
                    residentsToDisplayForProperty = residentsInThisProperty.filter(r => {
                      const status = (r.status || r.Status || '').toLowerCase();
                      return status === 'active';
                    });
                  }
                  
                  if (residentsToDisplayForProperty.length === 0) {
                    return null;
                  }

                  residentsToDisplayForProperty.sort((a, b) => a.first_name.localeCompare(b.first_name));

                  const generateWeekDates = (startDate, numWeeks) => {
                    const weeks = [];
                    let currentDate = new Date(startDate);
                    for (let i = 0; i < numWeeks; i++) {
                      weeks.push(new Date(currentDate));
                      currentDate.setDate(currentDate.getDate() + 7);
                    }
                    return weeks;
                  };
                  const weekDates = generateWeekDates('2026-01-01', 18);

                  return (
                    <div key={property.id}>
                      <h3 className="text-xl font-semibold mb-4 text-slate-800">{property.name}</h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="min-w-[200px] sticky left-0 bg-white z-10">Resident Name</TableHead>
                            <TableHead className="min-w-[150px]">Claim Ref No.</TableHead>
                            {weekDates.map(date => (
                              <TableHead key={date.toISOString()} className="text-center">W/C {format(date, 'dd/MM/yy')}</TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {residentsToDisplayForProperty.map(resident => {
                            const residentPlans = filteredPlans.filter(p => p.resident_id === resident.id && p.plan_type === 'support_notes');
                            
                            console.log(`🔍 Resident ${resident.first_name} ${resident.last_name}:`, {
                              totalPlans: residentPlans.length,
                              plans: residentPlans.map(p => ({
                                id: p.id,
                                log_date: p.log_date,
                                status: p.status,
                                attended_in_person: p.attended_in_person,
                                attended_telephone: p.attended_telephone,
                                did_not_attend: p.did_not_attend,
                                signature_page_missing: p.signature_page_missing
                              }))
                            });
                            
                            const residentMoveInDate = resident.move_in_date ? new Date(resident.move_in_date) : null;
                            if (residentMoveInDate) {
                              residentMoveInDate.setHours(0, 0, 0, 0);
                            }
                            
                            return (
                              <TableRow key={resident.id}>
                                <TableCell className="font-medium sticky left-0 bg-white">{resident.first_name} {resident.last_name}</TableCell>
                                <TableCell>{resident.claim_reference_number || 'N/A'}</TableCell>
                                {weekDates.map(weekStartDate => {
                                  const weekEndDate = new Date(weekStartDate);
                                  weekEndDate.setDate(weekStartDate.getDate() + 7);
                                  weekEndDate.setHours(0, 0, 0, 0);
                                  
                                  const isBeforeMoveIn = residentMoveInDate && weekEndDate <= residentMoveInDate;
                                  
                                  const planForWeek = residentPlans.find(p => {
                                    const logDate = new Date(p.log_date);
                                    const planLogDate = new Date(logDate.getFullYear(), logDate.getMonth(), logDate.getDate());
                                    const weekStart = new Date(weekStartDate.getFullYear(), weekStartDate.getMonth(), weekStartDate.getDate());
                                    const weekEnd = new Date(weekEndDate.getFullYear(), weekEndDate.getMonth(), weekEndDate.getDate());
                                    const matches = planLogDate >= weekStart && planLogDate < weekEnd;
                                    
                                    if (matches) {
                                      console.log('🎯 Found plan for week:', {
                                        resident: resident.first_name,
                                        weekStart: weekStart.toISOString(),
                                        planLogDate: planLogDate.toISOString(),
                                        planId: p.id,
                                        attended_in_person: p.attended_in_person,
                                        attended_telephone: p.attended_telephone,
                                        did_not_attend: p.did_not_attend,
                                        signature_page_missing: p.signature_page_missing,
                                        status: p.status
                                      });
                                    }
                                    
                                    return matches;
                                  });

                                  if (isBeforeMoveIn) {
                                    return (
                                      <TableCell key={weekStartDate.toISOString()} className="text-center">
                                        <div className="w-full flex items-center justify-center">
                                          <span className="text-xs text-slate-400 font-medium">N/A</span>
                                        </div>
                                      </TableCell>
                                    );
                                  }

                                  let iconToShow;
                                  if (planForWeek) {
                                    // Priority order: status flags first, then attendance flags
                                    // Values are now normalized to proper booleans in loadData
                                    if (planForWeek.status === 'document_missing') {
                                      iconToShow = <XCircle className="w-5 h-5 text-red-500" />;
                                    } else if (planForWeek.status === 'signature_missing' || planForWeek.signature_page_missing === true) {
                                      iconToShow = <XCircle className="w-5 h-5 text-orange-500" />;
                                    } else if (planForWeek.did_not_attend === true) {
                                      iconToShow = <CheckCircle className="w-5 h-5 text-blue-900" />;
                                    } else if (planForWeek.attended_telephone === true) {
                                      iconToShow = <CheckCircle className="w-5 h-5 text-blue-400" />;
                                    } else if (planForWeek.attended_in_person === true) {
                                      iconToShow = <CheckCircle className="w-5 h-5 text-green-500" />;
                                    } else {
                                      // Default: if plan exists but no specific flag is set, show green checkmark
                                      iconToShow = <CheckCircle className="w-5 h-5 text-green-500" />;
                                    }
                                  } else {
                                    // No plan for this week - show plus icon to add one
                                    iconToShow = <PlusCircle className="w-5 h-5 text-slate-400 hover:text-slate-600" />;
                                  }

                                  return (
                                    <TableCell key={weekStartDate.toISOString()} className="text-center">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="w-full"
                                        onClick={() => {
                                          if (planForWeek) {
                                            handleViewDetails(planForWeek);
                                          } else {
                                            const planToInteractWith = {
                                              resident_id: resident.id,
                                              plan_type: 'support_notes',
                                              log_date: new Date(weekStartDate.getTime() + (12 * 60 * 60 * 1000)).toISOString().slice(0, 16),
                                              key_worker: currentUser?.email || "",
                                              status: 'document_combined_uploaded',
                                              title: `Weekly Note for ${resident.first_name} ${resident.last_name} - W/C ${format(weekStartDate, 'dd/MM/yy')}`
                                            };
                                            handleEdit(planToInteractWith);
                                          }
                                        }}
                                      >
                                        {iconToShow}
                                      </Button>
                                    </TableCell>
                                  );
                                })}
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="archive" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-slate-600" />
                Archive - Former Residents
              </CardTitle>
              <p className="text-slate-600">View support plans and quarterly reviews for residents who have moved out</p>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Resident</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Logged By</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPlans.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-slate-900 mb-2">No archived records found</h3>
                          <p className="text-slate-500">Support plans for former residents will appear here.</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredPlans
                        .sort((a, b) => new Date(b.log_date).getTime() - new Date(a.log_date).getTime())
                        .map((plan) => (
                          <TableRow 
                            key={plan.id} 
                            className="hover:bg-slate-50 cursor-pointer"
                            onClick={() => handleViewDetails(plan)}
                          >
                            <TableCell className="font-medium">
                              {getResidentName(plan.resident_id)}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {plan.plan_type === 'support_notes' ? 'Support Note' : 'Quarterly Review'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {format(new Date(plan.log_date), 'dd/MM/yyyy')}
                            </TableCell>
                            <TableCell className="max-w-xs truncate">
                              {plan.title}
                            </TableCell>
                            <TableCell>
                              {plan.key_worker || plan.created_by || '-'}
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(plan.status)}>
                                {plan.status?.replace(/_/g, ' ')}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewDetails(plan);
                                }}
                              >
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quarterly_reviews" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600" />
                Quarterly Reviews
              </CardTitle>
              <p className="text-slate-600">Track quarterly review meetings and assessments - complete history for all residents</p>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Accommodation</TableHead>
                      <TableHead>Resident</TableHead>
                      <TableHead>Review Date</TableHead>
                      <TableHead>Review Title</TableHead>
                      <TableHead>Support Worker</TableHead>
                      <TableHead>Logged By</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Next Review Due</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(() => {
                      const activeResidents = residents.filter(r => {
                        const status = (r.status || r.Status || '').toLowerCase();
                        if (status !== 'active') return false;
                        if (!r.accommodation_id) return false;
                        const accommodation = accommodations.find(a => a.id === r.accommodation_id);
                        if (!accommodation?.property_id) return false;
                        const property = properties.find(p => p.id === accommodation.property_id);
                        const isRylandProperty = property?.name?.toLowerCase().includes('ryland');
                        return !isRylandProperty;
                      });
                      
                      const residentsToDisplay = activeResidents
                        .filter(resident => {
                          const hasFilteredReviews = filteredPlans.some(p => p.resident_id === resident.id && p.plan_type === 'quarterly_reviews');
                          const hasNoReviewsAtAll = !supportPlans.some(p => p.resident_id === resident.id && p.plan_type === 'quarterly_reviews');
                          
                          if(searchTerm) {
                            return hasFilteredReviews;
                          }
                          return hasFilteredReviews || hasNoReviewsAtAll;
                        })
                        .sort((a, b) => a.first_name.localeCompare(b.first_name));

                      if (residentsToDisplay.length === 0 && !loading) {
                        return (
                          <TableRow>
                            <TableCell colSpan={9} className="text-center py-8">
                              <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                              <h3 className="text-lg font-medium text-slate-900 mb-2">No quarterly reviews found</h3>
                              <p className="text-slate-500">No active residents or no reviews match your search.</p>
                            </TableCell>
                          </TableRow>
                        );
                      }

                      return residentsToDisplay.map((resident) => {
                        const residentReviews = supportPlans
                          .filter(p => p.resident_id === resident.id && p.plan_type === 'quarterly_reviews' && !p.deleted)
                          .sort((a, b) => new Date(b.log_date).getTime() - new Date(a.log_date).getTime());

                        const accommodation = accommodations.find(a => a.id === resident.accommodation_id);
                        const property = accommodation ? properties.find(p => p.id === accommodation.property_id) : null;
                        const accommodationName = property && accommodation
                          ? `${property.name} - ${accommodation.room_number}`
                          : 'Unassigned';

                        if (residentReviews.length === 0) {
                          return (
                            <TableRow key={`${resident.id}-no-reviews`} className="hover:bg-slate-50">
                              <TableCell className="font-medium text-slate-700">{accommodationName}</TableCell>
                              <TableCell className="font-medium">{resident.first_name} {resident.last_name}</TableCell>
                              <TableCell>-</TableCell>
                              <TableCell className="max-w-xs truncate text-slate-500">No reviews yet</TableCell>
                              <TableCell>-</TableCell>
                              <TableCell>-</TableCell>
                              <TableCell>
                                <Badge className="bg-gray-100 text-gray-800">No review</Badge>
                              </TableCell>
                              <TableCell>-</TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const newReview = {
                                      resident_id: resident.id,
                                      plan_type: 'quarterly_reviews',
                                      log_date: new Date().toISOString().slice(0, 16),
                                      status: 'up_to_date',
                                      title: `Quarterly Review - ${resident.first_name} ${resident.last_name}`,
                                      key_worker: currentUser?.email || ""
                                    };
                                    handleEdit(newReview);
                                  }}
                                  className="text-indigo-600 hover:text-indigo-700"
                                >
                                  <PlusCircle className="w-4 h-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        }

                        return residentReviews.map((review, index) => {
                          // Use the stored status from the database
                          let displayStatus = review.status || 'up_to_date';

                          const displayStatusText = displayStatus.replace(/_/g, ' '); 

                          return (
                            <TableRow 
                              key={`${resident.id}-${review.id || index}`} 
                              className="hover:bg-slate-50 cursor-pointer"
                              onClick={() => handleViewDetails(review)}
                            >
                              <TableCell className="font-medium text-slate-700">
                                {index === 0 ? accommodationName : ''}
                              </TableCell>
                              <TableCell className="font-medium">
                                {index === 0 ? `${resident.first_name} ${resident.last_name}` : ''}
                              </TableCell>
                              <TableCell>
                                {format(new Date(review.log_date), 'dd/MM/yyyy')}
                              </TableCell>
                              <TableCell className="max-w-xs truncate">
                                {review.title}
                              </TableCell>
                              <TableCell>
                                {review.support_worker_name || '-'}
                              </TableCell>
                              <TableCell>
                                {review.created_by}
                              </TableCell>
                              <TableCell>
                                <Badge className={`${getStatusColor(displayStatus)} capitalize`}>
                                  {displayStatusText}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {review.next_review_date ? 
                                  format(new Date(review.next_review_date), 'dd/MM/yyyy') : '-'}
                              </TableCell>
                              <TableCell className="text-right">
                              </TableCell>
                            </TableRow>
                          );
                        });
                      });
                    })()}

                    <TableRow className="bg-slate-50 border-t-2 border-slate-200">
                      <TableCell colSpan={9} className="text-center py-4">
                        <Button
                          variant="outline"
                          onClick={() => {
                            const newReview = {
                              resident_id: "", 
                              plan_type: 'quarterly_reviews',
                              log_date: new Date().toISOString().slice(0, 16),
                              status: 'up_to_date',
                              title: '',
                              key_worker: currentUser?.email || ""
                            };
                            handleEdit(newReview);
                          }}
                          className="text-indigo-600 hover:text-indigo-700 border-indigo-300"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add New Quarterly Review
                        </Button>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!planToDelete} onOpenChange={(open) => !open && setPlanToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Support Plan Entry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{planToDelete?.title}"? This action cannot be undone and will permanently remove all data associated with this support plan entry.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete Entry
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
