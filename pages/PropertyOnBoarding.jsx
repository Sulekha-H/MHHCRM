import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Building, Phone, Mail, MapPin, Calendar, FileText, Eye, Download, User as UserIcon } from "lucide-react";
import { format, isValid } from "date-fns";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import PropertyOnboardingForm_Supabase from "../components/landlord/PropertyOnboardingForm";
import PropertyOnboardingDetailModal from "../components/landlord/PropertyOnboardingDetailModal";

// Helper to normalize Supabase data - handles both PascalCase and snake_case
const normalizeCase = (case_) => {
  if (!case_) return null;
  
  return {
    id: case_.id || case_.Id || case_.ID || case_["ID"],
    created_date: case_.created_date || case_["Created Date"],
    updated_date: case_.updated_date || case_["Updated Date"],
    created_by: case_.created_by || case_["Created By"],
    application_date: case_.application_date || case_["Application Date"] || case_.Application_Date,
    landlord_name: case_.landlord_name || case_["Landlord Name"] || case_.Landlord_Name,
    landlord_company: case_.landlord_company || case_["Landlord Company"] || case_.Landlord_Company,
    contact_email: case_.contact_email || case_["Contact Email"] || case_.Contact_Email,
    contact_phone: case_.contact_phone || case_["Contact Phone"] || case_.Contact_Phone,
    alternative_contact: case_.alternative_contact || case_["Alternative Contact"] || case_.Alternative_Contact,
    property_address: case_.property_address || case_["Property Address"] || case_.Property_Address,
    property_area: case_.property_area || case_["Property Area"] || case_.Property_Area,
    property_type: case_.property_type || case_["Property Type"] || case_.Property_Type,
    total_units: case_.total_units || case_["Total Units"] || case_.Total_Units,
    detailed_property_layout: case_.detailed_property_layout || case_["Detailed Property Layout"] || case_.Detailed_Property_Layout,
    rent_per_week: case_.rent_per_week || case_["Rent Per Week"] || case_.Rent_Per_Week,
    deposit_amount: case_.deposit_amount || case_["Deposit Amount"] || case_.Deposit_Amount,
    hmo_ready: case_.hmo_ready !== undefined ? case_.hmo_ready : case_["HMO Ready"] !== undefined ? case_["HMO Ready"] : case_.Hmo_Ready,
    hmo_conversion_by: case_.hmo_conversion_by || case_["HMO Conversion By"] || case_.Hmo_Conversion_By,
    property_ready: (() => {
      const val = case_.property_ready || case_["Property Ready"] || case_.Property_Ready;
      return val ? String(val).toLowerCase() : "yes";
    })(),
    property_ready_date: case_.property_ready_date || case_["Property Ready Date"] || case_.Property_Ready_Date,
    pictures_provided: (() => {
      const val = case_.pictures_provided || case_["Pictures Provided"] || case_.Pictures_Provided;
      return val ? String(val).toLowerCase() : "no";
    })(),
    pictures_gdrive_link: case_.pictures_gdrive_link || case_["Pictures GDrive Link"] || case_.Pictures_Gdrive_Link,
    onboarding_status: case_.onboarding_status || case_["Onboarding Status"] || case_.Onboarding_Status,
    assigned_to_user_id: case_.assigned_to_user_id || case_["Assigned To User ID"] || case_.Assigned_To_User_Id,
    initial_contact_date: case_.initial_contact_date || case_["Initial Contact Date"] || case_.Initial_Contact_Date,
    documents_requested_date: case_.documents_requested_date || case_["Documents Requested Date"] || case_.Documents_Requested_Date,
    documents_received_date: case_.documents_received_date || case_["Documents Received Date"] || case_.Documents_Received_Date,
    property_inspection_date: case_.property_inspection_date || case_["Property Inspection Date"] || case_.Property_Inspection_Date,
    contract_preparation_date: case_.contract_preparation_date || case_["Contract Preparation Date"] || case_.Contract_Preparation_Date,
    contract_signed_date: case_.contract_signed_date || case_["Contract Signed Date"] || case_.Contract_Signed_Date,
    live_date: case_.live_date || case_["Live Date"] || case_.Live_Date,
    rejected_date: case_.rejected_date || case_["Rejected Date"] || case_.Rejected_Date,
    on_hold_date: case_.on_hold_date || case_["On Hold Date"] || case_.On_Hold_Date,
    inspection_date: case_.inspection_date || case_["Inspection Date"] || case_.Inspection_Date,
    contract_start_date: case_.contract_start_date || case_["Contract Start Date"] || case_.Contract_Start_Date,
    notes: case_.notes || case_.Notes,
    rejection_reason: case_.rejection_reason || case_["Rejection Reason"] || case_.Rejection_Reason,
    logged_by: case_.logged_by || case_["Logged By"] || case_.Logged_By,
    deleted: case_.deleted !== undefined ? case_.deleted : case_.Deleted,
    deleted_date: case_.deleted_date || case_["Deleted Date"] || case_.Deleted_Date,
    deleted_by: case_.deleted_by || case_["Deleted By"] || case_.Deleted_By
  };
};

