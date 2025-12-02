import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Calendar, User, Trash2 } from "lucide-react";
import { format } from "date-fns";

export default function CustomSectionDataDetailModal({ section, entry, onClose, onEdit, onDelete }) {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between pr-8">
            <span>{entry.title || `Entry #${entry.id.slice(-6)}`}</span>
            <Badge variant={entry.status === 'active' ? 'default' : 'secondary'}>
              {entry.status}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {section.fields && section.fields.map((field, idx) => (
              <div key={idx} className="space-y-1">
                <label className="text-sm font-medium text-slate-700">
                  {field.field_name}
                </label>
                <div className="text-slate-900">
                  {entry.data[field.field_name] !== undefined && entry.data[field.field_name] !== null && entry.data[field.field_name] !== "" 
                    ? (field.field_type === 'checkbox' 
                        ? (entry.data[field.field_name] === true || entry.data[field.field_name] === "true" ? "Yes" : "No")
                        : String(entry.data[field.field_name]))
                    : "-"}
                </div>
              </div>
            ))}
          </div>

          {entry.notes && (
            <div className="space-y-1 pt-4 border-t">
              <label className="text-sm font-medium text-slate-700">Notes</label>
              <p className="text-slate-900 whitespace-pre-wrap">{entry.notes}</p>
            </div>
          )}

          <div className="flex flex-wrap gap-4 text-sm text-slate-600 pt-4 border-t">
            {entry.created_date && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>Created: {format(new Date(entry.created_date), "MMM d, yyyy 'at' h:mm a")}</span>
              </div>
            )}
            {entry.created_by && (
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>By: {entry.created_by}</span>
              </div>
            )}
            {entry.updated_date && entry.updated_date !== entry.created_date && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>Updated: {format(new Date(entry.updated_date), "MMM d, yyyy 'at' h:mm a")}</span>
              </div>
            )}
          </div>

          <div className="flex justify-between gap-3 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => {
                onClose();
                onDelete(entry);
              }}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Entry
            </Button>
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button onClick={() => onEdit(entry)} className="bg-indigo-600 hover:bg-indigo-700">
                <Pencil className="w-4 h-4 mr-2" />
                Edit Entry
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}