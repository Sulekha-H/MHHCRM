"use client"

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Save, CheckSquare } from "lucide-react";

export default function TaskForm({ task, users, residents, properties, onSubmit, onCancel }) {
  const [formData, setFormData] = useState(task || {
    Title: "",
    Description: "",
    "Due Date": new Date().toISOString().slice(0, 16),
    Status: "To Do",
    Priority: "Medium",
    "Assigned To User ID": "",
    "Related Entity": "None",
    "Related Entity ID": "",
    "Target Duration": ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Transform the data to match Supabase schema expectations
    const transformedData = {
      ...formData,
      // Ensure Status is in Title Case format
      Status: transformStatus(formData.Status),
      // Ensure Priority is in Title Case format
      Priority: transformPriority(formData.Priority),
      // Ensure Related Entity is in Title Case format
      "Related Entity": transformRelatedEntity(formData["Related Entity"])
    };
    
    onSubmit(transformedData);
  };

  // Transform status from any format to database format
  const transformStatus = (status) => {
    const statusMap = {
      'to_do': 'To Do',
      'To Do': 'To Do',
      'in_progress': 'In Progress',
      'In Progress': 'In Progress',
      'completed': 'Completed',
      'Completed': 'Completed',
      'overdue': 'Overdue',
      'Overdue': 'Overdue'
    };
    return statusMap[status] || 'To Do';
  };

  // Transform priority from any format to database format
  const transformPriority = (priority) => {
    const priorityMap = {
      'low': 'Low',
      'Low': 'Low',
      'medium': 'Medium',
      'Medium': 'Medium',
      'high': 'High',
      'High': 'High',
      'urgent': 'Urgent',
      'Urgent': 'Urgent'
    };
    return priorityMap[priority] || 'Medium';
  };

  // Transform related entity from any format to database format
  const transformRelatedEntity = (entity) => {
    const entityMap = {
      'none': 'None',
      'None': 'None',
      'resident': 'Resident',
      'Resident': 'Resident',
      'property': 'Property',
      'Property': 'Property',
      'support_plan': 'Support plan',
      'Support plan': 'Support plan',
      'incident': 'Incident',
      'Incident': 'Incident'
    };
    return entityMap[entity] || 'None';
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Card className="mb-6 shadow-md">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <CheckSquare className="w-5 h-5 text-cyan-600" />
          {task ? "Edit Task" : "Add New Task"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Task Details */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Task Details</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.Title}
                  onChange={(e) => handleChange("Title", e.target.value)}
                  placeholder="What needs to be done?"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.Description}
                  onChange={(e) => handleChange("Description", e.target.value)}
                  placeholder="Provide more details about the task..."
                  rows={4}
                />
              </div>
            </div>
          </div>

          {/* Scheduling and Assignment */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Scheduling & Assignment</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="due_date">Due Date *</Label>
                <Input
                  id="due_date"
                  type="datetime-local"
                  value={formData["Due Date"]}
                  onChange={(e) => handleChange("Due Date", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="assigned_to_user_id">Assign To</Label>
                <Select value={formData["Assigned To User ID"] || ""} onValueChange={(value) => handleChange("Assigned To User ID", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a team member" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>Unassigned</SelectItem>
                    <SelectItem value="all_team_members">
                      <span className="font-semibold text-cyan-700">All Team Members</span>
                    </SelectItem>
                    {users && users.map((user) => (
                      <SelectItem key={user.ID} value={user["Full Name"]}>
                        {user["Full Name"]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={formData.Priority} onValueChange={(value) => handleChange("Priority", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.Status} onValueChange={(value) => handleChange("Status", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="To Do">To Do</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="target_duration" className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-cyan-600" />
                  Speculate Duration (Minutes)
                </Label>
                <Input
                  id="target_duration"
                  type="number"
                  value={formData["Target Duration"]}
                  onChange={(e) => handleChange("Target Duration", e.target.value)}
                  placeholder="How long might this take? e.g. 30"
                  className="border-cyan-100 focus:border-cyan-300 focus:ring-cyan-100"
                />
              </div>
            </div>
          </div>

          {/* Related Entity */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Link to Record (Optional)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="related_entity">Related To</Label>
                <Select 
                  value={formData["Related Entity"] || "None"} 
                  onValueChange={(value) => {
                    handleChange("Related Entity", value);
                    if (value === "None") {
                      handleChange("Related Entity ID", "");
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="None">None</SelectItem>
                    <SelectItem value="Resident">Resident</SelectItem>
                    <SelectItem value="Property">Property</SelectItem>
                    <SelectItem value="Support plan">Support Plan</SelectItem>
                    <SelectItem value="Incident">Incident</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {formData["Related Entity"] && formData["Related Entity"] !== "None" && (
                <div className="space-y-2">
                  <Label htmlFor="related_entity_id">
                    {formData["Related Entity"] === "Resident" && "Select Resident"}
                    {formData["Related Entity"] === "Property" && "Select Property"}
                    {formData["Related Entity"] === "Support plan" && "Support Plan ID"}
                    {formData["Related Entity"] === "Incident" && "Incident ID"}
                  </Label>
                  {formData["Related Entity"] === "Resident" && residents ? (
                    <Select value={formData["Related Entity ID"] || ""} onValueChange={(value) => handleChange("Related Entity ID", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a resident" />
                      </SelectTrigger>
                      <SelectContent>
                        {residents.map((resident) => (
                          <SelectItem key={resident.ID} value={resident.ID}>
                            {resident["First Name"]} {resident["Last Name"]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : formData["Related Entity"] === "Property" && properties ? (
                    <Select value={formData["Related Entity ID"] || ""} onValueChange={(value) => handleChange("Related Entity ID", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a property" />
                      </SelectTrigger>
                      <SelectContent>
                        {properties.map((property) => (
                          <SelectItem key={property.ID} value={property.ID}>
                            {property.Name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id="related_entity_id"
                      value={formData["Related Entity ID"]}
                      onChange={(e) => handleChange("Related Entity ID", e.target.value)}
                      placeholder={`Enter ${formData["Related Entity"]} ID`}
                    />
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Form Actions */}
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
              className="bg-cyan-600 hover:bg-cyan-700 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {task ? "Update Task" : "Add Task"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}