"use client"

import { useUser } from "@clerk/nextjs";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useClerkSupabaseClient } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, History, RefreshCw, Download } from "lucide-react";
import { format } from "date-fns";
import RoomAssignmentForm from "@/components/room-breakdown/RoomAssignmentForm";
import RoomAssignmentHistory from "@/components/room-breakdown/RoomAssignmentHistory";

const PROPERTIES_CONFIG = [
  { name: "SPRINGFIELD", rooms: 6 },
  { name: "RYLAND", rooms: 4 },
  { name: "GERALDINE", rooms: 6 },
  { name: "APARTMENT 94", rooms: 2 },
  { name: "SUTTON", rooms: 6 },
  { name: "APARTMENT 108", rooms: 2 },
  { name: "FLAT 3", rooms: 2 },
  { name: "FLAT 4", rooms: 0, isNA: true } // Handled specially
];

const KEYCODES = [
  { value: "void", label: "VOID", color: "bg-pink-200", textColor: "text-black" },
  { value: "vacancy", label: "Vacancy", color: "bg-[#F5E6D3]", textColor: "text-black" }, // Tan
  { value: "placement", label: "Placement", color: "bg-yellow-200", textColor: "text-black" },
  { value: "standard_resident", label: "Standard Resident", color: "bg-white", textColor: "text-black" },
  { value: "allocated_resident", label: "Allocated Resident", color: "bg-white", textColor: "text-blue-600" },
  { value: "hb_pending", label: "HB Pending", color: "bg-blue-100", textColor: "text-black" },
  { value: "n-a", label: "N/A", color: "bg-gray-100", textColor: "text-black" }
];

