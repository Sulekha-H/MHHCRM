import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from 'date-fns';
import { Plus, Upload, Trash2, Link2, Camera, X, Save, UserPlus, Home, FileText, BedDouble, Building } from "lucide-react";
import { useClerkSupabaseClient } from "@/lib/supabaseClient";
 
const convertToDirectImageUrl = (url) => {
  if (!url) return url;
  if (url.includes('dropbox.com')) {
    return url.replace('www.dropbox.com', 'dl.dropboxusercontent.com').replace('?dl=0', '').replace('?dl=1', '');
  }
  if (url.includes('drive.google.com')) {
    let fileId = null;
    const match1 = url.match(/\/file\/d\/([^\/\?]+)/);
    if (match1) fileId = match1[1];
    const match2 = url.match(/[?&]id=([^&]+)/);
    if (match2 && !fileId) fileId = match2[1];
    if (fileId) return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
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

export default function AllocatedResidentForm({ resident, accommodations, allocatedResidents, otherResidents, onSubmit, onCancel }) {
  const [properties, setProperties] = useState([]);
  const supabase = useClerkSupabaseClient();
  const [formData, setFormData] = useState({
    "First Name": "", "Last Name": "", "Date of Birth": "", "Phone Number": "", "Email Address": "",
    "Resident Type": "Standard resident", "Accommodation Type": "Shared House", "Property Address": "",
    "Property ID": "", "Property Name": "", "Accommodation ID": "", "Unit/Room Number": "",
    "Move-in Date": "", "Move-out Date": "", "Support Worker": "", "Medical Conditions": "",
    "Status": "Active", "Notes": "", "Claim Reference Number": "", "Submission Reference": "",
    "National Insurance Number": "", "Benefits": [], "Room Transfers": [], "Accommodation Transfers": [],
    "Sign-up Documents URL": "", "Photo ID URL": "", "Future Address": "", "Future Housing Type": "",
    "Move-on Outcome": "", "Other Documents": []
  });

  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [photoPreviewError, setPhotoPreviewError] = useState(false);
  const [photoUrlInput, setPhotoUrlInput] = useState("");
  const [showGoogleDriveHelp, setShowGoogleDriveHelp] = useState(false);

  useEffect(() => {
    if (resident) {
      setFormData({
        ...resident,
        "Resident Type": resident["Resident Type"] || "Standard resident",
        "Benefits": resident["Benefits"] || [],
        "Room Transfers": resident["Room Transfers"] || [],
        "Accommodation Transfers": resident["Accommodation Transfers"] || [],
        "Other Documents": resident["Other Documents"] || []
      });
      setPhotoUrlInput(resident["Photo ID URL"] || "");
      setShowGoogleDriveHelp(resident["Photo ID URL"]?.includes('drive.google.com') || false);
    }
  }, [resident]);

  useEffect(() => {
    const loadProperties = async () => {
      if (!supabase) return;
      const { data, error } = await supabase.from('properties').select('*');
      if (!error) setProperties(data || []);
    };
    loadProperties();
  }, [supabase]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploadingFiles(true);
    try {
      let submissionData = { ...formData };
      
      const selectedProperty = properties.find(p => p.ID === formData["Property ID"]);
      if (selectedProperty) {
        submissionData["Property Address"] = selectedProperty.Address;
        submissionData["Property Name"] = selectedProperty.Name;
      }
      const selectedAccommodation = accommodations.find(a => a.ID === formData["Accommodation ID"]);
      if (selectedAccommodation) {
        submissionData["Unit/Room Number"] = selectedAccommodation["Room Number"];
        submissionData["Accommodation Type"] = selectedAccommodation["Accommodation Type"] || submissionData["Accommodation Type"];
      }

      const hasNewRoomTransfer = resident && submissionData["Room Transfers"].length > (resident["Room Transfers"] || []).length;
      if (hasNewRoomTransfer) {
        const latest = submissionData["Room Transfers"][submissionData["Room Transfers"].length - 1];
        if (latest.to_accommodation_id) {
          submissionData["Accommodation ID"] = latest.to_accommodation_id;
          submissionData["Unit/Room Number"] = latest.to_room_number;
          if (latest.transfer_date) submissionData["Move-in Date"] = latest.transfer_date;
        }
      }

      const hasNewAccTransfer = resident && submissionData["Accommodation Transfers"].length > (resident["Accommodation Transfers"] || []).length;
      if (hasNewAccTransfer) {
        const latest = submissionData["Accommodation Transfers"][submissionData["Accommodation Transfers"].length - 1];
        if (latest.to_property_id && latest.to_accommodation_id) {
          submissionData["Property ID"] = latest.to_property_id;
          submissionData["Accommodation ID"] = latest.to_accommodation_id;
          submissionData["Property Name"] = latest.to_property;
          submissionData["Unit/Room Number"] = latest.to_unit;
          if (latest.transfer_date) submissionData["Move-in Date"] = latest.transfer_date;
          const p = properties.find(prop => prop.ID === latest.to_property_id);
          if (p) submissionData["Property Address"] = p.Address;
        }
      }

      const cleanForeignKeys = (obj) => {
        if (Array.isArray(obj)) obj.forEach(item => cleanForeignKeys(item));
        else if (obj && typeof obj === 'object') {
          Object.keys(obj).forEach(key => {
            const isFK = ['Property ID', 'Accommodation ID', 'property_id', 'accommodation_id', 'from_property_id', 'to_property_id', 'from_accommodation_id', 'to_accommodation_id'].includes(key);
            if (isFK && !obj[key]) obj[key] = null;
            else if (typeof obj[key] === 'object' && obj[key] !== null) cleanForeignKeys(obj[key]);
          });
        }
      };
      cleanForeignKeys(submissionData);
      await onSubmit(submissionData);
    } catch (error) {
      alert("Error saving resident: " + error.message);
    } finally {
      setUploadingFiles(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => {
      let newState = { ...prev, [field]: value };
      if (field === 'Move-out Date') newState.Status = value ? 'Moved On' : 'Active';
      if (field === 'Status') {
        if (value === 'Active') newState['Move-out Date'] = '';
        if (value === 'Moved On' && !newState['Move-out Date']) newState['Move-out Date'] = new Date().toISOString().slice(0,10);
      }
      return newState;
    });
  };

  const updateListField = (listName, index, field, value) => {
    setFormData(prev => {
      const newList = [...prev[listName]];
      let item = { ...newList[index], [field]: value };
      if (listName === 'Room Transfers' && field === 'to_accommodation_id') {
        const acc = accommodations.find(a => a.ID === value);
        item.to_room_number = acc ? acc["Room Number"] : "";
      }
      if (listName === 'Accommodation Transfers') {
        if (field === 'to_property_id') {
          const prop = properties.find(p => p.ID === value);
          item.to_property = prop ? prop.Name : "";
          item.to_accommodation_id = "";
          item.to_unit = "";
        }
        if (field === 'to_accommodation_id') {
          const acc = accommodations.find(a => a.ID === value);
          item.to_unit = acc ? acc["Room Number"] : "";
        }
      }
      newList[index] = item;
      return { ...prev, [listName]: newList };
    });
  };

  return (
    <>
      <Card className="mb-6 shadow-md">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2"><UserPlus className="w-5 h-5 text-blue-600" />{resident ? "Edit Allocated Resident" : "Add New Allocated Resident"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label>First Name *</Label><Input value={formData["First Name"]} onChange={(e) => handleChange("First Name", e.target.value)} required /></div>
                <div><Label>Last Name *</Label><Input value={formData["Last Name"]} onChange={(e) => handleChange("Last Name", e.target.value)} required /></div>
                <div><Label>Date of Birth</Label><Input type="date" value={formData["Date of Birth"]} onChange={(e) => handleChange("Date of Birth", e.target.value)} /></div>
                <div><Label>Phone Number</Label><Input value={formData["Phone Number"]} onChange={(e) => handleChange("Phone Number", e.target.value)} /></div>
                <div><Label>Email Address</Label><Input type="email" value={formData["Email Address"]} onChange={(e) => handleChange("Email Address", e.target.value)} /></div>
                <div><Label>Resident Type *</Label><Select value={formData["Resident Type"]} onValueChange={(v) => handleChange("Resident Type", v)} required><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Standard resident">Standard Resident</SelectItem><SelectItem value="UASC placement">UASC Placement</SelectItem></SelectContent></Select></div>
                <div><Label>Claim Reference</Label><Input value={formData["Claim Reference Number"]} onChange={(e) => handleChange("Claim Reference Number", e.target.value)} /></div>
                <div><Label>Submission Reference</Label><Input value={formData["Submission Reference"]} onChange={(e) => handleChange("Submission Reference", e.target.value)} /></div>
                <div><Label>NI Number</Label><Input value={formData["National Insurance Number"]} onChange={(e) => handleChange("National Insurance Number", e.target.value)} /></div>
              </div>
            </div>

            {formData.Status === 'Moved On' && (
              <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
                <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2"><Home className="w-5 h-5" /> Move-on Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2"><Label>Future Address</Label><Textarea value={formData["Future Address"]} onChange={(e) => handleChange("Future Address", e.target.value)} className="bg-white" /></div>
                  <div><Label>Housing Type</Label><Select value={formData["Future Housing Type"]} onValueChange={(v) => handleChange("Future Housing Type", v)}><SelectTrigger className="bg-white"><SelectValue /></SelectTrigger><SelectContent>{["Private Rented", "Council Housing", "Housing Association", "Other"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
                  <div><Label>Outcome</Label><Select value={formData["Move-on Outcome"]} onValueChange={(v) => handleChange("Move-on Outcome", v)}><SelectTrigger className="bg-white"><SelectValue /></SelectTrigger><SelectContent>{["Successful Move-on", "Planned Move", "Eviction", "Other"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select></div>
                </div>
              </div>
            )}

            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Benefits</h3>
              <div className="space-y-3">
                {formData.Benefits.map((benefit, index) => (
                  <Card key={index} className="p-4 flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1"><Label>Type</Label><Select value={benefit.benefit_type} onValueChange={(v) => updateListField("Benefits", index, "benefit_type", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["Universal Credit", "Housing Benefit", "PIP", "ESA"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
                    <div className="flex-1"><Label>Amount</Label><Input type="number" value={benefit.amount} onChange={(e) => updateListField("Benefits", index, "amount", e.target.value)} /></div>
                    <div className="flex-1"><Label>Payment Day</Label><Input type="number" min="1" max="31" value={benefit.payment_day} onChange={(e) => updateListField("Benefits", index, "payment_day", e.target.value)} /></div>
                    <Button type="button" variant="destructive" size="icon" onClick={() => setFormData(prev => ({ ...prev, Benefits: prev.Benefits.filter((_, i) => i !== index) }))}><Trash2 className="w-4 h-4" /></Button>
                  </Card>
                ))}
                <Button type="button" variant="outline" onClick={() => setFormData(prev => ({ ...prev, Benefits: [...prev.Benefits, { benefit_type: "Universal Credit", amount: "", payment_day: 1 }] }))} className="w-full"><Plus className="w-4 h-4 mr-2" /> Add Benefit</Button>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Accommodation</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label>Status *</Label><Select value={formData.Status} onValueChange={(v) => handleChange("Status", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Active">Active</SelectItem><SelectItem value="Moved On">Moved On</SelectItem></SelectContent></Select></div>
                <div><Label>Move-in Date</Label><Input type="date" value={formData["Move-in Date"]} onChange={(e) => handleChange("Move-in Date", e.target.value)} /></div>
                <div className="md:col-span-2"><Label>Property Address</Label><Select value={formData["Property ID"]} onValueChange={(v) => { const p = properties.find(prop => prop.ID === v); setFormData(prev => ({ ...prev, "Property ID": v, "Property Name": p?.Name || "", "Property Address": p?.Address || "", "Accommodation ID": "", "Unit/Room Number": "" })); }}><SelectTrigger><SelectValue placeholder="Select property" /></SelectTrigger><SelectContent>{properties.map(p => <SelectItem key={p.ID} value={p.ID}>{p.Name} - {p.Address}</SelectItem>)}</SelectContent></Select></div>
                <div className="md:col-span-2"><Label>Unit/Room</Label><Select value={formData["Accommodation ID"]} onValueChange={(v) => { const a = accommodations.find(acc => acc.ID === v); setFormData(prev => ({ ...prev, "Accommodation ID": v, "Unit/Room Number": a?.["Room Number"] || "", "Accommodation Type": a?.["Accommodation Type"] || prev["Accommodation Type"] })); }} disabled={!formData["Property ID"]}><SelectTrigger><SelectValue placeholder="Select unit" /></SelectTrigger><SelectContent>{accommodations.filter(u => u["Property ID"] === formData["Property ID"]).map(u => {
                  const curCount = (allocatedResidents || []).filter(r => (r["Accommodation ID"] || r.accommodation_id) === u.ID && (r.Status || r.status || '').toLowerCase() === 'active' && (r.ID || r.id) !== (resident?.ID || resident?.id)).length + (otherResidents || []).filter(r => (r["Accommodation ID"] || r.accommodation_id) === u.ID && (r.Status || r.status || '').toLowerCase() === 'active').length;
                  const isOccupied = curCount > 0;
                  const maxOcc = u["Max Occupancy"] || 1;
                  const labelSuffix = isOccupied ? ` (Occupied: ${curCount}/${maxOcc})` : "";
                  const isFullyOccupied = curCount >= maxOcc;
                  return (<SelectItem key={u.ID} value={u.ID}>{u["Room Number"]} ({u["Accommodation Type"]}){labelSuffix}</SelectItem>);
                })}</SelectContent></Select></div>
                <div><Label>Support Worker</Label><Select value={formData["Support Worker"]} onValueChange={(v) => handleChange("Support Worker", v)}><SelectTrigger><SelectValue placeholder="Select SW" /></SelectTrigger><SelectContent><SelectItem value="none">None</SelectItem><SelectItem value="Hasib">Hasib</SelectItem></SelectContent></Select></div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Transfers</h3>
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2"><Label className="text-md font-medium">Room Transfers (Internal)</Label><Button type="button" variant="outline" size="sm" onClick={() => setFormData(prev => ({ ...prev, "Room Transfers": [...prev["Room Transfers"], { transfer_date: "", property_id: prev["Property ID"], to_accommodation_id: "", to_room_number: "", reason: "" }] }))}><Plus className="w-4 h-4 mr-2" />Add</Button></div>
                  {formData["Room Transfers"].map((t, idx) => (
                    <Card key={idx} className="p-4 mb-2 relative">
                      <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2" onClick={() => setFormData(prev => ({ ...prev, "Room Transfers": prev["Room Transfers"].filter((_, i) => i !== idx) }))}><Trash2 className="w-4 h-4" /></Button>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><Label>Date</Label><Input type="date" value={t.transfer_date} onChange={(e) => updateListField("Room Transfers", idx, "transfer_date", e.target.value)} /></div>
                        <div><Label>To Room</Label><Select value={t.to_accommodation_id} onValueChange={(v) => updateListField("Room Transfers", idx, "to_accommodation_id", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{accommodations.filter(a => a["Property ID"] === formData["Property ID"]).map(a => <SelectItem key={a.ID} value={a.ID}>{a["Room Number"]}</SelectItem>)}</SelectContent></Select></div>
                        <div className="md:col-span-2"><Label>Reason</Label><Input value={t.reason} onChange={(e) => updateListField("Room Transfers", idx, "reason", e.target.value)} /></div>
                      </div>
                    </Card>
                  ))}
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2"><Label className="text-md font-medium">Accommodation Transfers</Label><Button type="button" variant="outline" size="sm" onClick={() => setFormData(prev => ({ ...prev, "Accommodation Transfers": [...prev["Accommodation Transfers"], { transfer_date: "", to_property_id: "", to_property: "", to_accommodation_id: "", to_unit: "", reason: "" }] }))}><Plus className="w-4 h-4 mr-2" />Add</Button></div>
                  {formData["Accommodation Transfers"].map((t, idx) => (
                    <Card key={idx} className="p-4 mb-2 relative">
                      <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2" onClick={() => setFormData(prev => ({ ...prev, "Accommodation Transfers": prev["Accommodation Transfers"].filter((_, i) => i !== idx) }))}><Trash2 className="w-4 h-4" /></Button>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><Label>Date</Label><Input type="date" value={t.transfer_date} onChange={(e) => updateListField("Accommodation Transfers", idx, "transfer_date", e.target.value)} /></div>
                        <div><Label>To Property</Label><Select value={t.to_property_id} onValueChange={(v) => updateListField("Accommodation Transfers", idx, "to_property_id", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{properties.map(p => <SelectItem key={p.ID} value={p.ID}>{p.Name}</SelectItem>)}</SelectContent></Select></div>
                        <div><Label>To Unit</Label><Select value={t.to_accommodation_id} onValueChange={(v) => updateListField("Accommodation Transfers", idx, "to_accommodation_id", v)} disabled={!t.to_property_id}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{accommodations.filter(a => a["Property ID"] === t.to_property_id).map(a => <SelectItem key={a.ID} value={a.ID}>{a["Room Number"]}</SelectItem>)}</SelectContent></Select></div>
                        <div className="md:col-span-2"><Label>Reason</Label><Input value={t.reason} onChange={(e) => updateListField("Accommodation Transfers", idx, "reason", e.target.value)} /></div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Documents</h3>
              <div className="space-y-4">
                <div><Label>Medical Conditions</Label><Textarea value={formData["Medical Conditions"]} onChange={(e) => handleChange("Medical Conditions", e.target.value)} /></div>
                <div><Label>Sign-up Documents URL</Label><Input value={formData["Sign-up Documents URL"]} onChange={(e) => handleChange("Sign-up Documents URL", e.target.value)} /></div>
                <div><Label>Photo ID URL</Label><div className="flex gap-2"><Input value={photoUrlInput} onChange={(e) => { setPhotoUrlInput(e.target.value); handleChange("Photo ID URL", e.target.value); }} className="flex-1" /><Button type="button" variant="outline" onClick={() => setShowPhotoModal(true)}><Camera className="w-4 h-4 mr-2" />Preview</Button></div></div>
                <div><Label>Other Documents</Label>
                  <div className="space-y-2 mt-2">{formData["Other Documents"].map((doc, idx) => (<div key={idx} className="flex gap-2 items-center"><Input placeholder="Title" value={doc.title} onChange={(e) => updateListField("Other Documents", idx, "title", e.target.value)} className="flex-1" /><Input placeholder="URL" value={doc.url} onChange={(e) => updateListField("Other Documents", idx, "url", e.target.value)} className="flex-2" /><Button type="button" variant="destructive" size="icon" onClick={() => setFormData(prev => ({ ...prev, "Other Documents": prev["Other Documents"].filter((_, i) => i !== idx) }))}><Trash2 className="w-4 h-4" /></Button></div>))}<Button type="button" variant="outline" onClick={() => setFormData(prev => ({ ...prev, "Other Documents": [...prev["Other Documents"], { title: "", url: "" }] }))} className="w-full"><Plus className="w-4 h-4 mr-2" /> Add Document Link</Button></div>
                </div>
              </div>
            </div>
            <div><Label>Notes</Label><Textarea value={formData.Notes} onChange={(e) => handleChange("Notes", e.target.value)} className="h-32" /></div>
            <div className="flex justify-end gap-3 pt-4 border-t"><Button type="button" variant="outline" onClick={onCancel}><X className="w-4 h-4 mr-2" />Cancel</Button><Button type="submit" disabled={uploadingFiles} className="bg-blue-600">{uploadingFiles ? <Upload className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}{resident ? "Update" : "Add"}</Button></div>
          </form>
        </CardContent>
      </Card>
      {showPhotoModal && formData["Photo ID URL"] && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={() => setShowPhotoModal(false)}>
          <div className="relative max-w-2xl p-4 bg-white rounded-lg shadow-2xl" onClick={(e) => e.stopPropagation()}><button onClick={() => setShowPhotoModal(false)} className="absolute -top-12 right-0 text-white"><X className="w-8 h-8" /></button><PhotoModalContent imageUrl={convertToDirectImageUrl(formData["Photo ID URL"])} /></div>
        </div>
      )}
    </>
  );
}

function PhotoModalContent({ imageUrl }) {
  const [error, setError] = useState(false);
  useEffect(() => { setError(false); }, [imageUrl]);
  return error ? <div className="text-center p-12 text-red-500">Failed to load image</div> : <img src={imageUrl} alt="Resident Photo" className="max-w-full" onError={() => setError(true)} />;
}
