"use client"

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Phone, Mail, User, Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

// Group consecutive dates helper
export const groupConsecutiveDates = (dateStrings) => {
  if (!Array.isArray(dateStrings) || dateStrings.length === 0) return [];

  // Filter out any invalid/empty dates and sort them chronologically
  const sortedDates = [...dateStrings]
    .filter(Boolean)
    .sort();

  const groups = [];
  let currentGroup = [];

  for (let i = 0; i < sortedDates.length; i++) {
    const currentDateStr = sortedDates[i];
    if (currentGroup.length === 0) {
      currentGroup.push(currentDateStr);
    } else {
      const prevDateStr = currentGroup[currentGroup.length - 1];

      const [pYear, pMonth, pDay] = prevDateStr.split('-').map(Number);
      const [cYear, cMonth, cDay] = currentDateStr.split('-').map(Number);

      const prevTime = Date.UTC(pYear, pMonth - 1, pDay);
      const currTime = Date.UTC(cYear, cMonth - 1, cDay);

      const diffDays = (currTime - prevTime) / (1000 * 60 * 60 * 24);

      if (diffDays === 1) {
        currentGroup.push(currentDateStr);
      } else if (diffDays > 1) {
        groups.push({
          start: currentGroup[0],
          end: currentGroup[currentGroup.length - 1],
          dates: [...currentGroup]
        });
        currentGroup = [currentDateStr];
      }
      // If diffDays === 0 (duplicate), we skip/ignore to prevent duplicates
    }
  }

  if (currentGroup.length > 0) {
    groups.push({
      start: currentGroup[0],
      end: currentGroup[currentGroup.length - 1],
      dates: [...currentGroup]
    });
  }

  return groups;
};

export const formatDateString = (ds) => {
  if (!ds) return "";
  const [year, month, day] = ds.split('-');
  return `${day}/${month}/${year}`;
};

export const formatGroup = (group) => {
  if (group.start === group.end) {
    return formatDateString(group.start);
  }
  return `${formatDateString(group.start)} - ${formatDateString(group.end)}`;
};

export default function ServiceProviderList({ providers, onEdit, onDelete, canEdit }) {
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

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

  const getCategoryColor = (category) => {
    switch (category?.toLowerCase()?.trim()) {
      case 'handyman': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'plumber': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'electrician': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'decorator': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'gas engineer': return 'bg-red-100 text-red-800 border-red-200';
      case 'cleaner': return 'bg-sky-100 text-sky-800 border-sky-200';
      case 'gardener': return 'bg-green-100 text-green-800 border-green-200';
      case 'translator': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'rubbish collector': return 'bg-stone-100 text-stone-800 border-stone-200';
      case 'delivery person': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'pest control': return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'tradesman': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const handlePreview = (provider) => {
    setSelectedProvider(provider);
    setIsPreviewOpen(true);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {providers.map((provider) => (
        <Card key={provider.ID || provider.id} className="overflow-hidden hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center shrink-0">
                  <User className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{provider.Name || provider.name}</h3>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(provider.Category || provider.category || "")
                      .split(",")
                      .map(cat => cat.trim())
                      .filter(Boolean)
                      .map(cat => (
                        <Badge key={cat} variant="outline" className={getCategoryColor(cat)}>
                          {cat}
                        </Badge>
                      ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => handlePreview(provider)} title="Preview Service Provider">
                  <Eye className="w-4 h-4 text-blue-500" />
                </Button>
                {canEdit && (
                  <>
                    <Button variant="ghost" size="icon" onClick={() => onEdit(provider)} title="Edit">
                      <Edit className="w-4 h-4 text-slate-500" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onDelete(provider)} title="Delete">
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </>
                )}
              </div>
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

              {/* Unavailable Dates List as Grouped Ranges */}
              <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5">
                <span className="text-xs font-semibold text-slate-500 block">Unavailable Dates:</span>
                {getUnavailableDates(provider).length > 0 ? (
                  <div className="flex flex-wrap gap-1 max-h-[80px] overflow-y-auto">
                    {groupConsecutiveDates(getUnavailableDates(provider)).map((group) => (
                      <span
                        key={group.start + '-' + group.end}
                        className="bg-red-50 text-red-700 border border-red-100 text-[11px] px-2 py-0.5 rounded-md font-medium"
                      >
                        {formatGroup(group)}
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

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="sm:max-w-[550px] p-6 max-h-[90vh] overflow-y-auto bg-white border border-slate-200 shadow-xl rounded-xl">
          <DialogHeader className="border-b pb-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center shrink-0">
                <User className="w-6 h-6 text-slate-600" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-slate-900">
                  {selectedProvider?.Name || selectedProvider?.name}
                </DialogTitle>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {(selectedProvider?.Category || selectedProvider?.category || "")
                    .split(",")
                    .map(cat => cat.trim())
                    .filter(Boolean)
                    .map(cat => (
                      <Badge key={cat} variant="outline" className={getCategoryColor(cat)}>
                        {cat}
                      </Badge>
                    ))}
                </div>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Contact Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-xs font-semibold text-slate-500 block">Contact Number</span>
                <div className="flex items-center gap-2 text-slate-800 text-sm">
                  <Phone className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>{selectedProvider?.["Contact Number"] || selectedProvider?.contact_number || "No phone"}</span>
                </div>
              </div>
              <div className="space-y-1.5 p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-xs font-semibold text-slate-500 block">Email Address</span>
                <div className="flex items-center gap-2 text-slate-800 text-sm truncate">
                  <Mail className="w-4 h-4 text-slate-500 shrink-0" />
                  <span className="truncate">{selectedProvider?.Email || selectedProvider?.email || "No email"}</span>
                </div>
              </div>
            </div>

            {/* Rates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1 p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-xs font-semibold text-slate-500">Hourly Rate</span>
                <span className="block font-bold text-slate-900 text-lg mt-0.5">
                  {(() => {
                    const rate = selectedProvider?.["Default Hourly Rate"] || selectedProvider?.default_hourly_rate;
                    if (!rate) return "£0.00";
                    return rate.toString().startsWith("£") ? rate : `£${rate}`;
                  })()}
                </span>
              </div>
              <div className="space-y-1 p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-xs font-semibold text-slate-500">Day Rate</span>
                <span className="block font-bold text-slate-900 text-lg mt-0.5">
                  {(() => {
                    const rate = selectedProvider?.["Default Day Rate"] || selectedProvider?.default_day_rate;
                    if (!rate) return "N/A";
                    return rate.toString().startsWith("£") ? rate : `£${rate}`;
                  })()}
                </span>
              </div>
            </div>

            {/* Unavailable Dates */}
            <div className="space-y-1.5 p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-xs font-semibold text-slate-500 block">Unavailable Dates</span>
              {selectedProvider && getUnavailableDates(selectedProvider).length > 0 ? (
                <div className="flex flex-wrap gap-1.5 max-h-[150px] overflow-y-auto mt-1">
                  {groupConsecutiveDates(getUnavailableDates(selectedProvider)).map((group) => (
                    <span
                      key={group.start + '-' + group.end}
                      className="bg-red-50 text-red-700 border border-red-200 text-xs px-2.5 py-1 rounded-md font-medium"
                    >
                      {formatGroup(group)}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-slate-400 italic">None marked</span>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-1.5 p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-xs font-semibold text-slate-500 block">Notes</span>
              <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed mt-1">
                {selectedProvider?.Notes || selectedProvider?.notes || "No additional notes provided."}
              </p>
            </div>
          </div>

          <DialogFooter className="border-t pt-4 mt-4">
            <Button type="button" onClick={() => setIsPreviewOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