export default function RoomBreakdownPage() {
  const { user } = useUser();
  const supabase = useClerkSupabaseClient();
  const [residents, setResidents] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [activeSlot, setActiveSlot] = useState(null);
  const [historySlot, setHistorySlot] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  const loadData = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      // 1. Load Residents (Standard & Allocated)
      const [resResult, allocResResult, assignResult, userResult] = await Promise.all([
        supabase.from('residents').select('"ID", "First Name", "Last Name", "Status"').eq('Status', 'Active'),
        supabase.from('allocated_residents').select('"ID", "First Name", "Last Name"'),
        supabase.from('room_assignments').select('*').eq('Deleted', false).order('Created Date', { ascending: false }),
        user?.primaryEmailAddress?.emailAddress ? supabase.from('users').select('*').eq('Email', user.primaryEmailAddress.emailAddress).single() : Promise.resolve({ data: null })
      ]);

      const allResidents = [
        ...(resResult.data || []).map(r => ({
          id: r.ID,
          first_name: r["First Name"],
          last_name: r["Last Name"],
          is_allocated: false
        })),
        ...(allocResResult.data || []).map(r => ({
          id: r.ID || r.id,
          first_name: r["First Name"] || r.first_name,
          last_name: r["Last Name"] || r.last_name,
          is_allocated: true
        }))
      ];
      setResidents(allResidents);
      setAssignments(assignResult.data || []);
      setCurrentUser(userResult.data);
    } catch (err) {
      console.error("Error loading room breakdown data:", err);
    } finally {
      setLoading(false);
    }
  }, [supabase, user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getLatestAssignment = (propertyName, roomName, slot) => {
    return assignments.find(a =>
      a['Property Name'] === propertyName &&
      a['Room Name'] === roomName &&
      a['Slot'] === slot
    );
  };

  const handleQuickStatusChange = async (propertyName, roomName, slot, newStatus) => {
    const existing = getLatestAssignment(propertyName, roomName, slot);

    const isAllocated = existing?.['Is Allocated'] || false;
    const residentId = existing?.['Resident ID'] || existing?.['Resident ID AR'] || null;

    const newAssignment = {
      "ID": crypto.randomUUID(),
      "Property Name": propertyName,
      "Room Name": roomName,
      "Slot": slot,
      "Resident ID": isAllocated ? null : residentId,
      "Resident ID AR": isAllocated ? residentId : null,
      "Is Allocated": isAllocated,
      "Status": newStatus,
      "Start Date": existing?.['Start Date'] || null,
      "End Date": existing?.['End Date'] || null,
      "Created By": user?.primaryEmailAddress?.emailAddress || "Unknown",
      "Created Date": new Date().toISOString()
    };

    const { error } = await supabase.from('room_assignments').insert([newAssignment]);
    if (error) {
      alert("Error updating status: " + error.message);
    } else {
      loadData();
    }
  };

  const handleFormSubmit = async (formData) => {
    const isAllocated = formData.is_allocated;
    const residentId = formData.resident_id === "none" ? null : formData.resident_id;

    const newAssignment = {
      "ID": crypto.randomUUID(),
      "Property Name": activeSlot.propertyName,
      "Room Name": activeSlot.roomName,
      "Slot": activeSlot.slot,
      "Resident ID": isAllocated ? null : residentId,
      "Resident ID AR": isAllocated ? residentId : null,
      "Is Allocated": isAllocated,
      "Status": formData.status,
      "Start Date": formData.start_date || null,
      "End Date": formData.end_date || null,
      "Notes": formData.notes,
      "Created By": user?.primaryEmailAddress?.emailAddress || "Unknown",
      "Created Date": new Date().toISOString()
    };

    const { error } = await supabase.from('room_assignments').insert([newAssignment]);
    if (error) {
      alert("Error saving assignment: " + error.message);
    } else {
      setShowForm(false);
      loadData();
    }
  };

  const renderCell = (propertyName, roomName, slot) => {
    const assignment = getLatestAssignment(propertyName, roomName, slot);
    const residentId = assignment?.['Is Allocated'] ? assignment?.['Resident ID AR'] : assignment?.['Resident ID'];
    const resident = residentId ? residents.find(r => (r.id || r.Id) === residentId) : null;
    const keycode = KEYCODES.find(k => k.value === assignment?.Status);

    return (
      <TableCell className={`p-1 border text-center ${keycode?.color || 'bg-white'}`}>
        <div className="flex flex-col items-center gap-1 min-h-[40px] justify-center">
          {resident ? (
            <span className={`font-bold text-xs ${assignment['Is Allocated'] ? 'text-blue-600' : 'text-black'}`}>
              {resident.first_name} {resident.last_name}
            </span>
          ) : (
            <span className="text-[10px] uppercase font-bold text-slate-500">
              {keycode?.label || ""}
            </span>
          )}
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => {
                setActiveSlot({ propertyName, roomName, slot });
                setShowForm(true);
              }}
              title="Assign"
            >
              <PlusCircle className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setHistorySlot({ propertyName, roomName, slot })}
              title="History"
            >
              <History className="h-3 w-3" />
            </Button>
            <Select
              value={assignment?.Status || ""}
              onValueChange={(v) => handleQuickStatusChange(propertyName, roomName, slot, v)}
            >
              <SelectTrigger className="h-6 w-[100px] text-[10px] bg-white/50 border-none shadow-none focus:ring-0">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {KEYCODES.map(k => (
                  <SelectItem key={k.value} value={k.value} className="text-[10px]">
                    {k.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </TableCell>
    );
  };

  const calculateFraction = (propertyName, roomsCount) => {
    if (propertyName === "FLAT 4") return "n/a";
    let count = 0;
    for (let i = 1; i <= roomsCount; i++) {
      const assignment = getLatestAssignment(propertyName, `R${i}`, "Residing");
      // Fraction logic: Residing column count
      // Based on spreadsheet: SPRINGFIELD 4/6 means 4 rooms have someone RESIDING
      if (assignment?.['Resident ID'] || (assignment?.Status && !['void', 'vacancy', 'n-a'].includes(assignment.Status))) {
          count++;
      }
    }
    return `${count}/${roomsCount}`;
  };

  return (
    <div className="p-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Room Breakdown</h1>
          <p className="text-slate-500">Real-time room occupancy and assignment tracking.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadData}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {PROPERTIES_CONFIG.map(prop => (
          <Card key={prop.name} className="shadow-sm border-slate-200">
            <CardHeader className="bg-slate-50 border-b py-3">
              <CardTitle className="text-lg font-bold flex justify-between items-center">
                {prop.name}
                <span className="text-sm font-normal text-slate-500">
                   {prop.rooms > 0 ? `${prop.rooms} Rooms` : ''}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-100 hover:bg-slate-100">
                    <TableHead className="w-[80px] font-bold text-black border">ROOM</TableHead>
                    <TableHead className="text-center font-bold text-black border">HB REGISTERED</TableHead>
                    <TableHead className="text-center font-bold text-black border">RESIDING</TableHead>
                    <TableHead className="text-center font-bold text-black border">PLANNED</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: prop.rooms }).map((_, i) => {
                    const roomName = `R${i + 1}`;
                    return (
                      <TableRow key={roomName} className="hover:bg-transparent">
                        <TableCell className="font-bold border bg-slate-50">{roomName}</TableCell>
                        {renderCell(prop.name, roomName, "HB Registered")}
                        {renderCell(prop.name, roomName, "Residing")}
                        {renderCell(prop.name, roomName, "Planned")}
                      </TableRow>
                    );
                  })}
                  {prop.name === "FLAT 4" && (
                     <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-slate-400 italic">
                            No rooms currently defined for Flat 4.
                        </TableCell>
                     </TableRow>
                  )}
                  <TableRow className="bg-slate-50 font-bold">
                    <TableCell colSpan={2} className="text-right border"></TableCell>
                    <TableCell className="text-center border py-2">
                      <div className="text-lg">
                        {calculateFraction(prop.name, prop.rooms)}
                      </div>
                    </TableCell>
                    <TableCell className="border"></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}
      </div>

      {showForm && (
        <RoomAssignmentForm
          isOpen={showForm}
          onClose={() => setShowForm(false)}
          onSubmit={handleFormSubmit}
          initialData={activeSlot ? (() => {
            const assignment = getLatestAssignment(activeSlot.propertyName, activeSlot.roomName, activeSlot.slot);
            return {
              ...assignment,
              propertyName: activeSlot.propertyName,
              roomName: activeSlot.roomName,
              slot: activeSlot.slot,
              resident_id: (assignment?.['Is Allocated'] ? assignment?.['Resident ID AR'] : assignment?.['Resident ID']) || "",
              is_allocated: assignment?.['Is Allocated'] || false,
              status: assignment?.Status || "",
              start_date: assignment?.['Start Date'] || "",
              end_date: assignment?.['End Date'] || "",
            };
          })() : null}
          residents={residents}
          currentUser={currentUser}
        />
      )}

      {historySlot && (
        <RoomAssignmentHistory
          isOpen={!!historySlot}
          onClose={() => setHistorySlot(null)}
          propertyName={historySlot.propertyName}
          roomName={historySlot.roomName}
          slot={historySlot.slot}
          residents={residents}
        />
      )}
    </div>
  );
}
