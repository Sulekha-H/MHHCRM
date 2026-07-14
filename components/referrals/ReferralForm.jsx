"use client"

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Save, ClipboardPlus, Plus, ChevronDown, ChevronUp, Trash2 } from "lucide-react";

// The 38 support needs listed on Page 6 of the form
const SUPPORT_NEEDS_LIST = [
  "Tenancy failure or losing short term accommodation",
  "Becoming homeless / evicted (within 28 Days)",
  "Ongoing issues with drug and alcohol",
  "Ability to manage ongoing health problems",
  "Access to local services Rough Sleeping",
  "Access to health services",
  "Improved quality of life",
  "Build an alternative support network",
  "Skills to eat healthily",
  "Access voluntary services",
  "Ability to manage personal hygiene",
  "Risk of domestic abuse",
  "Increase social and community networks",
  "Frequent presentation to accident and emergency",
  "Unplanned hospital admissions",
  "Reduce social isolation",
  "Accessing drug and alcohol services",
  "Obtaining or maintaining a suitable home",
  "Getting involved in activities",
  "Increased feelings of being less reliant",
  "Gaining and / or maintaining employment and / or education and training",
  "Risk of long-term worklessness",
  "Deteriorating financial position",
  "Developing household skills",
  "Help to find other help",
  "Feeling more involved",
  "Risk of offending",
  "Risk of harm from others",
  "Risk of self-harm",
  "Reducing feelings of isolation",
  "Ongoing health issues",
  "Ability to be keep home safe & secure",
  "Developing problem solving skills",
  "Ability to manage a healthy lifestyle",
  "Developing personal competence",
  "Developing self esteem",
  "Increased feelings of being more independent",
  "Ability to manage health & wellbeing",
  "Ability to manage £ better",
  "Developing interpersonal skills",
  "Increased knowledge",
  "Increased confidence"
];

