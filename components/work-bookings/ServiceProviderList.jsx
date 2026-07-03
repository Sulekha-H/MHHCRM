"use client"

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Phone, Mail, User } from "lucide-react";

export default function ServiceProviderList({ providers, onEdit, onDelete, canEdit }) {
  if (providers.length === 0) {
    return (
      <div className="text-center py-12 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
        <p className="text-slate-500 italic">No service providers found.</p>
      </div>
    );
  }

  const getCategoryColor = (category) => {
    switch (category?.toLowerCase()) {
      case 'cleaner': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'tradesman': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'gardener': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {providers.map((provider) => (
        <Card key={provider.ID || provider.id} className="overflow-hidden hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{provider.Name || provider.name}</h3>
                  <Badge variant="outline" className={getCategoryColor(provider.Category || provider.category)}>
                    {provider.Category || provider.category}
                  </Badge>
                </div>
              </div>
              {canEdit && (
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => onEdit(provider)}>
                    <Edit className="w-4 h-4 text-slate-500" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => onDelete(provider)}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-slate-600">
                <Phone className="w-4 h-4" />
                <span>{provider["Contact Number"] || provider.contact_number || "No phone"}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Mail className="w-4 h-4" />
                <span className="truncate">{provider.Email || provider.email || "No email"}</span>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Hourly Rate:</span>
                  <span className="font-semibold text-slate-900">
                    £{parseFloat(provider["Default Hourly Rate"] || provider.default_hourly_rate || 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
