"use client";

import { useUser } from "@clerk/nextjs";
import React, { useState, useEffect, useCallback } from "react";
import { useClerkSupabaseClient } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Edit2,
  Plus,
  Loader2,
  Clock,
  AlertCircle,
  FileText,
  CheckCircle2,
  Trash2
} from "lucide-react";
import { generateUUID } from "@/lib/utils";
import {
  format,
  startOfWeek,
  addDays,
  isSameDay,
  isAfter,
  isBefore,
  parseISO,
  startOfDay,
  setHours,
  setMinutes
} from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { logActivity, ACTIONS, ENTITIES } from "@/lib/activityUtils";

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const STAFF_GROUPS = {
  OFFICE: {
    name: "Office only",
    color: "#673AB7", // Deep Purple
    members: ["sulekha", "amaani", "leticia", "burton"]
  },
  SW_OFFICE: {
    name: "SW + Office",
    color: "#4B6F44", // Bogey Green
    members: ["sulekha", "amaani", "leticia", "burton", "hasib", "jessica", "francesca", "jess"]
  }
};

const STAFF_COLORS = {
  "amaani": "#AF8FE3",
  "burton": "#42A5F5",
  "francesca": "#FFC107",
  "hasib": "#3F51B5",
  "jessica": "#FF7043",
  "leticia": "#E91E63",
  "sulekha": "#26A69A",
  "jess": "#FF7043", // Alias for jessica
};

const normalizeUser = (user) => {
  if (!user) return user;
  // Keep original keys and add normalized ones
  const normalized = { ...user };
  Object.keys(user).forEach(key => {
    const normalizedKey = key.trim().toLowerCase().replace(/ /g, '_');
    if (!normalized[normalizedKey]) {
      normalized[normalizedKey] = user[key];
    }
  });
  return normalized;
};

const getEmailUsername = (email) => {
  if (!email) return "Unknown";
  return email.split('@')[0];
};

const normalizeHandover = (handover) => {
  if (!handover) return handover;
  const normalized = { ...handover };
  Object.keys(handover).forEach(key => {
    const normalizedKey = key.trim().toLowerCase().replace(/ /g, '_');
    if (!normalized[normalizedKey]) {
      normalized[normalizedKey] = handover[key];
    }
  });

  // Extract Assignment Metadata from Content if present
  if (normalized.content && normalized.content.startsWith('---ASSIGNMENT:')) {
    const match = normalized.content.match(/^---ASSIGNMENT:([\s\S]*?)---\n([\s\S]*)$/);
    if (match) {
      try {
        const metadata = JSON.parse(match[1]);
        normalized.assignment_type = metadata.type;
        normalized.recipients = metadata.recipients || [];
        normalized.content = match[2];
      } catch (e) {
        console.error("Failed to parse handover metadata", e);
      }
    }
  }

  return normalized;
};

