"use client"

import React, { useState, useEffect } from "react";
import { useClerkSupabaseClient } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Save, FileText, Calendar } from "lucide-react";
import { format } from 'date-fns';

export default function SupportPlanForm_Supabase({ plan, residents, users, currentUser, activePlanType, onSubmit, onCancel, isAllocated = false }) {
  const getInitialDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const isQuarterlyReview = activePlanType === "quarterly_reviews";

  // Helper to normalize status from database format to form format
  const normalizeStatus = (status) => {
    if (!status) return null;
    const reverseMap = {
      'Up To Date': 'up_to_date',
      'Due': 'due',
      'Overdue': 'overdue',
      'No Review': 'no_review',
      'Document Missing': 'document_missing',
      'Document Combined/Uploaded': 'document_combined_uploaded',
      'Signature Missing': 'signature_missing'
    };
    return reverseMap[status] || status.toLowerCase().replace(/ /g, '_');
  };

  const [formData, setFormData] = useState(plan ? {
    ...plan,
    // For support notes: use datetime-local format (slice to 16 for YYYY-MM-DDTHH:MM)
    // For quarterly reviews: use date format (slice to 10 for YYYY-MM-DD)
    log_date: plan.Log_Date ? 
      (plan.Plan_Type === 'support_notes' || plan.plan_type === 'support_notes' ? plan.Log_Date.slice(0, 16) : plan.Log_Date.slice(0, 10))
      : (plan.log_date ? 
        (plan.plan_type === 'support_notes' ? plan.log_date.slice(0, 16) : plan.log_date.slice(0, 10))
        : ""),
    date_logged_by_office: plan.Date_Logged_By_Office ?
      (plan.Plan_Type === 'support_notes' || plan.plan_type === 'support_notes' ? plan.Date_Logged_By_Office.slice(0, 16) : plan.Date_Logged_By_Office.slice(0, 10))
      : (plan.date_logged_by_office ?
        (plan.plan_type === 'support_notes' ? plan.date_logged_by_office.slice(0, 16) : plan.date_logged_by_office.slice(0, 10))
        : getInitialDateTime()),
    next_review_date: plan.Next_Review_Date ? format(new Date(plan.Next_Review_Date), 'yyyy-MM-dd') : (plan.next_review_date ? format(new Date(plan.next_review_date), 'yyyy-MM-dd') : ""),
    review_completed_date: plan.Review_Completed_Date ? format(new Date(plan.Review_Completed_Date), 'yyyy-MM-dd') : (plan.review_completed_date ? format(new Date(plan.review_completed_date), 'yyyy-MM-dd') : ""),
    resident_id: plan.Resident_Id || plan.resident_id || "",
    plan_type: plan.Plan_Type || plan.plan_type || activePlanType,
    title: plan.Title || plan.title || "",
    description: plan.Description || plan.description || "",
    key_worker: plan.Key_Worker || plan.key_worker || currentUser?.full_name || "",
    status: normalizeStatus(plan.Status || plan.status) || (activePlanType === "support_notes" ? "document_combined_uploaded" : "up_to_date"),
    file_url: plan.File_Url || plan.file_url || "",
    additional_file_url: plan.Additional_File_Url || plan.additional_file_url || "", // <--- ADD THIS LINE HERE
    attended_in_person: plan.Attended_In_Person !== null && plan.Attended_In_Person !== undefined ? plan.Attended_In_Person : (plan.attended_in_person || false),
    attended_telephone: plan.Attended_Telephone !== null && plan.Attended_Telephone !== undefined ? plan.Attended_Telephone : (plan.attended_telephone || false),
    did_not_attend: plan.Did_Not_Attend !== null && plan.Did_Not_Attend !== undefined ? plan.Did_Not_Attend : (plan.did_not_attend || false),
    authorised_absence: plan.Authorised_Absence !== null && plan.Authorised_Absence !== undefined ? plan.Authorised_Absence : (plan.authorised_absence || false),
    signature_page_missing: plan.Signature_Page_Missing !== null && plan.Signature_Page_Missing !== undefined ? plan.Signature_Page_Missing : (plan.signature_page_missing || false),
    signature_page_missing_comments: plan.Signature_Page_Missing_Comments || plan.signature_page_missing_comments || "",
    support_hours: plan.Support_Hours !== null && plan.Support_Hours !== undefined ? plan.Support_Hours : (plan.support_hours !== null && plan.support_hours !== undefined ? plan.support_hours : null),
    support_worker_name: plan.Support_Worker_Name || plan.support_worker_name || "",
    goals_discussed: plan.Goals_Discussed || plan.goals_discussed || "",
    action_points: plan.Action_Points || plan.action_points || "",
    resident_feedback: plan.Resident_Feedback || plan.resident_feedback || "",
    created_date: plan["Created Date"] || plan.Created_Date || plan.created_date || ""
  } : {
    resident_id: "",
    plan_type: activePlanType,
    created_date: "",
    title: "",
    log_date: "",
    date_logged_by_office: getInitialDateTime(),
    key_worker: currentUser?.full_name || "",
    status: activePlanType === "support_notes" ? "document_combined_uploaded" : "up_to_date",
    file_url: "",
    additional_file_url: "", // <--- ADD THIS LINE HERE
    attended_in_person: false,
    attended_telephone: false,
    did_not_attend: false,
    authorised_absence: false,
    signature_page_missing: false,
    signature_page_missing_comments: "",
    support_hours: null,
    next_review_date: "",
    review_completed_date: "",
    support_worker_name: "",
    description: "",
    goals_discussed: "",
    action_points: "",
    resident_feedback: ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate resident_id is not empty
    if (!formData.resident_id || formData.resident_id.trim() === '') {
      alert('Please select a resident before saving.');
      return;
    }
    
    // Transform status to match database constraints
    const transformStatus = (status) => {
      const statusMap = {
        'document_missing': 'Document Missing',
        'document_combined_uploaded': 'Document Combined/Uploaded',
        'signature_missing': 'Signature Missing',
        'up_to_date': 'Up To Date',
        'due': 'Due',
        'overdue': 'Overdue'
      };
      return statusMap[status] || status;
    };

    // Convert to Supabase column names (with spaces)
    const supabaseData = {
      "Resident ID": formData.resident_id,
      "Plan Type": formData.plan_type,
      "Title": formData.title,
      "Log Date": formData.log_date,
      "Date Logged by Office": formData.date_logged_by_office,
      "Key Worker": formData.key_worker,
      "Status": transformStatus(formData.status),
      "File URL": formData.file_url || null,
      "Additional File URL": formData.additional_file_url || null, // <--- ADD THIS LINE HERE
      "Updated Date": new Date().toISOString()
    };

    // Generate ID for new records
    const isNewRecord = !plan || !plan.id;
    if (isNewRecord) {
      supabaseData["ID"] = crypto.randomUUID();
      supabaseData["Created Date"] = new Date().toISOString();
      supabaseData["Created By"] = currentUser?.email || currentUser?.primaryEmailAddress?.emailAddress || "Unknown";
    }

    // Add fields specific to support_notes table
    if (formData.plan_type === 'support_notes') {
      supabaseData["Description"] = formData.description || null;
      supabaseData["Attended In Person"] = formData.attended_in_person;
      supabaseData["Attended Telephone"] = formData.attended_telephone;
      supabaseData["Did Not Attend"] = formData.did_not_attend;
      supabaseData["Authorised Absence"] = formData.authorised_absence;
      supabaseData["Signature Page Missing"] = formData.signature_page_missing;
      supabaseData["Signature Page Missing Comments"] = formData.signature_page_missing_comments || null;
      supabaseData["Support Hours"] = formData.support_hours !== null && formData.support_hours !== undefined && formData.support_hours !== "" ? formData.support_hours : null;
    }

    // Add fields specific to quarterly_reviews table
    if (formData.plan_type === 'quarterly_reviews') {
      supabaseData["Description"] = formData.description || null;
      supabaseData["Next Review Date"] = formData.next_review_date || null;
      supabaseData["Review Completed Date"] = formData.review_completed_date || null;
      supabaseData["Support Worker Name"] = formData.support_worker_name || null;
      supabaseData["Goals Discussed"] = formData.goals_discussed || null;
      supabaseData["Action Points"] = formData.action_points || null;
      supabaseData["Resident Feedback"] = formData.resident_feedback || null;
    }
    
    onSubmit(supabaseData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAttendanceChange = (field, checked) => {
    // Clear other attendance options when one is selected
    const clearedAttendance = {
      attended_in_person: false,
      attended_telephone: false,
      did_not_attend: false,
      authorised_absence: false
    };

    setFormData(prev => ({
      ...prev,
      ...clearedAttendance,
      [field]: checked
    }));
  };

  return (
    <Card className="mb-6 shadow-md">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          {isQuarterlyReview ? (
            <>
              <Calendar className="w-5 h-5 text-indigo-600" />
              {plan ? "Edit Quarterly Review" : "Add New Quarterly Review"}
            </>
          ) : (
            <>
              <FileText className="w-5 h-5 text-indigo-600" />
              {plan ? "Edit Support Note" : "Add New Support Note"}
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">

          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-8 mt-2">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="entry_date_time">Entry Date & Time</Label>
                <Input
                  id="entry_date_time"
                  value={formData.created_date ? format(new Date(formData.created_date), 'dd/MM/yyyy HH:mm') : format(new Date(), 'dd/MM/yyyy HH:mm')}
                  disabled
                  className="bg-slate-100 cursor-not-allowed text-slate-500"
                />
              </div>
              <div>
                <Label htmlFor="resident_id">Resident *</Label>
                <Select value={formData.resident_id} onValueChange={v => handleChange("resident_id", v)} required>
                  <SelectTrigger><SelectValue placeholder="Select resident" /></SelectTrigger>
                  <SelectContent>
                    {residents?.filter(r => {
                      const residentStatus = (r.Status || r.status || '').toLowerCase();
                      return residentStatus === 'active';
                    }).map(resident => (
                      <SelectItem key={resident.Id || resident.id} value={resident.Id || resident.id}>
                        {resident.First_Name || resident.first_name} {resident.Last_Name || resident.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="key_worker">Logged by *</Label>
                <Input
                  id="key_worker"
                  value={formData.key_worker}
                  onChange={e => handleChange("key_worker", e.target.value)}
                  placeholder="Staff name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="log_date">
                  {isQuarterlyReview ? "Support Session Date *" : "Support Session Date & Time *"}
                </Label>
                <Input
                  id="log_date"
                  type={isQuarterlyReview ? "date" : "datetime-local"}
                  value={formData.log_date}
                  onChange={e => handleChange("log_date", e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="date_logged_by_office">
                  {isQuarterlyReview ? "Date logged by office *" : "Date & Time logged by office *"}
                </Label>
                <Input
                  id="date_logged_by_office"
                  type={isQuarterlyReview ? "date" : "datetime-local"}
                  value={formData.date_logged_by_office}
                  onChange={e => handleChange("date_logged_by_office", e.target.value)}
                  required
                />
              </div>

              {isQuarterlyReview && (
                <>
                  <div>
                    <Label htmlFor="review_completed_date">Date quarterly review was completed</Label>
                    <Input
                      id="review_completed_date"
                      type="date"
                      value={formData.review_completed_date || ""}
                      onChange={e => handleChange("review_completed_date", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="support_worker_name">Support Worker Name *</Label>
                    <Select value={formData.support_worker_name || ""} onValueChange={v => handleChange("support_worker_name", v)} required>
                      <SelectTrigger><SelectValue placeholder="Select support worker" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Hasib">Hasib</SelectItem>
                        <SelectItem value="Jess">Jess</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:col-span-1">
                <div>
                  <Label htmlFor="status">{isQuarterlyReview ? "Status" : "Document Status"}</Label>
                  <Select value={formData.status} onValueChange={v => handleChange("status", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {isQuarterlyReview ? (
                        <>
                          <SelectItem value="up_to_date">Up to date</SelectItem>
                          <SelectItem value="due">Due</SelectItem>
                          <SelectItem value="overdue">Overdue</SelectItem>
                        </>
                      ) : (
                        <>
                          <SelectItem value="document_combined_uploaded">Document Combined/Uploaded</SelectItem>
                          <SelectItem value="document_missing">Document Missing</SelectItem>
                          <SelectItem value="signature_missing">Signature Missing</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                {isQuarterlyReview && (
                  <div>
                    <Label htmlFor="next_review_date">Next Review Date</Label>
                    <Input
                      id="next_review_date"
                      type="date"
                      value={formData.next_review_date || ""}
                      onChange={e => handleChange("next_review_date", e.target.value)}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-8 mt-2">Note Details</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">
                  {isQuarterlyReview ? "Review Title *" : "Note Title *"}
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={e => handleChange("title", e.target.value)}
                  placeholder={isQuarterlyReview ? "e.g., Q1 2024 Support Review" : "e.g., Weekly check-in meeting"}
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">
                  {isQuarterlyReview ? "Review Description" : "Note Description"}
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={e => handleChange("description", e.target.value)}
                  placeholder={isQuarterlyReview ? "Describe what was discussed in this quarterly review..." : "Describe what was discussed or observed during this support session..."}
                  rows={4}
                />
              </div>

              {!isQuarterlyReview && (
                <div>
                  <Label htmlFor="support_hours">Support Hours (optional)</Label>
                  <Input
                    id="support_hours"
                    type="number"
                    step="0.5"
                    min="0"
                    value={formData.support_hours !== null && formData.support_hours !== undefined ? formData.support_hours : ""}
                    onChange={e => handleChange("support_hours", e.target.value === "" ? null : parseFloat(e.target.value))}
                    placeholder="e.g., 1.5"
                  />
                  <p className="text-xs text-slate-500 mt-1">Number of hours spent on this support session</p>
                </div>
              )}

              {isQuarterlyReview && (
                <>
                  <div>
                    <Label htmlFor="goals_discussed">Goals Discussed</Label>
                    <Textarea
                      id="goals_discussed"
                      value={formData.goals_discussed}
                      onChange={e => handleChange("goals_discussed", e.target.value)}
                      placeholder="What goals were discussed with the resident..."
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="action_points">Action Points</Label>
                    <Textarea
                      id="action_points"
                      value={formData.action_points}
                      onChange={e => handleChange("action_points", e.target.value)}
                      placeholder="What actions need to be taken..."
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="resident_feedback">Resident Feedback</Label>
                    <Textarea
                      id="resident_feedback"
                      value={formData.resident_feedback}
                      onChange={e => handleChange("resident_feedback", e.target.value)}
                      placeholder="Any feedback from the resident..."
                      rows={3}
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {!isQuarterlyReview && (
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-8 mt-2">Attendance</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="attended_in_person"
                    checked={formData.attended_in_person}
                    onCheckedChange={(checked) => handleAttendanceChange("attended_in_person", checked)}
                  />
                  <Label htmlFor="attended_in_person">Attended - in person</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="attended_telephone"
                    checked={formData.attended_telephone}
                    onCheckedChange={(checked) => handleAttendanceChange("attended_telephone", checked)}
                  />
                  <Label htmlFor="attended_telephone">Attended - telephone session</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="did_not_attend"
                    checked={formData.did_not_attend}
                    onCheckedChange={(checked) => handleAttendanceChange("did_not_attend", checked)}
                  />
                  <Label htmlFor="did_not_attend">Did not attend</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="authorised_absence"
                    checked={formData.authorised_absence}
                    onCheckedChange={(checked) => handleAttendanceChange("authorised_absence", checked)}
                  />
                  <Label htmlFor="authorised_absence">Authorised absence</Label>
                </div>
              </div>
            </div>
          )}

          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-8 mt-2">Document</h3>
            <div>
              <Label htmlFor="file_url">Document URL</Label>
              <Input
                id="file_url"
                type="url"
                value={formData.file_url}
                onChange={e => handleChange("file_url", e.target.value)}
                placeholder="https://gdrive.com/..."
              />
              <p className="text-xs text-slate-500 mt-1">
                Please enter a valid URL (must start with http:// or https://)
              </p>
            </div>
              {/* START OF NEW CODE BLOCK */}
            <div className="mt-4"> {/* Add margin for visual separation */}
              <Label htmlFor="additional_file_url">Additional Document URL (If support is 2 hours)</Label>
              <Input
                id="additional_file_url"
                type="url"
                value={formData.additional_file_url}
                onChange={e => handleChange("additional_file_url", e.target.value)}
                placeholder="https://gdrive.com/..."
              />
              <p className="text-xs text-slate-500 mt-1">
                Please enter a valid URL (must start with http:// or https://)
              </p>
            </div>
            {/* END OF NEW CODE BLOCK */}
          </div>

          {isQuarterlyReview && formData.resident_id && (
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-6">Quarterly Review History</h3>
              <div className="bg-slate-50 rounded-lg p-4 border">
                <QuarterlyReviewHistory residentId={formData.resident_id} isAllocated={isAllocated} />
              </div>
            </div>
          )}

          {!isQuarterlyReview && (
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-8 mt-2">Document Issues</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="signature_page_missing"
                    checked={formData.signature_page_missing}
                    onCheckedChange={(checked) => handleChange("signature_page_missing", checked)}
                  />
                  <Label
                    htmlFor="signature_page_missing"
                    className={formData.signature_page_missing ? "text-red-600 font-semibold" : ""}
                  >
                    Signature page missing
                  </Label>
                </div>
                {formData.signature_page_missing && (
                  <div>
                    <Label htmlFor="signature_page_missing_comments">Comments for follow-up *</Label>
                    <Textarea
                      id="signature_page_missing_comments"
                      value={formData.signature_page_missing_comments}
                      onChange={(e) => handleChange("signature_page_missing_comments", e.target.value)}
                      placeholder="Describe the issue and next steps..."
                      required
                      className="mt-1"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onCancel}>
              <X className="w-4 h-4 mr-2" /> Cancel
            </Button>
            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
              <Save className="w-4 h-4 mr-2" />
              {plan ? "Update Entry" : "Save Entry"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// New component to display quarterly review history
function QuarterlyReviewHistory({ residentId, isAllocated }) {
  const [reviewHistory, setReviewHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const supabase = useClerkSupabaseClient();

  useEffect(() => {
    const loadReviewHistory = async () => {
      if (!residentId) {
        setReviewHistory([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        let allReviews = [];

        if (isAllocated) {
          // For allocated residents, reviews are in allocated_quarterly_reviews
          const { data, error } = await supabase
            .from('allocated_quarterly_reviews')
            .select('*')
            .eq('"Resident ID"', residentId)
            .eq('"Deleted"', false)
            .order('"Log Date"', { ascending: false });

          if (error) throw error;
          allReviews = data || [];
        } else {
          // For standard residents, reviews could be in quarterly_reviews OR legacy support_notes
          const [qrResult, snResult] = await Promise.all([
            supabase.from('quarterly_reviews').select('*').eq('"Resident ID"', residentId).eq('"Deleted"', false),
            supabase.from('support_notes').select('*').eq('"Resident ID"', residentId).eq('"Plan Type"', 'quarterly_reviews').eq('"Deleted"', false)
          ]);

          if (qrResult.error) throw qrResult.error;
          if (snResult.error) throw snResult.error;

          allReviews = [...(qrResult.data || []), ...(snResult.data || [])];

          // Sort by Log Date descending
          allReviews.sort((a, b) => {
            const dateA = new Date(a['Log Date'] || a.Log_Date || 0);
            const dateB = new Date(b['Log Date'] || b.Log_Date || 0);
            return dateB - dateA;
          });
        }

        setReviewHistory(allReviews);
      } catch (error) {
        console.error("Error loading review history:", error);
        setReviewHistory([]);
      } finally {
        setLoading(false);
      }
    };

    loadReviewHistory();
  }, [residentId]);

  if (loading) {
    return <div className="text-sm text-slate-500">Loading review history...</div>;
  }

  if (reviewHistory.length === 0) {
    return (
      <div className="text-center py-4">
        <Calendar className="w-8 h-8 text-slate-400 mx-auto mb-2" />
        <p className="text-sm text-slate-500">No previous quarterly reviews found for this resident.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600 mb-3">
        Previous quarterly reviews for this resident ({reviewHistory.length} total):
      </p>
      <div className="space-y-3 max-h-60 overflow-y-auto">
        {reviewHistory.map((review, index) => (
          <div key={review.Id || index} className="bg-white rounded-lg border p-3 text-sm">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-medium text-slate-900">{review.Title || review['Title']}</h4>
              <span className="text-xs text-slate-500">
                {(review.Log_Date || review['Log Date']) ? format(new Date(review.Log_Date || review['Log Date']), 'dd/MM/yyyy HH:mm') : 'N/A'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-600">
              {(review.Review_Completed_Date || review['Review Completed Date']) && (
                <div>
                  <span className="font-medium">Review Completed:</span> {format(new Date(review.Review_Completed_Date || review['Review Completed Date']), 'dd/MM/yyyy')}
                </div>
              )}
              {(review.Support_Worker_Name || review['Support Worker Name']) && (
                <div>
                  <span className="font-medium">Support Worker:</span> {review.Support_Worker_Name || review['Support Worker Name']}
                </div>
              )}
              {(review.Key_Worker || review['Key Worker'] || review.Created_By || review['Created By']) && (
                <div>
                  <span className="font-medium">Logged By:</span> {review.Key_Worker || review['Key Worker'] || review.Created_By || review['Created By'] || '-'}
                </div>
              )}
              {(review.Next_Review_Date || review['Next Review Date']) && (
                <div>
                  <span className="font-medium">Next Review Due:</span> {format(new Date(review.Next_Review_Date || review['Next Review Date']), 'dd/MM/yyyy')}
                </div>
              )}
              <div>
                <span className="font-medium">Status:</span> {(review.Status || review['Status'])?.replace(/_/g, ' ')}
              </div>
            </div>

            {(review.Description || review['Description']) && (
              <div className="mt-2 pt-2 border-t">
                <span className="font-medium text-slate-700">Description:</span>
                <p className="text-slate-600 mt-1">{review.Description || review['Description']}</p>
              </div>
            )}

            {(review.File_Url || review['File URL']) && (
              <div className="mt-2">
                <a
                  href={review.File_Url || review['File URL']}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800"
                >
                  <FileText className="w-3 h-3" />
                  View Document
                </a>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
