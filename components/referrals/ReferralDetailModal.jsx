"use client"

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
    Calendar, User, UserPlus, Info, Home, Edit, Trash2, ChevronDown, ChevronUp, Link as LinkIcon, Building
} from 'lucide-react';
import { format } from 'date-fns';

const DetailItem = ({ icon, label, children }) => (
  <div className="flex items-start gap-3">
    {icon && (
      <div className="flex-shrink-0 w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
        {React.cloneElement(icon, { className: "w-4 h-4 text-slate-600" })}
      </div>
    )}
    <div>
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <div className="text-sm font-semibold text-slate-900">{children || <span className="text-xs font-normal text-slate-400">Not provided</span>}</div>
    </div>
  </div>
);

const formatDateSafe = (dateString, formatStr = 'dd MMMM yyyy, HH:mm') => {
  if (!dateString) return null;
  try {
    return format(new Date(dateString), formatStr);
  } catch (e) {
    return dateString;
  }
};

export default function ReferralDetailModal({ 
  referral, 
  getStatusColor, 
  getUserName, 
  getLoggedByName, 
  onClose, 
  onEdit,
  onDelete 
}) {
  if (!referral) return null;

  const isSelfReferral = referral.referral_type === 'self-referral';

  // State to track expanded sections in the details modal
  const [expandedSections, setExpandedSections] = useState({
    personal: true,
    address: false,
    health: false,
    substance: false,
    offending: false,
    support: false,
    risks: false,
    consent: false,
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Safe parsing of Form Data
  let formData = {};
  if (isSelfReferral && referral) {
    // Both flat column references and JSONB metadata checks
    const fd = referral.form_data || referral.Form_Data;
    if (fd) {
      formData = typeof fd === 'string' ? JSON.parse(fd) : fd;
    }
  }

  const AccordionHeader = ({ title, section, count }) => (
    <div
      onClick={() => toggleSection(section)}
      className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 cursor-pointer rounded-lg border border-slate-200 transition-colors mt-3"
    >
      <span className="font-semibold text-sm text-slate-800 flex items-center gap-2">
        {title}
        {count !== undefined && <Badge variant="secondary" className="ml-1 text-xs">{count}</Badge>}
      </span>
      {expandedSections[section] ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
    </div>
  );

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full p-0">
        <ScrollArea className="max-h-[90vh]">
          <div className="p-6">
            <DialogHeader className="mb-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-r from-fuchsia-500 to-pink-500 rounded-xl flex items-center justify-center shadow-sm">
                    <UserPlus className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <DialogTitle className="text-2xl font-bold text-slate-900">{referral.applicant_name}</DialogTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={getStatusColor(referral.status)}>{referral.status?.replace(/_/g, ' ')}</Badge>
                      <Badge variant="outline" className="capitalize text-xs">{referral.priority} priority</Badge>
                      <Badge className="bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200 hover:bg-fuchsia-100 text-xs">
                        {isSelfReferral ? 'Self-Referral' : 'Organisation Referral'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </DialogHeader>

            {/* ==============================================
                COMMON TOP-LEVEL METADATA
                ============================================== */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <DetailItem icon={<Calendar />} label="Referral Date & Time">
                {referral.referral_date ? format(new Date(referral.referral_date), 'dd MMMM yyyy, HH:mm') : null}
              </DetailItem>
              <DetailItem icon={<User />} label="Applicant DOB">
                {referral.applicant_dob ? format(new Date(referral.applicant_dob), 'dd MMMM yyyy') : null}
              </DetailItem>
              {!isSelfReferral && referral.referred_by_agency && (
                <DetailItem icon={<Building />} label="Referred By Agency">{referral.referred_by_agency}</DetailItem>
              )}
              {referral.referral_from_url && (
                <DetailItem icon={<LinkIcon />} label="Referral Document">
                  <a 
                    href={referral.referral_from_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-fuchsia-600 hover:text-fuchsia-800 underline text-xs font-semibold"
                  >
                    View Document
                  </a>
                </DetailItem>
              )}
              {getLoggedByName && (
                <DetailItem icon={<User />} label="Logged By">{getLoggedByName(referral)}</DetailItem>
              )}
              <DetailItem icon={<Home />} label="Accommodation Needed">
                {referral.accommodation_type_needed?.replace(/_/g, ' ')}
              </DetailItem>
            </div>

            {/* ==============================================
                IF ORGANISATION REFERRAL (SIMPLE FIELDS)
                ============================================== */}
            {!isSelfReferral ? (
              <div className="space-y-4 mt-6">
                {referral.referral_reason && (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800 mb-1">Reason for Referral</h4>
                    <p className="text-slate-700 text-sm whitespace-pre-wrap bg-slate-50 p-3 rounded-lg border border-slate-100">{referral.referral_reason}</p>
                  </div>
                )}
                {referral.notes && (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800 mb-1">Additional Notes</h4>
                    <p className="text-slate-700 text-sm whitespace-pre-wrap bg-slate-50 p-3 rounded-lg border border-slate-100">{referral.notes}</p>
                  </div>
                )}
              </div>
            ) : (
              /* ==============================================
                 IF SELF-REFERRAL (COMPREHENSIVE 9-PAGE VIEW)
                 ============================================== */
              <div className="space-y-1">

                {/* Accordion: Page 1 Personal Details */}
                <AccordionHeader title="Page 1: Personal Details & Next of Kin" section="personal" />
                {expandedSections.personal && (
                  <div className="p-4 border border-t-0 rounded-b-lg border-slate-200 bg-white grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <DetailItem label="Title">{formData.title}</DetailItem>
                    <DetailItem label="National Insurance Number">{formData.ni_number}</DetailItem>
                    <DetailItem label="Gender">{formData.gender}</DetailItem>
                    <DetailItem label="Pronouns">{formData.pronouns}</DetailItem>
                    <DetailItem label="Contact Number">{formData.contact_number}</DetailItem>
                    <DetailItem label="Email Address">{formData.email}</DetailItem>
                    <DetailItem label="Marital Status">{formData.martial_status}</DetailItem>
                    <DetailItem label="Ethnic Origin">{formData.ethnic_origin}</DetailItem>
                    <DetailItem label="Religion">{formData.religion}</DetailItem>
                    <DetailItem label="Sexual Orientation">{formData.sexual_orientation}</DetailItem>

                    <div className="col-span-full border-t border-slate-100 pt-3 mt-2">
                      <h5 className="font-semibold text-xs text-slate-600 uppercase tracking-wide">Next of Kin / Emergency Contact</h5>
                    </div>
                    <DetailItem label="NoK Name">{formData.nok_name}</DetailItem>
                    <DetailItem label="Relationship">{formData.nok_relationship}</DetailItem>
                    <DetailItem label="Contact Phone">{formData.nok_phone}</DetailItem>
                    <DetailItem label="Full Address" className="col-span-2">{formData.nok_address}</DetailItem>
                  </div>
                )}

                {/* Accordion: Page 2 Address History */}
                <AccordionHeader title="Page 2: Address History" section="address" count={formData.address_history?.length} />
                {expandedSections.address && (
                  <div className="p-4 border border-t-0 rounded-b-lg border-slate-200 bg-white space-y-3">
                    {formData.address_history && formData.address_history.length > 0 ? (
                      formData.address_history.map((row, idx) => (
                        <div key={idx} className="p-3 border border-slate-150 rounded-lg bg-slate-50/50 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                          <div className="sm:col-span-2">
                            <span className="text-xs font-semibold text-slate-400 block">Address</span>
                            <span className="text-sm font-semibold text-slate-800">{row.address || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-xs font-semibold text-slate-400 block">Period</span>
                            <span className="text-sm font-semibold text-slate-800">{row.dates_from} - {row.dates_to}</span>
                          </div>
                          <div>
                            <span className="text-xs font-semibold text-slate-400 block">Tenure / Status</span>
                            <span className="text-sm font-semibold text-slate-800">{row.tenure || 'N/A'}</span>
                          </div>
                          <div className="sm:col-span-4 mt-1 border-t border-slate-100 pt-1">
                            <span className="text-xs font-semibold text-slate-400 block">Reason For Leaving</span>
                            <span className="text-sm text-slate-700">{row.reason_for_leaving || 'N/A'}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400">No address history provided.</span>
                    )}
                  </div>
                )}

                {/* Accordion: Page 3 Physical & Mental Health */}
                <AccordionHeader title="Page 3: Physical & Mental Health Support" section="health" />
                {expandedSections.health && (
                  <div className="p-4 border border-t-0 rounded-b-lg border-slate-200 bg-white space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <DetailItem label="GP Name">{formData.gp_name}</DetailItem>
                      <DetailItem label="GP Surgery">{formData.gp_surgery}</DetailItem>
                      <DetailItem label="GP Contact Details">{formData.gp_contact}</DetailItem>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-slate-500 block">Diagnosed Physical Medical Conditions</span>
                      <p className="text-sm text-slate-800 whitespace-pre-wrap bg-slate-50 p-2 rounded-md mt-1">{formData.medical_conditions || 'None reported'}</p>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-slate-500 block">Prescribed Medication & Dosage</span>
                      <p className="text-sm text-slate-800 whitespace-pre-wrap bg-slate-50 p-2 rounded-md mt-1">{formData.prescribed_medication || 'None reported'}</p>
                    </div>
                    <div>
                      <DetailItem label="Medication Storage requirements">{formData.needs_medication_storage}</DetailItem>
                    </div>
                    <div className="border-t border-slate-100 pt-3">
                      <h5 className="font-semibold text-xs text-slate-600 uppercase tracking-wide mb-2">Mental Health</h5>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <DetailItem label="Care Coordinator Name">{formData.mental_health_care_coordinator}</DetailItem>
                        <DetailItem label="Mental Health Team / Clinic">{formData.mental_health_team}</DetailItem>
                        <DetailItem label="MH Team Contact details">{formData.mental_health_team_contact}</DetailItem>
                      </div>
                      <div className="mt-2">
                        <span className="text-xs font-medium text-slate-500 block">Diagnosed Mental Health History</span>
                        <p className="text-sm text-slate-800 whitespace-pre-wrap bg-slate-50 p-2 rounded-md mt-1">{formData.mental_health_diagnosis || 'None reported'}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Accordion: Page 4 Substance Misuse */}
                <AccordionHeader title="Page 4: Substance Misuse Details" section="substance" />
                {expandedSections.substance && (
                  <div className="p-4 border border-t-0 rounded-b-lg border-slate-200 bg-white space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <DetailItem label="Drug Misuse History">{formData.uses_drugs}</DetailItem>
                      <DetailItem label="Alcohol Misuse History">{formData.uses_alcohol}</DetailItem>
                    </div>
                    {formData.uses_drugs !== 'No' && (
                      <div>
                        <span className="text-xs font-medium text-slate-500 block">Drug Types, Frequency & Administering Methods</span>
                        <p className="text-sm text-slate-800 whitespace-pre-wrap bg-slate-50 p-2 rounded-md mt-1">{formData.drug_types_frequency || 'N/A'}</p>
                      </div>
                    )}
                    {formData.uses_alcohol !== 'No' && (
                      <div>
                        <span className="text-xs font-medium text-slate-500 block">Alcohol Quantities & Frequency</span>
                        <p className="text-sm text-slate-800 whitespace-pre-wrap bg-slate-50 p-2 rounded-md mt-1">{formData.alcohol_units_frequency || 'N/A'}</p>
                      </div>
                    )}
                    <div className="border-t border-slate-100 pt-3">
                      <h5 className="font-semibold text-xs text-slate-600 uppercase tracking-wide mb-2">Treatment Provider Info</h5>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <DetailItem label="Treatment Agency">{formData.substance_misuse_treatment_agency}</DetailItem>
                        <DetailItem label="Keyworker Name">{formData.substance_misuse_worker_name}</DetailItem>
                        <DetailItem label="Keyworker Contact">{formData.substance_misuse_worker_contact}</DetailItem>
                      </div>
                    </div>
                  </div>
                )}

                {/* Accordion: Page 5 Offending History */}
                <AccordionHeader title="Page 5: Offending History & Probation" section="offending" />
                {expandedSections.offending && (
                  <div className="p-4 border border-t-0 rounded-b-lg border-slate-200 bg-white space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <DetailItem label="Has Convictions?">{formData.has_convictions}</DetailItem>
                      <DetailItem label="Under Active Probation?">{formData.on_probation}</DetailItem>
                      <DetailItem label="On Multi-Agency Register?">{formData.is_on_multi_agency_register}</DetailItem>
                    </div>
                    {formData.has_convictions !== 'No' && (
                      <div>
                        <span className="text-xs font-medium text-slate-500 block">Conviction & Offence Details</span>
                        <p className="text-sm text-slate-800 whitespace-pre-wrap bg-slate-50 p-2 rounded-md mt-1">{formData.conviction_details || 'N/A'}</p>
                      </div>
                    )}
                    {formData.on_probation === 'Yes' && (
                      <div className="border-t border-slate-100 pt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <DetailItem label="Probation Officer">{formData.probation_officer_name}</DetailItem>
                        <DetailItem label="Probation Office">{formData.probation_office}</DetailItem>
                        <DetailItem label="Officer Phone/Email">{formData.probation_contact}</DetailItem>
                      </div>
                    )}
                    {formData.is_on_multi_agency_register === 'Yes' && (
                      <div className="mt-2">
                        <DetailItem label="Register Details">{formData.register_details}</DetailItem>
                      </div>
                    )}
                  </div>
                )}

                {/* Accordion: Page 6 Support Needs Checklist */}
                <AccordionHeader title="Page 6: Supported Accommodation Eligibility Checklist" section="support" count={formData.support_needs?.length} />
                {expandedSections.support && (
                  <div className="p-4 border border-t-0 rounded-b-lg border-slate-200 bg-white">
                    <p className="text-xs text-slate-500 mb-3">Below are the verified support needs of the applicant (minimum 5 required for supported housing):</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {formData.support_needs && formData.support_needs.length > 0 ? (
                        formData.support_needs.map((need, idx) => (
                          <div key={idx} className="flex items-center gap-2 p-2 bg-fuchsia-50/50 rounded-md border border-fuchsia-100 text-xs font-medium text-fuchsia-950">
                            <span className="w-1.5 h-1.5 bg-fuchsia-500 rounded-full flex-shrink-0"></span>
                            {need}
                          </div>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400">None selected.</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Accordion: Pages 7 & 8 Risk Assessment Matrix */}
                <AccordionHeader title="Pages 7 & 8: Risk Assessment Matrix" section="risks" />
                {expandedSections.risks && (
                  <div className="p-4 border border-t-0 rounded-b-lg border-slate-200 bg-white space-y-4">

                    <div className="space-y-3">
                      <h5 className="font-bold text-xs text-slate-600 uppercase tracking-wide border-b pb-1">Risks regarding Children</h5>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50 p-2 rounded border">
                        <DetailItem label="Has Children?">{formData.risk_children}</DetailItem>
                        <span className="col-span-2 text-xs text-slate-600 italic">Details: {formData.risk_children_details || 'N/A'}</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50 p-2 rounded border">
                        <DetailItem label="Concern re Risk to Children?">{formData.concern_risk_to_children}</DetailItem>
                        <span className="col-span-2 text-xs text-slate-600 italic">Details: {formData.concern_risk_to_children_details || 'N/A'}</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50 p-2 rounded border">
                        <DetailItem label="Abilities Reduced?">{formData.abilities_reduced}</DetailItem>
                        <span className="col-span-2 text-xs text-slate-600 italic">Details: {formData.abilities_reduced_details || 'N/A'}</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50 p-2 rounded border">
                        <DetailItem label="Known to Social Services?">{formData.known_to_social_services}</DetailItem>
                        <span className="col-span-2 text-xs text-slate-600 italic">Details: {formData.known_to_social_services_details || 'N/A'}</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50 p-2 rounded border">
                        <DetailItem label="Safeguarding Concerns?">{formData.safeguarding_concerns}</DetailItem>
                        <span className="col-span-2 text-xs text-slate-600 italic">Details: {formData.safeguarding_concerns_details || 'N/A'}</span>
                      </div>
                    </div>

                    <div className="space-y-3 pt-2">
                      <h5 className="font-bold text-xs text-slate-600 uppercase tracking-wide border-b pb-1">General Risk Indicators</h5>
                      <div className="space-y-2">
                        {[
                          { label: "Risk of Self Harm", val: formData.risk_self_harm, details: formData.risk_self_harm_details },
                          { label: "Risk of Neglect", val: formData.risk_neglect, details: formData.risk_neglect_details },
                          { label: "Potential Harm from others", val: formData.risk_harm_from_others, details: formData.risk_harm_from_others_details },
                          { label: "Risk of Domestic Abuse", val: formData.risk_domestic_abuse, details: formData.risk_domestic_abuse_details },
                          { label: "Risk of Suicide", val: formData.risk_suicide, details: formData.risk_suicide_details },
                          { label: "Risk of Police/Law involvement", val: formData.risk_law_enforcement, details: formData.risk_law_enforcement_details },
                          { label: "Risk from MH Diagnosis", val: formData.risk_mental_health_diagnosis, details: formData.risk_mental_health_diagnosis_details },
                          { label: "Risk from Medical Condition", val: formData.risk_medical_condition, details: formData.risk_medical_condition_details },
                          { label: "Known Vulnerabilities", val: formData.risk_vulnerabilities, details: formData.risk_vulnerabilities_details },
                          { label: "Physical Disabilities/Falls", val: formData.risk_physical_disabilities, details: formData.risk_physical_disabilities_details },
                          { label: "Risk of Violence", val: formData.risk_violence, details: formData.risk_violence_details },
                          { label: "Risk of Social Isolation", val: formData.risk_social_isolation, details: formData.risk_social_isolation_details },
                          { label: "Accidental Fire Setting", val: formData.risk_accidental_fire, details: formData.risk_accidental_fire_details },
                          { label: "Arson", val: formData.risk_arson, details: formData.risk_arson_details },
                          { label: "Ex Offender", val: formData.risk_ex_offender, details: formData.risk_ex_offender_details },
                          { label: "Sex Offender", val: formData.risk_sex_offender, details: formData.risk_sex_offender_details },
                          { label: "Violent Offender", val: formData.risk_violent_offender, details: formData.risk_violent_offender_details },
                          { label: "Risk of Substance Misuse", val: formData.risk_substance_misuse, details: formData.risk_substance_misuse_details }
                        ].map((row, idx) => (
                          <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-2 border-b border-slate-100 pb-2 items-center">
                            <span className="text-xs font-semibold text-slate-700">{row.label}</span>
                            <span className="text-xs text-center"><Badge variant={row.val !== 'No' ? 'destructive' : 'outline'}>{row.val || 'No'}</Badge></span>
                            <span className="col-span-2 text-xs text-slate-600 italic">Details: {row.details || 'N/A'}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                )}

                {/* Accordion: Pages 8 & 9 Consents & Signatures */}
                <AccordionHeader title="Pages 8 & 9: Involvement, Declarations & Consents" section="consent" />
                {expandedSections.consent && (
                  <div className="p-4 border border-t-0 rounded-b-lg border-slate-200 bg-white grid grid-cols-1 md:grid-cols-2 gap-4">
                    <DetailItem label="Agrees to receiving supported accommodation support?">{formData.eligibility_benefits}</DetailItem>
                    <DetailItem label="Agrees to eligibility criteria (benefits, 18+, unemployed/part-time < 16 hrs)?">{formData.consent_personal_info}</DetailItem>
                    <DetailItem label="Consents to storing personal details on system database (GDPR/Data Protection Act)?">{formData.consent_pronouns}</DetailItem>
                    <DetailItem label="Consents to using chosen name/pronouns verbally?">{formData.consent_ongoing_contact}</DetailItem>
                    <DetailItem label="Consents to on-going contact after support ends?">{formData.information_sharing_consent}</DetailItem>

                    <div className="col-span-full border-t border-slate-100 pt-3 mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <DetailItem label="Applicant Signature / Name Typed">{formData.applicant_signature}</DetailItem>
                      <DetailItem label="Date Signed">{formData.signature_date ? format(new Date(formData.signature_date), 'dd MMMM yyyy') : null}</DetailItem>
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* ==============================================
                COMMON INTERNAL ADMINISTRATIVE PROCESSING
                ============================================== */}
            <Separator className="my-6" />
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Internal Staff Processing & Decision</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <DetailItem icon={<User />} label="Assigned To Staff">{getUserName(referral.assigned_to_user_id)}</DetailItem>
              <DetailItem icon={<Calendar />} label="Assessment Scheduled Date">
                {referral.assessment_date ? format(new Date(referral.assessment_date), 'dd MMMM yyyy') : null}
              </DetailItem>
              <DetailItem icon={<Calendar />} label="Decision Finalized Date">
                {referral.decision_date ? format(new Date(referral.decision_date), 'dd MMMM yyyy') : null}
              </DetailItem>
            </div>
            
            {referral.decision_reason && (
              <div className="mt-4">
                <span className="text-xs font-medium text-slate-500 block">Decision / Acceptance Reason</span>
                <p className="text-sm text-slate-700 whitespace-pre-wrap bg-slate-50 p-2 rounded-md mt-1">{referral.decision_reason}</p>
              </div>
            )}

            {referral.notes && isSelfReferral && (
              <div className="mt-4">
                <span className="text-xs font-medium text-slate-500 block">Administrative Staff Notes</span>
                <p className="text-sm text-slate-700 whitespace-pre-wrap bg-slate-50 p-2 rounded-md mt-1">{referral.notes}</p>
              </div>
            )}

            <Separator className="my-6" />
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Record History & Progress</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <DetailItem icon={<User />} label="Created By">
                {referral.created_by || 'Unknown'}
              </DetailItem>
              <DetailItem icon={<Calendar />} label="Created Date">
                {formatDateSafe(referral.created_date)}
              </DetailItem>
              <DetailItem icon={<User />} label="Last Updated By">
                {referral.updated_by || 'N/A'}
              </DetailItem>
              <DetailItem icon={<Calendar />} label="Last Updated Date">
                {formatDateSafe(referral.updated_date)}
              </DetailItem>
            </div>

            <DialogFooter className="mt-8 flex justify-between gap-4 border-t pt-4">
              <Button 
                onClick={() => {
                  onClose();
                  onDelete(referral);
                }} 
                variant="destructive"
                className="bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Entry
              </Button>
              <Button onClick={() => {
                onClose();
                onEdit(referral);
              }} className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-medium">
                <Edit className="w-4 h-4 mr-2" />
                Edit Referral Info
              </Button>
            </DialogFooter>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}