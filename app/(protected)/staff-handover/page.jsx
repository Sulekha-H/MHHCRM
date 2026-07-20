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
  Eye,
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
    members: ["sulekha", "amaani", "leticia", "burton", "hasib", "jessica", "francesca"]
  }
};

const TEAMSUP_COLORS = {
  "amaani": "#B388EB",
  "burton": "#42A5F5",
  "francesca": "#4B6F44", // SW -> Bogey Green
  "hasib": "#4B6F44",      // SW -> Bogey Green
  "jessica": "#4B6F44",    // SW -> Bogey Green
  "jess": "#4B6F44",       // SW -> Bogey Green
  "leticia": "#E91E63",
  "sulekha": "#26A69A",
};

const STAFF_COLORS = {
  "amaani": "#B388EB",
  "burton": "#42A5F5",
  "francesca": "#4B6F44", // SW -> Bogey Green
  "hasib": "#4B6F44",      // SW -> Bogey Green
  "jessica": "#4B6F44",    // SW -> Bogey Green
  "jess": "#4B6F44",       // SW -> Bogey Green
  "leticia": "#E91E63",
  "sulekha": "#26A69A",
  "office": "#673AB7",     // Deep Purple for group blocks
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

  // New multi-entry format: ---JSON_ENTRIES:[{id, content, type, recipients}]---
  if (normalized.content && typeof normalized.content === 'string' && normalized.content.startsWith('---JSON_ENTRIES:')) {
    const match = normalized.content.match(/^---JSON_ENTRIES:([\s\S]*?)---/);
    if (match) {
      try {
        normalized.entries = JSON.parse(match[1]);
      } catch (e) {
        console.error("Failed to parse handover entries", e);
        normalized.entries = [];
      }
    }
  } else if (normalized.content && typeof normalized.content === 'string' && normalized.content.startsWith('---ASSIGNMENT:')) {
    // Fallback for legacy assignment format
    const match = normalized.content.match(/^---ASSIGNMENT:([\s\S]*?)---\n([\s\S]*)$/);
    if (match) {
      try {
        const metadata = JSON.parse(match[1]);
        normalized.entries = [{
            id: normalized.id || normalized.ID,
            type: metadata.type,
            recipients: metadata.recipients || [],
            content: match[2]
        }];
      } catch (e) {
        console.error("Failed to parse legacy handover metadata", e);
        normalized.entries = [];
      }
    }
  } else {
    // Pure legacy content
    normalized.entries = [{
        id: normalized.id || normalized.ID,
        type: 'SPECIFIC',
        recipients: [(normalized.user_id || normalized['User ID']).toString()],
        content: normalized.content
    }];
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
  const [previewData, setPreviewData] = useState(null); // { entry, handover, date, staffMember }
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);


  const fetchUsers = useCallback(async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*');

      if (error) throw error;

      const exhaustiveStaff = ["sulekha", "amaani", "leticia", "burton", "hasib", "jessica", "francesca"];
      const existingPrefixes = new Set();

      const normalizedUsers = (data || [])
        .map(normalizeUser)
        .filter(u => {
          let emailPrefix = getEmailUsername(u.email || u.Email).toLowerCase();
          if (emailPrefix === 'jess') emailPrefix = 'jessica';

          if (exhaustiveStaff.includes(emailPrefix)) {
              existingPrefixes.add(emailPrefix);
              return true;
          }
          return false;
        });

      // Synthesize missing users
      exhaustiveStaff.forEach(prefix => {
          if (!existingPrefixes.has(prefix)) {
              normalizedUsers.push({
                  id: `synth-${prefix}`,
                  email: `${prefix}@myhopehousing.org.uk`,
                  full_name: prefix.charAt(0).toUpperCase() + prefix.slice(1)
              });
          }
      });

      normalizedUsers.sort((a, b) => {
        const nameA = (a.full_name || a['Full Name'] || a.email || a.Email || "").toLowerCase();
        const nameB = (b.full_name || b['Full Name'] || b.email || b.Email || "").toLowerCase();
        return nameA.localeCompare(nameB);
      });

      console.log("Final users for handover table:", normalizedUsers.length);
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

  const findStaffByAny = useCallback((id, email) => {
    if (!id && !email) return null;

    let searchId = id ? id.toString().trim() : null;
    let searchEmail = email ? email.toLowerCase().trim() : null;
    let searchPrefix = searchEmail ? getEmailUsername(searchEmail) : null;

    // If searchId looks like an email, use it as email
    if (searchId && searchId.includes('@')) {
        searchEmail = searchId.toLowerCase();
        searchPrefix = getEmailUsername(searchEmail);
    }

    // Handle aliases
    if (searchPrefix === 'jess') searchPrefix = 'jessica';

    // Also consider the current user as a source of truth
    if (user) {
        const clerkId = user.id;
        const clerkEmail = user.primaryEmailAddress?.emailAddress?.toLowerCase().trim();
        const clerkPrefix = clerkEmail?.split('@')[0];
        const normalizedClerkPrefix = clerkPrefix === 'jess' ? 'jessica' : clerkPrefix;

        if ((searchId && searchId === clerkId) ||
            (searchPrefix && searchPrefix === normalizedClerkPrefix) ||
            (searchEmail && searchEmail === clerkEmail)) {
            return {
                id: clerkId,
                email: clerkEmail,
                full_name: user.fullName || (clerkPrefix ? clerkPrefix.charAt(0).toUpperCase() + clerkPrefix.slice(1) : "Me")
            };
        }
    }

    return users.find(u => {
        const uId = (u.id || u.ID || "").toString().trim();
        const uEmail = (u.email || u.Email || "").toLowerCase().trim();
        const uPrefix = uEmail.split('@')[0].toLowerCase();
        const normalizedUPrefix = uPrefix === 'jess' ? 'jessica' : uPrefix;

        if (searchId && uId === searchId) return true;
        if (searchPrefix && normalizedUPrefix === searchPrefix) return true;
        if (searchEmail && uEmail === searchEmail) return true;
        // Legacy: ID might be the prefix
        if (searchId && searchId.toLowerCase() === normalizedUPrefix) return true;

        return false;
    });
  }, [users, user]);

  const isCurrentUser = useCallback((staffMember) => {
    if (!user) return false;

    const clerkEmail = user.primaryEmailAddress?.emailAddress?.toLowerCase();
    const clerkId = user.id;

    const staffEmail = (staffMember.email || staffMember.Email || "").toLowerCase();
    const staffId = (staffMember.id || staffMember.ID || "").toString();

    if (clerkId && staffId && clerkId === staffId) return true;
    if (clerkEmail && staffEmail) {
        const clerkPrefix = clerkEmail.split('@')[0];
        const staffPrefix = staffEmail.split('@')[0];
        if (clerkPrefix === staffPrefix && clerkPrefix.length > 1) return true;
    }

    return false;
  }, [user]);

  const getHandoversForCell = useCallback((staffMember, date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const staffEmailPrefix = getEmailUsername(staffMember.email || staffMember.Email).toLowerCase();
    const staffId = (staffMember.id || staffMember.ID || "").toString();

    const results = [];
    handovers.forEach(h => {
      if (h.handover_date !== dateStr) return;

      const hCreatorId = (h.user_id || h['User ID'] || "").toString();
      const hCreatorEmail = (h.user_email || h['User Email'] || "");

      // Use robust matching for creator
      const creatorStaff = findStaffByAny(hCreatorId, hCreatorEmail);
      const isCreator = creatorStaff && (
          (creatorStaff.id || creatorStaff.ID)?.toString() === staffId ||
          getEmailUsername(creatorStaff.email || creatorStaff.Email).toLowerCase() === staffEmailPrefix
      );

      if (h.entries && Array.isArray(h.entries)) {
          h.entries.forEach(entry => {
              if (entry.deleted) return;
              let isRecipient = false;
              if (entry.type === 'OFFICE') {
                isRecipient = STAFF_GROUPS.OFFICE.members.includes(staffEmailPrefix);
              } else if (entry.type === 'SW_OFFICE') {
                isRecipient = STAFF_GROUPS.SW_OFFICE.members.includes(staffEmailPrefix);
              } else if (entry.type === 'SPECIFIC') {
                // Specific recipients are stored by ID, but we should also check synthesis compatibility
                isRecipient = entry.recipients?.some(rid => {
                    const rStaff = findStaffByAny(rid, null);
                    return rStaff && getEmailUsername(rStaff.email || rStaff.Email).toLowerCase() === staffEmailPrefix;
                });
              }

              if (isCreator || isRecipient) {
                  results.push({
                      ...h,
                      entry: entry,
                      isCreator
                  });
              }
          });
      }
    });
    return results;
  }, [handovers, findStaffByAny]);

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

    const dateStr = format(date, 'yyyy-MM-dd');

    // Find if the current user already has an entry for this date
    const existing = existingHandover || handovers.find(h => {
        if (h.handover_date !== dateStr) return false;
        const hCreatorId = h.user_id || h['User ID'];
        if (hCreatorId === user?.id) return true;
        const staff = findStaffByAny(hCreatorId);
        return staff && staff.id === user?.id;
    });

    // Restriction: Only allow creating/editing for "Today" OR future dates
    const today = startOfDay(new Date());
    const cellDate = startOfDay(date);

    // If it's a past date, only allow viewing existing handovers
    if (isBefore(cellDate, today) && !existing) {
        return;
    }

    setSelectedCell({ user: staffMember, date, handover: existing });
    setHandoverContent("");
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
      const existing = handovers.find(h => {
          if (h.handover_date !== dateStr) return false;
          const hCreatorId = h.user_id || h['User ID'];
          if (hCreatorId === user.id) return true;
          const staff = findStaffByAny(hCreatorId);
          return staff && staff.id === user.id;
      });

      // Collect all entries (existing + new queued + current form)
      let allEntries = existing?.entries ? [...existing.entries] : [];

      // Add queued entries
      queuedEntries.forEach(q => {
          allEntries.push({
              id: q.id,
              content: q.content,
              type: q.type,
              recipients: q.specificStaff
          });
      });

      // Add current form content if valid
      if (handoverContent.trim() && assignmentType) {
          allEntries.push({
              id: generateUUID(),
              content: handoverContent,
              type: assignmentType,
              recipients: assignmentType === 'SPECIFIC' ? [...selectedSpecificStaff] : []
          });
      }

      if (allEntries.length === 0) {
          alert("Please add at least one handover note.");
          setIsSubmitting(false);
          return;
      }

      const combinedContent = `---JSON_ENTRIES:${JSON.stringify(allEntries)}---`;

      const userEmail = user.primaryEmailAddress?.emailAddress;
      if (existing) {
        const { error } = await supabase
          .from('staff_handover')
          .update({
            "Content": combinedContent,
            "User Email": userEmail,
            "Late Reason": "",
            "Updated At": new Date().toISOString()
          })
          .eq('"ID"', existing.id || existing.ID);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('staff_handover')
          .insert([{
            "ID": generateUUID(),
            "User ID": user.id,
            "User Email": userEmail,
            "Handover Date": dateStr,
            "Content": combinedContent,
            "Late Reason": "",
            "Created At": new Date().toISOString(),
            "Updated At": new Date().toISOString()
          }]);

        if (error) throw error;
      }

      // Log activity
      await logActivity(supabase, {
        userName: user?.fullName || "Unknown",
        userEmail: user?.primaryEmailAddress?.emailAddress,
        actionType: existing ? ACTIONS.UPDATE : ACTIONS.CREATE,
        entityType: ENTITIES.STAFF_HANDOVER,
        description: `Handover entries saved for ${dateStr}. Total notes: ${allEntries.length}`
      });

      await fetchHandovers();
      setIsDialogOpen(false);
      setQueuedEntries([]);
      setHandoverContent("");
      setAssignmentType(null);
      setSelectedSpecificStaff([]);
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

  const getStaffNameById = (id, email = null) => {
    const s = findStaffByAny(id, email);
    if (s) {
        const name = s.full_name || s['Full Name'];
        if (name && name !== "Me") return name;
        const prefix = getEmailUsername(s.email || s.Email);
        return prefix.charAt(0).toUpperCase() + prefix.slice(1);
    }

    const effectiveEmail = email || (id && id.includes('@') ? id : null);
    if (effectiveEmail) {
        const prefix = getEmailUsername(effectiveEmail);
        if (prefix && prefix !== "Unknown") {
            return prefix.charAt(0).toUpperCase() + prefix.slice(1);
        }
    }

    if (id) {
        const idStr = id.toString().toLowerCase();
        const exhaustiveStaff = ["sulekha", "amaani", "leticia", "burton", "hasib", "jessica", "francesca", "jess"];
        if (exhaustiveStaff.includes(idStr)) {
            const prefix = idStr === 'jess' ? 'Jessica' : idStr.charAt(0).toUpperCase() + idStr.slice(1);
            return prefix;
        }
    }

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
                const staffEmailPrefix = getEmailUsername(staffEmail).toLowerCase();

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
                          <span className="capitalize font-bold" style={{ color: TEAMSUP_COLORS[staffEmailPrefix] || 'inherit' }}>
                            {getEmailUsername(staffEmail)}
                          </span>
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
                                    handoversInCell.map((cellItem, idx) => {
                                        const h = cellItem;
                                        const entry = cellItem.entry;
                                        const isCreator = cellItem.isCreator;
                                let cellColor = 'white';
                                let textColor = 'slate-900';

                                        if (entry.type === 'OFFICE') {
                                    cellColor = STAFF_GROUPS.OFFICE.color;
                                    textColor = 'white';
                                        } else if (entry.type === 'SW_OFFICE') {
                                    cellColor = STAFF_GROUPS.SW_OFFICE.color;
                                    textColor = 'white';
                                } else {
                                            // SPECIFIC staff: get the color of the row it's in
                                    cellColor = STAFF_COLORS[staffEmailPrefix] || '#94a3b8';
                                    textColor = 'white';
                                }

                                return (
                                    <div
                                                key={`${h.id || h.ID}-${idx}`}
                                                className="p-2 flex-1 min-h-[64px] text-xs transition-all flex flex-col border-b last:border-b-0 border-white/20 group/cell"
                                        style={{ backgroundColor: cellColor, color: textColor }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleCellClick(staffMember, date, h);
                                        }}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                          {!isCreator ? (
                                              <div className="text-[9px] font-black uppercase opacity-80">
                                                          From: {getStaffNameById(h.user_id || h['User ID'] || h.User_ID, h.user_email || h['User Email'] || h.User_Email)}
                                              </div>
                                          ) : (
                                              <div className="text-[9px] font-black uppercase opacity-80">
                                                  My Entry
                                              </div>
                                          )}
                                          <div className="flex items-center gap-1 ml-auto">
                                              <button
                                                  className="p-1 rounded hover:bg-white/20 transition-colors opacity-0 group-hover/cell:opacity-100"
                                                  onClick={(e) => {
                                                      e.stopPropagation();
                                                      setPreviewData({ entry, handover: h, date, staffMember });
                                                      setIsPreviewOpen(true);
                                                  }}
                                                  title="Preview Handover"
                                              >
                                                  <Eye className="w-3 h-3" />
                                              </button>
                                              {isCreator && canEditRow && (
                                                <Edit2 className="w-3 h-3 opacity-50" />
                                              )}
                                          </div>
                                        </div>
                                        <p className="line-clamp-3 leading-tight font-medium">
                                                    {entry.content}
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
            {selectedCell?.handover && (() => {
                const hCreatorId = selectedCell.handover.user_id || selectedCell.handover['User ID'];
                const isMine = hCreatorId === user?.id || findStaffByAny(hCreatorId)?.id === user?.id;
                if (isMine) return null;
                return (
                    <div className="p-3 bg-purple-50 rounded-lg border border-purple-100 text-sm">
                        <span className="font-bold text-purple-700">From: </span>
                        <span className="text-slate-700">{getStaffNameById(hCreatorId, selectedCell.handover.user_email || selectedCell.handover['User Email'])}</span>
                    </div>
                );
            })()}

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
            {(!selectedCell?.handover || (() => {
                const hCreatorId = selectedCell.handover.user_id || selectedCell.handover['User ID'];
                return hCreatorId === user?.id || findStaffByAny(hCreatorId)?.id === user?.id;
            })()) && (
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
                        const teamsupColor = TEAMSUP_COLORS[emailPrefix] || '#94a3b8';
                        const isSelected = selectedSpecificStaff.includes((u.id || u.ID || "").toString());

                        return (
                          <div
                            key={u.id || u.ID}
                            className={`flex items-center space-x-2 p-2 rounded border transition-all cursor-pointer ${isSelected ? 'ring-2 ring-offset-1' : 'bg-white'}`}
                            style={{
                              borderColor: isSelected ? teamsupColor : '#e2e8f0',
                              backgroundColor: isSelected ? `${teamsupColor}15` : 'white',
                              boxShadow: isSelected ? `0 0 0 2px ${teamsupColor}33` : 'none'
                            }}
                            onClick={() => {
                              const id = (u.id || u.ID || "").toString();
                              setSelectedSpecificStaff(prev =>
                                prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
                              );
                            }}
                          >
                            <Checkbox checked={isSelected} />
                            <span className="text-xs font-bold truncate" style={{ color: teamsupColor }}>
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

            {selectedCell?.handover && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {selectedCell.handover.user_id === user?.id ? "Existing Entries" : "Handover Notes"}
                </h4>
                {selectedCell.handover.entries?.map((entry, idx) => {
                    if (entry.deleted) return null;
                    const staffEmailPrefix = getEmailUsername(selectedCell.user.email || selectedCell.user.Email).toLowerCase();
                    const staffId = (selectedCell.user.id || selectedCell.user.ID || "").toString();

                    let isRecipient = false;
                    if (entry.type === 'OFFICE') {
                      isRecipient = STAFF_GROUPS.OFFICE.members.includes(staffEmailPrefix);
                    } else if (entry.type === 'SW_OFFICE') {
                      isRecipient = STAFF_GROUPS.SW_OFFICE.members.includes(staffEmailPrefix);
                    } else if (entry.type === 'SPECIFIC') {
                      isRecipient = entry.recipients?.some(rid => {
                          const rStaff = findStaffByAny(rid);
                          return rStaff && getEmailUsername(rStaff.email || rStaff.Email).toLowerCase() === staffEmailPrefix;
                      });
                    }

                    const hCreatorId = selectedCell.handover.user_id || selectedCell.handover['User ID'];
                    const isMine = hCreatorId === user?.id || findStaffByAny(hCreatorId)?.id === user?.id;

                    // If viewing someone else's row, only show entries assigned to them
                    if (!isMine && !isRecipient) return null;

                    return (
                        <div key={entry.id || idx} className="p-3 bg-white rounded-lg border shadow-sm relative group">
                            <div className="flex items-center gap-2 mb-2">
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
                                    <span className="text-[10px] text-slate-500 italic">
                                        Assigned to {entry.recipients?.length} staff
                                    </span>
                                )}
                                {isMine && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 ml-auto text-red-500 hover:bg-red-50 transition-colors"
                                        onClick={async () => {
                                            if (!confirm("Are you sure you want to delete this entry?")) return;
                                            const updatedEntries = selectedCell.handover.entries.map(e => {
                                                if ((e.id || e.ID) === (entry.id || entry.ID)) {
                                                    return {
                                                        ...e,
                                                        deleted: true,
                                                        deleted_date: new Date().toISOString(),
                                                        deleted_by: user?.primaryEmailAddress?.emailAddress || "unknown_user"
                                                    };
                                                }
                                                return e;
                                            });

                                            try {
                                                const combinedContent = `---JSON_ENTRIES:${JSON.stringify(updatedEntries)}---`;

                                                await supabase
                                                    .from('staff_handover')
                                                    .update({ "Content": combinedContent })
                                                    .eq('"ID"', selectedCell.handover.id || selectedCell.handover.ID);

                                                await fetchHandovers();
                                                // Refresh local state if possible
                                                setSelectedCell(prev => ({
                                                    ...prev,
                                                    handover: { ...prev.handover, entries: updatedEntries, content: combinedContent }
                                                }));
                                            } catch (err) {
                                                console.error("Delete failed", err);
                                                alert("Delete failed: " + err.message);
                                            }
                                        }}
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </Button>
                                )}
                            </div>
                            <p className="text-sm text-slate-700 whitespace-pre-wrap">{entry.content}</p>
                        </div>
                    );
                })}
              </div>
            )}

            {selectedCell && isAfter(startOfDay(selectedCell.date), startOfDay(new Date())) && (!selectedCell.handover || (() => {
                const hCreatorId = selectedCell.handover.user_id || selectedCell.handover['User ID'];
                return hCreatorId === user?.id || findStaffByAny(hCreatorId)?.id === user?.id;
            })()) && (
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
                                        {(() => {
                                          const d = new Date(comment.created_at || comment['Created At']);
                                          return isNaN(d.getTime()) ? 'Recently' : format(d, 'MMM d, HH:mm');
                                        })()}
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
            {(!selectedCell?.handover || (() => {
                const hCreatorId = selectedCell.handover.user_id || selectedCell.handover['User ID'];
                return hCreatorId === user?.id || findStaffByAny(hCreatorId)?.id === user?.id;
            })()) && (
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

      {/* Full Screen Read-Only Preview Modal */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-hidden flex flex-col p-0 border-none shadow-2xl">
          {previewData && (
              <>
                  <div
                      className="p-6 text-white"
                      style={{
                          backgroundColor: previewData.entry.type === 'OFFICE' ? STAFF_GROUPS.OFFICE.color :
                                         previewData.entry.type === 'SW_OFFICE' ? STAFF_GROUPS.SW_OFFICE.color :
                                         STAFF_COLORS[getEmailUsername(previewData.staffMember.email || previewData.staffMember.Email).toLowerCase()] || '#94a3b8'
                      }}
                  >
                      <div className="flex justify-between items-start mb-4">
                          <div>
                              <Badge className="bg-white/20 hover:bg-white/30 text-white border-none mb-2 px-3 py-1">
                                  {previewData.entry.type === 'OFFICE' ? 'Office Only' :
                                   previewData.entry.type === 'SW_OFFICE' ? 'SW + Office' : 'Specific Staff'}
                              </Badge>
                              <h2 className="text-3xl font-bold tracking-tight">Handover Preview</h2>
                              <p className="opacity-90 font-medium">
                                  {format(previewData.date, 'EEEE, MMMM do, yyyy')}
                              </p>
                          </div>
                          <Eye className="w-12 h-12 opacity-20" />
                      </div>

                      <div className="grid grid-cols-2 gap-6 py-4 border-t border-white/20 mt-4">
                          <div className="space-y-1">
                              <p className="text-[10px] font-black uppercase tracking-widest opacity-70">From (Sender)</p>
                              <p className="font-bold text-lg">
                                  {getStaffNameById(previewData.handover.user_id, previewData.handover.user_email || previewData.handover['User Email'])}
                              </p>
                          </div>
                          <div className="space-y-1">
                              <p className="text-[10px] font-black uppercase tracking-widest opacity-70">To (Recipient Row)</p>
                              <p className="font-bold text-lg">
                                  {previewData.staffMember.full_name || getStaffNameById(previewData.staffMember.id, previewData.staffMember.email)}
                              </p>
                          </div>
                      </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
                      <div className="max-w-2xl mx-auto space-y-6">
                          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                              <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-6">Handover Content</p>
                              <div className="text-xl text-slate-800 leading-relaxed whitespace-pre-wrap font-medium">
                                  {previewData.entry.content}
                              </div>
                          </div>

                          {previewData.entry.type === 'SPECIFIC' && previewData.entry.recipients?.length > 0 && (
                              <div className="space-y-3">
                                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Assigned Recipients</p>
                                  <div className="flex flex-wrap gap-2">
                                      {previewData.entry.recipients.map(rid => (
                                          <Badge key={rid} variant="outline" className="bg-white py-1.5 px-3 text-slate-600 font-bold border-slate-200">
                                              {getStaffNameById(rid)}
                                          </Badge>
                                      ))}
                                  </div>
                              </div>
                          )}
                      </div>
                  </div>

                  <div className="p-4 bg-white border-t flex justify-end gap-3">
                      <Button
                          variant="ghost"
                          onClick={() => setIsPreviewOpen(false)}
                          className="font-bold text-slate-500"
                      >
                          Close Preview
                      </Button>
                      <Button
                          className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-8"
                          onClick={() => setIsPreviewOpen(false)}
                      >
                          Done Reading
                      </Button>
                  </div>
              </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
