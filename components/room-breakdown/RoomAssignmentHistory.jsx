"use client"

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useClerkSupabaseClient } from "@/lib/supabaseClient";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History } from "lucide-react";

export default function RoomAssignmentHistory({
  isOpen,
  onClose,
  propertyName,
  roomName,
  slot,
  residents
}) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const supabase = useClerkSupabaseClient();

  useEffect(() => {
    const fetchHistory = async () => {
      if (!isOpen || !supabase) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('room_assignments')
          .select('*')
          .eq('Property Name', propertyName)
          .eq('Room Name', roomName)
          .eq('Slot', slot)
          .order('Created Date', { ascending: false });

        if (error) throw error;
        setHistory(data || []);
      } catch (err) {
        console.error("Error fetching assignment history:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [isOpen, propertyName, roomName, slot, supabase]);

  const getResidentName = (id) => {
    const res = residents.find(r => (r.id || r.Id) === id);
    return res ? `${res.first_name} ${res.last_name}` : "None";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-600" />
            Assignment History
          </DialogTitle>
          <p className="text-sm text-slate-500">
            {propertyName} - {roomName} ({slot})
          </p>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] p-6">
          {loading ? (
            <div className="text-center py-10">Loading history...</div>
          ) : history.length === 0 ? (
            <div className="text-center py-10 text-slate-500">No history found for this slot.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date Changed</TableHead>
                  <TableHead>Resident</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Changed By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((item) => (
                  <TableRow key={item.ID}>
                    <TableCell className="text-xs">
                      {format(new Date(item['Created Date']), 'dd/MM/yyyy HH:mm')}
                    </TableCell>
                    <TableCell className={`font-medium ${item['Is Allocated'] ? 'text-blue-600' : ''}`}>
                      {getResidentName(item['Resident ID'])}
                    </TableCell>
                    <TableCell className="capitalize">{item.Status || "-"}</TableCell>
                    <TableCell className="text-xs">
                      {item['Start Date'] ? format(new Date(item['Start Date']), 'dd/MM/yy') : "-"} to {item['End Date'] ? format(new Date(item['End Date']), 'dd/MM/yy') : "Present"}
                    </TableCell>
                    <TableCell className="text-xs">{item['Created By']}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
