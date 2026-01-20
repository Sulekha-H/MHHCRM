"use client";

import { useUser } from "@clerk/nextjs";
import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Users, Phone, Mail, MapPin, Calendar, Building, Eye, Download, User as UserIcon } from "lucide-react";
import { format, isValid } from "date-fns";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import LandlordEnquiryForm_Supabase from "@/components/landlord/LandlordEnquiryForm";
import LandlordEnquiryDetailModal from "@/components/landlord/LandlordEnquiryDetailModal";

// Helper to normalize Supabase data - handles both PascalCase and snake_case
const normalizeEnquiry = (enquiry) => {
  if (!enquiry) return null;
  
  return {
    id: enquiry.id || enquiry.ID,
    created_date: enquiry.created_date || enquiry["Created Date"],
    updated_date: enquiry.updated_date || enquiry["Updated Date"],
    created_by: enquiry.created_by || enquiry["Created By"],
    enquiry_date: enquiry.enquiry_date || enquiry["Enquiry Date"],
    landlord_name: enquiry.landlord_name || enquiry["Landlord Name"],
    is_company: enquiry.is_company !== undefined ? enquiry.is_company : enquiry["Is Company"],
    company_name: enquiry.company_name || enquiry["Company Name"],
    is_individual: enquiry.is_individual !== undefined ? enquiry.is_individual : enquiry["Is Individual"],
    individual_name: enquiry.individual_name || enquiry["Individual Name"],
    contact_email: enquiry.contact_email || enquiry["Contact Email"],
    contact_phone: enquiry.contact_phone || enquiry["Contact Phone"],
    property_address: enquiry.property_address || enquiry["Property Address"],
    property_area: enquiry.property_area || enquiry["Property Area"],
    property_type: enquiry.property_type || enquiry["Property Type"],
    number_of_bedrooms: enquiry.number_of_bedrooms || enquiry["Number Of Bedrooms"],
    number_of_bathrooms: enquiry.number_of_bathrooms || enquiry["Number Of Bathrooms"],
    multiple_properties: enquiry.multiple_properties !== undefined ? enquiry.multiple_properties : enquiry["Multiple Properties"],
    hmo_ready: enquiry.hmo_ready !== undefined ? enquiry.hmo_ready : enquiry["Hmo Ready"],
    hmo_conversion_by: enquiry.hmo_conversion_by || enquiry["Hmo Conversion By"],
    property_ready: enquiry.property_ready || enquiry["Property Ready"],
    property_ready_date: enquiry.property_ready_date || enquiry["Property Ready Date"],
    pictures_provided: enquiry.pictures_provided || enquiry["Pictures Provided"],
    pictures_gdrive_link: enquiry.pictures_gdrive_link || enquiry["Pictures Gdrive Link"],
    requested_rent_figure: enquiry.requested_rent_figure || enquiry["Requested Rent Figure"],
    rent_per_week: enquiry.rent_per_week || enquiry["Rent Per Week"],
    enquiry_source: enquiry.enquiry_source || enquiry["Enquiry Source"],
    description: enquiry.description || enquiry.Description,
    status: enquiry.status || enquiry.Status,
    priority: enquiry.priority || enquiry.Priority,
    assigned_to_user_id: enquiry.assigned_to_user_id || enquiry["Assigned To"],
    intro_given_to_organisation: enquiry.intro_given_to_organisation !== undefined ? enquiry.intro_given_to_organisation : enquiry["Intro Given to Organisation"],
    new_date: enquiry.new_date || enquiry["New Date"],
    contacted_date: enquiry.contacted_date || enquiry["Contacted Date"],
    viewing_arranged_date: enquiry.viewing_arranged_date || enquiry["Viewing Arranged Date"],
    under_assessment_date: enquiry.under_assessment_date || enquiry["Under Assessment Date"],
    accepted_date: enquiry.accepted_date || enquiry["Accepted Date"],
    declined_date: enquiry.declined_date || enquiry["Declined Date"],
    on_hold_date: enquiry.on_hold_date || enquiry["On Hold Date"],
    next_action_date: enquiry.next_action_date || enquiry["Next Action Date"],
    viewing_date: enquiry.viewing_date || enquiry["Viewing Date"],
    follow_up_action: enquiry.follow_up_action || enquiry["Follow-up Action"],
    follow_up_completed: enquiry.follow_up_completed !== undefined ? enquiry.follow_up_completed : enquiry["Follow-up Completed"],
    notes: enquiry.notes || enquiry.Notes,
    logged_by: enquiry.logged_by || enquiry["Logged By"],
    deleted: enquiry.deleted !== undefined ? enquiry.deleted : enquiry.Deleted,
    deleted_date: enquiry.deleted_date || enquiry["Deleted Date"],
    deleted_by: enquiry.deleted_by || enquiry["Deleted By"]
  };
};

