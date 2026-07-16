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

  const getUnavailableDates = (provider) => {
    let unavail = provider["Unavailable Dates"] || provider.unavailable_dates || [];
    if (typeof unavail === 'string') {
      try {
        unavail = JSON.parse(unavail);
      } catch (e) {
        unavail = unavail.split(',').map(d => d.trim()).filter(Boolean);
      }
    }
    return Array.isArray(unavail) ? unavail : [];
  };

  const formatDateString = (ds) => {
    if (!ds) return "";
    const [year, month, day] = ds.split('-');
    return `${day}/${month}/${year}`;
  };

  const getCategoryColor = (category) => {
    switch (category?.toLowerCase()) {
      case 'cleaner': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'tradesman': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'gardener': return 'bg-green-100 text-green-800 border-green-200';
      case 'translator': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
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

              {/* Unavailable Dates List */}
              <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5">
                <span className="text-xs font-semibold text-slate-500 block">Unavailable Dates:</span>
                {getUnavailableDates(provider).length > 0 ? (
                  <div className="flex flex-wrap gap-1 max-h-[80px] overflow-y-auto">
                    {getUnavailableDates(provider).map((date) => (
                      <span
                        key={date}
                        className="bg-red-50 text-red-700 border border-red-100 text-[11px] px-2 py-0.5 rounded-md font-medium"
                      >
                        {formatDateString(date)}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-slate-400 italic">None marked</span>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <span className="text-xs text-slate-500">Hourly Rate:</span>
                  <span className="font-semibold text-slate-900">
                    {(() => {
                      const rate = provider["Default Hourly Rate"] || provider.default_hourly_rate;
                      if (!rate) return "£0.00";
                      return rate.toString().startsWith("£") ? rate : `£${rate}`;
                    })()}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-slate-500">Day Rate:</span>
                  <span className="font-semibold text-slate-900">
                    {(() => {
                      const rate = provider["Default Day Rate"] || provider.default_day_rate;
                      if (!rate) return "N/A";
                      return rate.toString().startsWith("£") ? rate : `£${rate}`;
                    })()}
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
