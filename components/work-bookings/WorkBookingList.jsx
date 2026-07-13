"use client"

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Calendar, MapPin, Clock, PoundSterling, FileText, ExternalLink } from "lucide-react";
import { format } from "date-fns";

export default function WorkBookingList({ bookings, providers, properties, accommodations, onEdit, onDelete, canEdit }) {
  if (bookings.length === 0) {
    return (
      <div className="text-center py-12 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
        <p className="text-slate-500 italic">No bookings found for the selected criteria.</p>
      </div>
    );
  }

  const getProviderName = (id) => {
    const provider = providers.find(p => (p.ID || p.id) === id);
    return provider ? provider.Name || provider.name : "Unknown Provider";
  };

  const getPropertyName = (id) => {
    const property = properties.find(p => (p.ID || p.id) === id);
    return property ? property.Name || property.name : "Unknown Property";
  };

  const getAccommodationName = (id) => {
    if (!id) return null;
    const acc = accommodations.find(a => (a.ID || a.id) === id);
    return acc ? acc["Room Number"] || acc.room_number : null;
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'scheduled': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getPaymentColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50">
            <TableHead className="w-[120px]">Date</TableHead>
            <TableHead>Service Provider</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Total Pay</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Payment</TableHead>
            {canEdit && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {bookings.map((booking) => (
            <TableRow key={booking.ID || booking.id} className="hover:bg-slate-50/50">
              <TableCell className="font-medium">
                {format(new Date(booking.Date || booking.date), 'dd/MM/yyyy')}
              </TableCell>
              <TableCell>
                <div className="font-semibold text-slate-900">{getProviderName(booking["Service Provider ID"] || booking.service_provider_id)}</div>
                <div className="text-xs text-slate-500 italic">{booking["Description of Work"] || booking.description_of_work}</div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    {getPropertyName(booking["Property ID"] || booking.property_id)}
                  </span>
                  <span className="text-xs text-slate-500 pl-4">
                    {getAccommodationName(booking["Accommodation ID"] || booking.accommodation_id) ? `Room ${getAccommodationName(booking["Accommodation ID"] || booking.accommodation_id)} - ` : ""}
                    {booking.Area || booking.area}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1 text-slate-600">
                  <Clock className="w-3 h-3" />
                  {booking["Duration Hours"] || booking.duration_hours || 0}h {booking["Duration Minutes"] || booking.duration_minutes || 0}m
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1 font-bold text-slate-900">
                  <PoundSterling className="w-3 h-3" />
                  {parseFloat(booking["Total Pay"] || booking.total_pay || 0).toFixed(2)}
                </div>
                {booking["Invoice Number"] && (
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    <FileText className="w-2.5 h-2.5" />
                    <span>{booking["Invoice Number"]}</span>
                    {(booking["Invoice File URL"] || booking.invoice_file_url) && (
                      <a
                        href={booking["Invoice File URL"] || booking.invoice_file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-orange-600 hover:text-orange-700 hover:underline"
                        title="View Invoice Document"
                      >
                        <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
                      </a>
                    )}
                  </div>
                )}
                {!booking["Invoice Number"] && (booking["Invoice File URL"] || booking.invoice_file_url) && (
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    <a
                      href={booking["Invoice File URL"] || booking.invoice_file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-orange-600 hover:text-orange-700 hover:underline font-medium"
                      title="View Invoice Document"
                    >
                      <span>View Invoice</span>
                      <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
                    </a>
                  </div>
                )}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={getStatusColor(booking["Work Status"] || booking.work_status)}>
                  {booking["Work Status"] || booking.work_status}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={getPaymentColor(booking["Payment Status"] || booking.payment_status)}>
                  {booking["Payment Status"] || booking.payment_status}
                </Badge>
              </TableCell>
              {canEdit && (
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => onEdit(booking)}>
                      <Edit className="w-4 h-4 text-slate-500" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onDelete(booking)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
