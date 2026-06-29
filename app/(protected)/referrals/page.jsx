"use client"

import { useUser } from "@clerk/nextjs";
import React, { useState, useEffect, useCallback } from "react";
import { useClerkSupabaseClient } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Edit, ClipboardPlus, Download } from "lucide-react";
import { format } from "date-fns";
import { logActivity, ACTIONS, ENTITIES } from "@/lib/activityUtils";
import ReferralForm from "@/components/referrals/ReferralForm";
import ReferralDetailModal from "@/components/referrals/ReferralDetailModal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Referrals() {
  const { user } = useUser();
  const supabase = useClerkSupabaseClient()
  const [referrals, setReferrals] = useState([]);
  const [users, setUsers] = useState([]);
  const [filteredReferrals, setFilteredReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingReferral, setEditingReferral] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusTab, setStatusTab] = useState("all");
  const [referralTypeTab, setReferralTypeTab] = useState("organisation");
  const [currentUser, setCurrentUser] = useState(null);
  const [viewingReferral, setViewingReferral] = useState(null);
  const [error, setError] = useState(null);
  
useEffect(() => {
  if (!supabase) return;
  loadData();
}, [supabase, referralTypeTab]);

  const getUserName = useCallback((userId) => {
    const user = users.find(u => u.id === userId);
    return user?.full_name || userId || "Unassigned";
  }, [users]);

  const getLoggedByName = useCallback((referral) => {
    if (referral.logged_by) {
      return referral.logged_by;
    }

    if (referral.created_by) {
      const user = users.find(u => u.email === referral.created_by);
      if (user?.full_name) {
        return user.full_name;
      }
      return referral.created_by.split('@')[0];
    }

    return 'Unknown';
  }, [users]);

  const filterReferrals = useCallback(() => {
    let filtered = referrals;

    if (statusTab !== "all") {
      const statusMap = {
        'received': 'Received',
        'under_assessment': 'Under Assessment',
        'awaiting_interview': 'Awaiting Interview',
        'interviewed': 'Interviewed',
        'accepted': 'Accepted',
        'rejected': 'Rejected',
        'withdrawn': 'Withdrawn'
      };
      const supabaseStatus = statusMap[statusTab] || statusTab;
      filtered = filtered.filter(r => r.status === supabaseStatus);
    }

    if (searchTerm) {
      const lowercasedTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(r =>
        r.applicant_name?.toLowerCase().includes(lowercasedTerm) ||
        r.referred_by_agency?.toLowerCase().includes(lowercasedTerm) ||
        getUserName(r.assigned_to_user_id)?.toLowerCase().includes(lowercasedTerm) ||
        getLoggedByName(r).toLowerCase().includes(lowercasedTerm)
      );
    }
    setFilteredReferrals(filtered);
  }, [referrals, searchTerm, statusTab, getUserName, getLoggedByName]);

  useEffect(() => {
    filterReferrals();
  }, [filterReferrals]);

  const loadData = async () => {
    setLoading(true);
    if (!supabase || !user) return;
    setLoading(true);
    try {
      setCurrentUser(user);
      
const { data: usersData } = await supabase.from('users').select('*');

      // Load from the appropriate table based on referralTypeTab
      const tableName = referralTypeTab === 'organisation' ? 'organisation_referrals' : 'self_referrals';
      
      const { data: referralsData, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('"Deleted"', false)
        .order('"Referral Date"', { ascending: false });
      console.log("Raw Supabase response:", referralsData);

      if (error) {
        console.error(`Error loading from ${tableName}:`, error);
      }

      // Normalize Supabase data (convert column names with spaces to lowercase with underscores)
      const normalizedReferrals = (referralsData || []).map(ref => ({
        id: ref.ID,
        created_date: ref['Created Date'],
        updated_date: ref['Updated Date'],
        created_by: ref['Created By'],
        referral_date: ref['Referral Date'],
        referral_type: ref['Referral Type'],
        referred_by_agency: ref['Referred By Agency'],
        referral_from_url: ref['Referral From URL'],
        applicant_name: ref['Applicant Name'],
        applicant_dob: ref['Applicant DOB'],
        referral_reason: ref['Referral Reason'],
        status: ref.Status,
        priority: ref.Priority,
        assigned_to_user_id: ref['Assigned To'],
        accommodation_type_needed: ref['Accommodation Type Needed'],
        assessment_date: ref['Assessment Date'],
        decision_date: ref['Decision Date'],
        decision_reason: ref['Decision Reason'],
        notes: ref.Notes,
        logged_by: ref['Logged By'],
        deleted: ref.Deleted,
        deleted_date: ref['Deleted Date'],
        deleted_by: ref['Deleted By']
      }));

      console.log(`✅ Loaded ${normalizedReferrals.length} referrals from ${tableName}`);
      setReferrals(normalizedReferrals);
      setUsers(usersData || []);
    } catch (error) {
      console.error("Error loading referrals or users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (referralData) => {
    try {
      if (!referralData['Logged By'] && currentUser?.full_name) {
        referralData['Logged By'] = currentUser.full_name;
      }

      // Determine table based on the actual referral type in the data, not the tab
      const tableName = referralData['Referral Type'] === 'Organisation' ? 'organisation_referrals' : 'self_referrals';

      if (editingReferral) {
        const { error } = await supabase
          .from(tableName)
          .update(referralData)
          .eq('"ID"', editingReferral.id);
        if (error) throw error;

        await logActivity(supabase, {
          userName: user.fullName || user.username || "Unknown",
          userEmail: user.primaryEmailAddress?.emailAddress,
          actionType: ACTIONS.UPDATE,
          entityType: ENTITIES.REFERRAL,
          entityId: editingReferral.id,
          description: `Updated referral for ${referralData["Applicant Name"] || editingReferral.applicant_name} (${tableName})`
        });
      } else {
        // Ensure ID exists for new records
        const newId = referralData.ID || crypto.randomUUID();
        if (!referralData.ID) {
          referralData.ID = newId;
          referralData["Created Date"] = new Date().toISOString();
        }
        
        const { error } = await supabase
          .from(tableName)
          .insert([referralData]);
        if (error) throw error;

        await logActivity(supabase, {
          userName: user.fullName || user.username || "Unknown",
          userEmail: user.primaryEmailAddress?.emailAddress,
          actionType: ACTIONS.CREATE,
          entityType: ENTITIES.REFERRAL,
          entityId: newId,
          description: `Logged new referral for ${referralData["Applicant Name"]} (${tableName})`
        });
      }
      
      setShowForm(false);
      setEditingReferral(null);
      setViewingReferral(null);
      loadData();
    } catch (error) {
      console.error("Error saving referral:", error);
      alert("Error saving referral: " + error.message);
    }
  };

  const handleEdit = (referral) => {
    setViewingReferral(null);
    setEditingReferral(referral);
    setShowForm(true);
  };

  const handleViewDetails = (referral) => {
    setViewingReferral(referral);
  };

  const handleDelete = async (referral) => {
    if (!window.confirm(`Are you sure you want to delete the referral for "${referral.applicant_name}"?`)) {
      return;
    }

    try {
      const tableName = referral.referral_type === 'Organisation' ? 'organisation_referrals' : 'self_referrals';
      
      const { error } = await supabase
        .from(tableName)
        .update({
          'Deleted': true,
          'Deleted Date': new Date().toISOString(),
          'Deleted By': currentUser?.email || "Unknown User"
        })
        .eq('"ID"', referral.id);

      if (error) throw error;

      await logActivity(supabase, {
        userName: user.fullName || user.username || "Unknown",
        userEmail: user.primaryEmailAddress?.emailAddress,
        actionType: ACTIONS.DELETE,
        entityType: ENTITIES.REFERRAL,
        entityId: referral.id,
        description: `Deleted referral for ${referral.applicant_name} (${tableName})`
      });

      setViewingReferral(null);
      loadData();
    } catch (error) {
      console.error("Error deleting referral:", error);
      alert("Error deleting referral: " + error.message);
    }
  };

  const getStatusColor = (status) => {
    const statusLower = status?.toLowerCase().replace(/ /g, '_');
    const colors = {
      received: "bg-gray-100 text-gray-800",
      under_assessment: "bg-blue-100 text-blue-800",
      awaiting_interview: "bg-cyan-100 text-cyan-800",
      interviewed: "bg-indigo-100 text-indigo-800",
      accepted: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      withdrawn: "bg-pink-100 text-pink-800",
    };
    return colors[statusLower] || "bg-gray-100 text-gray-800";
  };

  const exportToCSV = () => {
    const headers = [
      'ID',
      'Referral Type',
      'Referral Date',
      'Applicant Name',
      'Applicant DOB',
      'Referred By Agency',
      'Referral From URL',
      'Referral Reason',
      'Status',
      'Priority',
      'Assigned To',
      'Accommodation Type Needed',
      'Assessment Date',
      'Decision Date',
      'Decision Reason',
      'Notes',
      'Created Date',
      'Logged By'
    ];

    const rows = referrals.map(referral => {
      return [
        referral.id || '',
        referral.referral_type || 'organisation',
        referral.referral_date ? format(new Date(referral.referral_date), 'yyyy-MM-dd HH:mm:ss') : '',
        referral.applicant_name || '',
        referral.applicant_dob ? format(new Date(referral.applicant_dob), 'yyyy-MM-dd') : '',
        referral.referred_by_agency || '',
        referral.referral_from_url || '',
        referral.referral_reason || '',
        referral.status || '',
        referral.priority || '',
        getUserName(referral.assigned_to_user_id) || 'Unassigned',
        referral.accommodation_type_needed || '',
        referral.assessment_date ? format(new Date(referral.assessment_date), 'yyyy-MM-dd') : '',
        referral.decision_date ? format(new Date(referral.decision_date), 'yyyy-MM-dd') : '',
        referral.decision_reason || '',
        referral.notes || '',
        referral.created_date ? format(new Date(referral.created_date), 'yyyy-MM-dd HH:mm:ss') : '',
        getLoggedByName(referral)
      ];
    });

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
    const timestamp = format(new Date(), 'yyyy-MM-dd_HHmmss');

    link.setAttribute('href', url);
    link.setAttribute('download', `referrals_export_${timestamp}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    logActivity(supabase, {
      userName: user.fullName || user.username || "Unknown",
      userEmail: user.primaryEmailAddress?.emailAddress,
      actionType: ACTIONS.EXPORT,
      entityType: ENTITIES.REFERRAL,
      description: `Exported ${referrals.length} referrals to CSV`
    });
  };

  const emptyStateMessage = searchTerm
    ? "Try adjusting your search terms"
    : "There are no " + referralTypeTab.replace('-', ' ') + " referrals matching the current filters.";

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 px-6 pt-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Housing Referrals</h1>
          <p className="text-slate-600">Log and track the progress of new housing referrals.</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={exportToCSV}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export to CSV
          </Button>
          <Button onClick={() => { setEditingReferral(null); setShowForm(true); }} className="bg-fuchsia-600 hover:bg-fuchsia-700">
            <Plus className="w-4 h-4 mr-2" />
            Log New Referral
          </Button>
        </div>
      </div>

      {showForm && (
        <div className="px-6">
          <ReferralForm
            referral={editingReferral}
            users={users}
            currentUser={currentUser}
            onSubmit={handleSubmit}
            onCancel={() => { setShowForm(false); setEditingReferral(null); setViewingReferral(null); }}
            activeReferralType={referralTypeTab}
          />
        </div>
      )}

      {viewingReferral && (
        <ReferralDetailModal
          referral={viewingReferral}
          getStatusColor={getStatusColor}
          getUserName={getUserName}
          getLoggedByName={getLoggedByName}
          onClose={() => setViewingReferral(null)}
          onEdit={(ref) => handleEdit(ref)}
          onDelete={(ref) => handleDelete(ref)}
        />
      )}

      <Card className="mx-6">
        <CardHeader>
          <Tabs value={referralTypeTab} onValueChange={setReferralTypeTab} className="mb-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="organisation">Organisation Referrals</TabsTrigger>
              <TabsTrigger value="self-referral">Self-Referrals</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <CardTitle>Referral List ({filteredReferrals.length} total)</CardTitle>
            <div className="relative w-full md:w-1/3">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by applicant, agency, creator..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Tabs value={statusTab} onValueChange={setStatusTab} className="mt-4">
            <TabsList className="grid w-full grid-cols-4 md:grid-cols-8">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="received">Received</TabsTrigger>
              <TabsTrigger value="under_assessment">Assessment</TabsTrigger>
              <TabsTrigger value="awaiting_interview">Interview</TabsTrigger>
              <TabsTrigger value="accepted">Accepted</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
              <TabsTrigger value="withdrawn">Withdrawn</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Applicant Name</TableHead>
                  <TableHead>Referral Date</TableHead>
                  <TableHead>Referred By</TableHead>
                  <TableHead>Referral From URL</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Logged By</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan="9" className="text-center">Loading referrals...</TableCell></TableRow>
                ) : filteredReferrals.length > 0 ? (
                  filteredReferrals.map((referral) => (
                    <TableRow
                      key={referral.id}
                      className="hover:bg-slate-50 cursor-pointer"
                      onClick={() => handleViewDetails(referral)}
                    >
                      <TableCell className="font-medium">{referral.applicant_name}</TableCell>
                      <TableCell>{referral.referral_date ? format(new Date(referral.referral_date), "PP") : 'N/A'}</TableCell>
                      <TableCell>{referral.referred_by_agency || 'N/A'}</TableCell>
                      <TableCell>
                        {referral.referral_from_url ? (
                          <a 
                            href={referral.referral_from_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-blue-600 hover:text-blue-800 underline text-sm"
                          >
                            View Doc
                          </a>
                        ) : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(referral.status)}>
                          {referral.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="capitalize">{referral.priority}</TableCell>
                      <TableCell>{getUserName(referral.assigned_to_user_id)}</TableCell>
                      <TableCell>{getLoggedByName(referral)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(referral);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan="9" className="text-center py-10">
                      <ClipboardPlus className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium">No referrals found</h3>
                      <p className="text-slate-500 mb-4">
                        {emptyStateMessage}
                      </p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
