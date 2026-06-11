"use client"

import { useUser } from "@clerk/nextjs";
import React, { useState, useEffect, useCallback } from "react";
import { useClerkSupabaseClient } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, FileText, Download, Edit, Trash2, User as UserIcon, ExternalLink, Shield, Wrench, Calendar, Tag } from "lucide-react";
import { format } from "date-fns";
import DocumentFormSupabase from "@/components/documents/DocumentForm";
import WarrantyFormSupabase from "@/components/documents/WarrantyForm";
import InsuranceFormSupabase from "@/components/documents/InsuranceForm";
import ApplianceFormSupabase from "@/components/documents/ApplianceForm";
import DocumentDetailModal from "@/components/documents/DocumentDetailModal";
import WarrantyDetailModal from "@/components/documents/WarrantyDetailModal";
import InsuranceDetailModal from "@/components/documents/InsuranceDetailModal";
import ApplianceDetailModal from "@/components/documents/ApplianceDetailModal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function DocumentsSupabase() {
  
  const { user } = useUser();
  const supabase = useClerkSupabaseClient()
  const [activeTab, setActiveTab] = useState("documents");
  const [documents, setDocuments] = useState([]);
  const [warranties, setWarranties] = useState([]);
  const [insurances, setInsurances] = useState([]);
  const [appliances, setAppliances] = useState([]);
  const [residents, setResidents] = useState([]);
  const [properties, setProperties] = useState([]);
  const [accommodations, setAccommodations] = useState([]);
  const [users, setUsers] = useState([]);
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [viewingRecord, setViewingRecord] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [residentFilter, setResidentFilter] = useState("all");
  const [selectedTags, setSelectedTags] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const getLoggedByName = useCallback((record) => {
    // Use the 'logged_by' field if present
    if (record.logged_by || record["Logged By"]) {
      return record.logged_by || record["Logged By"];
    }

    // Otherwise, fall back to 'created_by'
    const createdBy = record.created_by || record["Created By"];
    if (createdBy) {
      // If you have a list of users, match by email
      if (users && users.length > 0) {
        const matchedUser = users.find(u =>
          (u.email && u.email.toLowerCase() === createdBy.toLowerCase()) ||
          (u.Email && u.Email.toLowerCase() === createdBy.toLowerCase())
        );
        if (matchedUser) {
          return matchedUser.full_name || matchedUser["Full Name"] || matchedUser.Name || matchedUser.name || createdBy.split('@')[0];
        }
      }

      // Otherwise, just return the email name before '@'
      return createdBy.split('@')[0];
    }

    return null;
  }, [users]);

  // Initial data load
  useEffect(() => {
    if (supabase && user) {
      loadData();
    }
  }, [supabase, user]);

  useEffect(() => {
    let filtered = documents;

    if (residentFilter !== "all") {
      filtered = filtered.filter(doc => {
        const residentId = doc.resident_id || doc["Resident ID"];
        return residentId === residentFilter;
      });
    }

    if (selectedTags.length > 0) {
      filtered = filtered.filter(doc => {
        const docTags = doc.tags || doc.Tags || [];
        return selectedTags.every(selectedTag => docTags.includes(selectedTag));
      });
    }

    if (searchTerm) {
      const lowercasedTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(doc => {
        const title = doc.title || doc.Title || '';
        const description = doc.description || doc.Description || '';
        const documentType = doc.document_type || doc["Document Type"] || '';
        const docTags = doc.tags || doc.Tags || [];
        
        const titleMatch = title.toLowerCase().includes(lowercasedTerm);
        const descMatch = description.toLowerCase().includes(lowercasedTerm);
        const typeMatch = documentType.toLowerCase().includes(lowercasedTerm);
        const tagsMatch = docTags.some(tag => tag.toLowerCase().includes(lowercasedTerm));
        const loggedByMatch = (getLoggedByName(doc) || '').toLowerCase().includes(lowercasedTerm);
        return titleMatch || descMatch || typeMatch || tagsMatch || loggedByMatch;
      });
    }

    setFilteredDocuments(filtered);
  }, [documents, searchTerm, residentFilter, selectedTags, getLoggedByName]);

  const loadData = async () => {
    setLoading(true);
    console.log('🔄 Starting to load Documents & Assets data...');
    try {
      const userEmail = user?.primaryEmailAddress?.emailAddress;
      console.log('👤 Current user email:', userEmail);
      
      if (userEmail) {
        const { data } = await supabase.from('users').select('*').eq('Email', userEmail).single();
        if (data) {
          const userData = {
            ...data,
            email: data.Email || data.email,
            full_name: data["Full Name"] || data.full_name || data.Name || data.name
          };
          setCurrentUser(userData);
        }
      }

      const [
        { data: docsData, error: docsError },
        { data: warrantyData, error: warrantyError },
        { data: insuranceData, error: insuranceError },
        { data: applianceData, error: applianceError },
        { data: residentsData, error: residentsError },
        { data: propertiesData, error: propertiesError },
        { data: accommodationsData, error: accommodationsError },
        { data: usersData, error: usersError }
      ] = await Promise.all([
        supabase.from('documents').select('*').order('"Created Date"', { ascending: false }),
        supabase.from('warranties').select('*').order('"Created Date"', { ascending: false }),
        supabase.from('insurances').select('*').order('"Created Date"', { ascending: false }),
        supabase.from('appliances').select('*').order('"Created Date"', { ascending: false }),
        supabase.from('residents').select('*'),
        supabase.from('properties').select('*'),
        supabase.from('accommodations').select('*'),
        supabase.from('users').select('*')
      ]);

      if (docsError) console.error('❌ Error loading documents:', docsError);
      if (warrantyError) console.error('❌ Error loading warranties:', warrantyError);
      if (insuranceError) console.error('❌ Error loading insurances:', insuranceError);
      if (applianceError) console.error('❌ Error loading appliances:', applianceError);
      if (residentsError) console.error('❌ Error loading residents:', residentsError);
      if (propertiesError) console.error('❌ Error loading properties:', propertiesError);
      if (accommodationsError) console.error('❌ Error loading accommodations:', accommodationsError);
      if (usersError) console.error('❌ Error loading users:', usersError);

      const activeDocuments = (docsData || []).filter(d => {
        const isDeleted = d.deleted || d.Deleted || d["Deleted"];
        return !isDeleted;
      });
      const activeWarranties = (warrantyData || []).filter(w => {
        const isDeleted = w.deleted || w.Deleted || w["Deleted"];
        return !isDeleted;
      });
      const activeInsurances = (insuranceData || []).filter(i => {
        const isDeleted = i.deleted || i.Deleted || i["Deleted"];
        return !isDeleted;
      });
      const activeAppliances = (applianceData || []).filter(a => {
        const isDeleted = a.deleted || a.Deleted || a["Deleted"];
        return !isDeleted;
      });

      console.log('📊 Data loaded:');
      console.log('  - Documents:', activeDocuments.length, '(filtered out', (docsData?.length || 0) - activeDocuments.length, 'deleted)');
      console.log('  - Warranties:', activeWarranties.length);
      console.log('  - Insurances:', activeInsurances.length);
      console.log('  - Appliances:', activeAppliances.length);
      console.log('  - Residents:', residentsData?.length || 0);
      console.log('  - Properties:', propertiesData?.length || 0);
      console.log('  - Users:', usersData?.length || 0);
      
      setDocuments(activeDocuments);
      setWarranties(activeWarranties);
      setInsurances(activeInsurances);
      setAppliances(activeAppliances);
      setResidents(residentsData || []);
      setProperties(propertiesData || []);
      setAccommodations(accommodationsData || []);
      setUsers(usersData || []);

      console.log('✅ Data loaded successfully');
    } catch (error) {
      console.error("❌ Error loading data:", error);
      setDocuments([]);
      setWarranties([]);
      setInsurances([]);
      setAppliances([]);
      setResidents([]);
      setProperties([]);
      setAccommodations([]);
      setUsers([]);
    } finally {
      setLoading(false);
      console.log('✅ Loading complete');
    }
  };

  const handleSubmit = async (recordData) => {
    console.log(`📝 Submitting ${activeTab}:`, recordData);
    
    try {
      // Ensure "Logged By" is set from currentUser if not provided
      if (!recordData["Logged By"] && currentUser?.full_name) {
        recordData["Logged By"] = currentUser.full_name;
      }

      let error;
      if (activeTab === "documents") {
        if (editingRecord) {
          const recordId = editingRecord.ID || editingRecord.id;
          ({ error } = await supabase.from('documents').update(recordData).eq('"ID"', recordId));
          console.log(`✅ Updated document ${recordId}`);
        } else {
          ({ error } = await supabase.from('documents').insert([recordData]));
          console.log(`✅ Created new document`);
        }
      } else if (activeTab === "warranties") {
        if (editingRecord) {
          const recordId = editingRecord.ID || editingRecord.id;
          ({ error } = await supabase.from('warranties').update(recordData).eq('"ID"', recordId));
          console.log(`✅ Updated warranty ${recordId}`);
        } else {
          ({ error } = await supabase.from('warranties').insert([recordData]));
          console.log(`✅ Created new warranty`);
        }
      } else if (activeTab === "insurances") {
        if (editingRecord) {
          const recordId = editingRecord.ID || editingRecord.id;
          ({ error } = await supabase.from('insurances').update(recordData).eq('"ID"', recordId));
          console.log(`✅ Updated insurance ${recordId}`);
        } else {
          ({ error } = await supabase.from('insurances').insert([recordData]));
          console.log(`✅ Created new insurance`);
        }
      } else if (activeTab === "appliances") {
        if (editingRecord) {
          const recordId = editingRecord.ID || editingRecord.id;
          ({ error } = await supabase.from('appliances').update(recordData).eq('"ID"', recordId));
          console.log(`✅ Updated appliance ${recordId}`);
        } else {
          ({ error } = await supabase.from('appliances').insert([recordData]));
          console.log(`✅ Created new appliance`);
        }
      }
      
      if (error) throw error;
      
      setShowForm(false);
      setEditingRecord(null);
      
      setTimeout(() => {
        console.log("🔄 Reloading data after save...");
        loadData();
      }, 500);
    } catch (error) {
      console.error(`❌ Error saving ${activeTab}:`, error);
      alert(`Failed to save record. Error: ${error.message}`);
    }
  };

  const handleEdit = (record) => {
    console.log("✏️ Editing record:", record);
    setViewingRecord(null);
    setEditingRecord(record);
    setShowForm(true);
  };

  const handleViewDetails = (record) => {
    console.log("👁️ Viewing record details:", record);
    setViewingRecord(record);
  };

  const handleDelete = async (recordId) => {
    console.log("🗑️ handleDelete called with recordId:", recordId);
    console.log("👤 Current user:", currentUser?.email);

    if (window.confirm("Are you sure you want to delete this record? It will be moved to deleted entries.")) {
      console.log("✅ Delete confirmed by:", currentUser?.email);
      
      try {
        const deleteData = {
          "Deleted": true,
          "Deleted Date": new Date().toISOString(),
          "Deleted By": user?.primaryEmailAddress?.emailAddress || currentUser?.full_name || 'unknown'
        };

        let error;
        if (activeTab === "documents") {
          ({ error } = await supabase.from('documents').update(deleteData).eq('"ID"', recordId));
        } else if (activeTab === "warranties") {
          ({ error } = await supabase.from('warranties').update(deleteData).eq('"ID"', recordId));
        } else if (activeTab === "insurances") {
          ({ error } = await supabase.from('insurances').update(deleteData).eq('"ID"', recordId));
        } else if (activeTab === "appliances") {
          ({ error } = await supabase.from('appliances').update(deleteData).eq('"ID"', recordId));
        }
        
        if (error) throw error;
        
        console.log(`✅ Soft deleted ${activeTab} record ${recordId}`);
        setViewingRecord(null);
        
        setTimeout(() => {
          console.log("🔄 Reloading data after delete...");
          loadData();
        }, 500);
      } catch (error) {
        console.error(`❌ Error deleting ${activeTab}:`, error);
        alert(`Failed to delete record. Error: ${error.message}`);
      }
    } else {
      console.log("❌ Delete cancelled by user");
    }
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

    const getResidentNameForExport = (residentId) => {
      if (!residentId) return null;
      const resident = residents.find(r => (r.id || r.ID) === residentId);
      if (!resident) return null;
      const firstName = resident.first_name || resident["First Name"] || '';
      const lastName = resident.last_name || resident["Last Name"] || '';
      return `${firstName} ${lastName}`.trim() || null;
    };

    const getPropertyNameForExport = (propertyId) => {
      if (!propertyId) return null;
      if (propertyId === "OFFICE") return "OFFICE";
      const property = properties.find(p => (p.id || p.ID) === propertyId);
      return property ? (property.name || property.Name) : null;
    };
    
    const getAccommodationNameForExport = (accommodationId) => {
      if (!accommodationId) return null;
      const accommodation = accommodations.find(a => (a.id || a.ID) === accommodationId);
      return accommodation ? (accommodation.room_number || accommodation["Unit/Room Number"]) : null;
    };

    const formatTags = (tags) => {
      if (!tags || tags.length === 0) return null;
      return tags.join('; ');
    };

    const formatDocumentType = (type) => {
      const typeMap = {
        'policy': 'Policy',
        'procedure': 'Procedure',
        'form': 'Form',
        'report': 'Report',
        'correspondence': 'Correspondence',
        'resident_file': 'Resident File',
        'other': 'Other'
      };
      return typeMap[type] || type;
    };

    const formatConfidentiality = (level) => {
      const levelMap = {
        'public': 'Public',
        'internal': 'Internal',
        'confidential': 'Confidential',
        'restricted': 'Restricted'
      };
      return levelMap[level] || level;
    };

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

    let csvContent, filename;

    if (activeTab === "documents") {
      const headers = [
        "ID", "Created Date", "Updated Date", "Created By", "Title", "Document Type",
        "Category", "File URL", "Resident ID", "Resident Name", "Description", "Tags",
        "Confidentiality", "Expiry Date", "Logged By", "Deleted", "Deleted Date", "Deleted By"
      ];

      const rows = filteredDocuments.map(doc => [
        doc.id || doc.ID || null,
        formatDateTime(doc.created_date || doc["Created Date"]),
        formatDateTime(doc.updated_date || doc["Updated Date"]),
        doc.created_by || doc["Created By"] || null,
        doc.title || doc.Title || null,
        formatDocumentType(doc.document_type || doc["Document Type"]),
        doc.category || doc.Category || null,
        doc.file_url || doc["File URL"] || null,
        doc.resident_id || doc["Resident ID"] || null,
        getResidentNameForExport(doc.resident_id || doc["Resident ID"]),
        doc.description || doc.Description || null,
        formatTags(doc.tags || doc.Tags),
        formatConfidentiality(doc.confidentiality || doc.Confidentiality),
        formatDate(doc.expiry_date || doc["Expiry Date"]),
        getLoggedByName(doc),
        formatBoolean(doc.deleted || doc.Deleted),
        formatDateTime(doc.deleted_date || doc["Deleted Date"]),
        doc.deleted_by || doc["Deleted By"] || null
      ]);

      csvContent = [
        headers.map(h => `"${h}"`).join(','),
        ...rows.map(row => row.map(escapeCSV).join(','))
      ].join('\n');

      filename = `documents_export_${format(new Date(), 'yyyy-MM-dd_HHmm')}.csv`;
      
    } else if (activeTab === "warranties") {
      const formatWarrantyType = (type) => {
        const typeMap = {
          'manufacturer': 'Manufacturer Warranty',
          'extended': 'Extended Warranty',
          'retailer': 'Retailer Warranty',
          'insurance': 'Insurance Warranty'
        };
        return typeMap[type] || type;
      };

      const formatWarrantyStatus = (status) => {
        const statusMap = {
          'active': 'Active',
          'expired': 'Expired',
          'claimed': 'Claimed',
          'cancelled': 'Cancelled',
          'pending_renewal': 'Pending Renewal'
        };
        return statusMap[status] || status;
      };

      const headers = [
        "ID", "Created Date", "Updated Date", "Created By", "Product Name", "Brand",
        "Model Number", "Serial Number", "Property ID", "Property Name", "Accommodation ID",
        "Unit/Room Number", "Purchase Date", "Warranty Start Date", "Warranty End Date",
        "Warranty Period (Months)", "Supplier", "Purchase Price", "Warranty Type", "Status",
        "Warranty Document URL", "Receipt URL", "Policy Provider", "Policy Number",
        "Letter Received From", "Direct Debit Payment Day", "Online Account Website",
        "Online Account Email", "Online Account Password", "Auto Renewal", "Renewal Reminder Date",
        "Renewal Contact Person", "Renewal Notes", "Notes", "Logged By", "Deleted",
        "Deleted Date", "Deleted By"
      ];

      const rows = warranties.map(w => [
        w.id || w.ID || null,
        formatDateTime(w.created_date || w["Created Date"]),
        formatDateTime(w.updated_date || w["Updated Date"]),
        w.created_by || w["Created By"] || null,
        w.product_name || w["Product Name"] || null,
        w.brand || w.Brand || null,
        w.model_number || w["Model Number"] || null,
        w.serial_number || w["Serial Number"] || null,
        w.property_id || w["Property ID"] || null,
        getPropertyNameForExport(w.property_id || w["Property ID"]),
        w.accommodation_id || w["Accommodation ID"] || null,
        getAccommodationNameForExport(w.accommodation_id || w["Accommodation ID"]),
        formatDate(w.purchase_date || w["Purchase Date"]),
        formatDate(w.warranty_start_date || w["Warranty Start Date"]),
        formatDate(w.warranty_end_date || w["Warranty End Date"]),
        w.warranty_period_months || w["Warranty Period (Months)"] || null,
        w.supplier || w.Supplier || null,
        w.purchase_price || w["Purchase Price"] || null,
        formatWarrantyType(w.warranty_type || w["Warranty Type"]),
        formatWarrantyStatus(w.status || w.Status),
        w.warranty_document_url || w["Warranty Document URL"] || null,
        w.receipt_url || w["Receipt URL"] || null,
        w.policy_provider || w["Policy Provider"] || null,
        w.policy_number || w["Policy Number"] || null,
        w.letter_received_from || w["Letter Received From"] || null,
        w.direct_debit_payment_day || w["Direct Debit Payment Day"] || null,
        w.online_account_website || w["Online Account Website"] || null,
        w.online_account_email || w["Online Account Email"] || null,
        w.online_account_password || w["Online Account Password"] || null,
        formatBoolean(w.auto_renewal || w["Auto Renewal"]),
        formatDate(w.renewal_reminder_date || w["Renewal Reminder Date"]),
        w.renewal_contact_person || w["Renewal Contact Person"] || null,
        w.renewal_notes || w["Renewal Notes"] || null,
        w.notes || w.Notes || null,
        getLoggedByName(w),
        formatBoolean(w.deleted || w.Deleted),
        formatDateTime(w.deleted_date || w["Deleted Date"]),
        w.deleted_by || w["Deleted By"] || null
      ]);

      csvContent = [
        headers.map(h => `"${h}"`).join(','),
        ...rows.map(row => row.map(escapeCSV).join(','))
      ].join('\n');

      filename = `warranties_export_${format(new Date(), 'yyyy-MM-dd_HHmm')}.csv`;
      
    } else if (activeTab === "insurances") {
      const formatInsuranceType = (type) => {
        const typeMap = {
          'public_liability': 'Public Liability',
          'buildings': 'Buildings',
          'contents': 'Contents',
          'employers_liability': 'Employers Liability',
          'professional_indemnity': 'Professional Indemnity',
          'motor': 'Motor',
          'equipment': 'Equipment',
          'other': 'Other'
        };
        return typeMap[type] || type;
      };

      const formatInsuranceStatus = (status) => {
        const statusMap = {
          'active': 'Active',
          'expired': 'Expired',
          'cancelled': 'Cancelled',
          'pending_renewal': 'Pending Renewal'
        };
        return statusMap[status] || status;
      };

      const headers = [
        "ID", "Created Date", "Updated Date", "Created By", "Policy Name", "Insurance Type",
        "Insurance Company", "Policy Number", "Coverage Amount", "Annual Premium",
        "Policy Start Date", "Policy End Date", "Renewal Date", "Direct Debit Payment Day",
        "Broker Name", "Broker Contact", "Property ID", "Property Name", "Status",
        "Policy Document URL", "Certificate URL", "Auto Renewal", "Renewal Reminder Date",
        "Renewal Contact Person", "Renewal Notes", "Notes", "Logged By", "Deleted",
        "Deleted Date", "Deleted By"
      ];

      const rows = insurances.map(i => [
        i.id || i.ID || null,
        formatDateTime(i.created_date || i["Created Date"]),
        formatDateTime(i.updated_date || i["Updated Date"]),
        i.created_by || i["Created By"] || null,
        i.policy_name || i["Policy Name"] || null,
        formatInsuranceType(i.insurance_type || i["Insurance Type"]),
        i.insurance_company || i["Insurance Company"] || null,
        i.policy_number || i["Policy Number"] || null,
        i.coverage_amount || i["Coverage Amount"] || null,
        i.annual_premium || i["Annual Premium"] || null,
        formatDate(i.policy_start_date || i["Policy Start Date"]),
        formatDate(i.policy_end_date || i["Policy End Date"]),
        formatDate(i.renewal_date || i["Renewal Date"]),
        i.direct_debit_payment_day || i["Direct Debit Payment Day"] || null,
        i.broker_name || i["Broker Name"] || null,
        i.broker_contact || i["Broker Contact"] || null,
        i.property_id || i["Property ID"] || null,
        getPropertyNameForExport(i.property_id || i["Property ID"]),
        formatInsuranceStatus(i.status || i.Status),
        i.policy_document_url || i["Policy Document URL"] || null,
        i.certificate_url || i["Certificate URL"] || null,
        formatBoolean(i.auto_renewal || i["Auto Renewal"]),
        formatDate(i.renewal_reminder_date || i["Renewal Reminder Date"]),
        i.renewal_contact_person || i["Renewal Contact Person"] || null,
        i.renewal_notes || i["Renewal Notes"] || null,
        i.notes || i.Notes || null,
        getLoggedByName(i),
        formatBoolean(i.deleted || i.Deleted),
        formatDateTime(i.deleted_date || i["Deleted Date"]),
        i.deleted_by || i["Deleted By"] || null
      ]);

      csvContent = [
        headers.map(h => `"${h}"`).join(','),
        ...rows.map(row => row.map(escapeCSV).join(','))
      ].join('\n');

      filename = `insurances_export_${format(new Date(), 'yyyy-MM-dd_HHmm')}.csv`;
      
    } else if (activeTab === "appliances") {
      const formatApplianceCategory = (category) => {
        const categoryMap = {
          'kitchen': 'Kitchen',
          'laundry': 'Laundry',
          'heating_cooling': 'Heating & Cooling',
          'electrical': 'Electrical',
          'plumbing': 'Plumbing',
          'furniture': 'Furniture',
          'electronics': 'Electronics',
          'other': 'Other'
        };
        return categoryMap[category] || category;
      };

      const formatApplianceCondition = (condition) => {
        const conditionMap = {
          'new': 'New',
          'good': 'Good',
          'fair': 'Fair',
          'needs_repair': 'Needs Repair',
          'out_of_order': 'Out of Order'
        };
        return conditionMap[condition] || condition;
      };

      const headers = [
        "ID", "Created Date", "Updated Date", "Created By", "Appliance Name", "Category",
        "Brand", "Model Number", "Serial Number", "Property ID", "Property Name",
        "Accommodation ID", "Unit/Room Number", "Purchase Date", "Installation Date",
        "Purchase Price", "Supplier", "Condition", "Last Service Date", "Next Service Due",
        "Energy Rating", "Warranty ID", "Manual URL", "Receipt URL", "Notes", "Logged By",
        "Deleted", "Deleted Date", "Deleted By"
      ];

      const rows = appliances.map(a => [
        a.id || a.ID || null,
        formatDateTime(a.created_date || a["Created Date"]),
        formatDateTime(a.updated_date || a["Updated Date"]),
        a.created_by || a["Created By"] || null,
        a.appliance_name || a["Appliance Name"] || null,
        formatApplianceCategory(a.category || a.Category),
        a.brand || a.Brand || null,
        a.model_number || a["Model Number"] || null,
        a.serial_number || a["Serial Number"] || null,
        a.property_id || a["Property ID"] || null,
        getPropertyNameForExport(a.property_id || a["Property ID"]),
        a.accommodation_id || a["Accommodation ID"] || null,
        getAccommodationNameForExport(a.accommodation_id || a["Accommodation ID"]),
        formatDate(a.purchase_date || a["Purchase Date"]),
        formatDate(a.installation_date || a["Installation Date"]),
        a.purchase_price || a["Purchase Price"] || null,
        a.supplier || a.Supplier || null,
        formatApplianceCondition(a.condition || a.Condition),
        formatDate(a.last_service_date || a["Last Service Date"]),
        formatDate(a.next_service_due || a["Next Service Due"]),
        a.energy_rating || a["Energy Rating"] || null,
        a.warranty_id || a["Warranty ID"] || null,
        a.manual_url || a["Manual URL"] || null,
        a.receipt_url || a["Receipt URL"] || null,
        a.notes || a.Notes || null,
        getLoggedByName(a),
        formatBoolean(a.deleted || a.Deleted),
        formatDateTime(a.deleted_date || a["Deleted Date"]),
        a.deleted_by || a["Deleted By"] || null
      ]);

      csvContent = [
        headers.map(h => `"${h}"`).join(','),
        ...rows.map(row => row.map(escapeCSV).join(','))
      ].join('\n');

      filename = `appliances_export_${format(new Date(), 'yyyy-MM-dd_HHmm')}.csv`;
    }

    if (csvContent && filename) {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      console.log(`✅ ${activeTab} CSV export completed successfully`);
    }
  };

  const getResidentName = useCallback((residentId) => {
    if (!residentId) return "N/A";
    const resident = residents.find(r => (r.id || r.ID) === residentId);
    if (!resident) return "Unknown Resident";
    
    const firstName = resident.first_name || resident["First Name"] || '';
    const lastName = resident.last_name || resident["Last Name"] || '';
    return `${firstName} ${lastName}`.trim() || "Unknown Resident";
  }, [residents]);

  const getPropertyName = useCallback((propertyId) => {
    if (!propertyId) return "N/A";
    if (propertyId === "OFFICE") return "OFFICE";
    const property = properties.find(p => (p.id || p.ID) === propertyId);
    return property ? (property.name || property.Name) : "Unknown Property";
  }, [properties]);

  const getAccommodationName = useCallback((accommodationId) => {
    if (!accommodationId) return "N/A";
    const accommodation = accommodations.find(a => (a.id || a.ID) === accommodationId);
    return accommodation ? (accommodation.room_number || accommodation["Unit/Room Number"]) : "Unknown Unit";
  }, [accommodations]);

  const getConfidentialityColor = (level) => {
    const colors = {
      public: "bg-green-500/90 text-white font-semibold",
      internal: "bg-blue-500/90 text-white font-semibold",
      confidential: "bg-yellow-500/90 text-white font-semibold",
      restricted: "bg-red-500/90 text-white font-semibold",
    };
    return colors[level] || "bg-gray-500/90 text-white font-semibold";
  };

  const getStatusColor = (status) => {
    const colors = {
      active: "bg-green-500/90 text-white font-semibold",
      expired: "bg-red-500/90 text-white font-semibold",
      claimed: "bg-yellow-500/90 text-white font-semibold",
      cancelled: "bg-red-500/90 text-white font-semibold",
      pending_renewal: "bg-yellow-500/90 text-white font-semibold",
    };
    return colors[status] || "bg-gray-500/90 text-white font-semibold";
  };

  const getConditionColor = (condition) => {
    const colors = {
      new: "bg-green-500/90 text-white font-semibold",
      good: "bg-blue-500/90 text-white font-semibold",
      fair: "bg-yellow-500/90 text-white font-semibold",
      needs_repair: "bg-orange-500/90 text-white font-semibold",
      out_of_order: "bg-red-500/90 text-white font-semibold",
    };
    return colors[condition] || "bg-gray-500/90 text-white font-semibold";
  };

  const getAllTags = () => {
    const tagsSet = new Set();
    documents.forEach(doc => {
      const docTags = doc.tags || doc.Tags || [];
      if (Array.isArray(docTags)) {
        docTags.forEach(tag => tagsSet.add(tag));
      }
    });
    return Array.from(tagsSet).sort();
  };

  const allTags = getAllTags();

  const toggleTag = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const renderForm = () => {
    if (!showForm) return null;

    switch (activeTab) {
      case "documents":
        return (
          <DocumentFormSupabase
            document={editingRecord}
            residents={residents}
            currentUser={currentUser}
            onSubmit={handleSubmit}
            onCancel={() => { setShowForm(false); setEditingRecord(null); }}
          />
        );
      case "warranties":
        return (
          <WarrantyFormSupabase
            warranty={editingRecord}
            properties={properties}
            accommodations={accommodations}
            currentUser={currentUser}
            onSubmit={handleSubmit}
            onCancel={() => { setShowForm(false); setEditingRecord(null); }}
          />
        );
      case "insurances":
        return (
          <InsuranceFormSupabase
            insurance={editingRecord}
            properties={properties}
            currentUser={currentUser}
            onSubmit={handleSubmit}
            onCancel={() => { setShowForm(false); setEditingRecord(null); }}
          />
        );
      case "appliances":
        return (
          <ApplianceFormSupabase
            appliance={editingRecord}
            properties={properties}
            accommodations={accommodations}
            warranties={warranties}
            currentUser={currentUser}
            onSubmit={handleSubmit}
            onCancel={() => { setShowForm(false); setEditingRecord(null); }}
          />
        );
      default:
        return null;
    }
  };

  const renderDetailModal = () => {
    if (!viewingRecord) return null;

    switch (activeTab) {
      case "documents":
        return (
          <DocumentDetailModal
            document={viewingRecord}
            getResidentName={getResidentName}
            getConfidentialityColor={getConfidentialityColor}
            getLoggedByName={getLoggedByName}
            onClose={() => setViewingRecord(null)}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        );
      case "warranties":
        return (
          <WarrantyDetailModal
            warranty={viewingRecord}
            getPropertyName={getPropertyName}
            getAccommodationName={getAccommodationName}
            getStatusColor={getStatusColor}
            getLoggedByName={getLoggedByName}
            onClose={() => setViewingRecord(null)}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        );
      case "insurances":
        return (
          <InsuranceDetailModal
            insurance={viewingRecord}
            getPropertyName={getPropertyName}
            getStatusColor={getStatusColor}
            onClose={() => setViewingRecord(null)}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        );
      case "appliances":
        return (
          <ApplianceDetailModal
            appliance={viewingRecord}
            getPropertyName={getPropertyName}
            getAccommodationName={getAccommodationName}
            getConditionColor={getConditionColor}
            onClose={() => setViewingRecord(null)}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        );
      default:
        return null;
    }
  };

  const getAddButtonText = () => {
    switch (activeTab) {
      case "documents": return "Add Document";
      case "warranties": return "Add Warranty";
      case "insurances": return "Add Insurance";
      case "appliances": return "Add Appliance";
      default: return "Add New";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 px-6 pt-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Documents & Assets</h1>
          <p className="text-slate-600">Manage documents, warranties, insurance policies, and appliances.</p>
          <p className="text-xs text-slate-500 mt-1">
            💾 Active records: {documents.length} docs, {warranties.length} warranties, {insurances.length} insurance, {appliances.length} appliances
          </p>
          <p className="text-xs text-slate-500">
            👤 Logged in as: <span className="font-semibold">{currentUser?.full_name || currentUser?.email || 'Unknown'}</span>
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={exportToCSV} variant="outline" className="flex items-center gap-2" disabled={loading}>
            <Download className="w-4 h-4" />
            Export to CSV
          </Button>
          <Button onClick={() => { setEditingRecord(null); setShowForm(true); setViewingRecord(null); }} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            {getAddButtonText()}
          </Button>
        </div>
      </div>

      <div className="px-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Documents ({documents.length})
            </TabsTrigger>
            <TabsTrigger value="warranties" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Warranties ({warranties.length})
            </TabsTrigger>
            <TabsTrigger value="insurances" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Insurance ({insurances.length})
            </TabsTrigger>
            <TabsTrigger value="appliances" className="flex items-center gap-2">
              <Wrench className="w-4 h-4" />
              Appliances ({appliances.length})
            </TabsTrigger>
          </TabsList>

          {renderDetailModal()}
          {renderForm()}

          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <CardTitle>Document Library</CardTitle>
                  <div className="flex w-full md:w-auto gap-4">
                    <div className="flex-1 md:flex-auto">
                      <Select value={residentFilter} onValueChange={setResidentFilter}>
                        <SelectTrigger className="w-full md:w-[200px]">
                          <SelectValue placeholder="Filter by resident..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Residents</SelectItem>
                          {residents.map(r => {
                            const id = r.id || r.ID;
                            const firstName = r.first_name || r["First Name"] || '';
                            const lastName = r.last_name || r["Last Name"] || '';
                            const status = r.status || r.Status;
                            return (
                              <SelectItem key={id} value={id}>
                                {firstName} {lastName} {status === 'moved_on' ? '(Moved On)' : ''}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="relative flex-1 md:flex-auto">
                      <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                      <Input
                        placeholder="Search documents..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-full md:w-[200px]"
                      />
                    </div>
                  </div>
                </div>

                {allTags.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <div className="flex items-center gap-2 mb-3">
                      <Tag className="w-4 h-4 text-slate-500" />
                      <span className="text-sm font-medium text-slate-700">Filter by tags:</span>
                      {selectedTags.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedTags([])}
                          className="text-xs text-blue-600 hover:text-blue-700"
                        >
                          Clear all
                        </Button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {allTags.map(tag => (
                        <Badge
                          key={tag}
                          variant={selectedTags.includes(tag) ? "default" : "outline"}
                          className="cursor-pointer hover:bg-blue-100 transition-colors"
                          onClick={() => toggleTag(tag)}
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <div className="w-full overflow-x-auto">
                  <Table className="w-full">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Related Resident</TableHead>
                        <TableHead>Tags</TableHead>
                        <TableHead>Uploaded</TableHead>
                        <TableHead>Confidentiality</TableHead>
                        <TableHead>Logged By</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow><TableCell colSpan="8" className="text-center">Loading documents...</TableCell></TableRow>
                      ) : filteredDocuments.length > 0 ? (
                        filteredDocuments.map((doc) => {
                          const docId = doc.id || doc.ID;
                          const docTitle = doc.title || doc.Title;
                          const docType = doc.document_type || doc["Document Type"];
                          const residentId = doc.resident_id || doc["Resident ID"];
                          const docTags = doc.tags || doc.Tags || [];
                          const createdDate = doc.created_date || doc["Created Date"];
                          const confidentiality = doc.confidentiality || doc.Confidentiality;
                          const fileUrl = doc.file_url || doc["File URL"];
                          
                          return (
                            <TableRow key={docId} className="hover:bg-slate-50 cursor-pointer" onClick={() => handleViewDetails(doc)}>
                              <TableCell className="font-medium flex items-center gap-2">
                                <FileText className="w-4 h-4 text-slate-500" />
                                {docTitle}
                              </TableCell>
                              <TableCell className="capitalize">{docType?.replace(/_/g, ' ')}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {residentId && <UserIcon className="w-4 h-4 text-slate-500" />}
                                  {getResidentName(residentId)}
                                </div>
                              </TableCell>
                              <TableCell>
                                {docTags && docTags.length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {docTags.slice(0, 2).map(tag => (
                                      <Badge key={tag} variant="secondary" className="text-xs">
                                        {tag}
                                      </Badge>
                                    ))}
                                    {docTags.length > 2 && (
                                      <Badge variant="secondary" className="text-xs">
                                        +{docTags.length - 2}
                                      </Badge>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-slate-400 text-sm">No tags</span>
                                )}
                              </TableCell>
                              <TableCell>{createdDate ? format(new Date(createdDate), "PP") : '-'}</TableCell>
                              <TableCell>
                                <Badge className={getConfidentialityColor(confidentiality)}>
                                  {confidentiality}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <span className="text-sm text-purple-700 font-medium">
                                  {getLoggedByName(doc)}
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button asChild variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                                  <a href={fileUrl} target="_blank" rel="noopener noreferrer" title="View Document">
                                    <ExternalLink className="w-4 h-4 text-blue-600" />
                                  </a>
                                </Button>
                                <Button variant="ghost" size="icon" onClick={(e) => {
                                  e.stopPropagation();
                                  handleEdit(doc);
                                }} title="Edit Document">
                                  <Edit className="w-4 h-4 text-slate-600" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(docId);
                                }} title="Delete Document">
                                  <Trash2 className="w-4 h-4 text-red-600" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan="8" className="text-center py-10">
                            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium">No documents found</h3>
                            <p className="text-slate-500 mb-4">
                              {selectedTags.length > 0 || searchTerm ? "Try adjusting your filters or search" : "Start by uploading your first document."}
                            </p>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="warranties">
            <Card>
              <CardHeader>
                <CardTitle>Warranties</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="w-full overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product Name</TableHead>
                        <TableHead>Brand</TableHead>
                        <TableHead>Property</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Warranty End</TableHead>
                        <TableHead>Logged By</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow><TableCell colSpan="7" className="text-center">Loading warranties...</TableCell></TableRow>
                      ) : warranties.length > 0 ? (
                        warranties.map((warranty) => {
                          const wId = warranty.id || warranty.ID;
                          const productName = warranty.product_name || warranty["Product Name"];
                          const brand = warranty.brand || warranty.Brand;
                          const propertyId = warranty.property_id || warranty["Property ID"];
                          const status = warranty.status || warranty.Status;
                          const warrantyEndDate = warranty.warranty_end_date || warranty["Warranty End Date"];
                          
                          return (
                            <TableRow key={wId} className="hover:bg-slate-50 cursor-pointer" onClick={() => handleViewDetails(warranty)}>
                              <TableCell className="font-medium">{productName}</TableCell>
                              <TableCell>{brand}</TableCell>
                              <TableCell>{getPropertyName(propertyId)}</TableCell>
                              <TableCell>
                                <Badge className={getStatusColor(status)}>{status}</Badge>
                              </TableCell>
                              <TableCell>{warrantyEndDate ? format(new Date(warrantyEndDate), "PP") : "-"}</TableCell>
                              <TableCell>
                                <span className="text-sm text-purple-700 font-medium">
                                  {getLoggedByName(warranty)}
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button variant="ghost" size="icon" onClick={(e) => {
                                  e.stopPropagation();
                                  handleEdit(warranty);
                                }}>
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(wId);
                                }}>
                                  <Trash2 className="w-4 h-4 text-red-600" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan="7" className="text-center py-10">
                            <Shield className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium">No warranties found</h3>
                            <p className="text-slate-500">Start by adding your first warranty.</p>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="insurances">
            <Card>
              <CardHeader>
                <CardTitle>Insurance Policies</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="w-full overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Policy Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Insurance Company</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Policy End</TableHead>
                        <TableHead>Logged By</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow><TableCell colSpan="7" className="text-center">Loading insurance policies...</TableCell></TableRow>
                      ) : insurances.length > 0 ? (
                        insurances.map((insurance) => {
                          const iId = insurance.id || insurance.ID;
                          const policyName = insurance.policy_name || insurance["Policy Name"];
                          const insuranceType = insurance.insurance_type || insurance["Insurance Type"];
                          const insuranceCompany = insurance.insurance_company || insurance["Insurance Company"];
                          const status = insurance.status || insurance.Status;
                          const policyEndDate = insurance.policy_end_date || insurance["Policy End Date"];
                          
                          return (
                            <TableRow key={iId} className="hover:bg-slate-50 cursor-pointer" onClick={() => handleViewDetails(insurance)}>
                              <TableCell className="font-medium">{policyName}</TableCell>
                              <TableCell className="capitalize">{insuranceType?.replace(/_/g, ' ')}</TableCell>
                              <TableCell>{insuranceCompany}</TableCell>
                              <TableCell>
                                <Badge className={getStatusColor(status)}>{status?.replace(/_/g, ' ')}</Badge>
                              </TableCell>
                              <TableCell>{policyEndDate ? format(new Date(policyEndDate), "PP") : "-"}</TableCell>
                              <TableCell>
                                <span className="text-sm text-purple-700 font-medium">
                                  {getLoggedByName(insurance)}
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button variant="ghost" size="icon" onClick={(e) => {
                                  e.stopPropagation();
                                  handleEdit(insurance);
                                }}>
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(iId);
                                }}>
                                  <Trash2 className="w-4 h-4 text-red-600" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan="7" className="text-center py-10">
                            <Shield className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium">No insurance policies found</h3>
                            <p className="text-slate-500">Start by adding your first policy.</p>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appliances">
            <Card>
              <CardHeader>
                <CardTitle>Appliances</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="w-full overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Appliance Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Brand</TableHead>
                        <TableHead>Property</TableHead>
                        <TableHead>Condition</TableHead>
                        <TableHead>Logged By</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow><TableCell colSpan="7" className="text-center">Loading appliances...</TableCell></TableRow>
                      ) : appliances.length > 0 ? (
                        appliances.map((appliance) => {
                          const aId = appliance.id || appliance.ID;
                          const applianceName = appliance.appliance_name || appliance["Appliance Name"];
                          const category = appliance.category || appliance.Category;
                          const brand = appliance.brand || appliance.Brand;
                          const propertyId = appliance.property_id || appliance["Property ID"];
                          const condition = appliance.condition || appliance.Condition;
                          
                          return (
                            <TableRow key={aId} className="hover:bg-slate-50 cursor-pointer" onClick={() => handleViewDetails(appliance)}>
                              <TableCell className="font-medium">{applianceName}</TableCell>
                              <TableCell className="capitalize">{category?.replace(/_/g, ' ')}</TableCell>
                              <TableCell>{brand || "-"}</TableCell>
                              <TableCell>{getPropertyName(propertyId)}</TableCell>
                              <TableCell>
                                <Badge className={getConditionColor(condition)}>{condition?.replace(/_/g, ' ')}</Badge>
                              </TableCell>
                              <TableCell>
                                <span className="text-sm text-purple-700 font-medium">
                                  {getLoggedByName(appliance)}
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button variant="ghost" size="icon" onClick={(e) => {
                                  e.stopPropagation();
                                  handleEdit(appliance);
                                }}>
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(aId);
                                }}>
                                  <Trash2 className="w-4 h-4 text-red-600" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan="7" className="text-center py-10">
                            <Wrench className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium">No appliances found</h3>
                            <p className="text-slate-500">Start by adding your first appliance.</p>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