// Convert enum values to Supabase format
const formatEnumForSupabase = (value, enumType) => {
  if (!value) return null;
  
  const enumMaps = {
    enquiry_source: {
      'website': 'Website',
      'phone_call': 'Phone Call',
      'email': 'Email',
      'referral': 'Referral',
      'walk_in': 'Walk-in',
      'other': 'Other'
    },
    status: {
      'new': 'New',
      'contacted': 'Contacted',
      'viewing_arranged': 'Viewing Arranged',
      'under_assessment': 'Under Assessment',
      'accepted': 'Accepted',
      'declined': 'Declined',
      'on_hold': 'On Hold'
    },
    priority: {
      'low': 'Low',
      'medium': 'Medium',
      'high': 'High',
      'urgent': 'Urgent'
    },
    hmo_conversion: {
      'landlord': 'Landlord',
      'us': 'Us',
      'not_applicable': 'Not Applicable'
    },
    property_type: {
      'shared': 'Shared',
      'en_suites': 'En-suites',
      'shared_en_suites_mixed': 'Shared/En-suites Mixed',
      'studio': 'Studio',
      'bedsits': 'Bedsits',
      'flats': 'Flats',
      'standard_house_not_hmo': 'Standard House (Not HMO)'
    },
    yes_no: {
      'yes': 'Yes',
      'no': 'No'
    }
  };
  
  // Convert value to lowercase for consistent lookup
  const lowerCaseValue = String(value).toLowerCase();
  
  return enumMaps[enumType]?.[lowerCaseValue] || value;
};

// Helper to convert snake_case to Supabase PascalCase with spaces
const toSupabaseFormat = (data) => {
  return {
    "Enquiry Date": data.enquiry_date,
    "Landlord Name": data.landlord_name,
    "Is Company": data.is_company || false,
    "Company Name": data.company_name || null,
    "Is Individual": data.is_individual || false,
    "Individual Name": data.individual_name || null,
    "Contact Email": data.contact_email,
    "Contact Phone": data.contact_phone || null,
    "Property Address": data.property_address,
    "Property Area": data.property_area || null,
    "Property Type": data.property_type ? formatEnumForSupabase(data.property_type, 'property_type') : null,
    "Number of Bedrooms": data.number_of_bedrooms || null,
    "Number of Bathrooms": data.number_of_bathrooms || null,
    "Multiple Properties": data.multiple_properties || false,
    "HMO Ready": data.hmo_ready || false,
    "HMO Conversion By": formatEnumForSupabase(data.hmo_conversion_by || 'not_applicable', 'hmo_conversion'),
    "Property Ready": formatEnumForSupabase(data.property_ready || 'yes', 'yes_no'),
    "Property Ready Date": data.property_ready_date || null,
    "Pictures Provided": formatEnumForSupabase(data.pictures_provided || 'no', 'yes_no'),
    "Pictures GDrive Link": data.pictures_gdrive_link || null,
    "Requested Rent Figure": data.requested_rent_figure || null,
    "Rent Per Week": data.rent_per_week || null,
    "Enquiry Source": formatEnumForSupabase(data.enquiry_source || 'website', 'enquiry_source'),
    "Description": data.description || null,
    "Status": formatEnumForSupabase(data.status || 'new', 'status'),
    "Priority": formatEnumForSupabase(data.priority || 'medium', 'priority'),
    "Assigned To": data.assigned_to_user_id || null,
    "Intro Given to Organisation": data.intro_given_to_organisation || false,
    "New Date": data.new_date || null,
    "Contacted Date": data.contacted_date || null,
    "Viewing Arranged Date": data.viewing_arranged_date || null,
    "Under Assessment Date": data.under_assessment_date || null,
    "Accepted Date": data.accepted_date || null,
    "Declined Date": data.declined_date || null,
    "On Hold Date": data.on_hold_date || null,
    "Next Action Date": data.next_action_date || null,
    "Viewing Date": data.viewing_date || null,
    "Follow-up Action": data.follow_up_action || null,
    "Follow-up Completed": data.follow_up_completed || false,
    "Notes": data.notes || null,
    "Logged By": data.logged_by || null,
    "Updated Date": new Date().toISOString()
  };
};

