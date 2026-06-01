import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Plus, Upload, FileText, Trash2, User, Link2, Camera, XCircle, X, Save, UserPlus, Home } from "lucide-react";
import { useClerkSupabaseClient } from "@/lib/supabaseClient";

const convertToDirectImageUrl = (url) => {
  if (!url) return url;
  
  if (url.includes('dropbox.com')) {
    return url
      .replace('www.dropbox.com', 'dl.dropboxusercontent.com')
      .replace('?dl=0', '')
      .replace('?dl=1', '');
  }
  
  if (url.includes('drive.google.com')) {
    let fileId = null;
    const match1 = url.match(/\/file\/d\/([^\/\?]+)/);
    if (match1) {
      fileId = match1[1];
    }
    const match2 = url.match(/[?&]id=([^&]+)/);
    if (match2 && !fileId) {
      fileId = match2[1];
    }
    
    if (fileId) {
      return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
    }
  }
  
  return url;
};

const getDaySuffix = (day) => {
  if (!day) return '';
  const dayNum = parseInt(day);
  if (dayNum >= 11 && dayNum <= 13) return 'th';
  switch (dayNum % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
};

export default function ResidentForm_Supabase({ resident, accommodations, residents, otherResidents, onSubmit, onCancel }) {
  console.log("Accommodations prop received by ResidentForm:", accommodations); // Add this line here
  const [properties, setProperties] = useState([]);
    const supabase = useClerkSupabaseClient()
  const [formData, setFormData] = useState(resident || {
    "First Name": "",
    "Last Name": "",
    "Date of Birth": "",
    "Phone Number": "",
    "Email Address": "",
    "Resident Type": "Standard resident",
    "UASC Info Added": false,
    "Accommodation Type": "Shared House",
    "Property Address": "",
    "Property ID": "",
    "Accommodation ID": "",
    "Move-in Date": "",
    "Move-out Date": "",
    "Support Level": "Medium",
    "Support Worker": "",
    "Emergency Contact Name": "",
    "Emergency Contact Phone": "",
    "Fluent English": false,
    "Partial English": false,
    "Language Spoken": "",
    "Communication Needs": "",
    "Medical Conditions": "",
    "Status": "Active",
    "Notes": "",
    "Claim Reference Number": "",
    "Submission Reference": "",
    "National Insurance Number": "",
    "Benefits": [],
    "Room Transfers": [],
    "Accommodation Transfers": [],
    "Sign Up Google Drive Link": "",
    "Photo Of Individual (Google Drive)": "",
    "Resident Photographic ID Link (Google Drive)": "",
    "PA/Worker Name": "",
    "PA/Worker Contact": "",
    "PA/Worker Email": "",
    "PA/Worker Borough": "",
    "PA/Worker Team": "",
    "PA/Worker Duty Line": "",
    "Future Address": "",
    "Future Housing Type": "",
    "Move-on Outcome": "",
  });

  const [documentsToUpload, setDocumentsToUpload] = useState([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [photoPreviewError, setPhotoPreviewError] = useState(false);
  const [photoUrlInput, setPhotoUrlInput] = useState("");
  const [showGoogleDriveHelp, setShowGoogleDriveHelp] = useState(false);

  const getPreviewUrl = () => {
    return convertToDirectImageUrl(formData["Photo Of Individual (Google Drive)"]);
  };

  useEffect(() => {
    if (resident) {
      console.log("📝 Editing resident:", resident["First Name"], resident["Last Name"]);
      console.log("   Property ID:", resident["Property ID"]);
      console.log("   Accommodation ID:", resident["Accommodation ID"]);
      
      setFormData({
        ...resident,
        "First Name": resident["First Name"] || resident.first_name || resident.First_Name || "",
        "Last Name": resident["Last Name"] || resident.last_name || resident.Last_Name || "",
        "Date of Birth": resident["Date of Birth"] || resident.date_of_birth || resident.Date_Of_Birth || "",
        "Phone Number": resident["Phone Number"] || resident.phone_number || resident.Phone_Number || "",
        "Email Address": resident["Email Address"] || resident.email_address || resident.Email_Address || "",
        "Resident Type": resident["Resident Type"] || resident.resident_type || resident.Resident_Type || "Standard resident",
        "UASC Info Added": resident["UASC Info Added"] || false,
        "Accommodation Type": resident["Accommodation Type"] || resident.accommodation_type || resident.Accommodation_Type || "Shared House",
        "Property ID": resident["Property ID"] || resident.property_id || resident.Property_Id || "",
        "Accommodation ID": resident["Accommodation ID"] || resident.accommodation_id || resident.Accommodation_Id || "",
        "Move-in Date": resident["Move-in Date"] || resident.move_in_date || resident.Move_In_Date || "",
        "Move-out Date": resident["Move-out Date"] || resident.move_out_date || resident.Move_Out_Date || "",
        "Support Level": resident["Support Level"] || resident.support_level || resident.Support_Level || "Medium",
        "Support Worker": resident["Support Worker"] || resident.support_worker || resident.Support_Worker || "",
        "Status": resident["Status"] || resident.status || "Active",
        "Emergency Contact Name": resident["Emergency Contact Name"] || resident.emergency_contact_name || resident.Emergency_Contact_Name || "",
        "Emergency Contact Phone": resident["Emergency Contact Phone"] || resident.emergency_contact_phone || resident.Emergency_Contact_Phone || "",
        "Fluent English": resident["Fluent English"] || resident.fluent_english || resident.Fluent_English || false,
        "Partial English": resident["Partial English"] || resident.partial_english || resident.Partial_English || false,
        "Language Spoken": resident["Language Spoken"] || resident.language_spoken || resident.Language_Spoken || "",
        "Communication Needs": resident["Communication Needs"] || resident.communication_needs || resident.Communication_Needs || "",
        "PA/Worker Name": resident["PA/Worker Name"] || resident.pa_worker_name || resident.PA_Worker_Name || "",
        "PA/Worker Contact": resident["PA/Worker Contact"] || resident.pa_worker_contact || resident.PA_Worker_Contact || "",
        "PA/Worker Email": resident["PA/Worker Email"] || resident.pa_worker_email || resident.PA_Worker_Email || "",
        "Resident Photographic ID Link (Google Drive)": resident["Resident Photographic ID Link (Google Drive)"] || resident["Resident Photographic Link"] || resident.resident_photographic_link || "",
        "Sign Up Google Drive Link": resident["Sign Up Google Drive Link"] || resident["Google Drive Link"] || resident.google_drive_link || "",
        "Photo Of Individual (Google Drive)": resident["Photo Of Individual (Google Drive)"] || resident["Photo ID URL"] || resident.photo_id_url || "",
        "PA/Worker Borough": resident["PA/Worker Borough"] || resident.pa_worker_borough || resident.PA_Worker_Borough || "",
        "PA/Worker Team": resident["PA/Worker Team"] || resident.pa_worker_team || resident.PA_Worker_Team || "",
        "PA/Worker Duty Line": resident["PA/Worker Duty Line"] || resident.pa_worker_duty_line || resident.PA_Worker_Duty_Line || "",
        "Room Transfers": resident["Room Transfers"] || resident.room_transfers || [],
        "Accommodation Transfers": resident["Accommodation Transfers"] || resident.accommodation_transfers || [],
        "Future Address": resident["Future Address"] || resident.future_address || resident.Future_Address || "",
        "Future Housing Type": resident["Future Housing Type"] || resident.future_housing_type || resident.Future_Housing_Type || "",
        "Move-on Outcome": resident["Move-on Outcome"] || resident.move_on_outcome || resident.Move_On_Outcome || "",
        "Claim Reference Number": resident["Claim Reference Number"] || resident.claim_reference_number || resident.Claim_Reference_Number || "",
        "Submission Reference": resident["Submission Reference"] || resident.submission_reference || resident.Submission_Reference || "",
        "National Insurance Number": resident["National Insurance Number"] || resident.national_insurance_number || resident.National_Insurance_Number || "",
        "Benefits": resident["Benefits"] || resident.benefits || [],
        "Notes": resident["Notes"] || resident.notes || "",
      });
      setPhotoUrlInput(resident["Photo Of Individual (Google Drive)"] || resident["Photo ID URL"] || "");
      setShowGoogleDriveHelp((resident["Photo Of Individual (Google Drive)"] || resident["Photo ID URL"])?.includes('drive.google.com') || false);
    } else {
      setFormData({
        "First Name": "", "Last Name": "", "Date of Birth": "", "Phone Number": "", "Email Address": "",
        "Resident Type": "Standard resident", "UASC Info Added": false,
        "Accommodation Type": "Shared House", "Property Address": "", "Property ID": "", "Accommodation ID": "",
        "Move-in Date": "", "Move-out Date": "", "Support Level": "Medium", "Support Worker": "",
        "Emergency Contact Name": "", "Emergency Contact Phone": "",
        "Fluent English": false, "Partial English": false, "Language Spoken": "", "Communication Needs": "",
        "Medical Conditions": "",
        "Status": "Active", "Notes": "", "Claim Reference Number": "", "Submission Reference": "",
        "National Insurance Number": "", "Benefits": [], "Room Transfers": [], "Accommodation Transfers": [],
        "Sign Up Google Drive Link": "", "Photo Of Individual (Google Drive)": "", "Resident Photographic ID Link (Google Drive)": "",
        "PA/Worker Name": "", "PA/Worker Contact": "", "PA/Worker Email": "", "PA/Worker Borough": "", "PA/Worker Team": "", "PA/Worker Duty Line": "",
        "Future Address": "", "Future Housing Type": "", "Move-on Outcome": "",
      });
      setPhotoUrlInput("");
      setShowGoogleDriveHelp(false);
    }
    setPhotoPreviewError(false);
  }, [resident]);

  useEffect(() => {
    const loadInitialData = async () => {
      if (!supabase) return;
      try {
        const { data: propertiesData, error } = await supabase.from('properties').select('*');
        if (error) throw error;
        setProperties(propertiesData || []);
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };
    loadInitialData();
  }, [supabase]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log("🚀 FORM SUBMIT - Starting...");

    if (formData["Resident Type"] === "UASC placement" && !formData["UASC Info Added"]) {
      alert("Please confirm that info has been added to 'NEW PLACEMENTS- OFFICE' GC");
      return;
    }
    console.log("   Form Data Property ID:", formData["Property ID"]);
    console.log("   Form Data Accommodation ID:", formData["Accommodation ID"]);
    
    let submissionData = { ...formData };

    // Remove "UASC Info Added" from submission data as it's for frontend validation only
    // and does not exist as a column in the database.
    delete submissionData["UASC Info Added"];

    submissionData["Room Transfers"] = formData["Room Transfers"] || [];
    submissionData["Accommodation Transfers"] = formData["Accommodation Transfers"] || [];

    try {
      setUploadingFiles(true);
      
      const selectedProperty = properties.find(p => p.ID === formData["Property ID"]);
      if (selectedProperty) {
        submissionData["Property Address"] = selectedProperty.Address;
      }

      // Recursively convert empty strings to null for ALL foreign key fields
      const cleanForeignKeys = (obj) => {
        if (Array.isArray(obj)) {
          obj.forEach(item => cleanForeignKeys(item));
        } else if (obj && typeof obj === 'object') {
          Object.keys(obj).forEach(key => {
            const isForeignKey = key === 'Property ID' || key === 'Accommodation ID' || 
                                 key === 'property_id' || key === 'accommodation_id' ||
                                 key === 'from_property_id' || key === 'to_property_id' ||
                                 key === 'from_accommodation_id' || key === 'to_accommodation_id';
            
            if (isForeignKey && (obj[key] === '' || obj[key] === undefined)) {
              obj[key] = null;
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
              cleanForeignKeys(obj[key]);
            }
          });
        }
      };
      
      cleanForeignKeys(submissionData);

      const hasNewRoomTransfer = resident && 
        submissionData["Room Transfers"].length > (resident["Room Transfers"] || []).length;

      if (hasNewRoomTransfer) {
        const latestRoomTransfer = submissionData["Room Transfers"][submissionData["Room Transfers"].length - 1];
        
        if (latestRoomTransfer.to_accommodation_id) {
          submissionData["Accommodation ID"] = latestRoomTransfer.to_accommodation_id;
          
          if (latestRoomTransfer.transfer_date) {
            submissionData["Move-in Date"] = latestRoomTransfer.transfer_date;
          }
        }
      }

      const hasNewAccommodationTransfer = resident && 
        submissionData["Accommodation Transfers"].length > (resident["Accommodation Transfers"] || []).length;

      if (hasNewAccommodationTransfer) {
        const latestAccommodationTransfer = submissionData["Accommodation Transfers"][submissionData["Accommodation Transfers"].length - 1];
        
        if (latestAccommodationTransfer.to_property_id && latestAccommodationTransfer.to_accommodation_id) {
          submissionData["Property ID"] = latestAccommodationTransfer.to_property_id;
          submissionData["Accommodation ID"] = latestAccommodationTransfer.to_accommodation_id;
          
          const newProperty = properties.find(p => p.ID === latestAccommodationTransfer.to_property_id);
          if (newProperty) {
            submissionData["Property Address"] = newProperty.Address;
          }
          
          if (latestAccommodationTransfer.transfer_date) {
            submissionData["Move-in Date"] = latestAccommodationTransfer.transfer_date;
          }
        }
      }
      else if (resident && submissionData["Accommodation Transfers"].length > 0) {
        const latestAccommodationTransfer = submissionData["Accommodation Transfers"][submissionData["Accommodation Transfers"].length - 1];
        
        if (latestAccommodationTransfer.to_accommodation_id) {
          submissionData["Accommodation ID"] = latestAccommodationTransfer.to_accommodation_id;
          
          if (latestAccommodationTransfer.to_property_id) {
            submissionData["Property ID"] = latestAccommodationTransfer.to_property_id;
            
            const newProperty = properties.find(p => p.ID === latestAccommodationTransfer.to_property_id);
            if (newProperty) {
              submissionData["Property Address"] = newProperty.Address;
            }
          }
          
          if (latestAccommodationTransfer.transfer_date) {
            submissionData["Move-in Date"] = latestAccommodationTransfer.transfer_date;
          }
        }
      }
      else if (resident && submissionData["Room Transfers"].length > 0) {
        const latestRoomTransfer = submissionData["Room Transfers"][submissionData["Room Transfers"].length - 1];
        
        if (latestRoomTransfer.to_accommodation_id) {
          submissionData["Accommodation ID"] = latestRoomTransfer.to_accommodation_id;
          
          if (latestRoomTransfer.transfer_date) {
            submissionData["Move-in Date"] = latestRoomTransfer.transfer_date;
          }
        }
      }
      
      console.log("📤 SUBMITTING DATA:");
      console.log("   Property ID:", submissionData["Property ID"]);
      console.log("   Accommodation ID:", submissionData["Accommodation ID"]);
      console.log("   Full Data:", JSON.stringify(submissionData, null, 2));
      
      await onSubmit(submissionData);
      
      console.log("✅ FORM SUBMIT - Complete!");

    } catch (error) {
      console.error("❌ FORM SUBMIT - Error:", error);
      alert("Error saving resident: " + error.message);
    } finally {
      setUploadingFiles(false);
    }
  };

  const handleChange = (field, value) => {
    console.log(`🔄 Field changed: ${field} = ${value}`);
    
    setFormData(prev => {
      let newState = { ...prev, [field]: value };
      
      if (field === 'Move-out Date' && value) {
        newState.Status = 'Moved On';
      }

      if (field === 'Move-out Date' && !value) {
        newState.Status = 'Active';
      }
      
      if (field === 'Status' && value === 'Active') {
        newState['Move-out Date'] = '';
      }

      if (field === 'Status' && value === 'Moved On' && !newState['Move-out Date']) {
        newState['Move-out Date'] = new Date().toISOString().slice(0,10);
      }

      return newState;
    });
  };

  const handlePhotoUrlChange = (value) => {
    setPhotoUrlInput(value);
    handleChange("Photo Of Individual (Google Drive)", value);
    setPhotoPreviewError(false);
    setShowGoogleDriveHelp(value.includes('drive.google.com'));
  };

  const handlePropertyChange = (propertyId) => {
    console.log("🏢 Property changed to:", propertyId);
    const selectedProperty = properties.find(p => p.ID === propertyId);
    setFormData(prev => ({
        ...prev,
        "Property ID": propertyId,
        "Accommodation ID": "",
        "Property Address": selectedProperty ? selectedProperty.Address : "",
        "Room Transfers": (prev["Room Transfers"] || []).map(transfer => ({
          ...transfer,
          property_id: propertyId,
          property_name: selectedProperty?.Name || ""
        }))
    }));
  };

  const handleAccommodationChange = (accommodationId) => {
    console.log("🏠 Accommodation changed to:", accommodationId);
    setFormData(prev => ({
        ...prev,
        "Accommodation ID": accommodationId
    }));
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const newDocs = files.map(file => ({
      file: file,
      title: file.name,
      document_type: "other",
      description: ""
    }));
    setDocumentsToUpload(prev => [...prev, ...newDocs]);
  };

  const updateDocumentField = (index, field, value) => {
    setDocumentsToUpload(prev => 
      prev.map((doc, i) => i === index ? { ...doc, [field]: value } : doc)
    );
  };

  const removeDocument = (index) => {
    setDocumentsToUpload(prev => prev.filter((_, i) => i !== index));
  };

  const addBenefit = () => {
    setFormData(prev => ({
      ...prev,
      "Benefits": [...(prev["Benefits"] || []), { benefit_type: "Universal Credit", amount: "", payment_day: 1 }]
    }));
  };

  const removeBenefit = (index) => {
    setFormData(prev => ({
      ...prev,
      "Benefits": (prev["Benefits"] || []).filter((_, i) => i !== index)
    }));
  };

  const updateBenefit = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      "Benefits": (prev["Benefits"] || []).map((benefit, i) => 
        i === index ? { ...benefit, [field]: value } : benefit
      )
    }));
  };

  const addRoomTransfer = () => {
    setFormData(prev => ({
      ...prev,
      "Room Transfers": [...(prev["Room Transfers"] || []), { 
        transfer_date: "", 
        property_id: prev["Property ID"] || "",
        from_accommodation_id: "", 
        to_accommodation_id: "",
        from_room_number: "", 
        to_room_number: "", 
        property_name: properties.find(p => p.ID === prev["Property ID"])?.Name || "",
        reason: "", 
        notes: "" 
      }]
    }));
  };

  const removeRoomTransfer = (index) => {
    setFormData(prev => ({
      ...prev,
      "Room Transfers": (prev["Room Transfers"] || []).filter((_, i) => i !== index)
    }));
  };

  const updateRoomTransfer = (index, field, value) => {
    setFormData(prev => {
      const newTransfers = [...(prev["Room Transfers"] || [])];
      const transfer = { ...newTransfers[index], [field]: value };
      
      if (field === 'from_accommodation_id') {
        const selectedAccommodation = accommodations.find(a => a.ID === value);
        transfer.from_room_number = selectedAccommodation?.["Room Number"] || '';
      }
      if (field === 'to_accommodation_id') {
        const selectedAccommodation = accommodations.find(a => a.ID === value);
        transfer.to_room_number = selectedAccommodation?.["Room Number"] || '';
      }
      
      newTransfers[index] = transfer;
      return { ...prev, "Room Transfers": newTransfers };
    });
  };

  const addAccommodationTransfer = () => {
    setFormData(prev => ({
      ...prev,
      "Accommodation Transfers": [...(prev["Accommodation Transfers"] || []), { 
        move_in_date: "",
        move_out_date: "",
        transfer_date: "", 
        from_property_id: "",
        from_accommodation_id: "",
        to_property_id: "",
        to_accommodation_id: "",
        from_property: "", 
        from_unit: "", 
        to_property: "", 
        to_unit: "",
        reason: "", 
        notes: "" 
      }]
    }));
  };

  const removeAccommodationTransfer = (index) => {
    setFormData(prev => ({
      ...prev,
      "Accommodation Transfers": (prev["Accommodation Transfers"] || []).filter((_, i) => i !== index)
    }));
  };

  const updateAccommodationTransfer = (index, field, value) => {
    setFormData(prev => {
      const newTransfers = [...(prev["Accommodation Transfers"] || [])];
      const transfer = { ...newTransfers[index], [field]: value };
      
      if (field === 'from_property_id') {
        const selectedProperty = properties.find(p => p.ID === value);
        transfer.from_property = selectedProperty?.Name || '';
        transfer.from_accommodation_id = '';
        transfer.from_unit = '';
      }
      if (field === 'to_property_id') {
        const selectedProperty = properties.find(p => p.ID === value);
        transfer.to_property = selectedProperty?.Name || '';
        transfer.to_accommodation_id = '';
        transfer.to_unit = '';
      }
      
      if (field === 'from_accommodation_id') {
        const selectedAccommodation = accommodations.find(a => a.ID === value);
        transfer.from_unit = selectedAccommodation?.["Room Number"] || '';
      }
      if (field === 'to_accommodation_id') {
        const selectedAccommodation = accommodations.find(a => a.ID === value);
        transfer.to_unit = selectedAccommodation?.["Room Number"] || '';
      }
      
      newTransfers[index] = transfer;
      return { ...prev, "Accommodation Transfers": newTransfers };
    });
  };

  return (
    <>
      <Card className="mb-6 shadow-md">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-blue-600" />
            {resident ? "Edit Resident" : "Add New Resident"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name" className="mb-2 block">First Name *</Label>
                  <Input
                    id="first_name"
                    value={formData["First Name"]}
                    onChange={(e) => handleChange("First Name", e.target.value)}
                    placeholder="e.g., John"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="last_name" className="mb-2 block">Last Name *</Label>
                  <Input
                    id="last_name"
                    value={formData["Last Name"]}
                    onChange={(e) => handleChange("Last Name", e.target.value)}
                    placeholder="e.g., Doe"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="date_of_birth" className="mb-2 block">Date of Birth</Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    value={formData["Date of Birth"]}
                    onChange={(e) => handleChange("Date of Birth", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="phone_number" className="mb-2 block">Phone Number</Label>
                  <Input
                    id="phone_number"
                    value={formData["Phone Number"]}
                    onChange={(e) => handleChange("Phone Number", e.target.value)}
                    placeholder="e.g., 07123456789"
                  />
                </div>
                <div>
                  <Label htmlFor="email_address" className="mb-2 block">Email Address</Label>
                  <Input
                    id="email_address"
                    type="email"
                    value={formData["Email Address"]}
                    onChange={(e) => handleChange("Email Address", e.target.value)}
                    placeholder="e.g., resident@example.com"
                  />
                </div>
                          {/* --- INSERT RESIDENT TYPE DROPDOWN HERE --- */}
                <div>
                  <Label htmlFor="resident_type" className="mb-2 block">Resident Type *</Label>
                  <Select
                    value={formData["Resident Type"]}
                    onValueChange={(value) => handleChange("Resident Type", value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select resident type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Standard resident">Standard Resident</SelectItem>
                      <SelectItem value="UASC placement">UASC Placement</SelectItem>
                    </SelectContent>
                  </Select>

                  {formData["Resident Type"] === "UASC placement" && (
                    <div className="flex items-center space-x-2 mt-3 p-2 border border-red-200 bg-red-50 rounded-md">
                      <input
                        type="checkbox"
                        id="uasc_info_added"
                        checked={formData["UASC Info Added"]}
                        onChange={(e) => handleChange("UASC Info Added", e.target.checked)}
                        className="w-4 h-4 accent-red-600"
                      />
                      <Label
                        htmlFor="uasc_info_added"
                        className="text-red-600 font-bold text-xs uppercase leading-tight cursor-pointer"
                      >
                        info added to "NEW PLACEMENTS- OFFICE" GC *
                      </Label>
                    </div>
                  )}
                </div>
                {/* --- END RESIDENT TYPE DROPDOWN --- */}
                <div>
                  <Label 
                    htmlFor="claim_reference_number"
                    className={`mb-2 block ${!formData["Claim Reference Number"] ? 'text-red-600' : ''}`}
                  >
                    Claim Reference Number
                  </Label>
                  <Input
                    id="claim_reference_number"
                    value={formData["Claim Reference Number"]}
                    onChange={(e) => handleChange("Claim Reference Number", e.target.value)}
                    placeholder="e.g., AB123456C"
                  />
                </div>
                <div>
                  <Label htmlFor="submission_reference" className="mb-2 block">Submission Reference</Label>
                  <Input
                    id="submission_reference"
                    value={formData["Submission Reference"]}
                    onChange={(e) => handleChange("Submission Reference", e.target.value)}
                    placeholder="e.g., SUB123456"
                  />
                </div>
                <div>
                  <Label htmlFor="national_insurance_number" className="mb-2 block">National Insurance Number</Label>
                  <Input
                    id="national_insurance_number"
                    value={formData["National Insurance Number"]}
                    onChange={(e) => handleChange("National Insurance Number", e.target.value)}
                    placeholder="e.g., QQ123456C"
                  />
                </div>
              </div>
            </div>

            {formData.Status === 'Moved On' && (
              <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
                <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
                  <Home className="w-5 h-5" />
                  Move-on Details (Future Housing)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="future_address" className="mb-2 block">Future Address</Label>
                    <Textarea
                      id="future_address"
                      value={formData["Future Address"]}
                      onChange={(e) => handleChange("Future Address", e.target.value)}
                      placeholder="Enter the resident's new address outside of My Hope Housing properties"
                      className="h-20 bg-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="future_housing_type" className="mb-2 block">Future Housing Type</Label>
                    <Select
                      value={formData["Future Housing Type"]}
                      onValueChange={(value) => handleChange("Future Housing Type", value)}
                    >
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Select housing type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Private Rented">Private Rented</SelectItem>
                        <SelectItem value="Council Housing">Council Housing</SelectItem>
                        <SelectItem value="Housing Association">Housing Association</SelectItem>
                        <SelectItem value="Supported Housing (Other)">Supported Housing (Other)</SelectItem>
                        <SelectItem value="Returning to Family">Returning to Family</SelectItem>
                        <SelectItem value="Home Ownership">Home Ownership</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="move_on_outcome" className="mb-2 block">Move-on Outcome</Label>
                    <Select
                      value={formData["Move-on Outcome"]}
                      onValueChange={(value) => handleChange("Move-on Outcome", value)}
                    >
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Select outcome" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Successful Move-on">Successful Move-on</SelectItem>
                        <SelectItem value="Planned Move">Planned Move</SelectItem>
                        <SelectItem value="Eviction">Eviction</SelectItem>
                        <SelectItem value="Abandonment">Abandonment</SelectItem>
                        <SelectItem value="Hospital/Care">Hospital/Care</SelectItem>
                        <SelectItem value="Prison">Prison</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Benefits Information</h3>
              <div className="space-y-3">
                {(formData["Benefits"] || []).map((benefit, index) => (
                  <Card key={index} className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                      <div>
                        <Label htmlFor={`benefit_type_${index}`} className="mb-2 block">Benefit Type</Label>
                        <Select
                          value={benefit.benefit_type}
                          onValueChange={(value) => updateBenefit(index, "benefit_type", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Universal Credit">Universal Credit</SelectItem>
                            <SelectItem value="Housing Benefit">Housing Benefit</SelectItem>
                            <SelectItem value="Personal Independence Payment (PIP)">PIP</SelectItem>
                            <SelectItem value="Employment and Support Allowance (ESA)">ESA</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor={`amount_${index}`} className="mb-2 block">Amount (£)</Label>
                        <Input
                          id={`amount_${index}`}
                          type="number"
                          value={benefit.amount}
                          onChange={(e) => updateBenefit(index, "amount", parseFloat(e.target.value) || "")}
                          placeholder="e.g., 316.00"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`payment_day_${index}`} className="mb-2 block">Payment Day</Label>
                        <div className="flex gap-2 items-center">
                          <div className="relative flex-1">
                            <Input
                              id={`payment_day_${index}`}
                              type="number"
                              min="1"
                              max="31"
                              value={benefit.payment_day}
                              onChange={(e) => updateBenefit(index, "payment_day", parseInt(e.target.value) || 1)}
                              className="pr-12"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500 pointer-events-none">
                              {benefit.payment_day}{getDaySuffix(benefit.payment_day)}
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            onClick={() => removeBenefit(index)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={addBenefit}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Benefit
                </Button>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Accommodation & Support</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="accommodation_type" className="mb-2 block">Accommodation Type *</Label>
                  <Select value={formData["Accommodation Type"]} onValueChange={(value) => handleChange("Accommodation Type", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Shared House">Shared House</SelectItem>
                      <SelectItem value="Studio Flat">Studio Flat</SelectItem>
                      <SelectItem value="Bedsit">Bedsit</SelectItem>
                      <SelectItem value="Supported Flat">Supported Flat</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="status" className="mb-2 block">Status *</Label>
                  <Select value={formData.Status} onValueChange={(value) => handleChange("Status", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Moved On">Moved On</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="move_in_date" className="mb-2 block">Move-in Date</Label>
                  <Input
                    id="move_in_date"
                    type="date"
                    value={formData["Move-in Date"]}
                    onChange={(e) => handleChange("Move-in Date", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="move_out_date" className="mb-2 block">Move-out Date</Label>
                  <Input
                    id="move_out_date"
                    type="date"
                    value={formData["Move-out Date"]}
                    onChange={(e) => handleChange("Move-out Date", e.target.value)}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="property_id" className="mb-2 block">Property Address</Label>
                  <Select value={formData["Property ID"]} onValueChange={handlePropertyChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select property address" />
                    </SelectTrigger>
                    <SelectContent>
                      {properties.map((property) => (
                        <SelectItem key={property.ID} value={property.ID}>
                          {property.Name} - {property.Address}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="accommodation_id" className="mb-2 block">Accommodation Unit/Room</Label>
                  <Select
                      value={formData["Accommodation ID"]}
                      onValueChange={handleAccommodationChange}
                      disabled={!formData["Property ID"]}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={!formData["Property ID"] ? "Select a property first" : "Select unit/room"} />
                    </SelectTrigger>
                    <SelectContent>
                      {accommodations
                          .filter(unit => unit["Property ID"] === formData["Property ID"])
                          .map(unit => {
                            const currentResidentsCount = (residents || []).filter(r =>
                              (r["Accommodation ID"] || r.accommodation_id) === unit.ID &&
                              (r.Status || r.status || '').toLowerCase() === 'active' &&
                              r.ID !== resident?.ID
                            ).length + (otherResidents || []).filter(r =>
                              (r["Accommodation ID"] || r.accommodation_id) === unit.ID &&
                              (r.Status || r.status || '').toLowerCase() === 'active'
                            ).length;

                            const isOccupied = currentResidentsCount > 0;
                            const maxOcc = unit["Max Occupancy"] || 1;
                            const labelSuffix = isOccupied ? ` (Occupied: ${currentResidentsCount}/${maxOcc})` : "";
                            const isFullyOccupied = currentResidentsCount >= maxOcc;

                            return (
                              <SelectItem key={unit.ID} value={unit.ID}>
                                {unit["Room Number"]} ({unit["Accommodation Type"]}){labelSuffix}
                              </SelectItem>
                            );
                          })}
                    </SelectContent>
                  </Select>
                  {formData["Accommodation ID"] && (
                    <p className="text-xs text-slate-500 mt-1">
                      Selected: {accommodations.find(a => a.ID === formData["Accommodation ID"])?.["Room Number"] || "N/A"}
                    </p>
                  )}
                  {formData["Property ID"] && accommodations.filter(unit => unit["Property ID"] === formData["Property ID"]).length === 0 && (
                    <p className="text-xs text-amber-600 mt-1">
                      ⚠️ No rooms found in this property.
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6"> 
                <div>
                  <Label htmlFor="support_level" className="mb-2 block">Support Level</Label>
                  <Select value={formData["Support Level"]} onValueChange={(value) => handleChange("Support Level", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Intensive">Intensive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="support_worker" className="mb-2 block">Support Worker</Label>
                  <Select value={formData["Support Worker"]} onValueChange={(value) => handleChange("Support Worker", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select support worker" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No support worker assigned</SelectItem>
                      <SelectItem value="Hasib">Hasib</SelectItem>
                      <SelectItem value="Jessica">Jessica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900">Room Transfers (Within Same Property)</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addRoomTransfer}
                  className="flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Add Room Transfer
                </Button>
              </div>

              <div className="space-y-3">
                {(formData["Room Transfers"] || []).map((transfer, index) => {
                  const fromAccommodation = accommodations.find(a => a.ID === transfer.from_accommodation_id);
                  const toAccommodation = accommodations.find(a => a.ID === transfer.to_accommodation_id);
                  const transferProperty = properties.find(p => p.ID === transfer.property_id);

                  return (
                    <Card key={index} className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-semibold text-sm">Transfer #{index + 1}</h4>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => removeRoomTransfer(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="mb-2 block">Transfer Date</Label>
                          <Input
                            type="date"
                            value={transfer.transfer_date}
                            onChange={(e) => updateRoomTransfer(index, "transfer_date", e.target.value)}
                          />
                        </div>

                        <div>
                          <Label className="mb-2 block">Property</Label>
                          <Input
                            value={transferProperty?.Name || ""}
                            disabled
                            className="bg-slate-50"
                          />
                        </div>

                        <div>
                          <Label className="mb-2 block">From Room</Label>
                          <Select
                            value={transfer.from_accommodation_id}
                            onValueChange={(value) => updateRoomTransfer(index, "from_accommodation_id", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select room" />
                            </SelectTrigger>
                            <SelectContent>
                              {accommodations
                                .filter(a => a["Property ID"] === transfer.property_id)
                                .map(acc => (
                                  <SelectItem key={acc.ID} value={acc.ID}>
                                    {acc["Room Number"]}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="mb-2 block">To Room</Label>
                          <Select
                            value={transfer.to_accommodation_id}
                            onValueChange={(value) => updateRoomTransfer(index, "to_accommodation_id", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select room" />
                            </SelectTrigger>
                            <SelectContent>
                              {accommodations
                                .filter(a => a["Property ID"] === transfer.property_id)
                                .map(acc => (
                                  <SelectItem key={acc.ID} value={acc.ID}>
                                    {acc["Room Number"]}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="md:col-span-2">
                          <Label className="mb-2 block">Reason</Label>
                          <Textarea
                            value={transfer.reason}
                            onChange={(e) => updateRoomTransfer(index, "reason", e.target.value)}
                            placeholder="Reason for transfer..."
                          />
                        </div>

                        <div className="md:col-span-2">
                          <Label className="mb-2 block">Notes</Label>
                          <Textarea
                            value={transfer.notes}
                            onChange={(e) => updateRoomTransfer(index, "notes", e.target.value)}
                            placeholder="Additional notes..."
                          />
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900">Accommodation Transfers (Between Properties)</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addAccommodationTransfer}
                  className="flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Add Accommodation Transfer
                </Button>
              </div>

              <div className="space-y-3">
                {(formData["Accommodation Transfers"] || []).map((transfer, index) => {
                  const fromProperty = properties.find(p => p.ID === transfer.from_property_id);
                  const toProperty = properties.find(p => p.ID === transfer.to_property_id);
                  const fromAccommodation = accommodations.find(a => a.ID === transfer.from_accommodation_id);
                  const toAccommodation = accommodations.find(a => a.ID === transfer.to_accommodation_id);

                  return (
                    <Card key={index} className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-semibold text-sm">Transfer #{index + 1}</h4>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => removeAccommodationTransfer(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="mb-2 block">Initial Move-in Date</Label>
                          <Input
                            type="date"
                            value={transfer.move_in_date}
                            onChange={(e) => updateAccommodationTransfer(index, "move_in_date", e.target.value)}
                          />
                          <p className="text-xs text-slate-500 mt-1">When they first moved into the FROM property</p>
                        </div>

                        <div>
                          <Label className="mb-2 block">Move-out Date</Label>
                          <Input
                            type="date"
                            value={transfer.move_out_date}
                            onChange={(e) => updateAccommodationTransfer(index, "move_out_date", e.target.value)}
                          />
                          <p className="text-xs text-slate-500 mt-1">When they moved out of the FROM property</p>
                        </div>

                        <div className="md:col-span-2">
                          <Label className="mb-2 block">Transfer Date (Move into new property)</Label>
                          <Input
                            type="date"
                            value={transfer.transfer_date}
                            onChange={(e) => updateAccommodationTransfer(index, "transfer_date", e.target.value)}
                          />
                          <p className="text-xs text-slate-500 mt-1">When they moved into the TO property</p>
                        </div>

                        <div>
                          <Label className="mb-2 block">From Property</Label>
                          <Select
                            value={transfer.from_property_id}
                            onValueChange={(value) => updateAccommodationTransfer(index, "from_property_id", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select property" />
                            </SelectTrigger>
                            <SelectContent>
                              {properties.map(prop => (
                                <SelectItem key={prop.ID} value={prop.ID}>
                                  {prop.Name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="mb-2 block">From Unit/Room</Label>
                          <Select
                            value={transfer.from_accommodation_id}
                            onValueChange={(value) => updateAccommodationTransfer(index, "from_accommodation_id", value)}
                            disabled={!transfer.from_property_id}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select property first" />
                            </SelectTrigger>
                            <SelectContent>
                              {accommodations
                                .filter(a => a["Property ID"] === transfer.from_property_id)
                                .map(acc => (
                                  <SelectItem key={acc.ID} value={acc.ID}>
                                    {acc["Room Number"]}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="mb-2 block">To Property</Label>
                          <Select
                            value={transfer.to_property_id}
                            onValueChange={(value) => updateAccommodationTransfer(index, "to_property_id", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select property" />
                            </SelectTrigger>
                            <SelectContent>
                              {properties.map(prop => (
                                <SelectItem key={prop.ID} value={prop.ID}>
                                  {prop.Name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="mb-2 block">To Unit/Room</Label>
                          <Select
                            value={transfer.to_accommodation_id}
                            onValueChange={(value) => updateAccommodationTransfer(index, "to_accommodation_id", value)}
                            disabled={!transfer.to_property_id}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select property first" />
                            </SelectTrigger>
                            <SelectContent>
                              {accommodations
                                .filter(a => a["Property ID"] === transfer.to_property_id)
                                .map(acc => (
                                  <SelectItem key={acc.ID} value={acc.ID}>
                                    {acc["Room Number"]}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="md:col-span-2">
                          <Label className="mb-2 block">Reason</Label>
                          <Textarea
                            value={transfer.reason}
                            onChange={(e) => updateAccommodationTransfer(index, "reason", e.target.value)}
                            placeholder="Reason for accommodation transfer"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <Label className="mb-2 block">Notes</Label>
                          <Textarea
                            value={transfer.notes}
                            onChange={(e) => updateAccommodationTransfer(index, "notes", e.target.value)}
                            placeholder="Additional notes..."
                          />
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Emergency Contact</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="emergency_contact_name" className="mb-2 block">Emergency Contact Name</Label>
                  <Input
                    id="emergency_contact_name"
                    value={formData["Emergency Contact Name"]}
                    onChange={(e) => handleChange("Emergency Contact Name", e.target.value)}
                    placeholder="e.g., Jane Doe"
                  />
                </div>
                <div>
                  <Label htmlFor="emergency_contact_phone" className="mb-2 block">Emergency Contact Phone</Label>
                  <Input
                    id="emergency_contact_phone"
                    value={formData["Emergency Contact Phone"]}
                    onChange={(e) => handleChange("Emergency Contact Phone", e.target.value)}
                    placeholder="e.g., 07987654321"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Communication & Health</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="fluent_english"
                    checked={formData["Fluent English"]}
                    onChange={(e) => handleChange("Fluent English", e.target.checked)}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="fluent_english">Fluent in English</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="partial_english"
                    checked={formData["Partial English"]}
                    onChange={(e) => handleChange("Partial English", e.target.checked)}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="partial_english">Partial English</Label>
                </div>
                <div>
                  <Label htmlFor="language_spoken" className="mb-2 block">Language Spoken</Label>
                  <Input
                    id="language_spoken"
                    value={formData["Language Spoken"]}
                    onChange={(e) => handleChange("Language Spoken", e.target.value)}
                    placeholder="e.g., Arabic, French"
                  />
                </div>
                <div>
                  <Label htmlFor="communication_needs" className="mb-2 block">Communication Needs</Label>
                  <Input
                    id="communication_needs"
                    value={formData["Communication Needs"]}
                    onChange={(e) => handleChange("Communication Needs", e.target.value)}
                    placeholder="e.g., Requires interpreter"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="medical_conditions" className="mb-2 block">Medical Conditions / Special Needs</Label>
                  <Textarea
                    id="medical_conditions"
                    value={formData["Medical Conditions"]}
                    onChange={(e) => handleChange("Medical Conditions", e.target.value)}
                    placeholder="Any medical conditions or special needs..."
                    className="h-24"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Documents & Links</h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="sign_up_google_drive_link" className="flex items-center gap-2 mb-2">
                    <Link2 className="w-4 h-4" />
                    Sign Up Google Drive Link
                  </Label>
                  <Input
                    id="sign_up_google_drive_link"
                    value={formData["Sign Up Google Drive Link"]}
                    onChange={(e) => handleChange("Sign Up Google Drive Link", e.target.value)}
                    placeholder="https://drive.google.com/..."
                  />
                </div>
                <div>
                  <Label htmlFor="photo_of_individual" className="flex items-center gap-2 mb-2">
                    <Camera className="w-4 h-4" />
                    Photo Of Individual (Google Drive)
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="photo_of_individual"
                      value={photoUrlInput}
                      onChange={(e) => handlePhotoUrlChange(e.target.value)}
                      placeholder="https://drive.google.com/file/d/..."
                      className="flex-1"
                    />
                    {formData["Photo Of Individual (Google Drive)"] && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowPhotoModal(true)}
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        Preview
                      </Button>
                    )}
                  </div>
                  {showGoogleDriveHelp && (
                    <p className="text-xs text-amber-600 mt-1">
                      ⚠️ Make sure the Google Drive file is set to "Anyone with the link can view"
                    </p>
                  )}
                  {formData["Photo Of Individual (Google Drive)"] && !photoPreviewError && (
                    <div className="mt-2">
                      <img
                        src={getPreviewUrl()}
                        alt="Photo ID Preview"
                        className="w-32 h-32 object-cover rounded border"
                        onError={() => setPhotoPreviewError(true)}
                      />
                    </div>
                  )}
                  {photoPreviewError && formData["Photo Of Individual (Google Drive)"] && (
                    <p className="text-xs text-red-600 mt-1">
                      Unable to load preview. The link may not be publicly accessible or may not be a direct image link.
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="resident_photographic_id_link" className="flex items-center gap-2 mb-2">
                    <Link2 className="w-4 h-4" />
                    Resident Photographic ID Link (Google Drive)
                  </Label>
                  <Input
                    id="resident_photographic_id_link"
                    value={formData["Resident Photographic ID Link (Google Drive)"] || ""}
                    onChange={(e) => handleChange("Resident Photographic ID Link (Google Drive)", e.target.value)}
                    placeholder="https://drive.google.com/..."
                  />
                </div>
                
                <div>
                  <h4 className="font-medium text-slate-900 mb-3">Other Documents</h4>
                  <div>
                    <Label htmlFor="other_documents" className="mb-2 block">Upload Additional Documents</Label>
                    <Input
                      id="other_documents"
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      multiple
                      className="cursor-pointer"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Accepted formats: PDF, DOC, DOCX, JPG, PNG
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Additional Information</h3>
              <div>
                <Label htmlFor="notes" className="mb-2 block">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.Notes}
                  onChange={(e) => handleChange("Notes", e.target.value)}
                  placeholder="Any additional notes about the resident..."
                  className="h-32"
                />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Children's Services / Personal Adviser</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="pa_worker_name" className="mb-2 block">PA/Worker Name</Label>
                  <Input
                    id="pa_worker_name"
                    value={formData["PA/Worker Name"]}
                    onChange={(e) => handleChange("PA/Worker Name", e.target.value)}
                    placeholder="e.g., Sarah Smith"
                  />
                </div>
                <div>
                  <Label htmlFor="pa_worker_contact" className="mb-2 block">PA/Worker Contact</Label>
                  <Input
                    id="pa_worker_contact"
                    value={formData["PA/Worker Contact"]}
                    onChange={(e) => handleChange("PA/Worker Contact", e.target.value)}
                    placeholder="e.g., 07123456789"
                  />
                </div>
                <div>
                  <Label htmlFor="pa_worker_email" className="mb-2 block">PA/Worker Email</Label>
                  <Input
                    id="pa_worker_email"
                    type="email"
                    value={formData["PA/Worker Email"]}
                    onChange={(e) => handleChange("PA/Worker Email", e.target.value)}
                    placeholder="e.g., sarah.smith@council.gov.uk"
                  />
                </div>
                <div>
                  <Label htmlFor="pa_worker_borough" className="mb-2 block">PA/Worker Borough</Label>
                  <Input
                    id="pa_worker_borough"
                    value={formData["PA/Worker Borough"]}
                    onChange={(e) => handleChange("PA/Worker Borough", e.target.value)}
                    placeholder="e.g., Birmingham"
                  />
                </div>
                <div>
                  <Label htmlFor="pa_worker_team" className="mb-2 block">PA/Worker Team</Label>
                  <Input
                    id="pa_worker_team"
                    value={formData["PA/Worker Team"]}
                    onChange={(e) => handleChange("PA/Worker Team", e.target.value)}
                    placeholder="e.g., Leaving Care Team"
                  />
                </div>
                <div>
                  <Label htmlFor="pa_worker_duty_line" className="mb-2 block">PA/Worker Duty Line</Label>
                  <Input
                    id="pa_worker_duty_line"
                    value={formData["PA/Worker Duty Line"]}
                    onChange={(e) => handleChange("PA/Worker Duty Line", e.target.value)}
                    placeholder="e.g., 0121 123 4567"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={uploadingFiles}
                className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
              >
                {uploadingFiles ? (
                  <>
                    <Upload className="w-4 h-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {resident ? "Update Resident" : "Add Resident"}
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {showPhotoModal && formData["Photo Of Individual (Google Drive)"] && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={() => setShowPhotoModal(false)}>
          <div className="relative max-w-2xl max-h-[90vh] p-4 bg-white rounded-lg shadow-2xl overflow-auto" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowPhotoModal(false)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
            >
              <X className="w-8 h-8" />
            </button>
            <PhotoModalContent imageUrl={getPreviewUrl()} />
          </div>
        </div>
      )}
    </>
  );
}

function PhotoModalContent({ imageUrl }) {
  const [error, setError] = useState(false);

  useEffect(() => {
    setError(false);
  }, [imageUrl]);

  return (
    <>
      {error ? (
        <div className="text-center p-12">
          <p className="text-lg text-red-500 mb-2">Failed to load image</p>
          <p className="text-sm text-slate-600">The URL may not be a direct image link or is inaccessible.</p>
        </div>
      ) : (
        <img
          src={imageUrl}
          alt="Enlarged Resident Photo"
          className="block w-auto h-auto max-w-full"
          onError={() => setError(true)}
        />
      )}
    </>
  );
}
