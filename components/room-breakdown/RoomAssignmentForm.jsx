"use client"

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { X, Save } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function RoomAssignmentForm({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  residents,
  currentUser
}) {
  const [formData, setFormData] = useState(initialData || {
    resident_id: "",
    status: "",
    start_date: "",
    end_date: "",
    notes: ""
  });

  React.useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const keycodes = [
    { value: "void", label: "VOID", color: "bg-pink-200" },
    { value: "vacancy", label: "Vacancy", color: "bg-[#F5E6D3]" }, // Tan
    { value: "placement", label: "Placement", color: "bg-yellow-200" },
    { value: "standard_resident", label: "Standard Resident", color: "bg-white" },
    { value: "allocated_resident", label: "Allocated Resident", color: "bg-white" },
    { value: "hb_pending", label: "HB Pending", color: "bg-blue-100" },
    { value: "n-a", label: "N/A", color: "bg-gray-100" }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-xl font-bold">
            Assign Room Slot
          </DialogTitle>
          <DialogDescription>
            {formData.propertyName} - {formData.roomName} ({formData.slot})
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <ScrollArea className="max-h-[80vh] p-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="resident_id">Resident</Label>
                <Select
                  value={formData.resident_id}
                  onValueChange={v => {
                    const resident = residents.find(r => (r.id || r.Id) === v);
                    setFormData(prev => ({
                      ...prev,
                      resident_id: v,
                      is_allocated: resident?.is_allocated || false
                    }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select resident" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {residents.map(r => (
                      <SelectItem key={r.id || r.Id} value={r.id || r.Id}>
                        <span className={r.is_allocated ? "text-blue-600" : "text-black"}>
                          {r.first_name} {r.last_name} {r.is_allocated ? "(Allocated)" : ""}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="status">Status (Keycode)</Label>
                <Select value={formData.status} onValueChange={v => handleChange("status", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {keycodes.map(k => (
                      <SelectItem key={k.value} value={k.value}>
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${k.color} border border-gray-300`}></div>
                          {k.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={e => handleChange("start_date", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="end_date">End Date</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={e => handleChange("end_date", e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={e => handleChange("notes", e.target.value)}
                  placeholder="Additional information..."
                  rows={3}
                />
              </div>
            </div>
          </ScrollArea>

          <div className="flex justify-end gap-3 p-6 border-t bg-slate-50">
            <Button type="button" variant="outline" onClick={onClose}>
              <X className="w-4 h-4 mr-2" /> Cancel
            </Button>
            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
              <Save className="w-4 h-4 mr-2" /> Save Assignment
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
