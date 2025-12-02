import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Eye, Calendar, Trash2 } from "lucide-react";
import { format } from "date-fns";

export default function CustomSectionDataCard({ section, entry, onEdit, onViewDetails, onDelete }) {
  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            {entry.title || `Entry #${entry.id.slice(-6)}`}
          </CardTitle>
          <Badge variant={entry.status === 'active' ? 'default' : 'secondary'}>
            {entry.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          {section.fields && section.fields.slice(0, 3).map((field, idx) => (
            <div key={idx} className="text-sm">
              <span className="font-medium text-slate-700">{field.field_name}: </span>
              <span className="text-slate-600">
                {entry.data[field.field_name] !== undefined && entry.data[field.field_name] !== null && entry.data[field.field_name] !== "" 
                  ? String(entry.data[field.field_name]) 
                  : "-"}
              </span>
            </div>
          ))}
        </div>

        {entry.created_date && (
          <div className="flex items-center gap-2 text-xs text-slate-500 pt-2 border-t">
            <Calendar className="w-3 h-3" />
            <span>Created {format(new Date(entry.created_date), "MMM d, yyyy")}</span>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={() => onViewDetails(entry)} className="flex-1">
            <Eye className="w-4 h-4 mr-2" />
            View
          </Button>
          <Button variant="outline" size="sm" onClick={() => onEdit(entry)}>
            <Pencil className="w-4 h-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onDelete(entry)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}