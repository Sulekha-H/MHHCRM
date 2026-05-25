"use client"

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Save, ClipboardCheck, Calendar, User, Home } from "lucide-react";
import { format } from 'date-fns';

const STANDARD_LOCATIONS = [
  "Front Door",
  "Front of property (outside)",
  "Downstairs hallway",
  "Living room",
  "Kitchen",
  "Communal bathroom",
  "Garden"
];

export default function ComplianceCheckForm({ log, properties, accommodations, currentUser, onSubmit, onCancel }) {
  const [formData, setFormData] = useState(log ? {
    ...log,
    property_id: log["Property ID"] || log.property_id || "",
    week_ending_date: log["Week Ending Date"] || log.week_ending_date || format(new Date(), 'yyyy-MM-dd'),
    logged_by: log["Logged By"] || log.logged_by || currentUser?.full_name || "",
    materials_required: log["Materials Required"] || log.materials_required || "",
    weekly_check_not_completed: log["Weekly Check Not Completed"] || log.weekly_check_not_completed || false,
    checks: log["Checks"] || log.checks || []
  } : {
    property_id: "",
    week_ending_date: format(new Date(), 'yyyy-MM-dd'),
    logged_by: currentUser?.full_name || "",
    materials_required: "",
    weekly_check_not_completed: false,
    checks: []
  });

  const [propertyRooms, setPropertyRooms] = useState([]);

  useEffect(() => {
    if (formData.property_id && accommodations) {
      const rooms = accommodations.filter(acc =>
        (acc["Property ID"] || acc.property_id) === formData.property_id
      ).sort((a, b) => (a["Room Number"] || "").localeCompare(b["Room Number"] || ""));

      setPropertyRooms(rooms);

      // Initialize checks if new log or property changed
      if (!log || log["Property ID"] !== formData.property_id) {
        const initialChecks = [
          ...STANDARD_LOCATIONS.map(loc => ({
            location: loc,
            no_issues: true,
            issue_details: "",
            reported_on_repairs: false,
            date_fixed: "",
            priority: "Medium"
          })),
          ...rooms.flatMap(room => {
            const roomChecks = [{
              location: `Room ${room["Room Number"] || room.room_number}`,
              no_issues: true,
              issue_details: "",
              reported_on_repairs: false,
              date_fixed: "",
              is_room: true,
              room_id: room.ID || room.id,
              priority: "Medium"
            }];

            const amenities = room.Amenities || room.amenities || [];
            const hasEnsuite = amenities.some(a =>
              a.toLowerCase().includes('ensuite') || a.toLowerCase().includes('en-suite')
            );

            if (hasEnsuite) {
              roomChecks.push({
                location: `Room ${room["Room Number"] || room.room_number} Ensuite`,
                no_issues: true,
                issue_details: "",
                reported_on_repairs: false,
                date_fixed: "",
                is_ensuite: true,
                room_id: room.ID || room.id,
                priority: "Medium"
              });
            }
            return roomChecks;
          })
        ];
        setFormData(prev => ({ ...prev, checks: initialChecks }));
      }
    } else {
      setPropertyRooms([]);
    }
  }, [formData.property_id, accommodations, log]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCheckChange = (index, field, value) => {
    const newChecks = [...formData.checks];
    newChecks[index] = { ...newChecks[index], [field]: value };

    // If "No Issues" is checked, clear issue details and reported status
    if (field === "no_issues" && value === true) {
      newChecks[index].issue_details = "";
      newChecks[index].reported_on_repairs = false;
      newChecks[index].priority = "Medium";
    }

    setFormData(prev => ({ ...prev, checks: newChecks }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.property_id) {
      alert("Please select a property.");
      return;
    }

    // Validate mandatory issue details and reported status
    const missingDetails = formData.checks.some(c => !c.no_issues && (!c.issue_details.trim() || !c.reported_on_repairs));
    if (missingDetails) {
      alert("Please provide details for all identified issues and confirm they have been reported on the repairs page.");
      return;
    }

    const selectedProperty = properties.find(p => (p.ID || p.id) === formData.property_id);

    const supabaseData = {
      "Property ID": formData.property_id,
      "Property Name": selectedProperty?.Name || "",
      "Week Ending Date": formData.week_ending_date,
      "Logged By": formData.logged_by,
      "Checks": formData.checks,
      "Materials Required": formData.materials_required,
      "Weekly Check Not Completed": formData.weekly_check_not_completed,
      "Updated Date": new Date().toISOString()
    };

    if (!log) {
      supabaseData["ID"] = crypto.randomUUID();
      supabaseData["Created Date"] = new Date().toISOString();
      supabaseData["Created By"] = currentUser?.email || "Unknown";
    }

    onSubmit(supabaseData);
  };

  return (
    <Card className="mb-6 shadow-md border-indigo-100">
      <CardHeader className="bg-indigo-50/50 pb-4">
        <CardTitle className="flex items-center gap-2 text-indigo-900">
          <ClipboardCheck className="w-5 h-5" />
          {log ? "Edit Weekly Compliance Log" : "New Weekly Compliance Log"}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="property_id" className="flex items-center gap-1.5">
                <Home className="w-4 h-4 text-slate-400" /> Property *
              </Label>
              <Select
                value={formData.property_id}
                onValueChange={(v) => handleChange("property_id", v)}
                disabled={!!log}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select property" />
                </SelectTrigger>
                <SelectContent>
                  {properties?.map(p => (
                    <SelectItem key={p.ID} value={p.ID}>{p.Name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="week_ending_date" className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-400" /> Week Ending Date *
              </Label>
              <Input
                id="week_ending_date"
                type="date"
                value={formData.week_ending_date}
                onChange={(e) => handleChange("week_ending_date", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="logged_by" className="flex items-center gap-1.5">
                <User className="w-4 h-4 text-slate-400" /> Logged By *
              </Label>
              <Input
                id="logged_by"
                value={formData.logged_by}
                onChange={(e) => handleChange("logged_by", e.target.value)}
                placeholder="Staff name"
                required
              />
            </div>
          </div>

          {formData.property_id && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900 border-b pb-2">Compliance Checks</h3>
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-700 uppercase text-xs font-bold">
                    <tr>
                      <th className="px-4 py-3 min-w-[200px]">Location</th>
                      <th className="px-4 py-3 text-center w-[100px]">No Issues</th>
                      <th className="px-4 py-3 min-w-[250px]">Repair Details</th>
                      <th className="px-4 py-3 w-[140px]">Priority</th>
                      <th className="px-4 py-3 text-center w-[120px]">Auto-Log?</th>
                      <th className="px-4 py-3 w-[150px]">Date Fixed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {formData.checks.map((check, index) => (
                      <tr key={index} className={`transition-colors ${check.no_issues ? 'hover:bg-green-50/30' : 'bg-red-50/30 hover:bg-red-50/50'}`}>
                        <td className="px-4 py-4 font-medium text-slate-900">
                          {check.location}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <Checkbox
                            checked={check.no_issues}
                            onCheckedChange={(checked) => handleCheckChange(index, "no_issues", checked)}
                            className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                          />
                        </td>
                        <td className="px-4 py-4">
                          {!check.no_issues ? (
                            <div className="space-y-1">
                              <Textarea
                                value={check.issue_details}
                                onChange={(e) => handleCheckChange(index, "issue_details", e.target.value)}
                                placeholder="Mandatory: Describe the repair..."
                                className="min-h-[80px] border-red-200 focus-visible:ring-red-500 text-xs"
                                required
                              />
                              <p className="text-[9px] text-red-500 font-medium italic">* Mandatory</p>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-xs">No issues reported</span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          {!check.no_issues && (
                            <Select
                              value={check.priority || "Medium"}
                              onValueChange={(v) => handleCheckChange(index, "priority", v)}
                            >
                              <SelectTrigger className="h-8 text-xs border-red-100">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Low">Low</SelectItem>
                                <SelectItem value="Medium">Medium</SelectItem>
                                <SelectItem value="High">High</SelectItem>
                                <SelectItem value="Urgent">Urgent</SelectItem>
                                <SelectItem value="Emergency">Emergency</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </td>
                        <td className="px-4 py-4 text-center">
                          {!check.no_issues && (
                            <div className="flex flex-col items-center gap-1">
                              <Checkbox
                                checked={check.reported_on_repairs}
                                onCheckedChange={(checked) => handleCheckChange(index, "reported_on_repairs", checked)}
                                className="data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                              />
                              <span className="text-[9px] font-bold text-indigo-600 uppercase">Auto-Log</span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <Input
                            type="date"
                            value={check.date_fixed || ""}
                            onChange={(e) => handleCheckChange(index, "date_fixed", e.target.value)}
                            className="text-xs"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <Label htmlFor="materials_required" className="text-lg font-semibold text-slate-900 mb-2 block">
                Materials Required / Property Purchase Details
              </Label>
              <Textarea
                id="materials_required"
                value={formData.materials_required}
                onChange={(e) => handleChange("materials_required", e.target.value)}
                placeholder="Enter details of any materials needed for repairs or property purchases..."
                rows={4}
                className="mt-1"
              />
            </div>
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Document Issues</h3>
              <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-red-100">
                <Checkbox
                  id="weekly_check_not_completed"
                  checked={formData.weekly_check_not_completed}
                  onCheckedChange={(checked) => handleChange("weekly_check_not_completed", checked)}
                  className="h-5 w-5 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                />
                <Label
                  htmlFor="weekly_check_not_completed"
                  className={`text-sm font-bold ${formData.weekly_check_not_completed ? 'text-red-600' : 'text-slate-700'}`}
                >
                  Weekly check not completed
                </Label>
              </div>
              <p className="text-xs text-slate-500 mt-3 italic">
                * Checking this will highlight this entry in red on the main page.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button type="button" variant="outline" onClick={onCancel} className="h-11 px-6">
              <X className="w-4 h-4 mr-2" /> Cancel
            </Button>
            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 h-11 px-8 shadow-lg shadow-indigo-100">
              <Save className="w-4 h-4 mr-2" />
              {log ? "Update Log" : "Save Weekly Log"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