export default function PropertyOnboarding() {
  const [onboardingCases, setOnboardingCases] = useState([]);
  const [filteredCases, setFilteredCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCase, setEditingCase] = useState(null);
  const [viewingCase, setViewingCase] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [caseToDelete, setCaseToDelete] = useState(null);

  // Helper function to safely format dates
  const formatCaseDate = (dateString) => {
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
    const loadUserAndData = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        
        if (authUser) {
          const { data: userData } = await supabase
            .from('users')
            .select('*')
            .eq('email', authUser.email)
            .single();
          setCurrentUser(userData);
          console.log("Current user:", userData?.Email || userData?.email);
        }
      } catch (error) {
        console.error("Error loading user:", error);
      }
      
      // Load data regardless of access check
      loadData();
    };
    loadUserAndData();
  }, []);

  const getLoggedByName = useCallback((onboardingCase) => {
    if (onboardingCase.logged_by) {
      return onboardingCase.logged_by;
    }
    
    if (onboardingCase.created_by) {
      const user = users.find(u => (u.Email || u.email) === onboardingCase.created_by);
      if (user?.Full_Name || user?.full_name) {
        return user.Full_Name || user.full_name;
      }
      return onboardingCase.created_by.split('@')[0];
    }
    
    return '-';
  }, [users]);

  const filterCases = useCallback(() => {
    let filtered = onboardingCases;

    if (activeTab !== "all") {
      filtered = filtered.filter(case_ => case_.onboarding_status === activeTab);
    }

    if (searchTerm) {
      filtered = filtered.filter(case_ =>
        case_.landlord_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        case_.property_address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        case_.contact_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getLoggedByName(case_).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredCases(filtered);
  }, [onboardingCases, searchTerm, activeTab, getLoggedByName]);

  useEffect(() => {
    filterCases();
  }, [filterCases]);

  const loadData = async () => {
    setLoading(true);
    console.log("Starting to load property onboarding cases from Supabase...");
    
    try {
      let casesData = [];
      
      try {
        const { data, error } = await supabase
          .from('property_onboarding')
          .select('*')
          .order('Application Date', { ascending: false });
        
        if (error) throw error;
        casesData = data;
        console.log(`✅ Loaded ${casesData?.length || 0} onboarding cases`);
        if (casesData && casesData.length > 0) {
          console.log("📊 Sample case from DB:", casesData[0]);
          console.log("📊 Column names:", Object.keys(casesData[0]));
        }
      } catch (error) {
        console.error("Error loading onboarding cases:", error);
        casesData = [];
      }

      let usersData = [];
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*');
        
        if (error) throw error;
        usersData = data;
        console.log(`Loaded ${usersData?.length || 0} users`);
      } catch (usersError) {
        console.error("Error loading users:", usersError);
      }
      
      // Normalize all cases
      const normalizedCases = casesData ? casesData.map(normalizeCase) : [];
      console.log("📊 Sample normalized case:", normalizedCases[0]);
      
      setOnboardingCases(normalizedCases);
      setUsers(usersData || []);
    } catch (error) {
      console.error("Critical error loading data:", error);
      setOnboardingCases([]);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const formatDate = (dateString) => {
      if (!dateString) return "";
      try {
        const date = new Date(dateString);
        if (isValid(date)) {
          return format(date, 'yyyy-MM-dd');
        }
        return "";
      } catch {
        return "";
      }
    };

    const formatDateTime = (dateString) => {
      if (!dateString) return "";
      try {
        const date = new Date(dateString);
        if (isValid(date)) {
          return format(date, 'yyyy-MM-dd HH:mm:ss');
        }
        return "";
      } catch {
        return "";
      }
    };

    const headers = [
      "ID",
      "Application Date",
      "Landlord Name",
      "Landlord Company",
      "Contact Email",
      "Contact Phone",
      "Alternative Contact",
      "Property Address",
      "Property Type",
      "Total Units",
      "Rent Per Week",
      "Deposit Amount",
      "Onboarding Status",
      "Assigned To User ID",
      "Inspection Date",
      "Contract Start Date",
      "Notes",
      "Rejection Reason",
      "Created Date",
      "Updated Date",
      "Created By",
      "Logged By"
    ];

    const rows = filteredCases.map(case_ => [
      case_.id || "",
      formatDateTime(case_.application_date),
      case_.landlord_name || "",
      case_.landlord_company || "",
      case_.contact_email || "",
      case_.contact_phone || "",
      case_.alternative_contact || "",
      case_.property_address || "",
      case_.property_type || "",
      case_.total_units || "",
      case_.rent_per_week || "",
      case_.deposit_amount || "",
      case_.onboarding_status || "",
      case_.assigned_to_user_id || "",
      formatDateTime(case_.inspection_date),
      formatDate(case_.contract_start_date),
      case_.notes || "",
      case_.rejection_reason || "",
      formatDateTime(case_.created_date),
      formatDateTime(case_.updated_date),
      case_.created_by || "",
      getLoggedByName(case_)
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
    link.setAttribute('download', `property_onboarding_export_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSubmit = async (caseData) => {
    try {
      console.log("📤 Submitting case data:", caseData);
      
      if (editingCase) {
        const { error } = await supabase
          .from('property_onboarding')
          .update(caseData)
          .eq('ID', editingCase.id);
        
        if (error) throw error;
        console.log("✅ Case updated successfully");
      } else {
        const { error } = await supabase
          .from('property_onboarding')
          .insert([caseData]);
        
        if (error) throw error;
        console.log("✅ Case created successfully");
      }
      
      setShowForm(false);
      setEditingCase(null);
      setActiveTab("all");
      setSearchTerm("");
      await loadData();
    } catch (error) {
      console.error("Error saving onboarding case:", error);
      alert("Error saving onboarding case: " + error.message);
    }
  };

  const handleEdit = (case_) => {
    console.log("📝 Editing case:", case_);
    setEditingCase(case_);
    setShowForm(true);
  };

  const handleViewDetails = (case_) => {
    setViewingCase(case_);
  };

  const handleDelete = (case_) => {
    setCaseToDelete(case_);
  };

  const confirmDelete = async () => {
    if (caseToDelete) {
      try {
        const { error } = await supabase
          .from('property_onboarding')
          .delete()
          .eq('ID', caseToDelete.id);
        
        if (error) throw error;
        
        console.log(`Property onboarding case ${caseToDelete.id} deleted successfully.`);
        setCaseToDelete(null);
        setViewingCase(null);
        await loadData();
      } catch (error) {
        console.error("Error deleting property onboarding case:", error);
        alert("Error deleting property onboarding case: " + error.message);
      }
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      initial_contact: "bg-blue-100 text-blue-800",
      documents_requested: "bg-yellow-100 text-yellow-800",
      documents_received: "bg-orange-100 text-orange-800",
      property_inspection: "bg-purple-100 text-purple-800",
      contract_preparation: "bg-indigo-100 text-indigo-800",
      contract_signed: "bg-green-100 text-green-800",
      live: "bg-emerald-100 text-emerald-800",
      rejected: "bg-red-100 text-red-800",
      on_hold: "bg-gray-100 text-gray-800"
    };
    return colors[status] || colors.initial_contact;
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Property Onboarding</h1>
          <p className="text-slate-600">Manage the onboarding process for new properties and landlords</p>
          {currentUser && (
            <p className="text-xs text-slate-400 mt-1">Logged in as: {currentUser.Email || currentUser.email}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            onClick={exportToCSV}
            variant="outline"
            className="flex items-center gap-2"
            disabled={loading || filteredCases.length === 0}
          >
            <Download className="w-4 h-4" />
            Export to CSV
          </Button>
          <Button
            onClick={() => setShowForm(true)}
            className="bg-green-600 hover:bg-green-700 shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Start Onboarding
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search onboarding cases by landlord name, property address, email, or staff member..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-9 lg:w-auto lg:grid-cols-9">
          <TabsTrigger value="all">All Cases</TabsTrigger>
          <TabsTrigger value="initial_contact">Initial Contact</TabsTrigger>
          <TabsTrigger value="documents_requested">Docs Requested</TabsTrigger>
          <TabsTrigger value="documents_received">Docs Received</TabsTrigger>
          <TabsTrigger value="property_inspection">Inspection</TabsTrigger>
          <TabsTrigger value="contract_preparation">Contract Prep</TabsTrigger>
          <TabsTrigger value="contract_signed">Contract Signed</TabsTrigger>
          <TabsTrigger value="live">Live</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>
      </Tabs>

      {showForm && (
        <PropertyOnboardingForm_Supabase
          onboardingCase={editingCase}
          users={users}
          currentUser={currentUser}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingCase(null);
          }}
        />
      )}

      {viewingCase && (
        <PropertyOnboardingDetailModal
          onboardingCase={viewingCase}
          getStatusColor={getStatusColor}
          onClose={() => setViewingCase(null)}
          onEdit={(caseToEdit) => {
            setViewingCase(null);
            handleEdit(caseToEdit);
          }}
          onDelete={handleDelete}
        />
      )}

      {loading ? (
        <div className="text-center py-12">
          <p className="text-slate-500">Loading onboarding cases...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {filteredCases.map((case_) => (
            <Card key={case_.id} className="hover:shadow-md transition-shadow duration-200">
              <CardHeader className="pb-4">
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 text-lg mb-2 break-words">
                        {case_.landlord_name || 'No name provided'}
                      </h3>
                      {case_.landlord_company && (
                        <p className="text-slate-600 text-sm mb-2 break-words">
                          ({case_.landlord_company})
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleViewDetails(case_)}
                      className="text-slate-400 hover:text-slate-600 flex-shrink-0"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge className={getStatusColor(case_.onboarding_status)}>
                      {(case_.onboarding_status || 'initial contact').replace(/_/g, ' ')}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-2">
                <div className="flex items-start gap-3 min-h-[24px]">
                  <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0 mt-1" />
                  <span className="text-slate-600 flex-1 break-words leading-relaxed">
                    {case_.property_address || 'No address provided'}
                  </span>
                </div>
                
                <div className="flex items-start gap-3 min-h-[24px]">
                  <Mail className="w-4 h-4 text-slate-400 flex-shrink-0 mt-1" />
                  <span className="text-slate-600 flex-1 break-all leading-relaxed">
                    {case_.contact_email || 'No email provided'}
                  </span>
                </div>
                
                {case_.contact_phone && (
                  <div className="flex items-start gap-3 min-h-[24px]">
                    <Phone className="w-4 h-4 text-slate-400 flex-shrink-0 mt-1" />
                    <span className="text-slate-600 flex-1 break-words leading-relaxed">
                      {case_.contact_phone}
                    </span>
                  </div>
                )}
                
                <div className="flex items-start gap-3 min-h-[24px]">
                  <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0 mt-1" />
                  <span className="text-slate-600 flex-1 leading-relaxed">
                    Started {formatCaseDate(case_.application_date)}
                  </span>
                </div>
                
                {case_.total_units && case_.rent_per_week && (
                  <div className="flex items-start gap-3 min-h-[24px]">
                    <Building className="w-4 h-4 text-slate-400 flex-shrink-0 mt-1" />
                    <span className="text-slate-600 flex-1 leading-relaxed">
                      {case_.total_units} units • £{case_.rent_per_week}/week
                    </span>
                  </div>
                )}
                
                <div className="flex items-start gap-3 pt-4 border-t min-h-[24px]">
                  <UserIcon className="w-4 h-4 text-purple-500 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <span className="text-purple-700 font-medium break-words leading-relaxed">
                      Logged by: {getLoggedByName(case_)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filteredCases.length === 0 && !loading && (
        <Card>
          <CardContent className="p-12 text-center">
            <Building className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No onboarding cases found</h3>
            <p className="text-slate-500 mb-4">
              {searchTerm ? "Try adjusting your search terms" : "No property onboarding cases have been started yet"}
            </p>
            {!searchTerm && (
              <Button onClick={() => setShowForm(true)} className="bg-green-600 hover:bg-green-700">
                <Plus className="w-4 h-4 mr-2" />
                Start First Onboarding
              </Button>
            )}
            <div className="mt-4 text-xs text-slate-400">
              Total onboarding cases in system: {onboardingCases.length}
            </div>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={!!caseToDelete} onOpenChange={(open) => !open && setCaseToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Property Onboarding Case</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the onboarding case for "{caseToDelete?.landlord_name}" at {caseToDelete?.property_address}? This action cannot be undone and will permanently remove all data associated with this property onboarding case.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete Case
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}