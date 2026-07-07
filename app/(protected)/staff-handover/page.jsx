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
  FileText
} from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { logActivity, ACTIONS, ENTITIES } from "@/lib/activityUtils";

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

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

const normalizeHandover = (handover) => {
  if (!handover) return handover;
  const normalized = { ...handover };
  Object.keys(handover).forEach(key => {
    const normalizedKey = key.trim().toLowerCase().replace(/ /g, '_');
    if (!normalized[normalizedKey]) {
      normalized[normalizedKey] = handover[key];
    }
  });
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
  const [selectedCell, setSelectedCell] = useState(null); // { user, date }
  const [handoverContent, setHandoverContent] = useState("");
  const [lateReason, setLateReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsers = useCallback(async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*');

      if (error) throw error;

      const normalizedUsers = (data || [])
        .map(normalizeUser)
        .filter(u => {
          // Normalize active status - default to true if null/undefined
          const isActive = u.is_active !== false && u.is_active !== 'FALSE' && u['Is Active'] !== false;
          const name = (u.full_name || u['Full Name'] || u.email || u.Email || "").toLowerCase();
          const isTest = name.includes('test') || name.includes('demo');
          return isActive && !isTest && name.trim() !== "";
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
        .gte('Handover Date', format(currentWeekStart, 'yyyy-MM-dd'))
        .lte('Handover Date', format(weekEnd, 'yyyy-MM-dd'));

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

  const getHandover = useCallback((staffMember, date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const staffEmail = (staffMember.email || staffMember.Email || staffMember.user_email || "").toLowerCase();
    const staffId = (staffMember.id || staffMember.ID || "").toString();

    return handovers.find(h => {
      if (h.handover_date !== dateStr) return false;

      const hEmail = (h.user_email || "").toLowerCase();
      const hUserId = (h.user_id || "").toString();

      // Match by email
      if (hEmail && staffEmail && hEmail === staffEmail) return true;

      // Match by staff record ID
      if (hUserId && staffId && hUserId === staffId) return true;

      // Match by current logged in user ID if this is the current user's row
      if (isCurrentUser(staffMember) && hUserId === user?.id) return true;

      return false;
    });
  }, [handovers, user, isCurrentUser]);

  const navigateWeek = (direction) => {
    setCurrentWeekStart(prev => addDays(prev, direction * 7));
  };

  const resetToCurrentWeek = () => {
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
  };

  const handleCellClick = (staffMember, date) => {
    if (!isCurrentUser(staffMember)) return;

    const existing = getHandover(staffMember, date);

    // Restriction: Only allow editing for "Today" OR future dates if reason is "Annual Leave"
    const today = startOfDay(new Date());
    const cellDate = startOfDay(date);

    if (isBefore(cellDate, today)) {
        // Cannot edit past days as per requirements: "there shouldnt be the case for filling for a different day other than the current"
        return;
    }

    setSelectedCell({ user: staffMember, date });
    setHandoverContent(existing?.content || "");
    setLateReason(existing?.late_reason || "");
    setIsDialogOpen(true);
  };

  const handleSaveHandover = async () => {
    if (!selectedCell || !supabase || !user) return;

    setIsSubmitting(true);
    try {
      const dateStr = format(selectedCell.date, 'yyyy-MM-dd');
      const existing = getHandover(selectedCell.user, selectedCell.date);

      const payload = {
        "User ID": user.id, // Use Clerk ID for RLS and uniqueness
        "User Email": user.primaryEmailAddress?.emailAddress || (selectedCell.user.email || selectedCell.user.Email),
        "Handover Date": dateStr,
        "Content": handoverContent,
        "Late Reason": lateReason || null,
        "Updated At": new Date().toISOString()
      };

      let error;
      if (existing) {
        const { error: updateError } = await supabase
          .from('staff_handover')
          .update(payload)
          .eq('ID', existing.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('staff_handover')
          .insert([payload]);
        error = insertError;
      }

      if (error) throw error;

      await logActivity(supabase, {
        userName: user?.fullName || "Unknown",
        userEmail: user?.primaryEmailAddress?.emailAddress,
        actionType: existing ? ACTIONS.UPDATE : ACTIONS.CREATE,
        entityType: 'STAFF_HANDOVER',
        description: `${existing ? 'Updated' : 'Created'} handover for ${dateStr}`
      });

      await fetchHandovers();
      setIsDialogOpen(false);
    } catch (err) {
      console.error("Error saving handover:", err);
      alert("Failed to save handover: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLate = (date) => {
    const now = new Date();
    if (!isSameDay(now, date)) return false;

    const deadline = setMinutes(setHours(startOfDay(date), 16), 0);
    return isAfter(now, deadline);
  };

  const getEmailUsername = (email) => {
    if (!email) return "Unknown";
    return email.split('@')[0];
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
                handleCellClick(me, new Date());
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
                <TableHead className="w-[200px] font-bold text-slate-700">Staff Member</TableHead>
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
                  <TableCell className={`font-semibold text-slate-900 sticky left-0 z-10 border-r ${
                    isMe ? 'bg-purple-50 ring-1 ring-inset ring-purple-200' : 'bg-white'
                  }`}>
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
                  </TableCell>
                  {weekDates.map((date, i) => {
                    const handover = getHandover(staffMember, date);
                    const canEdit = isMe && (isSameDay(new Date(), date) || isAfter(startOfDay(date), startOfDay(new Date())));

                    const isPast = isBefore(startOfDay(date), startOfDay(new Date()));
                    const isToday = isSameDay(new Date(), date);

                    return (
                      <TableCell
                        key={i}
                        className={`p-0 h-32 align-top border-r last:border-r-0 ${canEdit ? 'cursor-pointer hover:bg-slate-50 transition-colors group' : ''} ${isMe ? 'bg-purple-50/30' : ''}`}
                        onClick={() => handleCellClick(staffMember, date)}
                      >
                        <div className="p-3 h-full flex flex-col">
                          {handover ? (
                            <div className="flex-1 space-y-2">
                              <p className="text-sm text-slate-600 line-clamp-4 leading-relaxed">
                                {handover.content}
                              </p>
                              {handover.late_reason && (
                                <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200 gap-1">
                                  <AlertCircle className="w-3 h-3" />
                                  {handover.late_reason}
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-300">
                                {isPast ? (
                                    <span className="text-xs italic">No entry</span>
                                ) : canEdit ? (
                                    <div className={`${isToday ? 'opacity-100 text-purple-400' : 'opacity-0'} group-hover:opacity-100 transition-opacity flex flex-col items-center gap-1`}>
                                        <Plus className={`w-5 h-5 ${isToday ? 'animate-pulse' : ''}`} />
                                        <span className="text-[10px] font-medium uppercase tracking-wider">Add Entry</span>
                                    </div>
                                ) : null}
                            </div>
                          )}
                          {canEdit && handover && (
                            <div className="mt-auto flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                <Edit2 className="w-3 h-3 text-slate-400" />
                            </div>
                          )}
                        </div>
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
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
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Daily Summary</label>
              <Textarea
                placeholder="Write your handover notes for today..."
                className="min-h-[200px] resize-none"
                value={handoverContent}
                onChange={(e) => setHandoverContent(e.target.value)}
              />
            </div>

            {selectedCell && isLate(selectedCell.date) && (
              <div className="space-y-2 p-3 bg-amber-50 rounded-lg border border-amber-100">
                <div className="flex items-center gap-2 text-amber-800 text-sm font-semibold mb-1">
                  <Clock className="w-4 h-4" />
                  Late Submission (After 4 PM)
                </div>
                <label className="text-xs text-amber-700">Please provide a reason for the late entry:</label>
                <Select value={lateReason} onValueChange={setLateReason}>
                  <SelectTrigger className="bg-white border-amber-200">
                    <SelectValue placeholder="Select a reason..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Illness">Illness</SelectItem>
                    <SelectItem value="Annual Leave">Annual Leave</SelectItem>
                    <SelectItem value="Heavy Workload">Heavy Workload</SelectItem>
                    <SelectItem value="Emergency">Emergency</SelectItem>
                    <SelectItem value="Meeting">Meeting</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedCell && isAfter(startOfDay(selectedCell.date), startOfDay(new Date())) && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 text-xs text-blue-700 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>You are logging an entry for a future date. This is typically used for planned Annual Leave.</span>
                </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
                onClick={handleSaveHandover}
                disabled={isSubmitting || !handoverContent.trim() || (selectedCell && isLate(selectedCell.date) && !lateReason)}
                className="bg-purple-600 hover:bg-purple-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Handover'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
