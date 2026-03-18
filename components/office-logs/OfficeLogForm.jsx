import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { Calendar as CalendarIcon, X } from "lucide-react";

export default function OfficeLogForm({ log, currentUser, users, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    log_type: "",
    title: "",
    description: "",
    date_time: new Date().toISOString(),
    person_involved: "",
    staff_member: currentUser?.full_name || "",
    priority: "normal",
    action_required: false,
    action_due_date: null,
    status: "completed",
    follow_up_by_user_id: "",
    follow_up_completed: false,
    follow_up_comments: ""
  });

  const [dateTimeString, setDateTimeString] = useState("");

  useEffect(() => {
    if (log) {
      // Convert from PostgreSQL format to form format
      const logData = {
        log_type: (log["Log Type"] || log.log_type || "").toLowerCase().replace(/ /g, '_'),
        title: log["Title"] || log.title || "",
        description: log["Description"] || log.description || "",
        date_time: log["Date Time"] || log.date_time || new Date().toISOString(),
        person_involved: log["Person Involved"] || log.person_involved || "",
        staff_member: log["Staff Member"] || log.staff_member || currentUser?.full_name || "",
        priority: (log["Priority"] || log.priority || "normal").toLowerCase(),
        action_required: log["Action Required"] || log.action_required || false,
        action_due_date: log["Action Due Date"] || log.action_due_date || null,
        status: (log["Status"] || log.status || "completed").toLowerCase(),
        follow_up_by_user_id: log["Follow-up By User ID"] || log.follow_up_by_user_id || "",
        follow_up_completed: log["Follow-up Completed"] || log.follow_up_completed || false,
        follow_up_comments: log["Follow-up Comments"] || log.follow_up_comments || ""
      };
      setFormData(logData);
      setDateTimeString(format(new Date(logData.date_time), "yyyy-MM-dd'T'HH:mm"));
    } else {
      setDateTimeString(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
      const defaultStaff = currentUser?.full_name || currentUser?.Full_Name || "";
      if (defaultStaff) {
        setFormData(prev => ({ ...prev, staff_member: defaultStaff }));
      }
    }
  }, [log, currentUser]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const dataToSubmit = { ...formData };
    if (!log) {
      dataToSubmit.ID = crypto.randomUUID();
    }
    
    onSubmit(dataToSubmit);
  };

  const handleDateTimeChange = (e) => {
    const value = e.target.value;
    setDateTimeString(value);
    setFormData({ ...formData, date_time: new Date(value).toISOString() });
  };

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{log ? "Edit Office Log" : "Add New Office Log"}</CardTitle>
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Log Details Section */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Log Details</h3>
            <p className="text-sm text-slate-500 mb-4">Basic information about the office activity</p>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Log Type *</Label>
                  <Select
                    value={formData.log_type}
                    onValueChange={(value) => setFormData({ ...formData, log_type: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select log type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="enquiry">Enquiry</SelectItem>
                      <SelectItem value="office_order_purchase">Office Order/Purchase</SelectItem>
                      <SelectItem value="visitor">Visitor</SelectItem>
                      <SelectItem value="phone_call">Phone Call</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="delivery">Delivery</SelectItem>
                      <SelectItem value="meeting">Meeting</SelectItem>
                      <SelectItem value="appliance_purchase">Appliance Purchase</SelectItem>
                      <SelectItem value="window_cleaning">Window Cleaning</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => setFormData({ ...formData, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date & Time *</Label>
                  <Input
                    type="datetime-local"
                    value={dateTimeString}
                    onChange={handleDateTimeChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Staff Member</Label>
                  <Select
                    value={formData.staff_member || ""}
                    onValueChange={(value) => setFormData({ ...formData, staff_member: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={users?.length > 0 ? "Select staff member" : "No staff found"} />
                    </SelectTrigger>
                    <SelectContent>
                      {users?.length > 0 ? (
                        users.map((u, idx) => {
                          const userName = u.full_name || u["Full Name"] || "Unknown User";
                          const userId = u.id || u.ID || `user-${idx}`;
                          return (
                            <SelectItem key={userId} value={userName}>
                              {userName}
                            </SelectItem>
                          );
                        })
                      ) : (
                        <SelectItem value="_none" disabled>No staff members loaded</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Details Section */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Activity Details</h3>
            <p className="text-sm text-slate-500 mb-4">Provide specific information about what happened</p>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Brief summary of the activity"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed description of what happened"
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label>Person Involved</Label>
                <Input
                  value={formData.person_involved}
                  onChange={(e) => setFormData({ ...formData, person_involved: e.target.value })}
                  placeholder="Visitor name, caller, contractor, etc."
                />
              </div>
            </div>
          </div>

          {/* Follow-up & Status Section */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Follow-up & Status</h3>
            <p className="text-sm text-slate-500 mb-4">Track any required actions and overall completion status</p>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="action_required"
                  checked={formData.action_required}
                  onCheckedChange={(checked) => setFormData({ ...formData, action_required: checked })}
                />
                <Label htmlFor="action_required" className="cursor-pointer">
                  Action required
                </Label>
              </div>

              {formData.action_required && (
                <div className="space-y-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Action Due Date</Label>
                      <Input
                        type="date"
                        value={formData.action_due_date || ""}
                        onChange={(e) => setFormData({ ...formData, action_due_date: e.target.value || null })}
                        placeholder="dd/mm/yyyy"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Follow Up By</Label>
                      <Select
                        value={formData.follow_up_by_user_id || ""}
                        onValueChange={(value) => setFormData({ ...formData, follow_up_by_user_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={users?.length > 0 ? "Assign to staff..." : "No staff found"} />
                        </SelectTrigger>
                        <SelectContent>
                          {users?.length > 0 ? (
                            users.map((u, idx) => {
                              const userName = u.full_name || u["Full Name"] || "Unknown User";
                              const userId = u.id || u.ID || `user-followup-${idx}`;
                              return (
                                <SelectItem key={userId} value={userName}>
                                  {userName}
                                </SelectItem>
                              );
                            })
                          ) : (
                            <SelectItem value="_none" disabled>No staff members loaded</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Follow Up Comments</Label>
                    <Textarea
                      value={formData.follow_up_comments}
                      onChange={(e) => setFormData({ ...formData, follow_up_comments: e.target.value })}
                      placeholder="Add comments about the follow-up action..."
                      rows={3}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="follow_up_completed"
                      checked={formData.follow_up_completed}
                      onCheckedChange={(checked) => setFormData({ ...formData, follow_up_completed: checked })}
                    />
                    <Label htmlFor="follow_up_completed" className="cursor-pointer">
                      Mark follow-up as completed
                    </Label>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Overall Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
              {log ? "Update Log" : "Create Log"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