export default function ReferralForm({ referral, users, currentUser, onSubmit, onCancel, activeReferralType }) {
  const getInitialDateTime = () => {
    if (referral?.Referral_Date || referral?.referral_date) {
      const date = referral.Referral_Date || referral.referral_date;
      return date.slice(0, 16);
    }
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const [referralType, setReferralType] = useState(
    referral?.Referral_Type || referral?.referral_type || activeReferralType || 'organisation'
  );

  // Common core fields
  const [coreData, setCoreData] = useState(() => {
    const defaultCore = {
      referral_date: getInitialDateTime(),
      referred_by_agency: "",
      referral_from_url: "",
      applicant_name: "",
      applicant_dob: "",
      referral_reason: "",
      status: "received",
      priority: "medium",
      assigned_to_user_id: "",
      assessment_date: "",
      decision_date: "",
      decision_reason: "",
      accommodation_type_needed: "single_room",
      notes: "",
      logged_by: referral?.Logged_By || referral?.logged_by || (currentUser?.full_name || "")
    };
    if (referral) {
      return {
        ...defaultCore,
        referral_date: getInitialDateTime(),
        referred_by_agency: referral.Referred_By_Agency || referral.referred_by_agency || "",
        referral_from_url: referral.Referral_From_Url || referral.referral_from_url || "",
        applicant_name: referral.Applicant_Name || referral.applicant_name || "",
        applicant_dob: referral.Applicant_Dob || referral.applicant_dob || "",
        referral_reason: referral.Referral_Reason || referral.referral_reason || "",
        status: referral.Status || referral.status || "received",
        priority: referral.Priority || referral.priority || "medium",
        assigned_to_user_id: referral.Assigned_To_User_Id || referral.assigned_to_user_id || "",
        assessment_date: referral.Assessment_Date || referral.assessment_date || "",
        decision_date: referral.Decision_Date || referral.decision_date || "",
        decision_reason: referral.Decision_Reason || referral.decision_reason || "",
        accommodation_type_needed: referral.Accommodation_Type_Needed || referral.accommodation_type_needed || "single_room",
        notes: referral.Notes || referral.notes || "",
        logged_by: referral.Logged_By || referral.logged_by || (currentUser?.full_name || "")
      };
    }
    return defaultCore;
  });

  // Comprehensive 9-page self-referral form state
  const [formData, setFormData] = useState(() => {
    let savedFormData = {};
    if (referral && (referral.Form_Data || referral.form_data)) {
      const fd = referral.Form_Data || referral.form_data;
      savedFormData = typeof fd === 'string' ? JSON.parse(fd) : fd;
    }

    return {
      // PAGE 1: Personal Details
      title: savedFormData.title || "Mr",
      gender: savedFormData.gender || "",
      pronouns: savedFormData.pronouns || "",
      ni_number: savedFormData.ni_number || "",
      contact_number: savedFormData.contact_number || "",
      email: savedFormData.email || "",
      martial_status: savedFormData.martial_status || "",
      ethnic_origin: savedFormData.ethnic_origin || "",
      religion: savedFormData.religion || "",
      sexual_orientation: savedFormData.sexual_orientation || "",

      // Next of Kin / Emergency Contact
      nok_name: savedFormData.nok_name || "",
      nok_relationship: savedFormData.nok_relationship || "",
      nok_address: savedFormData.nok_address || "",
      nok_phone: savedFormData.nok_phone || "",

      // PAGE 2: Address History (Minimum 5 years)
      address_history: savedFormData.address_history || [
        { address: "", dates_from: "", dates_to: "", tenure: "", reason_for_leaving: "" }
      ],

      // PAGE 3: Physical & Mental Health
      gp_name: savedFormData.gp_name || "",
      gp_surgery: savedFormData.gp_surgery || "",
      gp_contact: savedFormData.gp_contact || "",
      medical_conditions: savedFormData.medical_conditions || "",
      prescribed_medication: savedFormData.prescribed_medication || "",
      needs_medication_storage: savedFormData.needs_medication_storage || "",
      mental_health_diagnosis: savedFormData.mental_health_diagnosis || "",
      mental_health_care_coordinator: savedFormData.mental_health_care_coordinator || "",
      mental_health_team: savedFormData.mental_health_team || "",
      mental_health_team_contact: savedFormData.mental_health_team_contact || "",

      // PAGE 4: Substance Misuse
      uses_drugs: savedFormData.uses_drugs || "No",
      drug_types_frequency: savedFormData.drug_types_frequency || "",
      uses_alcohol: savedFormData.uses_alcohol || "No",
      alcohol_units_frequency: savedFormData.alcohol_units_frequency || "",
      substance_misuse_treatment_agency: savedFormData.substance_misuse_treatment_agency || "",
      substance_misuse_worker_name: savedFormData.substance_misuse_worker_name || "",
      substance_misuse_worker_contact: savedFormData.substance_misuse_worker_contact || "",

      // PAGE 5: Offending History
      has_convictions: savedFormData.has_convictions || "No",
      conviction_details: savedFormData.conviction_details || "",
      on_probation: savedFormData.on_probation || "No",
      probation_officer_name: savedFormData.probation_officer_name || "",
      probation_office: savedFormData.probation_office || "",
      probation_contact: savedFormData.probation_contact || "",
      is_on_multi_agency_register: savedFormData.is_on_multi_agency_register || "No",
      register_details: savedFormData.register_details || "",

      // PAGE 6: Support Needs
      support_needs: savedFormData.support_needs || [],

      // PAGES 7 & 8: Risk Assessment (Yes/No/Details)
      risk_children: savedFormData.risk_children || "No",
      risk_children_details: savedFormData.risk_children_details || "",
      concern_risk_to_children: savedFormData.concern_risk_to_children || "No",
      concern_risk_to_children_details: savedFormData.concern_risk_to_children_details || "",
      abilities_reduced: savedFormData.abilities_reduced || "No",
      abilities_reduced_details: savedFormData.abilities_reduced_details || "",
      known_to_social_services: savedFormData.known_to_social_services || "No",
      known_to_social_services_details: savedFormData.known_to_social_services_details || "",
      safeguarding_concerns: savedFormData.safeguarding_concerns || "No",
      safeguarding_concerns_details: savedFormData.safeguarding_concerns_details || "",

      risk_self_harm: savedFormData.risk_self_harm || "No",
      risk_self_harm_details: savedFormData.risk_self_harm_details || "",
      risk_neglect: savedFormData.risk_neglect || "No",
      risk_neglect_details: savedFormData.risk_neglect_details || "",
      risk_harm_from_others: savedFormData.risk_harm_from_others || "No",
      risk_harm_from_others_details: savedFormData.risk_harm_from_others_details || "",
      risk_domestic_abuse: savedFormData.risk_domestic_abuse || "No",
      risk_domestic_abuse_details: savedFormData.risk_domestic_abuse_details || "",
      risk_suicide: savedFormData.risk_suicide || "No",
      risk_suicide_details: savedFormData.risk_suicide_details || "",
      risk_law_enforcement: savedFormData.risk_law_enforcement || "No",
      risk_law_enforcement_details: savedFormData.risk_law_enforcement_details || "",

      risk_mental_health_diagnosis: savedFormData.risk_mental_health_diagnosis || "No",
      risk_mental_health_diagnosis_details: savedFormData.risk_mental_health_diagnosis_details || "",
      risk_medical_condition: savedFormData.risk_medical_condition || "No",
      risk_medical_condition_details: savedFormData.risk_medical_condition_details || "",
      risk_vulnerabilities: savedFormData.risk_vulnerabilities || "No",
      risk_vulnerabilities_details: savedFormData.risk_vulnerabilities_details || "",
      risk_physical_disabilities: savedFormData.risk_physical_disabilities || "No",
      risk_physical_disabilities_details: savedFormData.risk_physical_disabilities_details || "",
      risk_to_children: savedFormData.risk_to_children || "No",
      risk_to_children_details: savedFormData.risk_to_children_details || "",
      risk_violence: savedFormData.risk_violence || "No",
      risk_violence_details: savedFormData.risk_violence_details || "",
      risk_social_isolation: savedFormData.risk_social_isolation || "No",
      risk_social_isolation_details: savedFormData.risk_social_isolation_details || "",
      risk_accidental_fire: savedFormData.risk_accidental_fire || "No",
      risk_accidental_fire_details: savedFormData.risk_accidental_fire_details || "",
      risk_arson: savedFormData.risk_arson || "No",
      risk_arson_details: savedFormData.risk_arson_details || "",
      risk_ex_offender: savedFormData.risk_ex_offender || "No",
      risk_ex_offender_details: savedFormData.risk_ex_offender_details || "",
      risk_sex_offender: savedFormData.risk_sex_offender || "No",
      risk_sex_offender_details: savedFormData.risk_sex_offender_details || "",
      risk_violent_offender: savedFormData.risk_violent_offender || "No",
      risk_violent_offender_details: savedFormData.risk_violent_offender_details || "",
      risk_substance_misuse: savedFormData.risk_substance_misuse || "No",
      risk_substance_misuse_details: savedFormData.risk_substance_misuse_details || "",

      // PAGE 8 & 9: Service User Involvement & Consent
      eligibility_benefits: savedFormData.eligibility_benefits || "No",
      consent_personal_info: savedFormData.consent_personal_info || "No",
      consent_pronouns: savedFormData.consent_pronouns || "No",
      consent_ongoing_contact: savedFormData.consent_ongoing_contact || "No",
      information_sharing_consent: savedFormData.information_sharing_consent || "No",
      applicant_signature: savedFormData.applicant_signature || "",
      signature_date: savedFormData.signature_date || "",
    };
  });

  // Accordion active sections
  const [expandedSections, setExpandedSections] = useState({
    personal: true,
    address: false,
    health: false,
    substance: false,
    offending: false,
    support: false,
    risks: false,
    consent: false,
    processing: false
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  useEffect(() => {
    if (!referral && currentUser?.full_name && coreData.logged_by === "") {
      setCoreData(prev => ({ ...prev, logged_by: currentUser.full_name }));
    }
  }, [currentUser, referral, coreData.logged_by]);

  const assignableUsers = [
    { id: "admin", name: "Admin" },
    { id: "amaani", name: "Amaani" },
    { id: "leticia", name: "Leticia" },
    { id: "burton", name: "Burton" },
    { id: "sulekha", name: "Sulekha" },
    { id: "shaila", name: "Shaila" }
  ];

  const handleCoreChange = (field, value) => {
    setCoreData(prev => ({ ...prev, [field]: value }));
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Address history handlers
  const handleAddressChange = (index, field, value) => {
    const updated = [...formData.address_history];
    updated[index][field] = value;
    handleFormChange("address_history", updated);
  };

  const addAddressRow = () => {
    handleFormChange("address_history", [
      ...formData.address_history,
      { address: "", dates_from: "", dates_to: "", tenure: "", reason_for_leaving: "" }
    ]);
  };

  const removeAddressRow = (index) => {
    if (formData.address_history.length === 1) return;
    const updated = formData.address_history.filter((_, i) => i !== index);
    handleFormChange("address_history", updated);
  };

  // Support needs checklist handlers
  const handleSupportNeedToggle = (need) => {
    const isChecked = formData.support_needs.includes(need);
    let updated;
    if (isChecked) {
      updated = formData.support_needs.filter(n => n !== need);
    } else {
      updated = [...formData.support_needs, need];
    }
    handleFormChange("support_needs", updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Mapping states to DB format
    const statusMap = {
      'received': 'Received',
      'under_assessment': 'Under Assessment',
      'awaiting_interview': 'Awaiting Interview',
      'interviewed': 'Interviewed',
      'accepted': 'Accepted',
      'rejected': 'Rejected',
      'withdrawn': 'Withdrawn'
    };

    const priorityMap = {
      'low': 'Low',
      'medium': 'Medium',
      'high': 'High'
    };

    const referralTypeMap = {
      'organisation': 'Organisation',
      'self-referral': 'Self-Referral'
    };

    // Strict Validations for Self-Referral
    if (referralType === 'self-referral') {
      // 1. Personal Details Validations
      if (!coreData.applicant_name.trim()) {
        alert("Applicant Name is required on Page 1 (Personal Details).");
        setExpandedSections(prev => ({ ...prev, personal: true }));
        return;
      }
      if (!formData.ni_number.trim()) {
        alert("National Insurance Number is required on Page 1 (Personal Details).");
        setExpandedSections(prev => ({ ...prev, personal: true }));
        return;
      }

      // 2. Address History Validation
      const hasValidAddress = formData.address_history.some(row => row.address.trim() !== "");
      if (!hasValidAddress) {
        alert("At least one address must be entered in Page 2 (Address History).");
        setExpandedSections(prev => ({ ...prev, address: true }));
        return;
      }

      // 3. Support Needs Checklist Validation (Minimum 5 ticked)
      if (formData.support_needs.length < 5) {
        alert(`You have checked ${formData.support_needs.length} support needs. Please tick at least 5 to be considered for supported accommodation (Page 6).`);
        setExpandedSections(prev => ({ ...prev, support: true }));
        return;
      }
    } else {
      // Organisation Referral Validations
      if (!coreData.applicant_name.trim()) {
        alert("Applicant Name is required.");
        return;
      }
      if (!coreData.referred_by_agency.trim()) {
        alert("Referred By Agency is required for Organisation referrals.");
        return;
      }
    }

    const supabaseData = {
      "Referral Date": coreData.referral_date,
      "Referral Type": referralTypeMap[referralType] || 'Organisation',
      "Referral From URL": coreData.referral_from_url || null,
      "Applicant Name": coreData.applicant_name,
      "Applicant DOB": coreData.applicant_dob || null,
      "Referral Reason": coreData.referral_reason || null,
      "Status": statusMap[coreData.status] || 'Received',
      "Priority": priorityMap[coreData.priority] || 'Medium',
      "Assigned To": coreData.assigned_to_user_id || null,
      "Accommodation Type Needed": coreData.accommodation_type_needed || null,
      "Assessment Date": coreData.assessment_date || null,
      "Decision Date": coreData.decision_date || null,
      "Decision Reason": coreData.decision_reason || null,
      "Notes": coreData.notes || null,
      "Logged By": coreData.logged_by || null,
      "Updated Date": new Date().toISOString()
    };

    if (referralType === 'organisation') {
      supabaseData["Referred By Agency"] = coreData.referred_by_agency;
    } else {
      // Store all comprehensive 9-page fields inside Form Data column
      supabaseData["Form Data"] = JSON.stringify(formData);
      // Synchronize some top-level fields for fast indexing/rendering if applicable
      supabaseData["Notes"] = coreData.notes || null;
    }

    if (!referral) {
      supabaseData.ID = crypto.randomUUID();
      supabaseData["Created Date"] = new Date().toISOString();
      supabaseData["Created By"] = currentUser?.email || "Unknown";
    }

    onSubmit(supabaseData);
  };

  const AccordionHeader = ({ title, section, required }) => (
    <div
      onClick={() => toggleSection(section)}
      className="flex items-center justify-between p-4 bg-slate-100 hover:bg-slate-200 cursor-pointer rounded-lg border border-slate-200 transition-colors"
    >
      <span className="font-semibold text-slate-800 flex items-center gap-2">
        {title}
        {required && <span className="text-red-500 font-bold">*</span>}
      </span>
      {expandedSections[section] ? <ChevronUp className="w-5 h-5 text-slate-500" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
    </div>
  );

  return (
    <Card className="mb-6 shadow-md border border-slate-200">
      <CardHeader className="pb-4 border-b border-slate-100 bg-slate-50 rounded-t-lg">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <CardTitle className="flex items-center gap-2 text-2xl text-slate-950">
            <ClipboardPlus className="w-6 h-6 text-fuchsia-600" />
            {referral ? "Edit Referral Entry" : "Log New Referral Entry"}
          </CardTitle>
          <div className="w-full md:w-64">
            <Label htmlFor="referral_type" className="text-slate-700 font-semibold mb-1 block">Referral Flow Type</Label>
            <Select value={referralType} onValueChange={setReferralType}>
              <SelectTrigger className="border-fuchsia-300 focus:ring-fuchsia-400 bg-white"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="organisation">Organisation Referral</SelectItem>
                <SelectItem value="self-referral">Self-Referral (9-Page Physical Form)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* ==========================================
              FLOW A: ORGANISATION REFERRAL (FLAT FORM)
              ========================================== */}
          {referralType === 'organisation' ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Applicant & Referral Source</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="referral_from_url">Referral From URL (Google Drive Link)</Label>
                    <Input
                      id="referral_from_url"
                      type="url"
                      value={coreData.referral_from_url}
                      onChange={e => handleCoreChange("referral_from_url", e.target.value)}
                      placeholder="https://drive.google.com/..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="applicant_name">Applicant Name *</Label>
                    <Input id="applicant_name" value={coreData.applicant_name} onChange={e => handleCoreChange("applicant_name", e.target.value)} required />
                  </div>
                  <div>
                    <Label htmlFor="applicant_dob">Applicant Date of Birth</Label>
                    <Input id="applicant_dob" type="date" value={coreData.applicant_dob || ""} onChange={e => handleCoreChange("applicant_dob", e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="referred_by_agency">Referred By (Agency/Person) *</Label>
                    <Input id="referred_by_agency" value={coreData.referred_by_agency} onChange={e => handleCoreChange("referred_by_agency", e.target.value)} required />
                  </div>
                  <div>
                    <Label htmlFor="referral_date">Referral Date & Time *</Label>
                    <Input id="referral_date" type="datetime-local" value={coreData.referral_date} onChange={e => handleCoreChange("referral_date", e.target.value)} required />
                  </div>
                  <div>
                    <Label htmlFor="logged_by">Logged By</Label>
                    <Input id="logged_by" value={coreData.logged_by} onChange={e => handleCoreChange("logged_by", e.target.value)} />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Referral Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="referral_reason">Reason for Referral</Label>
                    <Textarea id="referral_reason" value={coreData.referral_reason} onChange={e => handleCoreChange("referral_reason", e.target.value)} rows={3} />
                  </div>
                  <div>
                    <Label htmlFor="notes">Additional Notes</Label>
                    <Textarea id="notes" value={coreData.notes} onChange={e => handleCoreChange("notes", e.target.value)} rows={3} />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ==========================================
               FLOW B: SELF-REFERRAL (COMPREHENSIVE ACCORDIONS)
               ========================================== */
            <div className="space-y-4">

              {/* PAGE 1: Personal Details Accordion */}
              <div className="space-y-2">
                <AccordionHeader title="Page 1: Personal Details & Next of Kin" section="personal" required={true} />
                {expandedSections.personal && (
                  <div className="p-4 border border-t-0 rounded-b-lg border-slate-200 bg-white grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="applicant_name">Applicant Name *</Label>
                      <Input id="applicant_name" value={coreData.applicant_name} onChange={e => handleCoreChange("applicant_name", e.target.value)} required />
                    </div>
                    <div>
                      <Label htmlFor="applicant_dob">Applicant Date of Birth</Label>
                      <Input id="applicant_dob" type="date" value={coreData.applicant_dob || ""} onChange={e => handleCoreChange("applicant_dob", e.target.value)} />
                    </div>
                    <div>
                      <Label htmlFor="title">Title</Label>
                      <Select value={formData.title} onValueChange={v => handleFormChange("title", v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Mr">Mr</SelectItem>
                          <SelectItem value="Mrs">Mrs</SelectItem>
                          <SelectItem value="Ms">Ms</SelectItem>
                          <SelectItem value="Miss">Miss</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="ni_number">National Insurance (NI) Number *</Label>
                      <Input id="ni_number" value={formData.ni_number} onChange={e => handleFormChange("ni_number", e.target.value)} required placeholder="e.g. QQ 12 34 56 C" />
                    </div>
                    <div>
                      <Label htmlFor="gender">Gender</Label>
                      <Input id="gender" value={formData.gender} onChange={e => handleFormChange("gender", e.target.value)} placeholder="Gender description" />
                    </div>
                    <div>
                      <Label htmlFor="pronouns">Pronouns</Label>
                      <Input id="pronouns" value={formData.pronouns} onChange={e => handleFormChange("pronouns", e.target.value)} placeholder="e.g. He/Him, She/Her" />
                    </div>
                    <div>
                      <Label htmlFor="contact_number">Contact Number</Label>
                      <Input id="contact_number" value={formData.contact_number} onChange={e => handleFormChange("contact_number", e.target.value)} />
                    </div>
                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input id="email" type="email" value={formData.email} onChange={e => handleFormChange("email", e.target.value)} />
                    </div>
                    <div>
                      <Label htmlFor="martial_status">Marital / Civil Status</Label>
                      <Input id="martial_status" value={formData.martial_status} onChange={e => handleFormChange("martial_status", e.target.value)} />
                    </div>
                    <div>
                      <Label htmlFor="ethnic_origin">Ethnic Origin</Label>
                      <Input id="ethnic_origin" value={formData.ethnic_origin} onChange={e => handleFormChange("ethnic_origin", e.target.value)} />
                    </div>
                    <div>
                      <Label htmlFor="religion">Religion</Label>
                      <Input id="religion" value={formData.religion} onChange={e => handleFormChange("religion", e.target.value)} />
                    </div>
                    <div>
                      <Label htmlFor="sexual_orientation">Sexual Orientation</Label>
                      <Input id="sexual_orientation" value={formData.sexual_orientation} onChange={e => handleFormChange("sexual_orientation", e.target.value)} />
                    </div>

                    <div className="md:col-span-2 mt-4 pt-4 border-t border-slate-100">
                      <h4 className="font-semibold text-md text-slate-800 mb-2">Next of Kin / Emergency Contact Details</h4>
                    </div>
                    <div>
                      <Label htmlFor="nok_name">Next of Kin Name</Label>
                      <Input id="nok_name" value={formData.nok_name} onChange={e => handleFormChange("nok_name", e.target.value)} />
                    </div>
                    <div>
                      <Label htmlFor="nok_relationship">Relationship to Applicant</Label>
                      <Input id="nok_relationship" value={formData.nok_relationship} onChange={e => handleFormChange("nok_relationship", e.target.value)} />
                    </div>
                    <div>
                      <Label htmlFor="nok_phone">Contact Phone Number</Label>
                      <Input id="nok_phone" value={formData.nok_phone} onChange={e => handleFormChange("nok_phone", e.target.value)} />
                    </div>
                    <div>
                      <Label htmlFor="nok_address">Next of Kin Full Address</Label>
                      <Input id="nok_address" value={formData.nok_address} onChange={e => handleFormChange("nok_address", e.target.value)} />
                    </div>
                  </div>
                )}
              </div>

              {/* PAGE 2: Address History Accordion */}
              <div className="space-y-2">
                <AccordionHeader title="Page 2: Address History (Last 5 Years)" section="address" required={true} />
                {expandedSections.address && (
                  <div className="p-4 border border-t-0 rounded-b-lg border-slate-200 bg-white space-y-4">
                    <p className="text-sm text-slate-500 mb-2">Please list your housing history, starting from the most recent. Ensure there are no gaps in the 5-year period.</p>
                    {formData.address_history.map((row, index) => (
                      <div key={index} className="p-4 border border-slate-200 rounded-lg bg-slate-50 relative space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-semibold text-slate-700">Address Entry #{index + 1}</span>
                          {formData.address_history.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeAddressRow(index)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4 mr-1" /> Remove
                            </Button>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="md:col-span-2">
                            <Label>Full Address</Label>
                            <Input
                              value={row.address}
                              onChange={e => handleAddressChange(index, "address", e.target.value)}
                              placeholder="e.g. 123 Hope Lane, London, NW1 5XX"
                            />
                          </div>
                          <div>
                            <Label>Date From</Label>
                            <Input
                              type="text"
                              value={row.dates_from}
                              onChange={e => handleAddressChange(index, "dates_from", e.target.value)}
                              placeholder="e.g. Month/Year or MM/YYYY"
                            />
                          </div>
                          <div>
                            <Label>Date To</Label>
                            <Input
                              type="text"
                              value={row.dates_to}
                              onChange={e => handleAddressChange(index, "dates_to", e.target.value)}
                              placeholder="e.g. Month/Year or MM/YYYY"
                            />
                          </div>
                          <div>
                            <Label>Tenure Type / Status</Label>
                            <Input
                              value={row.tenure}
                              onChange={e => handleAddressChange(index, "tenure", e.target.value)}
                              placeholder="e.g. Private tenant, Hostage, Sleeping rough, Prison"
                            />
                          </div>
                          <div>
                            <Label>Reason For Leaving</Label>
                            <Input
                              value={row.reason_for_leaving}
                              onChange={e => handleAddressChange(index, "reason_for_leaving", e.target.value)}
                              placeholder="e.g. Eviction, Tenancy ended"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addAddressRow}
                      className="w-full border-dashed border-fuchsia-300 text-fuchsia-600 hover:bg-fuchsia-50"
                    >
                      <Plus className="w-4 h-4 mr-2" /> Add Another Address
                    </Button>
                  </div>
                )}
              </div>

              {/* PAGE 3: Physical & Mental Health Accordion */}
              <div className="space-y-2">
                <AccordionHeader title="Page 3: Physical & Mental Health" section="health" />
                {expandedSections.health && (
                  <div className="p-4 border border-t-0 rounded-b-lg border-slate-200 bg-white grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="gp_name">GP Name</Label>
                      <Input id="gp_name" value={formData.gp_name} onChange={e => handleFormChange("gp_name", e.target.value)} />
                    </div>
                    <div>
                      <Label htmlFor="gp_surgery">GP Surgery Name</Label>
                      <Input id="gp_surgery" value={formData.gp_surgery} onChange={e => handleFormChange("gp_surgery", e.target.value)} />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="gp_contact">GP Surgery Phone / Email / Address</Label>
                      <Input id="gp_contact" value={formData.gp_contact} onChange={e => handleFormChange("gp_contact", e.target.value)} />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="medical_conditions">Are there any diagnosed physical medical conditions or ongoing treatments?</Label>
                      <Textarea id="medical_conditions" value={formData.medical_conditions} onChange={e => handleFormChange("medical_conditions", e.target.value)} rows={3} placeholder="Please provide details..." />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="prescribed_medication">List all prescribed medications and dosages</Label>
                      <Textarea id="prescribed_medication" value={formData.prescribed_medication} onChange={e => handleFormChange("prescribed_medication", e.target.value)} rows={3} />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="needs_medication_storage">Does the client require any specific support or temperature-controlled storage for medication?</Label>
                      <Input id="needs_medication_storage" value={formData.needs_medication_storage} onChange={e => handleFormChange("needs_medication_storage", e.target.value)} />
                    </div>
                    <div className="md:col-span-2 pt-4 border-t border-slate-100">
                      <h4 className="font-semibold text-md text-slate-800 mb-2">Mental Health Support</h4>
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="mental_health_diagnosis">Is there an active or historic mental health diagnosis?</Label>
                      <Textarea id="mental_health_diagnosis" value={formData.mental_health_diagnosis} onChange={e => handleFormChange("mental_health_diagnosis", e.target.value)} rows={2} />
                    </div>
                    <div>
                      <Label htmlFor="mental_health_care_coordinator">Care Coordinator Name</Label>
                      <Input id="mental_health_care_coordinator" value={formData.mental_health_care_coordinator} onChange={e => handleFormChange("mental_health_care_coordinator", e.target.value)} />
                    </div>
                    <div>
                      <Label htmlFor="mental_health_team">Mental Health Team / Clinic</Label>
                      <Input id="mental_health_team" value={formData.mental_health_team} onChange={e => handleFormChange("mental_health_team", e.target.value)} />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="mental_health_team_contact">Mental Health Team Contact Details</Label>
                      <Input id="mental_health_team_contact" value={formData.mental_health_team_contact} onChange={e => handleFormChange("mental_health_team_contact", e.target.value)} />
                    </div>
                  </div>
                )}
              </div>

              {/* PAGE 4: Substance Misuse Accordion */}
              <div className="space-y-2">
                <AccordionHeader title="Page 4: Substance Misuse" section="substance" />
                {expandedSections.substance && (
                  <div className="p-4 border border-t-0 rounded-b-lg border-slate-200 bg-white space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Do you currently, or have you in the past, misused Drugs?</Label>
                        <Select value={formData.uses_drugs} onValueChange={v => handleFormChange("uses_drugs", v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="No">No</SelectItem>
                            <SelectItem value="Yes - Current">Yes - Current</SelectItem>
                            <SelectItem value="Yes - Historic">Yes - Historic</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Do you currently, or have you in the past, misused Alcohol?</Label>
                        <Select value={formData.uses_alcohol} onValueChange={v => handleFormChange("uses_alcohol", v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="No">No</SelectItem>
                            <SelectItem value="Yes - Current">Yes - Current</SelectItem>
                            <SelectItem value="Yes - Historic">Yes - Historic</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="drug_types_frequency">Specify Drug Types, Frequency of use, and Method of Administering</Label>
                        <Textarea id="drug_types_frequency" value={formData.drug_types_frequency} onChange={e => handleFormChange("drug_types_frequency", e.target.value)} rows={3} />
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="alcohol_units_frequency">Specify Alcohol quantity, units and frequency of use</Label>
                        <Textarea id="alcohol_units_frequency" value={formData.alcohol_units_frequency} onChange={e => handleFormChange("alcohol_units_frequency", e.target.value)} rows={3} />
                      </div>

                      <div className="md:col-span-2 pt-4 border-t border-slate-100">
                        <h4 className="font-semibold text-md text-slate-800 mb-2">Substance Misuse Support Agency / Treatment</h4>
                      </div>
                      <div>
                        <Label htmlFor="substance_misuse_treatment_agency">Treatment Agency Name</Label>
                        <Input id="substance_misuse_treatment_agency" value={formData.substance_misuse_treatment_agency} onChange={e => handleFormChange("substance_misuse_treatment_agency", e.target.value)} />
                      </div>
                      <div>
                        <Label htmlFor="substance_misuse_worker_name">Support Worker / Key Worker Name</Label>
                        <Input id="substance_misuse_worker_name" value={formData.substance_misuse_worker_name} onChange={e => handleFormChange("substance_misuse_worker_name", e.target.value)} />
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="substance_misuse_worker_contact">Worker Contact Phone / Email</Label>
                        <Input id="substance_misuse_worker_contact" value={formData.substance_misuse_worker_contact} onChange={e => handleFormChange("substance_misuse_worker_contact", e.target.value)} />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* PAGE 5: Offending History Accordion */}
              <div className="space-y-2">
                <AccordionHeader title="Page 5: Offending History & Probation" section="offending" />
                {expandedSections.offending && (
                  <div className="p-4 border border-t-0 rounded-b-lg border-slate-200 bg-white grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Do you have any current or past criminal convictions?</Label>
                      <Select value={formData.has_convictions} onValueChange={v => handleFormChange("has_convictions", v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="No">No</SelectItem>
                          <SelectItem value="Yes - Current">Yes - Current</SelectItem>
                          <SelectItem value="Yes - Historic">Yes - Historic</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Are you currently under Probation?</Label>
                      <Select value={formData.on_probation} onValueChange={v => handleFormChange("on_probation", v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="No">No</SelectItem>
                          <SelectItem value="Yes">Yes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="conviction_details">Detail Convictions (Offences, sentence dates, release dates, unspent offences)</Label>
                      <Textarea id="conviction_details" value={formData.conviction_details} onChange={e => handleFormChange("conviction_details", e.target.value)} rows={3} />
                    </div>

                    <div className="md:col-span-2 pt-4 border-t border-slate-100">
                      <h4 className="font-semibold text-md text-slate-800 mb-2">Probation Officer Details</h4>
                    </div>
                    <div>
                      <Label htmlFor="probation_officer_name">Probation Officer Name</Label>
                      <Input id="probation_officer_name" value={formData.probation_officer_name} onChange={e => handleFormChange("probation_officer_name", e.target.value)} />
                    </div>
                    <div>
                      <Label htmlFor="probation_office">Probation Office / Clinic</Label>
                      <Input id="probation_office" value={formData.probation_office} onChange={e => handleFormChange("probation_office", e.target.value)} />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="probation_contact">Probation Officer Phone / Email</Label>
                      <Input id="probation_contact" value={formData.probation_contact} onChange={e => handleFormChange("probation_contact", e.target.value)} />
                    </div>

                    <div className="md:col-span-2 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Are you on any Multi-Agency register? (e.g. MAPPA, IOM, MARAC)</Label>
                        <Select value={formData.is_on_multi_agency_register} onValueChange={v => handleFormChange("is_on_multi_agency_register", v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="No">No</SelectItem>
                            <SelectItem value="Yes">Yes</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="register_details">Register Details / Level</Label>
                        <Input id="register_details" value={formData.register_details} onChange={e => handleFormChange("register_details", e.target.value)} placeholder="MAPPA Level, etc." />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* PAGE 6: Support Needs Checklist Accordion */}
              <div className="space-y-2">
                <AccordionHeader title={`Page 6: Support Needs Checklist (${formData.support_needs.length} selected)`} section="support" required={true} />
                {expandedSections.support && (
                  <div className="p-4 border border-t-0 rounded-b-lg border-slate-200 bg-white space-y-4">
                    <p className="text-sm font-medium text-slate-700 bg-amber-50 border border-amber-200 p-3 rounded">
                      <strong>Requirement:</strong> Please tick <strong>at least 5</strong> support needs to be considered for supported accommodation.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                      {SUPPORT_NEEDS_LIST.map((need) => {
                        const checked = formData.support_needs.includes(need);
                        return (
                          <div
                            key={need}
                            onClick={() => handleSupportNeedToggle(need)}
                            className={`flex items-start gap-2 p-3 rounded-md border cursor-pointer select-none transition-all ${
                              checked
                                ? "bg-fuchsia-50 border-fuchsia-300 text-fuchsia-950 font-medium"
                                : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {}} // Handled by outer div click
                              className="w-4 h-4 rounded text-fuchsia-600 focus:ring-fuchsia-500 mt-1 cursor-pointer"
                            />
                            <span className="text-xs leading-normal">{need}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* PAGES 7 & 8: Risk Assessment Accordion */}
              <div className="space-y-2">
                <AccordionHeader title="Pages 7 & 8: Risk Assessment Matrix" section="risks" />
                {expandedSections.risks && (
                  <div className="p-4 border border-t-0 rounded-b-lg border-slate-200 bg-white space-y-6">
                    <p className="text-sm text-slate-500">Provide details of any past or current risks regarding children, self, or others.</p>

                    {/* Children Grid */}
                    <div className="space-y-4 border border-slate-100 p-4 rounded-lg bg-slate-50/50">
                      <h4 className="font-bold text-slate-900 border-b pb-2 text-md">Risk Regarding Children</h4>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                          <Label className="md:col-span-1">Do you have any children?</Label>
                          <Select value={formData.risk_children} onValueChange={v => handleFormChange("risk_children", v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent><SelectItem value="No">No</SelectItem><SelectItem value="Yes">Yes</SelectItem></SelectContent>
                          </Select>
                          <Input value={formData.risk_children_details} onChange={e => handleFormChange("risk_children_details", e.target.value)} placeholder="If yes, please explain risk..." className="md:col-span-1" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                          <Label className="md:col-span-1">Is there a reason to be concerned about Risk to Children?</Label>
                          <Select value={formData.concern_risk_to_children} onValueChange={v => handleFormChange("concern_risk_to_children", v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent><SelectItem value="No">No</SelectItem><SelectItem value="Yes">Yes</SelectItem></SelectContent>
                          </Select>
                          <Input value={formData.concern_risk_to_children_details} onChange={e => handleFormChange("concern_risk_to_children_details", e.target.value)} placeholder="If yes, please explain risk..." className="md:col-span-1" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                          <Label className="md:col-span-1">Are abilities of parents/carers reduced?</Label>
                          <Select value={formData.abilities_reduced} onValueChange={v => handleFormChange("abilities_reduced", v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent><SelectItem value="No">No</SelectItem><SelectItem value="Yes">Yes</SelectItem></SelectContent>
                          </Select>
                          <Input value={formData.abilities_reduced_details} onChange={e => handleFormChange("abilities_reduced_details", e.target.value)} placeholder="If yes, please explain risk..." className="md:col-span-1" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                          <Label className="md:col-span-1">Are your children known to Social Services?</Label>
                          <Select value={formData.known_to_social_services} onValueChange={v => handleFormChange("known_to_social_services", v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent><SelectItem value="No">No</SelectItem><SelectItem value="Yes">Yes</SelectItem></SelectContent>
                          </Select>
                          <Input value={formData.known_to_social_services_details} onChange={e => handleFormChange("known_to_social_services_details", e.target.value)} placeholder="If yes, please explain risk..." className="md:col-span-1" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                          <Label className="md:col-span-1">Are there safeguarding concerns regarding children?</Label>
                          <Select value={formData.safeguarding_concerns} onValueChange={v => handleFormChange("safeguarding_concerns", v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent><SelectItem value="No">No</SelectItem><SelectItem value="Yes">Yes</SelectItem></SelectContent>
                          </Select>
                          <Input value={formData.safeguarding_concerns_details} onChange={e => handleFormChange("safeguarding_concerns_details", e.target.value)} placeholder="If yes, please explain risk..." className="md:col-span-1" />
                        </div>
                      </div>
                    </div>

                    {/* Standard Risk Types Matrix */}
                    <div className="space-y-4 border border-slate-100 p-4 rounded-lg bg-slate-50/50">
                      <h4 className="font-bold text-slate-900 border-b pb-2 text-md">General Risk Matrix</h4>
                      <div className="space-y-3">

                        {/* Self Harm */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                          <Label className="font-semibold text-slate-700">Risk of Self Harm?</Label>
                          <Select value={formData.risk_self_harm} onValueChange={v => handleFormChange("risk_self_harm", v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent><SelectItem value="No">No</SelectItem><SelectItem value="Yes - Current">Yes - Current</SelectItem><SelectItem value="Yes - Past">Yes - Past</SelectItem></SelectContent>
                          </Select>
                          <Input value={formData.risk_self_harm_details} onChange={e => handleFormChange("risk_self_harm_details", e.target.value)} placeholder="Specify details..." />
                        </div>

                        {/* Neglect */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                          <Label className="font-semibold text-slate-700">Risk of Self Neglect?</Label>
                          <Select value={formData.risk_neglect} onValueChange={v => handleFormChange("risk_neglect", v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent><SelectItem value="No">No</SelectItem><SelectItem value="Yes - Current">Yes - Current</SelectItem><SelectItem value="Yes - Past">Yes - Past</SelectItem></SelectContent>
                          </Select>
                          <Input value={formData.risk_neglect_details} onChange={e => handleFormChange("risk_neglect_details", e.target.value)} placeholder="Specify details..." />
                        </div>

                        {/* Harm from others */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                          <Label className="font-semibold text-slate-700">Potential Harm from Others?</Label>
                          <Select value={formData.risk_harm_from_others} onValueChange={v => handleFormChange("risk_harm_from_others", v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent><SelectItem value="No">No</SelectItem><SelectItem value="Yes - Current">Yes - Current</SelectItem><SelectItem value="Yes - Past">Yes - Past</SelectItem></SelectContent>
                          </Select>
                          <Input value={formData.risk_harm_from_others_details} onChange={e => handleFormChange("risk_harm_from_others_details", e.target.value)} placeholder="Specify details..." />
                        </div>

                        {/* Domestic abuse */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                          <Label className="font-semibold text-slate-700">Risk of Domestic Abuse?</Label>
                          <Select value={formData.risk_domestic_abuse} onValueChange={v => handleFormChange("risk_domestic_abuse", v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent><SelectItem value="No">No</SelectItem><SelectItem value="Yes - Current">Yes - Current</SelectItem><SelectItem value="Yes - Past">Yes - Past</SelectItem></SelectContent>
                          </Select>
                          <Input value={formData.risk_domestic_abuse_details} onChange={e => handleFormChange("risk_domestic_abuse_details", e.target.value)} placeholder="Specify details..." />
                        </div>

                        {/* Suicide */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                          <Label className="font-semibold text-slate-700">Risk of Suicide?</Label>
                          <Select value={formData.risk_suicide} onValueChange={v => handleFormChange("risk_suicide", v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent><SelectItem value="No">No</SelectItem><SelectItem value="Yes - Current">Yes - Current</SelectItem><SelectItem value="Yes - Past">Yes - Past</SelectItem></SelectContent>
                          </Select>
                          <Input value={formData.risk_suicide_details} onChange={e => handleFormChange("risk_suicide_details", e.target.value)} placeholder="Specify details..." />
                        </div>

                        {/* Police law enforcement */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                          <Label className="font-semibold text-slate-700">Risk of police/law involvement?</Label>
                          <Select value={formData.risk_law_enforcement} onValueChange={v => handleFormChange("risk_law_enforcement", v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent><SelectItem value="No">No</SelectItem><SelectItem value="Yes - Current">Yes - Current</SelectItem><SelectItem value="Yes - Past">Yes - Past</SelectItem></SelectContent>
                          </Select>
                          <Input value={formData.risk_law_enforcement_details} onChange={e => handleFormChange("risk_law_enforcement_details", e.target.value)} placeholder="Specify details..." />
                        </div>

                        {/* Mental health risk */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                          <Label className="font-semibold text-slate-700">Risk from Mental Health Diagnosis?</Label>
                          <Select value={formData.risk_mental_health_diagnosis} onValueChange={v => handleFormChange("risk_mental_health_diagnosis", v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent><SelectItem value="No">No</SelectItem><SelectItem value="Yes - Current">Yes - Current</SelectItem><SelectItem value="Yes - Past">Yes - Past</SelectItem></SelectContent>
                          </Select>
                          <Input value={formData.risk_mental_health_diagnosis_details} onChange={e => handleFormChange("risk_mental_health_diagnosis_details", e.target.value)} placeholder="Specify details..." />
                        </div>

                        {/* Medical risk */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                          <Label className="font-semibold text-slate-700">Risk from Medical Condition?</Label>
                          <Select value={formData.risk_medical_condition} onValueChange={v => handleFormChange("risk_medical_condition", v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent><SelectItem value="No">No</SelectItem><SelectItem value="Yes - Current">Yes - Current</SelectItem><SelectItem value="Yes - Past">Yes - Past</SelectItem></SelectContent>
                          </Select>
                          <Input value={formData.risk_medical_condition_details} onChange={e => handleFormChange("risk_medical_condition_details", e.target.value)} placeholder="Specify details..." />
                        </div>

                        {/* Vulnerabilities */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                          <Label className="font-semibold text-slate-700">Known General Vulnerabilities?</Label>
                          <Select value={formData.risk_vulnerabilities} onValueChange={v => handleFormChange("risk_vulnerabilities", v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent><SelectItem value="No">No</SelectItem><SelectItem value="Yes - Current">Yes - Current</SelectItem><SelectItem value="Yes - Past">Yes - Past</SelectItem></SelectContent>
                          </Select>
                          <Input value={formData.risk_vulnerabilities_details} onChange={e => handleFormChange("risk_vulnerabilities_details", e.target.value)} placeholder="Specify details..." />
                        </div>

                        {/* Physical disability */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                          <Label className="font-semibold text-slate-700">Physical Disabilities or Falls?</Label>
                          <Select value={formData.risk_physical_disabilities} onValueChange={v => handleFormChange("risk_physical_disabilities", v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent><SelectItem value="No">No</SelectItem><SelectItem value="Yes">Yes</SelectItem></SelectContent>
                          </Select>
                          <Input value={formData.risk_physical_disabilities_details} onChange={e => handleFormChange("risk_physical_disabilities_details", e.target.value)} placeholder="Specify details..." />
                        </div>

                        {/* Violence */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                          <Label className="font-semibold text-slate-700">Risk of Violence?</Label>
                          <Select value={formData.risk_violence} onValueChange={v => handleFormChange("risk_violence", v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent><SelectItem value="No">No</SelectItem><SelectItem value="Yes - Current">Yes - Current</SelectItem><SelectItem value="Yes - Past">Yes - Past</SelectItem></SelectContent>
                          </Select>
                          <Input value={formData.risk_violence_details} onChange={e => handleFormChange("risk_violence_details", e.target.value)} placeholder="Specify details..." />
                        </div>

                        {/* Social isolation */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                          <Label className="font-semibold text-slate-700">Risk of Social Isolation?</Label>
                          <Select value={formData.risk_social_isolation} onValueChange={v => handleFormChange("risk_social_isolation", v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent><SelectItem value="No">No</SelectItem><SelectItem value="Yes">Yes</SelectItem></SelectContent>
                          </Select>
                          <Input value={formData.risk_social_isolation_details} onChange={e => handleFormChange("risk_social_isolation_details", e.target.value)} placeholder="Specify details..." />
                        </div>

                        {/* Accidental fire */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                          <Label className="font-semibold text-slate-700">Accidental Fire Setting?</Label>
                          <Select value={formData.risk_accidental_fire} onValueChange={v => handleFormChange("risk_accidental_fire", v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent><SelectItem value="No">No</SelectItem><SelectItem value="Yes - Current">Yes - Current</SelectItem><SelectItem value="Yes - Past">Yes - Past</SelectItem></SelectContent>
                          </Select>
                          <Input value={formData.risk_accidental_fire_details} onChange={e => handleFormChange("risk_accidental_fire_details", e.target.value)} placeholder="Specify details..." />
                        </div>

                        {/* Arson */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                          <Label className="font-semibold text-slate-700">Arson?</Label>
                          <Select value={formData.risk_arson} onValueChange={v => handleFormChange("risk_arson", v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent><SelectItem value="No">No</SelectItem><SelectItem value="Yes - Current">Yes - Current</SelectItem><SelectItem value="Yes - Past">Yes - Past</SelectItem></SelectContent>
                          </Select>
                          <Input value={formData.risk_arson_details} onChange={e => handleFormChange("risk_arson_details", e.target.value)} placeholder="Specify details..." />
                        </div>

                        {/* Ex offender */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                          <Label className="font-semibold text-slate-700">Ex Offender?</Label>
                          <Select value={formData.risk_ex_offender} onValueChange={v => handleFormChange("risk_ex_offender", v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent><SelectItem value="No">No</SelectItem><SelectItem value="Yes - Current">Yes - Current</SelectItem><SelectItem value="Yes - Past">Yes - Past</SelectItem></SelectContent>
                          </Select>
                          <Input value={formData.risk_ex_offender_details} onChange={e => handleFormChange("risk_ex_offender_details", e.target.value)} placeholder="Specify details..." />
                        </div>

                        {/* Sex offender */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                          <Label className="font-semibold text-slate-700">Sex Offender?</Label>
                          <Select value={formData.risk_sex_offender} onValueChange={v => handleFormChange("risk_sex_offender", v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent><SelectItem value="No">No</SelectItem><SelectItem value="Yes - Current">Yes - Current</SelectItem><SelectItem value="Yes - Past">Yes - Past</SelectItem></SelectContent>
                          </Select>
                          <Input value={formData.risk_sex_offender_details} onChange={e => handleFormChange("risk_sex_offender_details", e.target.value)} placeholder="Specify details..." />
                        </div>

                        {/* Violent offender */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                          <Label className="font-semibold text-slate-700">Violent Offender?</Label>
                          <Select value={formData.risk_violent_offender} onValueChange={v => handleFormChange("risk_violent_offender", v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent><SelectItem value="No">No</SelectItem><SelectItem value="Yes - Current">Yes - Current</SelectItem><SelectItem value="Yes - Past">Yes - Past</SelectItem></SelectContent>
                          </Select>
                          <Input value={formData.risk_violent_offender_details} onChange={e => handleFormChange("risk_violent_offender_details", e.target.value)} placeholder="Specify details..." />
                        </div>

                        {/* Substance misuse */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                          <Label className="font-semibold text-slate-700">Risk of Substance Misuse?</Label>
                          <Select value={formData.risk_substance_misuse} onValueChange={v => handleFormChange("risk_substance_misuse", v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent><SelectItem value="No">No</SelectItem><SelectItem value="Yes - Current">Yes - Current</SelectItem><SelectItem value="Yes - Past">Yes - Past</SelectItem></SelectContent>
                          </Select>
                          <Input value={formData.risk_substance_misuse_details} onChange={e => handleFormChange("risk_substance_misuse_details", e.target.value)} placeholder="Specify details..." />
                        </div>

                      </div>
                    </div>

                  </div>
                )}
              </div>

              {/* PAGES 8 & 9: Service User Involvement & Declarations */}
              <div className="space-y-2">
                <AccordionHeader title="Pages 8 & 9: Involvement, Declarations & Consents" section="consent" />
                {expandedSections.consent && (
                  <div className="p-4 border border-t-0 rounded-b-lg border-slate-200 bg-white space-y-4">
                    <p className="text-sm text-slate-500">Service User Involvement: Please indicate 'Yes' or 'No' to the following questions.</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="block mb-1">Do you understand and agree to being accommodated in supported accommodation based on receiving support from My Hope Housing?</Label>
                        <Select value={formData.eligibility_benefits} onValueChange={v => handleFormChange("eligibility_benefits", v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent><SelectItem value="No">No</SelectItem><SelectItem value="Yes">Yes</SelectItem></SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="block mb-1">Do you agree and understand the eligibility for supported accommodation is to be on benefits (incl. UC, HB), over 18, and either unemployed or in part-time work on/below 16 hours?</Label>
                        <Select value={formData.consent_personal_info} onValueChange={v => handleFormChange("consent_personal_info", v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent><SelectItem value="No">No</SelectItem><SelectItem value="Yes">Yes</SelectItem></SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="block mb-1">Does the client consent for their personal information and details outlined in this form to be stored on My Hope Housing database and system (in accordance with Data Protection Act)?</Label>
                        <Select value={formData.consent_pronouns} onValueChange={v => handleFormChange("consent_pronouns", v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent><SelectItem value="No">No</SelectItem><SelectItem value="Yes">Yes</SelectItem></SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="block mb-1">Do you understand and agree that My Hope Housing staff shall verbally refer to you as your chosen name and pronouns even if this is different to legal identification?</Label>
                        <Select value={formData.consent_ongoing_contact} onValueChange={v => handleFormChange("consent_ongoing_contact", v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent><SelectItem value="No">No</SelectItem><SelectItem value="Yes">Yes</SelectItem></SelectContent>
                        </Select>
                      </div>

                      <div className="md:col-span-2">
                        <Label className="block mb-1">Do you consent to My Hope Housing having on-going contact with you after support ends?</Label>
                        <Select value={formData.information_sharing_consent} onValueChange={v => handleFormChange("information_sharing_consent", v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent><SelectItem value="No">No</SelectItem><SelectItem value="Yes">Yes</SelectItem></SelectContent>
                        </Select>
                      </div>

                      <div className="md:col-span-2 pt-4 border-t border-slate-100">
                        <h4 className="font-semibold text-md text-slate-800 mb-2">Declarations & Signatures</h4>
                        <p className="text-xs text-slate-500 mb-4">I agree that the information contained in this referral form is true and accurate. I give permission for My Hope Housing to carry out checks on this information with other agencies (e.g. medical, probation, social services).</p>
                      </div>

                      <div>
                        <Label htmlFor="applicant_signature">Applicant Signature (or type Name to sign)</Label>
                        <Input id="applicant_signature" value={formData.applicant_signature} onChange={e => handleFormChange("applicant_signature", e.target.value)} placeholder="Type name or signature representation..." />
                      </div>

                      <div>
                        <Label htmlFor="signature_date">Date Signed</Label>
                        <Input id="signature_date" type="date" value={formData.signature_date} onChange={e => handleFormChange("signature_date", e.target.value)} />
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ==========================================
              COMMON PROCESSING & DECISION FIELDS
              ========================================== */}
          <div className="space-y-2 pt-4 border-t border-slate-200">
            <AccordionHeader title="General Referral Metadata & Status Processing" section="processing" />
            {expandedSections.processing && (
              <div className="p-4 border border-t-0 rounded-b-lg border-slate-200 bg-white grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="referral_date">Referral Date & Time *</Label>
                  <Input id="referral_date" type="datetime-local" value={coreData.referral_date} onChange={e => handleCoreChange("referral_date", e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="referral_from_url">Referral Document Link (Google Drive)</Label>
                  <Input id="referral_from_url" type="url" value={coreData.referral_from_url} onChange={e => handleCoreChange("referral_from_url", e.target.value)} placeholder="https://drive.google.com/..." />
                </div>
                <div>
                  <Label htmlFor="logged_by">Logged By</Label>
                  <Input id="logged_by" value={coreData.logged_by} onChange={e => handleCoreChange("logged_by", e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="status">Status *</Label>
                  <Select value={coreData.status} onValueChange={v => handleCoreChange("status", v)} required>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="received">Received</SelectItem>
                      <SelectItem value="under_assessment">Under Assessment</SelectItem>
                      <SelectItem value="awaiting_interview">Awaiting Interview</SelectItem>
                      <SelectItem value="interviewed">Interviewed</SelectItem>
                      <SelectItem value="accepted">Accepted</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="withdrawn">Withdrawn</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={coreData.priority} onValueChange={v => handleCoreChange("priority", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="assigned_to_user_id">Assigned To Staff</Label>
                  <Select value={coreData.assigned_to_user_id} onValueChange={v => handleCoreChange("assigned_to_user_id", v)}>
                    <SelectTrigger><SelectValue placeholder="Select staff member" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={null}>Unassigned</SelectItem>
                      {assignableUsers.map(user => (
                        <SelectItem key={user.id} value={user.name}>{user.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="accommodation_type_needed">Accommodation Needed</Label>
                  <Select value={coreData.accommodation_type_needed} onValueChange={v => handleCoreChange("accommodation_type_needed", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single_room">Single Room</SelectItem>
                      <SelectItem value="shared_room">Shared Room</SelectItem>
                      <SelectItem value="studio">Studio</SelectItem>
                      <SelectItem value="bedsit">Bedsit</SelectItem>
                      <SelectItem value="one_bedroom_flat">One Bedroom Flat</SelectItem>
                      <SelectItem value="two_bedroom_flat">Two Bedroom Flat</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="assessment_date">Assessment Date</Label>
                  <Input id="assessment_date" type="date" value={coreData.assessment_date} onChange={e => handleCoreChange("assessment_date", e.target.value)} />
                </div>

                <div>
                  <Label htmlFor="decision_date">Decision Date</Label>
                  <Input id="decision_date" type="date" value={coreData.decision_date} onChange={e => handleCoreChange("decision_date", e.target.value)} />
                </div>

                <div className="md:col-span-3">
                   <Label htmlFor="decision_reason">Decision Reason</Label>
                   <Input id="decision_reason" value={coreData.decision_reason} onChange={e => handleCoreChange("decision_reason", e.target.value)} placeholder="Reason for acceptance or rejection..." />
                </div>

                <div className="md:col-span-3">
                  <Label htmlFor="notes">Internal Referral Notes / Assessment Comments</Label>
                  <Textarea id="notes" value={coreData.notes} onChange={e => handleCoreChange("notes", e.target.value)} rows={3} placeholder="Add any comments or notes regarding this applicant..." />
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <Button type="button" variant="outline" onClick={onCancel}>
              <X className="w-4 h-4 mr-2" /> Cancel
            </Button>
            <Button type="submit" className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-medium">
              <Save className="w-4 h-4 mr-2" /> {referral ? "Update Referral Entry" : "Save Referral Entry"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}