import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Save, AlertTriangle, Check, FileStack, XCircle } from "lucide-react";
import { format } from "date-fns";

export default function WeeklySWDocLogForm({ log, documentName, weekDate, onSubmit, onCancel, currentUser, hideCard = false }) {
  const [formData, setFormData] = useState(log ? {
    status: log.Status || log.status || "incomplete",
    notes: log.Notes || log.notes || "",
    staff_member: log.Staff_Member || log.staff_member || currentUser?.['Full Name'] || "",
    log_date: log.Log_Date || log.log_date || new Date().toISOString(),
    file_url: log.File_Url || log.file_url || "",
    created_date: log["Created Date"] || log.Created_Date || log.created_date || ""
  } : {
    status: "incomplete",
    notes: "",
    staff_member: currentUser?.['Full Name'] || "",
    log_date: new Date().toISOString(),
    file_url: "",
    created_date: ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Prepare data in snake_case format (parent expects this)
    const submitData = {
      id: log?.Id || log?.id,
      property_id: log?.property_id || log?.['Property ID'],
      sw_document_id: log?.sw_document_id || log?.['SW Document ID'],
      week_start_date: log?.week_start_date || log?.['Week Start Date'],
      status: formData.status,
      notes: formData.notes || null,
      staff_member: formData.staff_member,
      file_url: formData.file_url || null,
      log_date: new Date().toISOString()
    };

    onSubmit(submitData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
          <Label htmlFor="status">Status *</Label>
          <Select value={formData.status} onValueChange={v => handleChange("status", v)} required>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="completed">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" /> Completed
                </div>
              </SelectItem>
              <SelectItem value="issue_raised">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-500" /> Issue Raised
                </div>
              </SelectItem>
              <SelectItem value="incomplete">
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-slate-500" /> Incomplete
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
            <Label htmlFor="staff_member">Staff Member *</Label>
            <input
                id="staff_member"
                value={formData.staff_member}
                onChange={e => handleChange("staff_member", e.target.value)}
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
            />
        </div>
      </div>

      <div>
        <Label htmlFor="file_url">Supporting Document URL</Label>
        <Input
          id="file_url"
          type="url"
          value={formData.file_url}
          onChange={(e) => handleChange("file_url", e.target.value)}
          placeholder="https://gdrive.com/document.pdf"
        />
        <p className="text-xs text-slate-500 mt-1">
          Optional. Please enter a valid URL (must start with http:// or https://)
        </p>
      </div>

      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={e => handleChange("notes", e.target.value)}
          rows={4}
          placeholder={formData.status === 'issue_raised' ? "Describe the issue found..." : "Add any relevant notes..."}
          required={formData.status === 'issue_raised'}
        />
         {formData.status === 'issue_raised' && (
            <p className="text-xs text-red-600 mt-1">Notes are required when an issue is raised.</p>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="bg-cyan-600 hover:bg-cyan-700">
          <Save className="w-4 h-4 mr-2" />
          {log?.Id || log?.id ? "Update Entry" : "Save Entry"}
        </Button>
      </div>
    </form>
  );

  if (hideCard) {
    return formContent;
  }

  return (
    <Card className="mb-6 shadow-md border-t-4 border-t-cyan-600">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3">
          <FileStack className="w-6 h-6 text-cyan-600" />
          <div>
            <span className="text-xl font-bold">{log?.Id || log?.id ? "Edit" : "Log"} Weekly Document Check</span>
            <p className="text-sm font-normal text-slate-500 mt-1">
              {documentName} - W/C {format(new Date(weekDate), 'dd/MM/yy')}
            </p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {formContent}
      </CardContent>
    </Card>
  );
}