export default function LandlordEnquiries() {
  const [enquiries, setEnquiries] = useState([]);
  const [filteredEnquiries, setFilteredEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEnquiry, setEditingEnquiry] = useState(null);
  const [viewingEnquiry, setViewingEnquiry] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
   const { user } = useUser();
  const [currentUser, setCurrentUser] = useState(null);
  const [enquiryToDelete, setEnquiryToDelete] = useState(null);

  const hasFollowUpNeeded = useCallback((enquiry) => {
    return enquiry.follow_up_action && !enquiry.follow_up_completed;
  }, []);

  const getLoggedByName = useCallback((enquiry) => {
    if (enquiry.logged_by) {
      return enquiry.logged_by;
    }
    
    if (enquiry.created_by) {
      const user = user.find(u => u.email === enquiry.created_by);
      if (user?.full_name) {
        return user.full_name;
      }
      return enquiry.created_by.split('@')[0];
    }
    
    return '-';
  }, [user]);

  const formatEnquiryDate = (dateString) => {
    if (!dateString) return 'No date provided';
    try {
      const date = new Date(dateString);
      if (isValid(date)) {
        return format(date, 'PPP');
      }
      return 'Invalid date';
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  useEffect(() => {
    const loadUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUser(user);
        console.log("Current user:", user?.email);
      } catch (error) {
        console.error("Error loading user:", error);
      }
    };
    loadUser();
    loadData();
  }, []);

  const filterEnquiries = useCallback(() => {
    let filtered = enquiries;

    if (activeTab !== "all") {
      filtered = filtered.filter(enquiry => enquiry.status === activeTab);
    }

    if (searchTerm) {
      filtered = filtered.filter(enquiry =>
        enquiry.landlord_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        enquiry.property_address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        enquiry.contact_email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredEnquiries(filtered);
  }, [enquiries, searchTerm, activeTab]);

  useEffect(() => {
    filterEnquiries();
  }, [filterEnquiries]);

  const loadData = async () => {
    setLoading(true);
    console.log("Starting to load landlord enquiries...");
    
    try {
      const { data: enquiriesData, error: enquiriesError } = await supabase
        .from('landlord_enquiries')
        .select('*')
        .order('"Enquiry Date"', { ascending: false });

      if (enquiriesError) {
        console.error("❌ Error loading enquiries:", enquiriesError);
        throw enquiriesError;
      }

      console.log(`✅ Loaded ${enquiriesData?.length || 0} enquiries`);
      if (enquiriesData && enquiriesData.length > 0) {
        console.log("📊 Sample enquiry from DB:", enquiriesData[0]);
      }

      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*');

      if (usersError) throw usersError;
      
      // Filter out deleted records and normalize
      const activeEnquiries = (enquiriesData || []).filter(e => {
        const isDeleted = e.Deleted || e.deleted || e["Deleted"];
        return !isDeleted;
      });
      
      console.log(`📊 Active enquiries after filter: ${activeEnquiries.length}`);
      
      const normalizedEnquiries = activeEnquiries.map(normalizeEnquiry);
      console.log("📊 Sample normalized enquiry:", normalizedEnquiries[0]);
      
      setEnquiries(normalizedEnquiries);
      setUsers(usersData || []);

    } catch (error) {
      console.error("Error loading data:", error);
      setEnquiries([]);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (enquiryData) => {
    try {
      console.log("📤 Submitting enquiry data (snake_case):", enquiryData);
      
      if (!enquiryData.logged_by && currentUser?.user_metadata?.full_name) {
        enquiryData.logged_by = currentUser.user_metadata.full_name;
      }
      
      // Convert to Supabase format (PascalCase with spaces)
      const supabaseData = toSupabaseFormat(enquiryData);
      console.log("📤 Converted to Supabase format:", supabaseData);
      
      if (editingEnquiry) {
        const { error } = await supabase
          .from('landlord_enquiries')
          .update(supabaseData)
          .eq('ID', editingEnquiry.id); // Changed to 'ID'
        
        if (error) throw error;
        console.log("✅ Enquiry updated successfully");
      } else {
        // For new enquiries, add Created Date and ID
        const insertData = {
          ...supabaseData,
          "ID": crypto.randomUUID(), // Generated UUID
          "Created Date": new Date().toISOString(), // Current timestamp
          "Created By": currentUser?.email || null // Current user's email
        };
        
        const { error } = await supabase
          .from('landlord_enquiries')
          .insert([insertData]);
        
        if (error) throw error;
        console.log("✅ Enquiry created successfully");
      }
      
      setShowForm(false);
      setEditingEnquiry(null);
      setActiveTab("all");
      setSearchTerm("");
      await loadData();
    } catch (error) {
      console.error("Error saving enquiry:", error);
      alert("Error saving enquiry: " + error.message);
    }
  };

  const handleEdit = (enquiry) => {
    setEditingEnquiry(enquiry);
    setShowForm(true);
  };

  const handleViewDetails = (enquiry) => {
    setViewingEnquiry(enquiry);
  };

  const handleDelete = (enquiry) => {
    setEnquiryToDelete(enquiry);
  };

  const confirmDelete = async () => {
    if (enquiryToDelete) {
      try {
        const deleteData = {
          "Deleted": true,
          "Deleted Date": new Date().toISOString(),
          "Deleted By": currentUser?.email || currentUser?.user_metadata?.full_name || 'unknown'
        };

        const { error } = await supabase
          .from('landlord_enquiries')
          .update(deleteData)
          .eq('"ID"', enquiryToDelete.id);
        
        if (error) throw error;
        
        console.log(`✅ Soft deleted landlord enquiry ${enquiryToDelete.id}`);
        setEnquiryToDelete(null);
        setViewingEnquiry(null);
        await loadData();
      } catch (error) {
        console.error("Error deleting landlord enquiry:", error);
        alert("Error deleting landlord enquiry: " + error.message);
      }
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      new: "bg-blue-100 text-blue-800",
      contacted: "bg-yellow-100 text-yellow-800",
      viewing_arranged: "bg-purple-100 text-purple-800",
      under_assessment: "bg-orange-100 text-orange-800",
      accepted: "bg-green-100 text-green-800",
      declined: "bg-red-100 text-red-800",
      on_hold: "bg-gray-100 text-gray-800"
    };
    return colors[status] || colors.new;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: "bg-green-100 text-green-800",
      medium: "bg-blue-100 text-blue-800",
      high: "bg-orange-100 text-orange-800",
      urgent: "bg-red-100 text-red-800" // Corrected typo
    };
    return colors[priority] || colors.medium;
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

    const formatEnquirySource = (source) => {
      if (!source) return 'Website';
      const sourceMap = {
        'website': 'Website',
        'phone_call': 'Phone Call',
        'email': 'Email',
        'referral': 'Referral',
        'walk_in': 'Walk-in',
        'other': 'Other'
      };
      return sourceMap[source] || 'Website';
    };

    const formatStatus = (status) => {
      if (!status) return 'New';
      const statusMap = {
        'new': 'New',
        'contacted': 'Contacted',
        'viewing_arranged': 'Viewing Arranged',
        'under_assessment': 'Under Assessment',
        'accepted': 'Accepted',
        'declined': 'Declined',
        'on_hold': 'On Hold'
      };
      return statusMap[status] || 'New';
    };

    const formatPriority = (priority) => {
      if (!priority) return 'Medium';
      const priorityMap = {
        'low': 'Low',
        'medium': 'Medium',
        'high': 'High',
        'urgent': 'Urgent'
      };
      return priorityMap[priority] || 'Medium';
    };

    const formatPropertyType = (type) => {
      if (!type) return null;
      const typeMap = {
        'shared': 'Shared',
        'en_suites': 'En-suites',
        'shared_en_suites_mixed': 'Shared/En-suites Mixed',
        'studio': 'Studio',
        'bedsits': 'Bedsits',
        'flats': 'Flats',
        'standard_house_not_hmo': 'Standard House (Not HMO)'
      };
      return typeMap[type] || type;
    };

    const formatHMOConversionBy = (value) => {
      if (!value || value === '') return 'Not Applicable';
      const conversionMap = {
        'landlord': 'Landlord',
        'us': 'Us',
        'not_applicable': 'Not Applicable'
      };
      return conversionMap[value] || 'Not Applicable';
    };

    const formatYesNo = (value) => {
      if (value === true) return 'Yes';
      if (value === false) return 'No';
      return 'No'; // Default to No if value is null, undefined, or empty string
    };

    const headers = [
      "ID",
      "Created Date",
      "Updated Date",
      "Created By",
      "Enquiry Date",
      "Landlord Name",
      "Is Company",
      "Company Name",
      "Is Individual",
      "Individual Name",
      "Contact Email",
      "Contact Phone",
      "Property Address",
      "Property Area",
      "Property Type",
      "Number of Bedrooms",
      "Number of Bathrooms",
      "Multiple Properties",
      "HMO Ready",
      "HMO Conversion By",
      "Property Ready",
      "Property Ready Date",
      "Pictures Provided",
      "Pictures GDrive Link",
      "Requested Rent Figure",
      "Rent Per Week",
      "Enquiry Source",
      "Description",
      "Status",
      "Priority",
      "Assigned To",
      "Intro Given to Organisation",
      "New Date",
      "Contacted Date",
      "Viewing Arranged Date",
      "Under Assessment Date",
      "Accepted Date",
      "Declined Date",
      "On Hold Date",
      "Next Action Date",
      "Viewing Date",
      "Follow-up Action",
      "Follow-up Completed",
      "Notes",
      "Logged By",
      "Deleted",
      "Deleted Date",
      "Deleted By"
    ];

    const rows = filteredEnquiries.map(enquiry => [
      enquiry.id || null,
      formatDateTime(enquiry.created_date),
      formatDateTime(enquiry.updated_date),
      enquiry.created_by || null,
      formatDateTime(enquiry.enquiry_date),
      enquiry.landlord_name || null,
      formatBoolean(enquiry.is_company),
      enquiry.company_name || null,
      formatBoolean(enquiry.is_individual),
      enquiry.individual_name || null,
      enquiry.contact_email || null,
      enquiry.contact_phone || null,
      enquiry.property_address || null,
      enquiry.property_area || null,
      formatPropertyType(enquiry.property_type),
      enquiry.number_of_bedrooms || null,
      enquiry.number_of_bathrooms || null,
      formatBoolean(enquiry.multiple_properties),
      formatBoolean(enquiry.hmo_ready),
      formatHMOConversionBy(enquiry.hmo_conversion_by),
      formatYesNo(enquiry.property_ready),
      formatDate(enquiry.property_ready_date),
      formatYesNo(enquiry.pictures_provided),
      enquiry.pictures_gdrive_link || null,
      enquiry.requested_rent_figure || null,
      enquiry.rent_per_week || null,
      formatEnquirySource(enquiry.enquiry_source),
      enquiry.description || null,
      formatStatus(enquiry.status),
      formatPriority(enquiry.priority),
      enquiry.assigned_to_user_id || null,
      formatBoolean(enquiry.intro_given_to_organisation),
      formatDateTime(enquiry.new_date),
      formatDateTime(enquiry.contacted_date),
      formatDateTime(enquiry.viewing_arranged_date),
      formatDateTime(enquiry.under_assessment_date),
      formatDateTime(enquiry.accepted_date),
      formatDateTime(enquiry.declined_date),
      formatDateTime(enquiry.on_hold_date),
      formatDate(enquiry.next_action_date),
      formatDateTime(enquiry.viewing_date),
      enquiry.follow_up_action || null,
      formatBoolean(enquiry.follow_up_completed),
      enquiry.notes || null,
      getLoggedByName(enquiry),
      formatBoolean(enquiry.deleted),
      formatDateTime(enquiry.deleted_date),
      enquiry.deleted_by || null
    ]);

    const escapeCSV = (value) => {
      if (value === null || value === undefined) return '';
      if (typeof value === 'number') return String(value);
      const stringValue = String(value);
      if (stringValue === 'TRUE' || stringValue === 'FALSE') return stringValue;
      if (stringValue === '') return '';
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
    const timestamp = format(new Date(), 'yyyy-MM-dd_HHmmss');
    
    link.setAttribute('href', url);
    link.setAttribute('download', `landlord_enquiries_export_${timestamp}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log("✅ Landlord Enquiries CSV export completed successfully");
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Landlord Enquiries</h1>
          <p className="text-slate-600">Manage incoming property enquiries from potential landlords</p>
          {currentUser && (
            <p className="text-xs text-slate-400 mt-1">Logged in as: {currentUser.email}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            onClick={exportToCSV}
            variant="outline"
            className="flex items-center gap-2"
            disabled={loading || filteredEnquiries.length === 0}
          >
            <Download className="w-4 h-4" />
            Export to CSV
          </Button>
          <Button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Enquiry
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search enquiries by landlord name, property address, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-7 lg:w-auto lg:grid-cols-7">
          <TabsTrigger value="all">All Enquiries</TabsTrigger>
          <TabsTrigger value="new">New</TabsTrigger>
          <TabsTrigger value="contacted">Contacted</TabsTrigger>
          <TabsTrigger value="viewing_arranged">Viewing Arranged</TabsTrigger>
          <TabsTrigger value="under_assessment">Under Assessment</TabsTrigger>
          <TabsTrigger value="accepted">Accepted</TabsTrigger>
          <TabsTrigger value="declined">Declined</TabsTrigger>
        </TabsList>
      </Tabs>

      {showForm && (
        <LandlordEnquiryForm_Supabase
          enquiry={editingEnquiry}
          users={users}
          currentUser={currentUser}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingEnquiry(null);
          }}
        />
      )}

      {viewingEnquiry && (
        <LandlordEnquiryDetailModal
          enquiry={viewingEnquiry}
          getStatusColor={getStatusColor}
          getPriorityColor={getPriorityColor}
          onClose={() => setViewingEnquiry(null)}
          onEdit={(enquiry) => {
            setViewingEnquiry(null);
            handleEdit(enquiry);
          }}
          onDelete={handleDelete}
        />
      )}

      {loading ? (
        <div className="text-center py-12">
          <p className="text-slate-500">Loading enquiries...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {filteredEnquiries.map((enquiry) => (
            <Card key={enquiry.id} className="hover:shadow-md transition-shadow duration-200 relative">
              {hasFollowUpNeeded(enquiry) && (
                <div className="absolute top-4 right-4 z-10">
                  <Badge className="bg-red-100 text-red-800 border-red-200 animate-pulse">
                    Follow-up Required
                  </Badge>
                </div>
              )}
              <CardHeader className="pb-4">
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-4 pr-8">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 text-lg mb-3 break-words">
                        {enquiry.landlord_name || 'No name provided'}
                      </h3>
                      {enquiry.intro_given_to_organisation && (
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200 mb-2">
                          Intro Given
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleViewDetails(enquiry)}
                      className="text-slate-400 hover:text-slate-600 flex-shrink-0"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge className={getStatusColor(enquiry.status)}>
                      {enquiry.status?.replace('_', ' ') || 'new'}
                    </Badge>
                    <Badge className={getPriorityColor(enquiry.priority)}>
                      {enquiry.priority || 'medium'} priority
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-2">
                <div className="flex items-start gap-3 min-h-[24px]">
                  <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0 mt-1" />
                  <span className="text-slate-600 flex-1 break-words leading-relaxed">{enquiry.property_address || 'No address provided'}</span>
                </div>
                
                <div className="flex items-start gap-3 min-h-[24px]">
                  <Mail className="w-4 h-4 text-slate-400 flex-shrink-0 mt-1" />
                  <span className="text-slate-600 flex-1 break-all leading-relaxed">{enquiry.contact_email || 'No email provided'}</span>
                </div>
                
                {enquiry.contact_phone && (
                  <div className="flex items-start gap-3 min-h-[24px]">
                    <Phone className="w-4 h-4 text-slate-400 flex-shrink-0 mt-1" />
                    <span className="text-slate-600 flex-1 break-words leading-relaxed">{enquiry.contact_phone}</span>
                  </div>
                )}
                
                <div className="flex items-start gap-3 min-h-[24px]">
                  <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0 mt-1" />
                  <span className="text-slate-600 flex-1 leading-relaxed">
                    {formatEnquiryDate(enquiry.enquiry_date)}
                  </span>
                </div>
                
                {enquiry.rent_per_week && (
                  <div className="flex items-start gap-3 min-h-[24px]">
                    <Building className="w-4 h-4 text-slate-400 flex-shrink-0 mt-1" />
                    <span className="text-slate-600 flex-1 leading-relaxed">
                      £{enquiry.rent_per_week}/week • {enquiry.number_of_bedrooms} bedrooms
                    </span>
                  </div>
                )}
                
                <div className="flex items-start gap-3 pt-4 border-t min-h-[24px]">
                  <UserIcon className="w-4 h-4 text-purple-500 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <span className="text-purple-700 font-medium break-words leading-relaxed">
                      Logged by: {getLoggedByName(enquiry)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filteredEnquiries.length === 0 && !loading && (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No enquiries found</h3>
            <p className="text-slate-500 mb-4">
              {searchTerm ? "Try adjusting your search terms" : "No landlord enquiries have been received yet"}
            </p>
            {!searchTerm && (
              <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Add First Enquiry
              </Button>
            )}
            <div className="mt-4 text-xs text-slate-400">
              Total enquiries in system: {enquiries.length}
            </div>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={!!enquiryToDelete} onOpenChange={(open) => !open && setEnquiryToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Landlord Enquiry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the enquiry from "{enquiryToDelete?.landlord_name}"? It will be moved to deleted entries.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete Enquiry
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}