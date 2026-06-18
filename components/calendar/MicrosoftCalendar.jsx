"use client";

import React, { useState, useEffect } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  parseISO,
  startOfDay,
  endOfDay
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  MoreVertical,
  X,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";

const VIEWS = {
  MONTH: "month",
  WEEK: "week",
  DAY: "day"
};

export default function MicrosoftCalendar() {
  const { user } = useUser();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState(VIEWS.MONTH);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    subject: "",
    start: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    end: format(addHours(new Date(), 1), "yyyy-MM-dd'T'HH:mm"),
    location: "",
    content: ""
  });

  function addHours(date, hours) {
    const result = new Date(date);
    result.setHours(result.getHours() + hours);
    return result;
  }

  useEffect(() => {
    fetchEvents();
  }, [currentDate, view]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      let start, end;
      if (view === VIEWS.MONTH) {
        start = startOfWeek(startOfMonth(currentDate));
        end = endOfWeek(endOfMonth(currentDate));
      } else if (view === VIEWS.WEEK) {
        start = startOfWeek(currentDate);
        end = endOfWeek(currentDate);
      } else {
        start = startOfDay(currentDate);
        end = endOfDay(currentDate);
      }

      const res = await fetch(`/api/microsoft-calendar/events?start=${start.toISOString()}&end=${end.toISOString()}`);
      const data = await res.json();

      if (res.ok && Array.isArray(data)) {
        setEvents(data);
      } else {
          const errorMsg = data.message || data.error || "Failed to load events";
          console.error("Error fetching events:", data);
          toast.error(errorMsg, {
            description: "Please check your Microsoft 365 integration settings.",
            duration: 5000
          });
          setEvents([]);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
      toast.error("Network error: Could not reach the calendar service.");
    } finally {
      setLoading(false);
    }
  };

  const handlePrev = () => {
    if (view === VIEWS.MONTH) setCurrentDate(subMonths(currentDate, 1));
    else if (view === VIEWS.WEEK) setCurrentDate(subWeeks(currentDate, 1));
    else setCurrentDate(subDays(currentDate, 1));
  };

  const handleNext = () => {
    if (view === VIEWS.MONTH) setCurrentDate(addMonths(currentDate, 1));
    else if (view === VIEWS.WEEK) setCurrentDate(addWeeks(currentDate, 1));
    else setCurrentDate(addDays(currentDate, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const openAddModal = (date = new Date()) => {
    setSelectedEvent(null);
    const start = new Date(date);
    start.setHours(new Date().getHours() + 1, 0, 0, 0);
    const end = new Date(start);
    end.setHours(start.getHours() + 1);

    setFormData({
      subject: "",
      start: format(start, "yyyy-MM-dd'T'HH:mm"),
      end: format(end, "yyyy-MM-dd'T'HH:mm"),
      location: "",
      content: ""
    });
    setIsEventModalOpen(true);
  };

  const openEditModal = (event) => {
    setSelectedEvent(event);
    setFormData({
      subject: event.subject,
      start: format(parseISO(event.start.dateTime), "yyyy-MM-dd'T'HH:mm"),
      end: format(parseISO(event.end.dateTime), "yyyy-MM-dd'T'HH:mm"),
      location: event.location?.displayName || "",
      content: event.bodyPreview || ""
    });
    setIsEventModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const eventPayload = {
      subject: formData.subject,
      start: {
        dateTime: formData.start,
        timeZone: "UTC"
      },
      end: {
        dateTime: formData.end,
        timeZone: "UTC"
      },
      location: {
        displayName: formData.location
      },
      body: {
        contentType: "HTML",
        content: formData.content
      }
    };

    try {
      let res;
      if (selectedEvent) {
        res = await fetch("/api/microsoft-calendar/events", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: selectedEvent.id, ...eventPayload })
        });
      } else {
        res = await fetch("/api/microsoft-calendar/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(eventPayload)
        });
      }

      if (res.ok) {
        toast.success(selectedEvent ? "Event updated" : "Event created");
        setIsEventModalOpen(false);
        fetchEvents();
      } else {
        const errorData = await res.json();
        toast.error(errorData.message || "Failed to save event", {
            description: errorData.error || "Please check your connection and try again."
        });
      }
    } catch (error) {
      console.error("Error saving event:", error);
      toast.error("Error saving event");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedEvent) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/microsoft-calendar/events?id=${selectedEvent.id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        toast.success("Event deleted");
        setIsEventModalOpen(false);
        fetchEvents();
      } else {
        toast.error("Failed to delete event");
      }
    } catch (error) {
      console.error("Error deleting event:", error);
      toast.error("Error deleting event");
    } finally {
      setIsDeleting(false);
    }
  };

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const days = eachDayOfInterval({ start: startDate, end: endDate });

    return (
      <div className="grid grid-cols-7 gap-px bg-slate-200 border-slate-200 border rounded-lg overflow-hidden flex-1 min-h-0">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
          <div key={day} className="bg-slate-50 py-2 text-center text-xs font-semibold text-slate-500 uppercase">
            {day}
          </div>
        ))}
        {days.map((day, idx) => {
          const dayEvents = events.filter(event => isSameDay(parseISO(event.start.dateTime), day));
          return (
            <div
              key={idx}
              className={`bg-white min-h-[100px] p-1 flex flex-col group hover:bg-slate-50 transition-colors ${!isSameMonth(day, monthStart) ? "text-slate-400 bg-slate-50/50" : ""}`}
              onClick={() => openAddModal(day)}
            >
              <div className="flex justify-between items-start mb-1">
                <span className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full ${isSameDay(day, new Date()) ? "bg-blue-600 text-white" : ""}`}>
                  {format(day, "d")}
                </span>
                <button className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-slate-200 rounded transition-all">
                  <Plus className="w-3 h-3 text-slate-500" />
                </button>
              </div>
              <div className="flex-1 space-y-1 overflow-y-auto scrollbar-hide">
                {dayEvents.map(event => (
                  <div
                    key={event.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditModal(event);
                    }}
                    className="text-[10px] p-1 bg-blue-100 text-blue-800 rounded truncate cursor-pointer hover:bg-blue-200 border border-blue-200"
                  >
                    {format(parseISO(event.start.dateTime), "HH:mm")} {event.subject}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderWeekView = () => {
    const startDate = startOfWeek(currentDate);
    const days = Array.from({ length: 7 }).map((_, i) => addDays(startDate, i));
    const hours = Array.from({ length: 24 }).map((_, i) => i);

    return (
      <div className="flex flex-col flex-1 bg-white border border-slate-200 rounded-lg overflow-hidden min-h-0">
        <div className="grid grid-cols-8 gap-px bg-slate-50 border-b border-slate-200">
          <div className="p-2 border-r border-slate-200"></div>
          {days.map((day, idx) => (
            <div key={idx} className="p-2 text-center border-r border-slate-200 last:border-r-0">
              <div className="text-xs font-semibold text-slate-500 uppercase">{format(day, "EEE")}</div>
              <div className={`text-lg font-bold mx-auto w-8 h-8 flex items-center justify-center rounded-full ${isSameDay(day, new Date()) ? "bg-blue-600 text-white" : ""}`}>
                {format(day, "d")}
              </div>
            </div>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-8 gap-px bg-slate-200">
            <div className="bg-white">
                {hours.map(hour => (
                    <div key={hour} className="h-20 border-b border-slate-100 text-[10px] text-slate-400 p-1 text-right">
                        {format(new Date().setHours(hour), "HH:00")}
                    </div>
                ))}
            </div>
            {days.map((day, dayIdx) => (
                <div key={dayIdx} className="bg-white relative">
                    {hours.map(hour => (
                        <div
                          key={hour}
                          className="h-20 border-b border-slate-100 hover:bg-slate-50 transition-colors"
                          onClick={() => {
                              const d = new Date(day);
                              d.setHours(hour);
                              openAddModal(d);
                          }}
                        ></div>
                    ))}
                    {events
                        .filter(event => isSameDay(parseISO(event.start.dateTime), day))
                        .map(event => {
                            const start = parseISO(event.start.dateTime);
                            const end = parseISO(event.end.dateTime);
                            const top = (start.getHours() * 60 + start.getMinutes()) / (24 * 60) * 100;
                            const height = (Math.max(30, (end - start) / (1000 * 60))) / (24 * 60) * 100;

                            return (
                                <div
                                    key={event.id}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        openEditModal(event);
                                    }}
                                    className="absolute left-0.5 right-0.5 bg-blue-100 border border-blue-300 rounded p-1 overflow-hidden cursor-pointer hover:bg-blue-200 z-10"
                                    style={{ top: `${top}%`, height: `${height}%`, minHeight: '20px' }}
                                >
                                    <div className="text-[10px] font-bold text-blue-900 truncate">{event.subject}</div>
                                    <div className="text-[8px] text-blue-700">{format(start, "HH:mm")} - {format(end, "HH:mm")}</div>
                                </div>
                            );
                        })
                    }
                </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const hours = Array.from({ length: 24 }).map((_, i) => i);
    const day = currentDate;

    return (
      <div className="flex flex-col flex-1 bg-white border border-slate-200 rounded-lg overflow-hidden min-h-0">
        <div className="p-4 bg-slate-50 border-b border-slate-200 text-center">
            <div className="text-sm font-semibold text-slate-500 uppercase">{format(day, "EEEE")}</div>
            <div className={`text-2xl font-bold mx-auto w-12 h-12 flex items-center justify-center rounded-full ${isSameDay(day, new Date()) ? "bg-blue-600 text-white" : ""}`}>
                {format(day, "d")}
            </div>
            <div className="text-slate-600 mt-1">{format(day, "MMMM yyyy")}</div>
        </div>
        <div className="flex-1 overflow-y-auto">
            <div className="flex bg-slate-200">
                <div className="w-20 bg-white shrink-0">
                    {hours.map(hour => (
                        <div key={hour} className="h-24 border-b border-slate-100 text-xs text-slate-400 p-2 text-right">
                            {format(new Date().setHours(hour), "HH:00")}
                        </div>
                    ))}
                </div>
                <div className="flex-1 bg-white relative">
                    {hours.map(hour => (
                        <div
                          key={hour}
                          className="h-24 border-b border-slate-100 hover:bg-slate-50 transition-colors"
                          onClick={() => {
                              const d = new Date(day);
                              d.setHours(hour);
                              openAddModal(d);
                          }}
                        ></div>
                    ))}
                    {events
                        .filter(event => isSameDay(parseISO(event.start.dateTime), day))
                        .map(event => {
                            const start = parseISO(event.start.dateTime);
                            const end = parseISO(event.end.dateTime);
                            const top = (start.getHours() * 60 + start.getMinutes()) / (24 * 60) * 100;
                            const height = (Math.max(30, (end - start) / (1000 * 60))) / (24 * 60) * 100;

                            return (
                                <div
                                    key={event.id}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        openEditModal(event);
                                    }}
                                    className="absolute left-2 right-2 bg-blue-100 border border-blue-300 rounded p-2 overflow-hidden cursor-pointer hover:bg-blue-200 z-10 shadow-sm"
                                    style={{ top: `${top}%`, height: `${height}%`, minHeight: '40px' }}
                                >
                                    <div className="text-sm font-bold text-blue-900">{event.subject}</div>
                                    <div className="text-xs text-blue-700 flex items-center gap-1 mt-1">
                                        <Clock className="w-3 h-3" />
                                        {format(start, "HH:mm")} - {format(end, "HH:mm")}
                                    </div>
                                    {event.location?.displayName && (
                                        <div className="text-xs text-blue-700 flex items-center gap-1 mt-1">
                                            <MapPin className="w-3 h-3" />
                                            {event.location.displayName}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    }
                </div>
            </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">M365 Shared Calendar</h1>
            <p className="text-sm text-slate-500">{format(currentDate, "MMMM yyyy")}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="flex items-center bg-white border border-slate-200 rounded-md p-1">
            <Button variant="ghost" size="sm" onClick={handlePrev} className="h-8 w-8 p-0">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleToday} className="h-8 px-3 text-xs font-medium">
              Today
            </Button>
            <Button variant="ghost" size="sm" onClick={handleNext} className="h-8 w-8 p-0">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <Select value={view} onValueChange={setView}>
            <SelectTrigger className="w-[110px] h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={VIEWS.MONTH}>Month</SelectItem>
              <SelectItem value={VIEWS.WEEK}>Week</SelectItem>
              <SelectItem value={VIEWS.DAY}>Day</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={() => openAddModal()} className="h-9 gap-1.5 bg-blue-600 hover:bg-blue-700 text-white shadow-sm ml-auto md:ml-0">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Event</span>
          </Button>
        </div>
      </div>

      <div className="flex-1 relative min-h-0">
        {loading && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-50 flex items-center justify-center rounded-lg">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <p className="text-sm font-medium text-slate-600">Syncing with Microsoft 365...</p>
            </div>
          </div>
        )}

        {view === VIEWS.MONTH && renderMonthView()}
        {view === VIEWS.WEEK && renderWeekView()}
        {view === VIEWS.DAY && renderDayView()}
      </div>

      <Dialog open={isEventModalOpen} onOpenChange={setIsEventModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{selectedEvent ? "Edit Event" : "Create New Event"}</DialogTitle>
            <DialogDescription>
                {selectedEvent ? "Update details for this shared calendar event." : "Add a new event to the shared Microsoft 365 calendar."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                required
                value={formData.subject}
                onChange={e => setFormData({...formData, subject: e.target.value})}
                placeholder="Meeting, Maintenance, Visit..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start">Start Time</Label>
                <Input
                  id="start"
                  type="datetime-local"
                  required
                  value={formData.start}
                  onChange={e => setFormData({...formData, start: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end">End Time</Label>
                <Input
                  id="end"
                  type="datetime-local"
                  required
                  value={formData.end}
                  onChange={e => setFormData({...formData, end: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <Input
                  id="location"
                  className="pl-9"
                  value={formData.location}
                  onChange={e => setFormData({...formData, location: e.target.value})}
                  placeholder="Office, Property Address, Teams..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Description / Notes</Label>
              <Textarea
                id="content"
                rows={3}
                value={formData.content}
                onChange={e => setFormData({...formData, content: e.target.value})}
                placeholder="Additional details..."
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              {selectedEvent && (
                <Button
                    type="button"
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={isDeleting || loading}
                    className="mr-auto"
                >
                    {isDeleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Delete
                </Button>
              )}
              <Button type="button" variant="outline" onClick={() => setIsEventModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                {selectedEvent ? "Update Event" : "Create Event"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