export default function StaffHandoverPage() {
  const { user, isLoaded: isClerkLoaded } = useUser();
  const supabase = useClerkSupabaseClient();

  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [users, setUsers] = useState([]);
  const [handovers, setHandovers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCell, setSelectedCell] = useState(null); // { user, date, handover }
  const [handoverContent, setHandoverContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [assignee, setAssignee] = useState(null); // { id, email, name }
  const [queuedEntries, setQueuedEntries] = useState([]);
  const [assignmentType, setAssignmentType] = useState(null); // 'OFFICE', 'SW_OFFICE', 'SPECIFIC'
  const [selectedSpecificStaff, setSelectedSpecificStaff] = useState([]); // Array of IDs
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [isFetchingComments, setIsFetchingComments] = useState(false);


  const fetchUsers = useCallback(async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*');

      if (error) throw error;

      const exhaustiveStaff = ["sulekha", "amaani", "leticia", "burton", "hasib", "jessica", "francesca", "jess"];

      const normalizedUsers = (data || [])
        .map(normalizeUser)
        .filter(u => {
          const emailPrefix = getEmailUsername(u.email || u.Email).toLowerCase();
          return exhaustiveStaff.includes(emailPrefix);
        })
        .sort((a, b) => {
          const nameA = (a.full_name || a['Full Name'] || a.email || a.Email || "").toLowerCase();
          const nameB = (b.full_name || b['Full Name'] || b.email || b.Email || "").toLowerCase();
          return nameA.localeCompare(nameB);
        });

      console.log("Fetched users for handover:", normalizedUsers.length);
      setUsers(normalizedUsers);
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  }, [supabase]);

  const fetchHandovers = useCallback(async () => {
    if (!supabase) return;
    try {
      const weekEnd = addDays(currentWeekStart, 5);
      const { data, error } = await supabase
        .from('staff_handover')
        .select('*')
        .gte('"Handover Date"', format(currentWeekStart, 'yyyy-MM-dd'))
        .lte('"Handover Date"', format(weekEnd, 'yyyy-MM-dd'));

      if (error) throw error;
      setHandovers((data || []).map(normalizeHandover));
    } catch (err) {
      console.error("Error fetching handovers:", err);
    }
  }, [supabase, currentWeekStart]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchUsers(), fetchHandovers()]);
      setLoading(false);
    };
    if (supabase && isClerkLoaded) {
      loadData();
    }
  }, [supabase, isClerkLoaded, fetchUsers, fetchHandovers]);

  const weekDates = DAYS_OF_WEEK.map((_, index) => addDays(currentWeekStart, index));

  const isCurrentUser = useCallback((staffMember) => {
    if (!user) return false;

    const clerkEmail = user.primaryEmailAddress?.emailAddress?.toLowerCase();
    const clerkId = user.id;
    const clerkName = user.fullName?.toLowerCase();

    const staffEmail = (staffMember.email || staffMember.Email || staffMember.user_email || "").toLowerCase();
    const staffId = (staffMember.id || staffMember.ID || "").toString();
    const staffName = (staffMember.full_name || staffMember['Full Name'] || "").toLowerCase();

    // 1. Try matching by Clerk ID
    if (clerkId && staffId && clerkId === staffId) return true;

    // 2. Try matching by Exact Email
    if (clerkEmail && staffEmail && clerkEmail === staffEmail) return true;

    // 3. Try matching by Email Prefix (e.g. sulekha@...)
    if (clerkEmail && staffEmail) {
        const clerkPrefix = clerkEmail.split('@')[0];
        const staffPrefix = staffEmail.split('@')[0];
        if (clerkPrefix === staffPrefix && clerkPrefix.length > 2) return true;
    }

    // 4. Try matching by Name
    if (clerkName && staffName && clerkName === staffName && clerkName.length > 2) return true;

    return false;
  }, [user]);

  const getHandoversForCell = useCallback((staffMember, date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const staffEmailPrefix = getEmailUsername(staffMember.email || staffMember.Email).toLowerCase();
    const staffId = (staffMember.id || staffMember.ID || "").toString();

    return handovers.filter(h => {
      if (h.handover_date !== dateStr) return false;

      const hCreatorId = (h.user_id || h['User ID'] || "").toString();
      const isCreator = hCreatorId === staffId;

      // New Assignment logic
      if (h.assignment_type) {
        let isRecipient = false;
        if (h.assignment_type === 'OFFICE') {
          isRecipient = STAFF_GROUPS.OFFICE.members.includes(staffEmailPrefix);
        } else if (h.assignment_type === 'SW_OFFICE') {
          isRecipient = STAFF_GROUPS.SW_OFFICE.members.includes(staffEmailPrefix);
        } else if (h.assignment_type === 'SPECIFIC') {
          isRecipient = h.recipients?.includes(staffId);
        }
        return isCreator || isRecipient;
      }

      // Legacy logic
      const assignedToId = (h.assigned_to_id || h['Assigned To ID'] || "").toString();
      const assignedToEmail = (h.assigned_to_email || h['Assigned To Email'] || "").toLowerCase();
      const staffEmail = (staffMember.email || staffMember.Email || "").toLowerCase();

      if (assignedToId || assignedToEmail) {
        if (assignedToId && staffId && assignedToId === staffId) return true;
        if (assignedToEmail && staffEmail && assignedToEmail === staffEmail) return true;
        return isCreator; // Creator also sees it
      }

      // Default: creator only
      return isCreator;
    });
  }, [handovers]);

  const navigateWeek = (direction) => {
    setCurrentWeekStart(prev => addDays(prev, direction * 7));
  };

  const resetToCurrentWeek = () => {
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
  };

  const fetchComments = async (handoverId) => {
    if (!supabase || !handoverId) return;
    setIsFetchingComments(true);
    try {
      const { data, error } = await supabase
        .from('handover_comments')
        .select('*')
        .eq('"Handover ID"', handoverId)
        .order('"Created At"', { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (err) {
      console.error("Error fetching comments:", err);
    } finally {
      setIsFetchingComments(false);
    }
  };

  const handleCellClick = (staffMember, date, existingHandover = null) => {
    // Only allow clicking if:
    // 1. It's the user's own row (to create/edit self or assigned to others)
    // 2. Or if there's an existing handover to view/comment on
    if (!isCurrentUser(staffMember) && !existingHandover) return;

    // If it's the current user's row, they might be creating a new one (possibly assigned to someone else)
    const creatorId = user?.id;
    const currentAssigneeId = assignee?.id;

    // Find if the current user already has an entry for this date with the CURRENTLY SELECTED assignee
    const existing = existingHandover || handovers.find(h => {
        const hDate = h.handover_date;
        const hCreatorId = h.user_id;
        const hAssigneeId = h.assigned_to_id || h['Assigned To ID'];
        return hDate === format(date, 'yyyy-MM-dd') && hCreatorId === creatorId && hAssigneeId === currentAssigneeId;
    });

    // Restriction: Only allow creating/editing for "Today" OR future dates
    const today = startOfDay(new Date());
    const cellDate = startOfDay(date);

    // If it's a past date, only allow viewing existing handovers
    if (isBefore(cellDate, today) && !existing) {
        return;
    }

    setSelectedCell({ user: staffMember, date, handover: existing });
    setHandoverContent(existing?.content || "");
    setAssignmentType(null);
    setSelectedSpecificStaff([]);
    setQueuedEntries([]);
    setComments([]);
    setNewComment("");
    setIsDialogOpen(true);

    if (existing) {
      fetchComments(existing.id || existing.ID);
    }
  };

  const handleQueueEntry = () => {
    if (!handoverContent.trim() || !assignmentType) return;
    if (assignmentType === 'SPECIFIC' && selectedSpecificStaff.length === 0) return;

    const newEntry = {
      id: generateUUID(),
      content: handoverContent,
      type: assignmentType,
      specificStaff: [...selectedSpecificStaff]
    };

    setQueuedEntries(prev => [...prev, newEntry]);
    setHandoverContent("");
    setAssignmentType(null);
    setSelectedSpecificStaff([]);
  };

  const removeQueuedEntry = (id) => {
    setQueuedEntries(prev => prev.filter(e => e.id !== id));
  };

  const handleSaveHandover = async () => {
    if (!selectedCell || !supabase || !user) return;

    setIsSubmitting(true);
    try {
      const dateStr = format(selectedCell.date, 'yyyy-MM-dd');
      const existing = selectedCell.handover;

      // 1. Process Update if editing existing
      if (existing) {
        if (existing.user_id !== user.id) {
          throw new Error("Only the creator can edit this handover.");
        }
        const { error } = await supabase
          .from('staff_handover')
          .update({
            "Content": existing.assignment_type ?
              `---ASSIGNMENT:${JSON.stringify({ type: existing.assignment_type, recipients: existing.recipients })}---\n${handoverContent}` :
              handoverContent,
            "Updated At": new Date().toISOString()
          })
          .eq('"ID"', existing.id || existing.ID);

        if (error) throw error;
      }

      // 2. Process New/Queued entries
      const newEntriesToSave = [...queuedEntries];
      // Only include the current form content as a NEW entry if we are NOT editing an existing one
      if (!existing && handoverContent.trim() && assignmentType) {
        newEntriesToSave.push({
          id: generateUUID(),
          content: handoverContent,
          type: assignmentType,
          specificStaff: [...selectedSpecificStaff]
        });
      }

      if (newEntriesToSave.length > 0) {
        const insertPayloads = newEntriesToSave.map(entry => ({
          "ID": generateUUID(),
          "User ID": user.id,
          "User Email": user.primaryEmailAddress?.emailAddress,
          "Handover Date": dateStr,
          "Content": `---ASSIGNMENT:${JSON.stringify({ type: entry.type, recipients: entry.specificStaff })}---\n${entry.content}`,
          "Created At": new Date().toISOString(),
          "Updated At": new Date().toISOString()
        }));

        const { error } = await supabase
          .from('staff_handover')
          .insert(insertPayloads);

        if (error) throw error;
      }

      // Log activity
      await logActivity(supabase, {
        userName: user?.fullName || "Unknown",
        userEmail: user?.primaryEmailAddress?.emailAddress,
        actionType: existing ? ACTIONS.UPDATE : ACTIONS.CREATE,
        entityType: 'STAFF_HANDOVER',
        description: existing ? `Updated handover for ${dateStr}` : `Created ${newEntriesToSave.length} handover entries for ${dateStr}`
      });

      await fetchHandovers();
      setIsDialogOpen(false);
      setQueuedEntries([]);
    } catch (err) {
      console.error("Error saving handover:", err);
      alert("Failed to save handover: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedCell?.handover || !supabase || !user) return;

    try {
      const payload = {
        "ID": generateUUID(),
        "Handover ID": selectedCell.handover.id || selectedCell.handover.ID,
        "User ID": user.id,
        "User Name": user.fullName || "Unknown",
        "Content": newComment,
        "Created At": new Date().toISOString()
      };

      const { error } = await supabase
        .from('handover_comments')
        .insert([payload]);

      if (error) throw error;

      setNewComment("");
      await fetchComments(selectedCell.handover.id || selectedCell.handover.ID);
    } catch (err) {
      console.error("Error adding comment:", err);
      alert("Failed to add comment: " + err.message);
    }
  };

  const getStaffNameById = (id) => {
    const u = users.find(u => (u.id || u.ID)?.toString() === id?.toString());
    if (u) return u.full_name || u['Full Name'] || getEmailUsername(u.email || u.Email);
    return "Unknown Staff";
  };

  if (loading && !handovers.length) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Staff Handover</h1>
          <p className="text-slate-500">Weekly handover logs for all staff members</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white p-1 rounded-lg border shadow-sm">
            <Button variant="ghost" size="icon" onClick={() => navigateWeek(-1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="px-4 py-2 font-medium flex items-center gap-2 text-sm">
              <CalendarIcon className="w-4 h-4 text-slate-400" />
              {format(currentWeekStart, 'MMM d')} - {format(addDays(currentWeekStart, 4), 'MMM d, yyyy')}
            </div>
            <Button variant="ghost" size="icon" onClick={() => navigateWeek(1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
            <div className="h-4 w-[1px] bg-slate-200 mx-1" />
            <Button variant="ghost" size="sm" onClick={resetToCurrentWeek}>
              Today
            </Button>
          </div>

          <Button
            className="bg-purple-600 hover:bg-purple-700 shadow-sm"
            onClick={() => {
              const me = users.find(u => isCurrentUser(u));
              if (me) {
                // Ensure we start a fresh entry when clicking the top button
                handleCellClick(me, new Date(), null);
              } else {
                alert(`Could not identify your staff record. Logged in as: ${user?.primaryEmailAddress?.emailAddress || 'Unknown'}. Please ensure your email matches a record in the staff list.`);
              }
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Today's Handover
          </Button>
        </div>
      </div>

      <Card className="border-0 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="w-[240px] font-bold text-slate-700">Staff Member</TableHead>
                {weekDates.map((date, i) => (
                  <TableHead key={i} className="min-w-[200px] font-bold text-slate-700">
                    <div className="flex flex-col">
                      <span>{DAYS_OF_WEEK[i]}</span>
                      <span className="text-xs font-normal text-slate-500">{format(date, 'MMM d')}</span>
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((staffMember) => {
                const isMe = isCurrentUser(staffMember);
                const staffEmail = staffMember.email || staffMember.Email || "";

                return (
                <TableRow key={staffMember.id || staffMember.ID} className="hover:bg-slate-50/50 transition-colors">
                  <TableCell className={`font-semibold text-slate-900 sticky left-0 z-10 border-r min-w-[220px] ${
                    isMe ? 'bg-purple-50 ring-1 ring-inset ring-purple-200' : 'bg-white'
                  }`}>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs text-slate-600 font-bold uppercase">
                          {getEmailUsername(staffEmail).substring(0, 2)}
                        </div>
                        <div className="flex flex-col">
                          <span className="capitalize">{getEmailUsername(staffEmail)}</span>
                          {isMe && (
                            <span className="text-[10px] text-purple-600 font-bold uppercase tracking-tighter">You</span>
                          )}
                        </div>
                      </div>

                    </div>
                  </TableCell>
                  {weekDates.map((date, i) => {
                    const handoversInCell = getHandoversForCell(staffMember, date);
                    const canEditRow = isMe && (isSameDay(new Date(), date) || isAfter(startOfDay(date), startOfDay(new Date())));

                    const isPast = isBefore(startOfDay(date), startOfDay(new Date()));
                    const isToday = isSameDay(new Date(), date);

                    return (
                      <TableCell
                        key={i}
                        className={`p-0 h-32 align-top border-r last:border-r-0 ${canEditRow ? 'cursor-pointer hover:opacity-90 transition-all group' : ''} ${isMe ? 'bg-purple-50/20' : ''}`}
                        onClick={() => handleCellClick(staffMember, date)}
                      >
                        <div className="h-full flex flex-col overflow-y-auto max-h-32 scrollbar-hide">
                          {handoversInCell.length > 0 ? (
                            handoversInCell.map((h, idx) => {
                                const isCreator = h.user_id === user?.id;
                                let cellColor = 'white';
                                let textColor = 'slate-900';

                                if (h.assignment_type === 'OFFICE') {
                                    cellColor = STAFF_GROUPS.OFFICE.color;
                                    textColor = 'white';
                                } else if (h.assignment_type === 'SW_OFFICE') {
                                    cellColor = STAFF_GROUPS.SW_OFFICE.color;
                                    textColor = 'white';
                                } else {
                                    // SPECIFIC staff or legacy
                                    cellColor = STAFF_COLORS[staffEmailPrefix] || '#94a3b8';
                                    textColor = 'white';
                                }

                                return (
                                    <div
                                        key={h.id || h.ID}
                                        className={`p-2 flex-1 min-h-[64px] text-xs transition-all flex flex-col`}
                                        style={{ backgroundColor: cellColor, color: textColor }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleCellClick(staffMember, date, h);
                                        }}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                          {!isCreator && (
                                              <div className="text-[9px] font-black uppercase opacity-80">
                                                  From: {getStaffNameById(h.user_id)}
                                              </div>
                                          )}
                                          {isCreator && canEditRow && (
                                            <Edit2 className="w-3 h-3 opacity-50 ml-auto" />
                                          )}
                                        </div>
                                        <p className="line-clamp-3 leading-tight font-medium">
                                            {h.content}
                                        </p>
                                    </div>
                                );
                            })
                          ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-300 p-2">
                                {isPast ? (
                                    <span className="text-[10px] italic">No entry</span>
                                ) : canEditRow ? (
                                    <div className={`${isToday ? 'opacity-100 text-purple-400' : 'opacity-0'} group-hover:opacity-100 transition-opacity flex flex-col items-center gap-1`}>
                                        <Plus className={`w-4 h-4 ${isToday ? 'animate-pulse' : ''}`} />
                                        <span className="text-[9px] font-medium uppercase tracking-wider">Add Entry</span>
                                    </div>
                                ) : null}
                            </div>
                          )}
                        </div>
                      </TableCell>
                    );
                  })}
                </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-600" />
              Handover Entry - {selectedCell && format(selectedCell.date, 'EEEE, MMM d')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
            {selectedCell?.handover && selectedCell.handover.user_id !== user?.id && (
                <div className="p-3 bg-purple-50 rounded-lg border border-purple-100 text-sm">
                    <span className="font-bold text-purple-700">From: </span>
                    <span className="text-slate-700">{getStaffNameById(selectedCell.handover.user_id)}</span>
                </div>
            )}

            {/* Queued Entries Display */}
            {queuedEntries.length > 0 && (
              <div className="space-y-2 border rounded-lg p-3 bg-slate-50">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Queued Handovers</h4>
                {queuedEntries.map((entry) => (
                  <div key={entry.id} className="flex items-start justify-between gap-2 p-2 bg-white rounded border shadow-sm">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge
                          className="text-[10px]"
                          style={{
                            backgroundColor: entry.type === 'OFFICE' ? STAFF_GROUPS.OFFICE.color :
                                           entry.type === 'SW_OFFICE' ? STAFF_GROUPS.SW_OFFICE.color : '#64748b'
                          }}
                        >
                          {entry.type === 'OFFICE' ? 'Office' : entry.type === 'SW_OFFICE' ? 'SW + Office' : 'Specific'}
                        </Badge>
                        {entry.type === 'SPECIFIC' && (
                          <span className="text-[10px] text-slate-500">
                            {entry.specificStaff.length} staff
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-2">{entry.content}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-slate-400 hover:text-red-500"
                      onClick={() => removeQueuedEntry(entry.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Form Section */}
            {(!selectedCell?.handover || selectedCell.handover.user_id === user?.id) && (
              <div className="space-y-4 border-t pt-4">
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-slate-700">Assign Handover To:</label>
                  <div className="grid grid-cols-1 gap-3">
                    <div
                      className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors cursor-pointer ${assignmentType === 'OFFICE' ? 'bg-purple-50 border-purple-200' : 'hover:bg-slate-50'}`}
                      onClick={() => setAssignmentType('OFFICE')}
                    >
                      <Checkbox checked={assignmentType === 'OFFICE'} onCheckedChange={() => setAssignmentType('OFFICE')} />
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: STAFF_GROUPS.OFFICE.color }} />
                        <span className="text-sm font-medium">Office Only</span>
                      </div>
                    </div>

                    <div
                      className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors cursor-pointer ${assignmentType === 'SW_OFFICE' ? 'bg-green-50 border-green-200' : 'hover:bg-slate-50'}`}
                      onClick={() => setAssignmentType('SW_OFFICE')}
                    >
                      <Checkbox checked={assignmentType === 'SW_OFFICE'} onCheckedChange={() => setAssignmentType('SW_OFFICE')} />
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: STAFF_GROUPS.SW_OFFICE.color }} />
                        <span className="text-sm font-medium">SW + Office</span>
                      </div>
                    </div>

                    <div
                      className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors cursor-pointer ${assignmentType === 'SPECIFIC' ? 'bg-blue-50 border-blue-200' : 'hover:bg-slate-50'}`}
                      onClick={() => setAssignmentType('SPECIFIC')}
                    >
                      <Checkbox checked={assignmentType === 'SPECIFIC'} onCheckedChange={() => setAssignmentType('SPECIFIC')} />
                      <span className="text-sm font-medium">Specific Staff</span>
                    </div>
                  </div>
                </div>

                {assignmentType === 'SPECIFIC' && (
                  <div className="space-y-2 p-3 bg-slate-50 rounded-lg border animate-in fade-in slide-in-from-top-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Select Staff Members:</label>
                    <div className="grid grid-cols-2 gap-2">
                      {users.map((u) => {
                        const emailPrefix = getEmailUsername(u.email || u.Email).toLowerCase();
                        const staffColor = STAFF_COLORS[emailPrefix] || '#94a3b8';
                        const isSelected = selectedSpecificStaff.includes((u.id || u.ID).toString());
                        const isOffice = STAFF_GROUPS.OFFICE.members.includes(emailPrefix);

                        return (
                          <div
                            key={u.id || u.ID}
                            className={`flex items-center space-x-2 p-2 rounded border bg-white cursor-pointer transition-all ${isSelected ? 'ring-2 ring-offset-1' : ''}`}
                            style={{ borderColor: isSelected ? staffColor : '#e2e8f0', ringColor: staffColor }}
                            onClick={() => {
                              const id = (u.id || u.ID).toString();
                              setSelectedSpecificStaff(prev =>
                                prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
                              );
                            }}
                          >
                            <Checkbox checked={isSelected} />
                            <span className="text-xs font-semibold truncate" style={{ color: isSelected ? staffColor : (isOffice ? STAFF_GROUPS.OFFICE.color : STAFF_GROUPS.SW_OFFICE.color) }}>
                              {u.full_name || u['Full Name'] || getEmailUsername(u.email || u.Email)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {assignmentType && (
                  <div className="space-y-2 animate-in fade-in duration-300">
                    <label className="text-sm font-medium text-slate-700">Handover Notes</label>
                    <Textarea
                      placeholder="Write your handover notes here..."
                      className="min-h-[120px] resize-none"
                      value={handoverContent}
                      onChange={(e) => setHandoverContent(e.target.value)}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full border-dashed border-2 hover:border-purple-400 hover:bg-purple-50 text-slate-500 hover:text-purple-600"
                      onClick={handleQueueEntry}
                      disabled={!handoverContent.trim() || (assignmentType === 'SPECIFIC' && selectedSpecificStaff.length === 0)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Another Handover Note
                    </Button>
                  </div>
                )}
              </div>
            )}

            {selectedCell?.handover && selectedCell.handover.user_id !== user?.id && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Daily Summary</label>
                <div className="p-4 bg-slate-50 rounded-lg border text-sm text-slate-700 whitespace-pre-wrap">
                  {selectedCell.handover.content}
                </div>
              </div>
            )}

            {selectedCell && isAfter(startOfDay(selectedCell.date), startOfDay(new Date())) && (!selectedCell.handover || selectedCell.handover.user_id === user?.id) && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 text-xs text-blue-700 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>You are logging an entry for a future date. This is typically used for planned Annual Leave.</span>
                </div>
            )}

            {/* Comments Section */}
            {selectedCell?.handover && (
                <div className="space-y-4 pt-4 border-t">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Comments & Discussion
                    </h3>

                    <div className="space-y-3">
                        {isFetchingComments ? (
                            <div className="flex justify-center py-4">
                                <Loader2 className="w-5 h-5 animate-spin text-slate-300" />
                            </div>
                        ) : comments.length > 0 ? (
                            comments.map((comment) => (
                                <div key={comment.id || comment.ID} className={`flex flex-col ${comment.user_id === user?.id ? 'items-end' : 'items-start'}`}>
                                    <div className={`max-w-[80%] p-2 rounded-lg text-xs ${comment.user_id === user?.id ? 'bg-purple-100 text-purple-900' : 'bg-slate-100 text-slate-900'}`}>
                                        <div className="font-bold text-[10px] mb-1">{comment.user_name || comment['User Name']}</div>
                                        {comment.content || comment.Content}
                                    </div>
                                    <div className="text-[9px] text-slate-400 mt-1">
                                        {format(new Date(comment.created_at || comment['Created At']), 'MMM d, HH:mm')}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-xs text-slate-400 italic text-center py-2">No comments yet.</p>
                        )}
                    </div>

                    <div className="flex gap-2">
                        <Textarea
                            placeholder="Add a comment..."
                            className="min-h-[60px] text-xs resize-none"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                        />
                        <Button
                            size="sm"
                            className="h-auto"
                            onClick={handleAddComment}
                            disabled={!newComment.trim()}
                        >
                            Post
                        </Button>
                    </div>
                </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
              Close
            </Button>
            {(!selectedCell?.handover || selectedCell.handover.user_id === user?.id) && (
              <Button
                  onClick={handleSaveHandover}
                  disabled={isSubmitting || (queuedEntries.length === 0 && !handoverContent.trim())}
                  className="bg-purple-600 hover:bg-purple-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  queuedEntries.length > 0 ? `Save All (${queuedEntries.length + (handoverContent.trim() ? 1 : 0)})` : 'Save Handover'
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
