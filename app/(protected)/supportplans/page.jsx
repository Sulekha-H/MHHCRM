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

  useEffect(() => {
    if (supabase) {
      loadData();
    }
  }, [supabase]);

  const getResidentName = useCallback((residentId) => {
    const resident = residents.find(r => r.id === residentId);
    return resident ? `${resident.first_name} ${resident.last_name}` : "Unknown Resident";
  }, [residents]);

  const filterPlans = useCallback(() => {
    let filtered = supportPlans.filter(plan => {
      if (!plan || plan.deleted) return false;
      
      // Check plan type first
      if (plan.plan_type !== activeTab && activeTab !== "archive") return false;
      
      // For archive tab, only show plans from moved_on residents
      if (activeTab === "archive") {
        const resident = residents.find(r => r.id === plan.resident_id);
        const residentStatus = (resident?.status || resident?.Status || '').toLowerCase().replace(/ /g, '_');
        return residentStatus === 'moved_on';
      }
      
      // For other tabs, only show plans from active residents
      const resident = residents.find(r => r.id === plan.resident_id);
      if (!resident) return true; // Show plans even if resident not found for debugging
      
      const residentStatus = (resident?.status || resident?.Status || '').toLowerCase();
      return residentStatus === 'active';
    });

    if (searchTerm) {
      const lowercasedSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(plan => {
        const residentName = getResidentName(plan.resident_id).toLowerCase();
        const accommodation = accommodations.find(a => a.id === residents.find(r => r.id === plan.resident_id)?.accommodation_id);
        const property = accommodation ? properties.find(p => p.id === accommodation.property_id) : null;
        const accommodationName = property && accommodation ? `${property.name} - ${accommodation.room_number}` : 'unassigned';

        return plan.title?.toLowerCase().includes(lowercasedSearchTerm) ||
               plan.description?.toLowerCase().includes(lowercasedSearchTerm) ||
               residentName.includes(lowercasedSearchTerm) ||
               plan.key_worker?.toLowerCase().includes(lowercasedSearchTerm) ||
               plan.support_worker_name?.toLowerCase().includes(lowercasedSearchTerm) ||
               accommodationName.includes(lowercasedSearchTerm);
      });
    }
    setFilteredPlans(filtered);
  }, [supportPlans, activeTab, searchTerm, getResidentName, residents, accommodations, properties]);

  useEffect(() => {
    if (supabase) {
      filterPlans();
      console.log('🎯 Filtered Plans:', {
        activeTab,
        totalSupportPlans: supportPlans.length,
        filteredCount: filteredPlans.length,
        supportNotesCount: supportPlans.filter(p => p.plan_type === 'support_notes').length
      });
    }
  }, [filterPlans, activeTab, supportPlans, filteredPlans.length, supabase]);

  const loadData = async () => {
    setLoading(true);
    try {
      const authUser = user?.primaryEmailAddress?.emailAddress ? { email: user.primaryEmailAddress.emailAddress } : null;
      setCurrentUser(authUser);

      const [supportNotesResult, quarterlyReviewsResult, residentsResult, propertiesResult, accommodationsResult, usersResult] = await Promise.all([
        supabase.from('support_notes').select('*').eq('"Deleted"', false).order('"Created Date"', { ascending: false }),
        supabase.from('quarterly_reviews').select('*').eq('"Deleted"', false).order('"Created Date"', { ascending: false }),
        supabase.from('residents').select('*').eq('Deleted', false),
        supabase.from('properties').select('*').eq('Deleted', false),
        supabase.from('accommodations').select('*').eq('Deleted', false),
        supabase.from('users').select('*')
      ]);

      console.log('✅ Support notes loaded:', supportNotesResult.data?.length || 0);
      console.log('✅ Quarterly reviews loaded:', quarterlyReviewsResult.data?.length || 0);
      console.log('✅ Residents loaded:', residentsResult.data?.length || 0);
      console.log('✅ Properties loaded:', propertiesResult.data?.length || 0);
      console.log('✅ Accommodations loaded:', accommodationsResult.data?.length || 0);
      console.log('✅ Users loaded:', usersResult.data?.length || 0);
      
      if (supportNotesResult.error) console.error('❌ Support notes error:', supportNotesResult.error);
      if (quarterlyReviewsResult.error) console.error('❌ Quarterly reviews error:', quarterlyReviewsResult.error);
      if (residentsResult.error) console.error('❌ Residents error:', residentsResult.error);
      if (propertiesResult.error) console.error('❌ Properties error:', propertiesResult.error);
      if (accommodationsResult.error) console.error('❌ Accommodations error:', accommodationsResult.error);
      if (usersResult.error) console.error('❌ Users error:', usersResult.error);

      const normalizeBool = (value) => {
        if (value === true || value === 'true' || value === 'TRUE' || value === 1 || value === '1') return true;
        if (value === false || value === 'false' || value === 'FALSE' || value === 0 || value === '0') return false;
        return false;
      };

      const supportNotesWithType = (supportNotesResult.data || [])
        .filter(note => note.Deleted !== true && note.Deleted !== 'true')
        .map(note => {
        const normalizeStatus = (status) => {
          if (!status) return 'document_combined_uploaded';
          const statusLower = status.toLowerCase().replace(/ /g, '_').replace(/\//g, '_');
          return statusLower;
        };
        
        return {
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
      
      setSupportPlans(combinedPlans);
      setResidents(normalizeData(residentsResult.data) || []);
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
      const tableName = planData["Plan Type"] === 'quarterly_reviews' ? 'quarterly_reviews' : 'support_notes';
      let result;
      if (editingPlan && editingPlan.id) {
        result = await supabase.from(tableName).update(planData).eq('"ID"', editingPlan.id);
      } else {
        if (!planData.ID) {
          alert('Error: Missing ID field. Please try again.');
          return;
        }
        result = await supabase.from(tableName).insert([planData]);
      }
      
      if (result.error) throw result.error;
      
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
    
    const formatDate = (dateString) => dateString ? format(new Date(dateString), 'yyyy-MM-dd') : null;
    const formatDateTime = (dateString) => dateString ? format(new Date(dateString), 'yyyy-MM-dd HH:mm:ss') : null;
    const formatBoolean = (value) => value === true ? 'TRUE' : value === false ? 'FALSE' : null;

    const getResidentNameForCSV = (residentId) => {
      const resident = residents.find(r => r.id === residentId);
      return resident ? `${resident.first_name} ${resident.last_name}` : null;
    };

    const getPropertyNameCSV = (residentId) => {
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
      getPropertyNameCSV(plan.resident_id),
      getRoomNumber(plan.resident_id),
      'support_notes',
      plan.title || null,
      plan.description || null,
      formatDateTime(plan.log_date),
      formatDateTime(plan.date_logged_by_office),
      plan.key_worker || null,
      plan.status || null,
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
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    const csvContent = [headers.join(','), ...rows.map(row => row.map(escapeCSV).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `support_notes_export_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportQuarterlyReviewsToCSV = () => {
    const quarterlyReviewsData = supportPlans.filter(plan => 
      plan.plan_type === 'quarterly_reviews' && 
      !plan.deleted && 
      plan.resident_id && 
      plan.resident_id.trim() !== ''
    );

    const headers = [
      "ID", "Created Date", "Updated Date", "Created By", "Resident ID", "Resident Name",
      "Title", "Log Date", "Status", "Review Completed Date", "Next Review Date"
    ];

    const rows = quarterlyReviewsData.map((plan) => [
      plan.id, format(new Date(plan.created_date), 'yyyy-MM-dd HH:mm'),
      format(new Date(plan.updated_date), 'yyyy-MM-dd HH:mm'), plan.created_by,
      plan.resident_id, getResidentName(plan.resident_id), plan.title,
      format(new Date(plan.log_date), 'yyyy-MM-dd HH:mm'), plan.status,
      plan.review_completed_date ? format(new Date(plan.review_completed_date), 'yyyy-MM-dd') : '',
      plan.next_review_date ? format(new Date(plan.next_review_date), 'yyyy-MM-dd') : ''
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `quarterly_reviews_export_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Support Plans & Notes</h1>
          <p className="text-slate-600">Track daily support notes and quarterly reviews for residents</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={exportSupportNotesToCSV} variant="outline" disabled={loading}>
            <Download className="w-4 h-4 mr-2" />
            Export Notes
          </Button>
          <Button onClick={exportQuarterlyReviewsToCSV} variant="outline" disabled={loading}>
            <Download className="w-4 h-4 mr-2" />
            Export Reviews
          </Button>
          <Button onClick={() => setShowForm(true)} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="w-4 h-4 mr-2" />
            Add New Entry
          </Button>
        </div>
      </div>

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
            </CardHeader>
            <CardContent className="space-y-8 overflow-x-auto">
              {loading ? <p>Loading weekly notes...</p> : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Resident Name</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPlans.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center">No notes found</TableCell></TableRow>
                    ) : filteredPlans.map(plan => (
                      <TableRow key={plan.id}>
                        <TableCell>{getResidentName(plan.resident_id)}</TableCell>
                        <TableCell>{plan.title}</TableCell>
                        <TableCell>{format(new Date(plan.log_date), 'dd/MM/yyyy')}</TableCell>
                        <TableCell><Badge className={getStatusColor(plan.status)}>{plan.status?.replace(/_/g, ' ')}</Badge></TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => handleViewDetails(plan)}>View</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quarterly_reviews" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Quarterly Reviews</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Resident</TableHead>
                    <TableHead>Review Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPlans.filter(p => p.plan_type === 'quarterly_reviews').length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center">No reviews found</TableCell></TableRow>
                  ) : filteredPlans.filter(p => p.plan_type === 'quarterly_reviews').map(review => (
                    <TableRow key={review.id}>
                      <TableCell>{getResidentName(review.resident_id)}</TableCell>
                      <TableCell>{format(new Date(review.log_date), 'dd/MM/yyyy')}</TableCell>
                      <TableCell><Badge className={getStatusColor(review.status)}>{review.status?.replace(/_/g, ' ')}</Badge></TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleViewDetails(review)}>View</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="archive" className="mt-6">
          <Card>
            <CardHeader><CardTitle>Archive</CardTitle></CardHeader>
            <CardContent>
              <p className="text-slate-500 text-center py-8">Archived records for former residents will appear here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!planToDelete} onOpenChange={(open) => !open && setPlanToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Support Plan Entry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this entry? This action cannot be undone.
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
