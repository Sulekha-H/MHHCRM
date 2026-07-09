"use client";

import { useUser } from "@clerk/nextjs";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useClerkSupabaseClient } from "@/lib/supabaseClient";
import { logActivity, ACTIONS } from "@/lib/activityUtils";
import { isServiceChargeStaff } from "@/lib/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users, AlertTriangle, FileText, Plus, ArrowRight,
  CheckSquare, Wrench, DoorOpen, ShieldCheck, Heart,
  Bell, Clock, Calendar, Upload, FileUp, UserCheck, PoundSterling, HandCoins, ArrowRightLeft
} from "lucide-react";
import { createPageUrl } from "@/lib/utils";
import { format, addDays } from "date-fns";

const calculateTimeLeft = (deadline) => {
  const now = new Date();
  const target = new Date(deadline);
  // Set target to end of the day (23:59:59) for deadline dates
  target.setHours(23, 59, 59, 999);

  const diff = target - now;

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, isOverdue: true, totalMinutesOverdue: Math.floor(Math.abs(diff) / (1000 * 60)) };
  }

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / 1000 / 60) % 60),
    isOverdue: false
  };
};

const CountdownDisplay = ({ deadline }) => {
  const [timeLeft, setTimeLeft] = useState(() => calculateTimeLeft(deadline));

  useEffect(() => {
    setTimeLeft(calculateTimeLeft(deadline));
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(deadline));
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, [deadline]);

  if (timeLeft.isOverdue) {
    const days = Math.floor(timeLeft.totalMinutesOverdue / (60 * 24));
    const hours = Math.floor((timeLeft.totalMinutesOverdue / 60) % 24);
    const minutes = Math.floor(timeLeft.totalMinutesOverdue % 60);

    if (days > 0) return <span>{days}d {hours}h {minutes}m overdue</span>;
    if (hours > 0) return <span>{hours}h {minutes}m overdue</span>;
    return <span>{minutes}m overdue</span>;
  }

  const parts = [];
  if (timeLeft.days > 0) parts.push(`${timeLeft.days}d`);
  if (timeLeft.hours > 0 || timeLeft.days > 0) parts.push(`${timeLeft.hours}h`);
  parts.push(`${timeLeft.minutes}m`);

  return <span>{parts.join(" ")} remaining</span>;
};

const DeadlineGroup = ({ title, deadlines, colorClass, icon: Icon }) => {
  if (deadlines.length === 0) return null;
  return (
    <div className="space-y-3">
      <h3 className={`text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${colorClass}`}>
        <Icon className="w-4 h-4" />
        {title} ({deadlines.length})
      </h3>
      <div className="flex overflow-x-auto gap-4 pb-4">
        {deadlines.map((d) => (
          <Card key={d.id} className="min-w-[250px] max-w-[250px] flex-shrink-0 border-l-4 border-l-current shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <Badge variant="outline" className="text-[10px] uppercase font-bold">
                  {d.source}
                </Badge>
                <span className={`text-[10px] font-bold ${d.date < new Date() ? 'text-red-500' : 'text-slate-500'}`}>
                  {format(d.date, 'MMM d')}
                </span>
              </div>
              <h4 className="text-sm font-semibold text-slate-800 line-clamp-2 min-h-[40px]">
                {d.title}
              </h4>
              {d.assignedTo && (
                <div className="mt-1 text-[10px] text-slate-600 font-medium truncate">
                  For: {d.assignedTo}
                </div>
              )}
              <div className="mt-3 flex items-center justify-between">
                <div className="text-[10px] text-slate-500 italic">
                  <CountdownDisplay deadline={d.date} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default function Dashboard() {
  const { user, isLoaded, isSignedIn } = useUser();
  const isSCStaff = isServiceChargeStaff(user);
  const supabase = useClerkSupabaseClient();
  const loginLogged = useRef(false);
  console.log(`[Dashboard] User Status - Loaded: ${isLoaded}, SignedIn: ${isSignedIn}, UserID: ${user?.id}`);

  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    residents: 0,
    activeIncidents: 0,
    todayLogs: 0
  });
  const [taskSummary, setTaskSummary] = useState({
    overdueTasks: 0,
    myTasks: 0,
    dueSoon: 0,
    recentTasks: [],
    myRecentTasks: [],
    myOverdue: 0,
    myDueSoon: 0
  });
  const [complianceSummary, setComplianceSummary] = useState({
    overdue: 0,
    expiringSoon: 0,
    recentItems: []
  });
  const [voidsSummary, setVoidsSummary] = useState({
    count: 0,
    recentVoids: []
  });
  const [serviceChargeSummary, setServiceChargeSummary] = useState({
    overdue: 0,
    overdueItems: []
  });
  const [repairsSummary, setRepairsSummary] = useState({
    reported: 0,
    scheduled: 0,
    recentRepairs: []
  });
  const [housingBenefitSummary, setHousingBenefitSummary] = useState({
    requestedSupportNotes: 0,
    requestedDocuments: 0,
    suspendedClaims: 0,
    changeOfAddresses: 0,
    roomTransfers: 0,
    hbCalls: 0,
    hbLeavers: 0,
    total: 0,
    pendingSupportNoteRequests: []
  });
  const [quarterlyReviewSummary, setQuarterlyReviewSummary] = useState({
    overdue: [],
    dueSoon: []
  });
  const [referralsSummary, setReferralsSummary] = useState({
    underAssessment: 0,
    recentReferrals: []
  });
  const [recentActivity, setRecentActivity] = useState({
    incidents: [],
    logs: []
  });
  const [loading, setLoading] = useState(true);
  const [loadingReminders, setLoadingReminders] = useState(true);
  const [properties, setProperties] = useState([]);
  const [residents, setResidents] = useState([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState({
    next7Days: [],
    next14Days: []
  });

  const delay = useCallback((ms) => new Promise(resolve => setTimeout(resolve, ms)), []);

  const retryApiCall = useCallback(async (apiCall, maxRetries = 3, baseDelay = 1000) => {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await apiCall();
      } catch (error) {
        if (attempt < maxRetries - 1) {
          const delayMs = baseDelay * Math.pow(2, attempt);
          console.warn(`API call failed, retrying in ${delayMs}ms...`);
          await delay(delayMs);
          continue;
        }
        console.error("API call failed after retries:", error);
        return { data: [], error };
      }
    }
  }, [delay]);

  useEffect(() => {
    const loadDashboardData = async () => {
      setError(null);
      try {
        console.log(`[Dashboard] Starting data fetch for user: ${user?.id}...`);
        
        // Load all data in parallel
        console.log("[Dashboard] Calling Promise.all for all Supabase queries...");
        if (!supabase) {
          const msg = "Supabase client is not initialized. Please check your environment variables.";
          console.error(`[Dashboard] ${msg}`);
          setError(msg);
          setLoading(false);
          return;
        }

        const [
          residentsResult,
          incidentsResult,
          officeLogsResult,
          tasksResult,
          complianceLogsResult,
          accommodationsResult,
          quarterlyReviewsResult,
          serviceChargesResult,
          repairsResult,
          benefitLogsResult,
          ucLogsResult,
          pipLogsResult,
          wcaLogsResult,
          allocatedHbLogsResult,
          allocatedUcLogsResult,
          allocatedPipLogsResult,
          allocatedWcaLogsResult,
          orgReferralsResult,
          selfReferralsResult,
          propertiesResult,
          landlordEnquiriesResult,
          workBookingsResult,
          propertyOnboardingResult,
          propertyPurchasesResult,
          utilitiesResult,
          allocatedSupportNotesResult,
          supportNotesResult,
          weeklySWDocLogsResult,
          landlordPortalResult,
          customSectionDataResult,
          allocatedQuarterlyReviewsResult
        ] = await Promise.all([
          retryApiCall(() => supabase.from('residents').select('*').or('Deleted.is.null,Deleted.eq.false').order('Created Date', { ascending: false })),
          retryApiCall(() => supabase.from('incidents').select('*').or('Deleted.is.null,Deleted.eq.false').order('Incident Date', { ascending: false })),
          retryApiCall(() => supabase.from('office_logs').select('*').order('Date Time', { ascending: false })),
          retryApiCall(() => supabase.from('tasks').select('*').or('Deleted.is.null,Deleted.eq.false').order('Due Date', { ascending: false })),
          retryApiCall(() => supabase.from('compliance_logs').select('*').or('Deleted.is.null,Deleted.eq.false')),
          retryApiCall(() => supabase.from('accommodations').select('*').or('Deleted.is.null,Deleted.eq.false')),
          retryApiCall(() => supabase.from('quarterly_reviews').select('*').or('Deleted.is.null,Deleted.eq.false')),
          retryApiCall(() => supabase.from('service_charges').select('*').or('Deleted.is.null,Deleted.eq.false')),
          retryApiCall(() => supabase.from('repairs').select('*').order('Reported Date', { ascending: false })),
          retryApiCall(() => supabase.from('housing_benefit_logs').select('*').or('Deleted.is.null,Deleted.eq.false').order('Log Date', { ascending: false })),
          retryApiCall(() => supabase.from('universal_credit_logs').select('*').or('Deleted.is.null,Deleted.eq.false')),
          retryApiCall(() => supabase.from('pip_logs').select('*').or('Deleted.is.null,Deleted.eq.false')),
          retryApiCall(() => supabase.from('wca_logs').select('*').or('Deleted.is.null,Deleted.eq.false')),
          retryApiCall(() => supabase.from('allocated_housing_benefit_logs').select('*').or('Deleted.is.null,Deleted.eq.false')),
          retryApiCall(() => supabase.from('allocated_universal_credit_logs').select('*').or('Deleted.is.null,Deleted.eq.false')),
          retryApiCall(() => supabase.from('allocated_pip_logs').select('*').or('Deleted.is.null,Deleted.eq.false')),
          retryApiCall(() => supabase.from('allocated_wca_logs').select('*').or('Deleted.is.null,Deleted.eq.false')),
          retryApiCall(() => supabase.from('organisation_referrals').select('*').or('Deleted.is.null,Deleted.eq.false').order('Referral Date', { ascending: false })),
          retryApiCall(() => supabase.from('self_referrals').select('*').or('Deleted.is.null,Deleted.eq.false').order('Referral Date', { ascending: false })),
          retryApiCall(() => supabase.from('properties').select('*').or('Deleted.is.null,Deleted.eq.false')),
          retryApiCall(() => supabase.from('landlord_enquiries').select('*').or('Deleted.is.null,Deleted.eq.false')),
          retryApiCall(() => supabase.from('work_bookings').select('*').or('Deleted.is.null,Deleted.eq.false')),
          retryApiCall(() => supabase.from('property_onboarding').select('*').or('Deleted.is.null,Deleted.eq.false')),
          retryApiCall(() => supabase.from('property_purchases').select('*').or('Deleted.is.null,Deleted.eq.false')),
          retryApiCall(() => supabase.from('Utilities').select('*').or('Deleted.is.null,Deleted.eq.false')),
          retryApiCall(() => supabase.from('allocated_support_notes').select('*').or('Deleted.is.null,Deleted.eq.false')),
          retryApiCall(() => supabase.from('support_notes').select('*').or('Deleted.is.null,Deleted.eq.false')),
          retryApiCall(() => supabase.from('weekly_sw_doc_logs').select('*').or('Deleted.is.null,Deleted.eq.false')),
          retryApiCall(() => supabase.from('landlord_portal').select('*').or('Deleted.is.null,Deleted.eq.false')),
          retryApiCall(() => supabase.from('custom_section_data').select('*').or('Deleted.is.null,Deleted.eq.false')),
          retryApiCall(() => supabase.from('allocated_quarterly_reviews').select('*').or('Deleted.is.null,Deleted.eq.false'))
        ]);

        console.log("[Dashboard] ✅ All data loaded successfully from Supabase");

        const residentsData = residentsResult.data || [];
        const allIncidents = incidentsResult.data || [];
        const officeLogs = officeLogsResult.data || [];
        const tasks = tasksResult.data || [];
        const complianceLogs = complianceLogsResult.data || [];
        const allAccommodations = accommodationsResult.data || [];
        const quarterlyReviewsData = quarterlyReviewsResult.data || [];
        const serviceCharges = serviceChargesResult.data || [];
        const repairs = repairsResult.data || [];
        const benefitLogs = benefitLogsResult.data || [];
        const ucLogs = ucLogsResult.data || [];
        const pipLogs = pipLogsResult.data || [];
        const wcaLogs = wcaLogsResult.data || [];
        const allocatedHbLogs = allocatedHbLogsResult.data || [];
        const allocatedUcLogs = allocatedUcLogsResult.data || [];
        const allocatedPipLogs = allocatedPipLogsResult.data || [];
        const allocatedWcaLogs = allocatedWcaLogsResult.data || [];
        const allReferrals = [...(orgReferralsResult.data || []), ...(selfReferralsResult.data || [])];
        const allProperties = propertiesResult.data || [];
        const landlordEnquiries = landlordEnquiriesResult.data || [];
        const workBookings = workBookingsResult.data || [];
        const propertyOnboarding = propertyOnboardingResult.data || [];
        const propertyPurchases = propertyPurchasesResult.data || [];
        const utilities = utilitiesResult.data || [];
        const allocatedSupportNotes = allocatedSupportNotesResult.data || [];
        const supportNotes = supportNotesResult.data || [];
        const weeklySWDocLogs = weeklySWDocLogsResult.data || [];
        const landlordPortal = landlordPortalResult.data || [];
        const customSectionData = customSectionDataResult.data || [];
        const allocatedQuarterlyReviews = allocatedQuarterlyReviewsResult.data || [];

        setProperties(allProperties);
        setResidents(residentsData);

        // Calculate stats
        const activeResidents = residentsData.filter(r => {
          const status = (r.Status || '').toLowerCase();
          return status === 'active';
        });
        const openIncidents = allIncidents.filter(i => {
          const status = (i.Status || '').toLowerCase();
          return status === 'open';
        });
        
        const today = new Date();
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
        const todayLogs = officeLogs.filter(log => {
          const logDateStr = log["Date Time"] || log.date_time || log["Date/Time"];
          if (!logDateStr) return false;
          const logDate = new Date(logDateStr);
          return logDate >= todayStart && logDate < todayEnd;
        });

        // Calculate current week range
        const currentDate = new Date();
        const currentDayOfWeek = currentDate.getDay();
        const daysFromMonday = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1;
        
        const weekStart = new Date(currentDate);
        weekStart.setDate(currentDate.getDate() - daysFromMonday);
        weekStart.setHours(0, 0, 0, 0);
        
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);

        const thisWeekLogs = officeLogs.filter(log => {
          const logDateStr = log["Date Time"] || log.date_time || log["Date/Time"];
          if (!logDateStr) return false;
          const logDate = new Date(logDateStr);
          return logDate >= weekStart && logDate <= weekEnd;
        });

        // Last 4 weeks incidents
        const fourWeeksAgo = new Date(currentDate);
        fourWeeksAgo.setDate(currentDate.getDate() - 28);
        fourWeeksAgo.setHours(0, 0, 0, 0);

        const recentIncidents = allIncidents.filter(incident => {
          const incidentDateStr = incident["Incident Date"] || incident.incident_date;
          if (!incidentDateStr) return false;
          const incidentDate = new Date(incidentDateStr);
          return incidentDate >= fourWeeksAgo && incidentDate <= currentDate;
        });

        setStats({
          residents: activeResidents.length,
          activeIncidents: openIncidents.length,
          todayLogs: todayLogs.length
        });

        setRecentActivity({
          incidents: recentIncidents.slice(0, 5),
          logs: thisWeekLogs.slice(0, 5)
        });

        // Task Summary
        const now = new Date();
        const threeDaysFromNow = addDays(now, 3);
        const overdueTasks = tasks.filter(t => {
          const status = (t.Status || '').toLowerCase().replace(/ /g, '_');
          const dueDateStr = t["Due Date"] || t.due_date;
          return status !== 'completed' && dueDateStr && new Date(dueDateStr) < now;
        });
        const dueSoonTasks = tasks.filter(t => {
          const status = (t.Status || '').toLowerCase().replace(/ /g, '_');
          const dueDateStr = t["Due Date"] || t.due_date;
          const dueDate = dueDateStr ? new Date(dueDateStr) : null;
          return status !== 'completed' && dueDate && dueDate >= now && dueDate <= threeDaysFromNow;
        });

        // Find current user's details from Clerk
        const currentUserName = (user?.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.username || '').toLowerCase();
        const currentUserEmail = user?.primaryEmailAddress?.emailAddress?.toLowerCase();
        const currentUserPrefix = currentUserEmail?.split('@')[0];
        
        const isMatch = (val) => {
          if (!val) return false;
          const v = val.toLowerCase().trim();
          return v === currentUserName ||
                 v === currentUserEmail ||
                 v === currentUserPrefix ||
                 (currentUserName && (v.includes(currentUserName) || currentUserName.includes(v)));
        };

        const myOverdueTasks = overdueTasks.filter(t => {
          const assignedTo = (t["Assigned to (User ID)"] || t.assigned_to_user_id);
          return isMatch(assignedTo);
        });
        
        const myDueSoonTasks = dueSoonTasks.filter(t => {
          const assignedTo = (t["Assigned to (User ID)"] || t.assigned_to_user_id);
          return isMatch(assignedTo);
        });

        setTaskSummary({
          overdueTasks: overdueTasks.length,
          myTasks: myOverdueTasks.length + myDueSoonTasks.length,
          dueSoon: dueSoonTasks.length,
          recentTasks: [...overdueTasks, ...dueSoonTasks].slice(0, 5),
          myRecentTasks: [...myOverdueTasks, ...myDueSoonTasks].slice(0, 3),
          myOverdue: myOverdueTasks.length,
          myDueSoon: myDueSoonTasks.length
        });

        // Compliance Summary
        const thirtyDaysFromNow = addDays(now, 30);
        const overdueCompliance = complianceLogs.filter(c => {
          const expiryDateStr = c["Expiry Date"] || c.expiry_date;
          return expiryDateStr && new Date(expiryDateStr) < now && !c.Actioned;
        });
        const expiringSoonCompliance = complianceLogs.filter(c => {
          const expiryDateStr = c["Expiry Date"] || c.expiry_date;
          if (!expiryDateStr) return false;
          const expiryDate = new Date(expiryDateStr);
          return expiryDate >= now && expiryDate <= thirtyDaysFromNow && !c.Actioned;
        });

        setComplianceSummary({
          overdue: overdueCompliance.length,
          expiringSoon: expiringSoonCompliance.length,
          recentItems: [...overdueCompliance, ...expiringSoonCompliance].slice(0, 5)
        });

        // Voids Summary
        const availableVoids = allAccommodations.filter(a => {
          const availStatus = (a["Availability Status"] || '').toLowerCase();
          return availStatus === 'available';
        });
        setVoidsSummary({
          count: availableVoids.length,
          recentVoids: availableVoids.slice(0, 5)
        });

        // Service Charge Summary
        const getFinancialYearMonths = () => {
          const months = [];
          const currentDate = new Date();
          const currentYear = currentDate.getFullYear();
          const currentMonth = currentDate.getMonth();

          const financialYearStartYear = currentMonth >= 8 ? currentYear : currentYear - 1;
          
          for (let i = 0; i < 12; i++) {
            const monthIndex = (8 + i) % 12;
            const yearForMonth = monthIndex < 8 ? financialYearStartYear + 1 : financialYearStartYear;
            months.push(new Date(yearForMonth, monthIndex, 1));
          }
          
          return months;
        };

        const financialYearMonths = getFinancialYearMonths();
        
        const residentOverdueMap = new Map();
        let totalOverdueCount = 0;

        activeResidents.forEach(resident => {
          const residentId = resident.ID;
          const residentCharges = serviceCharges.filter(p => p["Resident ID"] === residentId);
          let residentOverdueCount = 0;

          let expectedPaymentDay = 1;
          const benefits = resident.Benefits || [];
          if (benefits && benefits.length > 0) {
            const ucBenefit = benefits.find(b => b.benefit_type === 'universal_credit' && b.payment_day);
            const hbBenefit = benefits.find(b => b.benefit_type === 'housing_benefit' && b.payment_day);
            const otherBenefit = benefits.find(b => b.payment_day);

            if (ucBenefit) expectedPaymentDay = ucBenefit.payment_day;
            else if (hbBenefit) expectedPaymentDay = hbBenefit.payment_day;
            else if (otherBenefit) expectedPaymentDay = otherBenefit.payment_day;
          }

          financialYearMonths.forEach(monthStartDate => {
            const monthKey = format(monthStartDate, 'yyyy-MM');
            
            // Check if this month is before resident's move-in date (N/A month)
            let isNotAvailable = false;
            const moveInDate = resident["Move-in Date"];
            if (moveInDate) {
              const moveInDateObj = new Date(moveInDate);
              moveInDateObj.setHours(0, 0, 0, 0);
              const monthEnd = new Date(monthStartDate.getFullYear(), monthStartDate.getMonth() + 1, 0);
              monthEnd.setHours(0, 0, 0, 0);
              isNotAvailable = monthEnd < moveInDateObj;
            }
            
            // Skip N/A months from overdue calculations
            if (isNotAvailable) {
              return;
            }
            
            const chargeForMonth = residentCharges.find(p => {
              const dueDate = p["Due Date"];
              if (!dueDate) return false;
              const chargeMonth = format(new Date(dueDate), 'yyyy-MM');
              return chargeMonth === monthKey;
            });

            let dayOfMonth = Math.min(expectedPaymentDay, new Date(monthStartDate.getFullYear(), monthStartDate.getMonth() + 1, 0).getDate());
            const expectedDueDate = new Date(monthStartDate.getFullYear(), monthStartDate.getMonth(), dayOfMonth);
            expectedDueDate.setHours(0, 0, 0, 0);
            
            const todayDate = new Date();
            todayDate.setHours(0, 0, 0, 0);

            let isOverdue = false;

            if (chargeForMonth) {
              if (chargeForMonth.Exempt || chargeForMonth["Payment Status"] === 'Exempt') {
                return;
              }
              
              const paymentStatus = chargeForMonth["Payment Status"];
              const dueDate = chargeForMonth["Due Date"];
              
              if (paymentStatus !== 'Paid' && dueDate) {
                const dueDateObj = new Date(dueDate);
                dueDateObj.setHours(0, 0, 0, 0);
                isOverdue = dueDateObj < todayDate;
              }
            } else {
              isOverdue = expectedDueDate < todayDate;
            }

            if (isOverdue) {
              residentOverdueCount++;
              totalOverdueCount++;
            }
          });

          if (residentOverdueCount > 0) {
            residentOverdueMap.set(residentId, {
              resident,
              count: residentOverdueCount
            });
          }
        });

        const overdueResidentsWithCharges = Array.from(residentOverdueMap.values())
          .sort((a, b) => b.count - a.count);

        setServiceChargeSummary({
          overdue: totalOverdueCount,
          overdueItems: overdueResidentsWithCharges.slice(0, 5)
        });

        // Repairs Summary
        const reportedRepairs = repairs.filter(r => {
          const status = (r.Status || '').toLowerCase();
          return status === 'reported';
        });
        const scheduledRepairs = repairs.filter(r => {
          const status = (r.Status || '').toLowerCase();
          return status === 'scheduled';
        });
        const urgentRepairs = repairs.filter(r => {
          const priority = (r.Priority || '').toLowerCase();
          const status = (r.Status || '').toLowerCase();
          return (priority === 'urgent' || priority === 'emergency') && 
                 (status === 'reported' || status === 'scheduled');
        }).slice(0, 5);

        setRepairsSummary({
          reported: reportedRepairs.length,
          scheduled: scheduledRepairs.length,
          recentRepairs: urgentRepairs
        });

        // Housing Benefit Summary
        const fourWeeksAgoHB = new Date();
        fourWeeksAgoHB.setDate(fourWeeksAgoHB.getDate() - 28);
        fourWeeksAgoHB.setHours(0, 0, 0, 0);

        const recentHBLogs = benefitLogs.filter(log => {
          const deleted = log.Deleted || log.deleted || false;
          if (deleted) return false;
          const benefitType = (log["Benefit Type"] || '').toLowerCase().replace(/ /g, '_');
          if (benefitType !== 'housing_benefit') return false; 
          const logDate = new Date(log["Log Date"]);
          return logDate >= fourWeeksAgoHB;
        });

        const requestedSupportNotes = recentHBLogs.filter(log => {
          const logType = (log["Log Type"] || '').toLowerCase().replace(/ /g, '_');
          return logType === 'requested_support_notes';
        }).length;
        const requestedDocuments = recentHBLogs.filter(log => {
          const logType = (log["Log Type"] || '').toLowerCase().replace(/ /g, '_');
          return logType === 'requested_documents';
        }).length;
        const suspendedClaims = recentHBLogs.filter(log => {
          const logType = (log["Log Type"] || '').toLowerCase().replace(/ /g, '_');
          return logType === 'suspended_claims';
        }).length;
        const changeOfAddresses = recentHBLogs.filter(log => {
          const logType = (log["Log Type"] || '').toLowerCase().replace(/ /g, '_');
          return logType === 'change_of_addresses';
        }).length;
        const roomTransfers = recentHBLogs.filter(log => {
          const logType = (log["Log Type"] || '').toLowerCase().replace(/ /g, '_');
          return logType === 'room_transfers';
        }).length;
        const hbCalls = recentHBLogs.filter(log => {
          const logType = (log["Log Type"] || '').toLowerCase().replace(/ /g, '_');
          return logType === 'hb_calls';
        }).length;
        const hbLeavers = recentHBLogs.filter(log => {
          const logType = (log["Log Type"] || '').toLowerCase().replace(/ /g, '_');
          return logType === 'hb_leavers';
        }).length;

        // Pending Support Note Reminders
        const pendingSupportNoteRequests = benefitLogs
          .filter(log => {
            const deleted = log.Deleted || log.deleted || false;
            if (deleted) return false;
            const benefitType = (log["Benefit Type"] || '').toLowerCase().replace(/ /g, '_');
            const logType = (log["Log Type"] || '').toLowerCase().replace(/ /g, '_');
            const deadlineDate = log["Deadline Date"] || log.deadline_date;

            return benefitType === 'housing_benefit' &&
                   logType === 'requested_support_notes' &&
                   deadlineDate;
          })
          .map(log => {
            const deadlineDate = new Date(log["Deadline Date"] || log.deadline_date);
            const today = new Date();

            // For initial sorting, use the difference including time
            const target = new Date(deadlineDate);
            target.setHours(23, 59, 59, 999);
            const diffTime = target - today;
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            return {
              ...log,
              daysRemaining: diffDays,
              exactDeadline: target.toISOString()
            };
          })
          .sort((a, b) => a.daysRemaining - b.daysRemaining);

        setHousingBenefitSummary({
          requestedSupportNotes,
          requestedDocuments,
          suspendedClaims,
          changeOfAddresses,
          roomTransfers,
          hbCalls,
          hbLeavers,
          total: recentHBLogs.length,
          pendingSupportNoteRequests
        });

        // Referrals Summary
        const referralsUnderAssessment = allReferrals.filter(r => {
          const deleted = r.Deleted || r.deleted || false;
          if (deleted) return false;
          const status = (r.Status || '').toLowerCase().replace(/ /g, '_');
          return status === 'under_assessment';
        });
        setReferralsSummary({
          underAssessment: referralsUnderAssessment.length,
          recentReferrals: referralsUnderAssessment.slice(0, 5)
        });

        // Quarterly Review Summary
        const overdueReviews = quarterlyReviewsData.filter(r => {
          const status = (r.Status || '').toLowerCase();
          const nextReviewDate = r["Next Review Date"];
          return status === 'overdue' || (nextReviewDate && new Date(nextReviewDate) < now);
        });
        const dueSoonReviews = quarterlyReviewsData.filter(r => {
          const nextReviewDate = r["Next Review Date"];
          return nextReviewDate && 
                 new Date(nextReviewDate) >= now && 
                 new Date(nextReviewDate) <= thirtyDaysFromNow;
        });

        setQuarterlyReviewSummary({
          overdue: overdueReviews.slice(0, 5),
          dueSoon: dueSoonReviews.slice(0, 5)
        });

        // --- Upcoming Deadlines Logic ---
        const allDeadlines = [];

        // Helper to add deadlines with robustness for field names
        const addDeadlines = (items, dateField, titleField, source, statusField = null, completedStatus = 'completed', userFields = []) => {
          const altDateField = dateField.toLowerCase().replace(/ /g, '_');
          const altTitleField = titleField.toLowerCase().replace(/ /g, '_');
          const altStatusField = statusField ? statusField.toLowerCase().replace(/ /g, '_') : null;

          items.forEach(item => {
            const dateStr = item[dateField] || item[altDateField];
            if (!dateStr) return;

            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return;

            const status = (item[statusField] || (altStatusField ? item[altStatusField] : '') || '').toString().toLowerCase().replace(/ /g, '_');

            if (statusField && status === completedStatus.toLowerCase().replace(/ /g, '_')) return;

            // Filtering logic: Visible if Compliance, or if one of the userFields matches current user
            let isVisible = source === 'Compliance';
            let assignedToName = '';

            // Try to find the person this deadline belongs to from the userFields
            for (const field of userFields) {
              const altField = field.toLowerCase().replace(/ /g, '_');
              const val = (item[field] || item[altField] || '').toString().trim();
              if (val) {
                assignedToName = val;
                if (isMatch(val)) {
                  isVisible = true;
                }
              }
            }

            if (isVisible) {
              // Resolve subject (Property or Resident) for better "who the deadline is for" context
              const propertyId = item["Property ID"] || item.property_id;
              const residentId = item["Resident ID"] || item.resident_id;

              let subjectName = '';
              if (propertyId) {
                const prop = allProperties.find(p => (p.ID || p.id) === propertyId);
                if (prop) subjectName = prop.Name || prop.name;
              } else if (residentId) {
                const res = residentsData.find(r => (r.ID || r.id) === residentId);
                if (res) subjectName = `${res["First Name"] || res.first_name} ${res["Last Name"] || res.last_name}`;
              }

              const finalAssignedTo = assignedToName && subjectName
                ? `${assignedToName} (${subjectName})`
                : (assignedToName || subjectName);

              allDeadlines.push({
                id: item.ID || item.id || `${source}-${Math.random()}`,
                title: item[titleField] || item[altTitleField] || item.Title || item.title || 'Untitled',
                date: date,
                source: source,
                item: item,
                assignedTo: finalAssignedTo
              });
            }
          });
        };

        // 1. Tasks - Filtered by Assigned To
        addDeadlines(tasks, 'Due Date', 'Title', 'Task', 'Status', 'completed', ['Assigned to (User ID)']);

        // 2. Benefit Logs (HB, UC, PIP, WCA + Allocated) - Filtered by Creator
        const allBenefitLogs = [...benefitLogs, ...ucLogs, ...pipLogs, ...wcaLogs, ...allocatedHbLogs, ...allocatedUcLogs, ...allocatedPipLogs, ...allocatedWcaLogs];
        addDeadlines(allBenefitLogs, 'Deadline Date', 'Title', 'Benefit', 'Status', 'completed', ['Logged By', 'Created By', 'Staff Member']);

        // 3. Office Logs - Filtered by Creator
        const officeLogsWithActions = officeLogs.filter(log => log["Action Required"] || log.action_required);
        addDeadlines(officeLogsWithActions, 'Action Due Date', 'Title', 'Office Log', 'Status', 'completed', ['Staff Member', 'Created By']);

        // 4. Compliance - Visible to ALL
        addDeadlines(complianceLogs.filter(c => !c.Actioned), 'Expiry Date', 'Certificate Name', 'Compliance');

        // 5. Quarterly Reviews - Filtered by Creator/Key Worker
        const allQuarterlyReviews = [...quarterlyReviewsData, ...allocatedQuarterlyReviews];
        addDeadlines(allQuarterlyReviews, 'Next Review Date', 'Title', 'Quarterly Review', 'Status', 'completed', ['Created By', 'Logged By', 'Key Worker']);

        // 6. Generic Deadline Date checks for all CRM pages
        // This fulfills the requirement to search all pages for literal "Deadline Date"
        addDeadlines(allIncidents, 'Deadline Date', 'Title', 'Incident', 'Status', 'resolved', ['Logged By', 'Created By']);
        const allSupportNotes = [...supportNotes, ...allocatedSupportNotes];
        addDeadlines(allSupportNotes, 'Deadline Date', 'Title', 'Support Note', 'Status', 'completed', ['Created By', 'Logged By']);
        addDeadlines(weeklySWDocLogs, 'Deadline Date', 'Title', 'Weekly SW Doc', 'Status', 'completed', ['Created By', 'Logged By']);
        addDeadlines(workBookings, 'Deadline Date', 'Title', 'Work Booking', 'Status', 'completed', ['Logged By', 'Created By']);
        addDeadlines(propertyOnboarding, 'Deadline Date', 'Landlord Name', 'Property Onboarding', 'Onboarding Status', 'live', ['Created By', 'Logged By']);
        addDeadlines(propertyPurchases, 'Deadline Date', 'Item Name', 'Property Purchase', 'Status', 'delivered', ['Logged By', 'Created By']);
        addDeadlines(utilities, 'Deadline Date', 'Company Name', 'Utility', null, 'completed', ['Created By']);
        addDeadlines(landlordPortal, 'Deadline Date', 'Title', 'Landlord Portal', 'Status', 'completed', ['Created By']);

        // 6a. Custom Section Deadlines
        customSectionData.forEach(entry => {
          if (entry.data && typeof entry.data === 'object') {
            const deadlineKey = Object.keys(entry.data).find(k => k.toLowerCase().replace(/ /g, '_') === 'deadline_date');
            if (deadlineKey && entry.data[deadlineKey]) {
              const date = new Date(entry.data[deadlineKey]);
              if (!isNaN(date.getTime())) {
                const creator = entry["Created By"] || entry.created_by || '';
                const creatorLower = creator.toLowerCase();
                if (creatorLower === currentUserName || creatorLower === currentUserEmail || creatorLower === currentUserPrefix) {
                  allDeadlines.push({
                    id: entry.ID || entry.id,
                    title: entry.Title || entry.title || 'Untitled Custom Entry',
                    date: date,
                    source: 'Custom Section',
                    item: entry,
                    assignedTo: creator
                  });
                }
              }
            }
          }
        });

        // 7. Repairs - Filtered by Creator
        addDeadlines(repairs, 'Scheduled Date', 'Title', 'Repair', 'Status', 'completed', ['Logged By', 'Created By']);
        addDeadlines(repairs, 'Payment Due Date', 'Title', 'Repair Payment', 'Invoice Payment Status', 'paid', ['Logged By', 'Created By']);

        // 8. Landlord Enquiries - Filtered by Creator
        addDeadlines(landlordEnquiries, 'Next Action Date', 'Applicant Name', 'Landlord Enquiry', 'Status', 'completed', ['Created By']);

        // 9. Referrals - Filtered by Creator
        addDeadlines(allReferrals, 'Assessment Date', 'Applicant Name', 'Referral', 'Status', 'accepted', ['Created By']); // accepted as a proxy for completed

        // Categorize and Sort
        const endOfToday = new Date(now);
        endOfToday.setHours(23, 59, 59, 999);

        const sevenDaysFromNow = addDays(endOfToday, 7);
        const fourteenDaysFromNow = addDays(endOfToday, 14);

        const next7Days = allDeadlines.filter(d => {
          const target = new Date(d.date);
          target.setHours(23, 59, 59, 999);
          return target >= now && d.date <= sevenDaysFromNow;
        }).sort((a, b) => a.date - b.date);
        const next14Days = allDeadlines.filter(d => d.date > sevenDaysFromNow && d.date <= fourteenDaysFromNow).sort((a, b) => a.date - b.date);

        setUpcomingDeadlines({ next7Days, next14Days });

        setLoadingReminders(false);
      } catch (error) {
        console.error("❌ Error loading dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadDashboardData();

      // Log login event once per session
      if (supabase && !loginLogged.current) {
        const sessionKey = `login_logged_${user.id}_${new Date().toISOString().split('T')[0]}`;
        const alreadyLoggedToday = sessionStorage.getItem(sessionKey);

        if (!alreadyLoggedToday) {
          logActivity(supabase, {
            userName: user.fullName || user.username || "Unknown",
            userEmail: user.primaryEmailAddress?.emailAddress,
            actionType: ACTIONS.LOGIN,
            description: `User logged in to the dashboard`
          });
          sessionStorage.setItem(sessionKey, 'true');
        }
        loginLogged.current = true;
      }
    }
  }, [user, delay, retryApiCall, supabase]);

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Error Loading Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">{error}</p>
            <Button
              variant="outline"
              className="mt-4 border-red-300 text-red-700 hover:bg-red-100"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isLoaded || loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Upcoming Deadlines Section */}
      {(upcomingDeadlines.next7Days.length > 0 || upcomingDeadlines.next14Days.length > 0) && (
        <Card className="mb-8 border-0 shadow-sm bg-white overflow-hidden">
          <CardHeader className="bg-slate-50 border-b py-4">
            <CardTitle className="text-xl flex items-center gap-2 text-slate-800">
              <Clock className="w-6 h-6 text-indigo-600" />
              Upcoming Deadlines
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-8">
            <DeadlineGroup
              title="Next 7 Days"
              deadlines={upcomingDeadlines.next7Days}
              colorClass="text-orange-600"
              icon={Calendar}
            />
            <DeadlineGroup
              title="Next 14 Days"
              deadlines={upcomingDeadlines.next14Days}
              colorClass="text-blue-600"
              icon={Clock}
            />
          </CardContent>
        </Card>
      )}

      {/* Welcome Section */}
      <Card className="mb-8 border-0 shadow-sm overflow-hidden">
        <CardContent className="p-8">
          <h1 className="text-3xl font-bold text-gray-800">
            Welcome back{user?.firstName ? `, ${user.firstName}` : ''}
          </h1>
          <p className="text-gray-500 text-base mt-2">Here's what's happening today</p>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {!isSCStaff && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <a href={createPageUrl("Residents")}>
              <Card className="bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 cursor-pointer transition-all duration-200 h-24 flex items-center justify-center border-0 shadow-md">
                <CardContent className="p-4 text-center text-white">
                  <Users className="w-6 h-6 mx-auto mb-2" />
                  <p className="font-medium text-sm">Add Resident</p>
                </CardContent>
              </Card>
            </a>

            <a href={createPageUrl("Incidents")}>
              <Card className="bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 cursor-pointer transition-all duration-200 h-24 flex items-center justify-center border-0 shadow-md">
                <CardContent className="p-4 text-center text-white">
                  <AlertTriangle className="w-6 h-6 mx-auto mb-2" />
                  <p className="font-medium text-sm">Report Incident</p>
                </CardContent>
              </Card>
            </a>

            <a href={createPageUrl("Referrals")}>
              <Card className="bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 cursor-pointer transition-all duration-200 h-24 flex items-center justify-center border-0 shadow-md">
                <CardContent className="p-4 text-center text-white">
                  <FileUp className="w-6 h-6 mx-auto mb-2" />
                  <p className="font-medium text-sm">Add Enquiry</p>
                </CardContent>
              </Card>
            </a>

            <a href={createPageUrl("Documents")}>
              <Card className="bg-gradient-to-br from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 cursor-pointer transition-all duration-200 h-24 flex items-center justify-center border-0 shadow-md">
                <CardContent className="p-4 text-center text-white">
                  <Upload className="w-6 h-6 mx-auto mb-2" />
                  <p className="font-medium text-sm">Upload Document</p>
                </CardContent>
              </Card>
            </a>

            <a href={createPageUrl("tasks")}>
              <Card className="bg-gradient-to-br from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 cursor-pointer transition-all duration-200 h-24 flex items-center justify-center border-0 shadow-md">
                <CardContent className="p-4 text-center text-white">
                  <CheckSquare className="w-6 h-6 mx-auto mb-2" />
                  <p className="font-medium text-sm">Tasks</p>
                </CardContent>
              </Card>
            </a>

            <a href={createPageUrl("Repairs")}>
              <Card className="bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 cursor-pointer transition-all duration-200 h-24 flex items-center justify-center border-0 shadow-md">
                <CardContent className="p-4 text-center text-white">
                  <Wrench className="w-6 h-6 mx-auto mb-2" />
                  <p className="font-medium text-sm">Add Repair</p>
                </CardContent>
              </Card>
            </a>
          </div>
        )}

        {/* Six Reminder Cards - 2 Rows of 3 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Row 1 - Card 1: Voids / Available Rooms */}
          {!isSCStaff && (
            <Card className="bg-gradient-to-br from-teal-50 to-blue-50 border-teal-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2 text-teal-700">
                  <DoorOpen className="w-5 h-5" />
                  Available Rooms
                </CardTitle>
                <a href={createPageUrl("Accommodations")}>
                  <Button variant="ghost" size="sm" className="text-teal-700 hover:text-teal-800">
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </a>
              </div>
            </CardHeader>
            <CardContent>
              {loadingReminders ? (
                <Skeleton className="h-24 w-full" />
              ) : (
                <>
                  <div className="text-center mb-4">
                    <div className="text-4xl font-bold text-teal-600">{voidsSummary.count}</div>
                    <div className="text-sm text-teal-700">rooms currently available</div>
                  </div>
                  {voidsSummary.recentVoids.length > 0 ? (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {voidsSummary.recentVoids.map(void_item => {
                        const property = properties.find(p => p.ID === void_item["Property ID"]);
                        return (
                          <div key={void_item.ID} className="flex items-center justify-between p-2 bg-white rounded border border-teal-100">
                            <div>
                              <div className="font-medium text-gray-900">{void_item["Room Number"]}</div>
                              {property && (
                                <div className="text-xs text-gray-600">{property.Name}</div>
                              )}
                              <div className="text-xs text-gray-600 capitalize">
                                {void_item["Accommodation Type"]?.replace(/_/g, ' ')}
                              </div>
                            </div>
                            <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200">
                              Available
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-teal-700 text-center py-4">No voids available</p>
                  )}
                  <a href={createPageUrl("Accommodations")}>
                    <Button variant="link" className="w-full mt-3 text-teal-700 hover:text-teal-800">
                      View All Accommodations <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </a>
                </>
              )}
            </CardContent>
          </Card>

          )}

          {/* Row 1 - Card 2: Task Reminders */}
          {!isSCStaff && (
            <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2 text-orange-700">
                  <Bell className="w-5 h-5" />
                  Tasks
                </CardTitle>
                <a href={createPageUrl("Tasks")}>
                  <Button variant="ghost" size="sm" className="text-orange-700 hover:text-orange-800">
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </a>
              </div>
            </CardHeader>
            <CardContent>
              {loadingReminders ? (
                <Skeleton className="h-24 w-full" />
              ) : (
                <>
                  {/* My Tasks Section */}
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-orange-800 mb-2">My Tasks</h4>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="text-center p-3 bg-white rounded border border-orange-100">
                        <div className="text-2xl font-bold text-orange-600">{taskSummary.myDueSoon}</div>
                        <div className="text-xs text-orange-700">Due soon</div>
                      </div>
                      <div className="text-center p-3 bg-white rounded border border-red-100">
                        <div className="text-2xl font-bold text-red-600">{taskSummary.myOverdue}</div>
                        <div className="text-xs text-red-700">Overdue</div>
                      </div>
                    </div>
                    {taskSummary.myRecentTasks.length > 0 ? (
                      <div className="space-y-2 max-h-24 overflow-y-auto">
                        {taskSummary.myRecentTasks.map(task => (
                          <div key={task.ID} className="p-2 bg-white rounded text-sm border border-orange-100">
                            <div className="font-medium text-gray-900 truncate">{task.Title}</div>
                            <div className="text-xs text-gray-600">
                              Due: {format(new Date(task["Due Date"]), 'MMM d, yyyy')}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-orange-700 text-center py-2">No tasks assigned to you</p>
                    )}
                  </div>

                  <div className="border-t border-orange-200 pt-3">
                    <h4 className="text-sm font-semibold text-orange-800 mb-2">All Tasks</h4>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="text-center p-3 bg-white rounded border border-yellow-100">
                        <div className="text-2xl font-bold text-yellow-600">{taskSummary.dueSoon}</div>
                        <div className="text-xs text-yellow-700">Due soon</div>
                      </div>
                      <div className="text-center p-3 bg-white rounded border border-red-100">
                        <div className="text-2xl font-bold text-red-600">{taskSummary.overdueTasks}</div>
                        <div className="text-xs text-red-700">Overdue</div>
                      </div>
                    </div>
                  </div>

                  <a href={createPageUrl("Tasks")}>
                    <Button variant="link" className="w-full mt-3 text-orange-700 hover:text-orange-800">
                      View All Tasks <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </a>
                </>
              )}
            </CardContent>
          </Card>
          )}

          {/* Row 1 - Card 3: Compliance Reminders */}
          {!isSCStaff && (
            <Card className="bg-gradient-to-br from-red-50 to-pink-50 border-red-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2 text-red-700">
                  <ShieldCheck className="w-5 h-5" />
                  Compliance
                </CardTitle>
                <a href={createPageUrl("Compliance")}>
                  <Button variant="ghost" size="sm" className="text-red-700 hover:text-red-800">
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </a>
              </div>
            </CardHeader>
            <CardContent>
              {loadingReminders ? (
                <Skeleton className="h-24 w-full" />
              ) : (
                <>
                  <div className="text-center mb-4">
                    <div className="text-4xl font-bold text-red-600">{complianceSummary.overdue}</div>
                    <div className="text-sm text-red-700">Expired</div>
                  </div>
                  {complianceSummary.recentItems.length > 0 ? (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {complianceSummary.recentItems.slice(0, 3).map(item => {
                        const property = properties.find(p => p.ID === item["Property ID"]);
                        return (
                          <div key={item.ID} className="p-2 bg-white rounded text-sm border border-red-100">
                            <div className="font-medium text-gray-900">{item["Certificate Name"]}</div>
                            {property && (
                              <div className="text-xs text-gray-600 mt-1">{property.Name}</div>
                            )}
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-xs text-gray-600">
                                Expires: {format(new Date(item["Expiry Date"]), 'MMM d, yyyy')}
                              </span>
                              <Badge variant="destructive" className="text-xs">
                                Expired
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-red-700 text-center py-4">All up to date ✅</p>
                  )}
                  <a href={createPageUrl("Compliance")}>
                    <Button variant="link" className="w-full mt-3 text-red-700 hover:text-red-800">
                      View All Compliance <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </a>
                </>
              )}
            </CardContent>
          </Card>
          )}

          {/* Row 2 - Card 4: Service Charge Reminders */}
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2 text-green-700">
                  <PoundSterling className="w-5 h-5" />
                  Service Charges
                </CardTitle>
                <a href={createPageUrl("ServiceCharges")}>
                  <Button variant="ghost" size="sm" className="text-green-700 hover:text-green-800">
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </a>
              </div>
            </CardHeader>
            <CardContent>
              {loadingReminders ? (
                <Skeleton className="h-24 w-full" />
              ) : (
                <>
                  <div className="text-center mb-4">
                    <div className="text-4xl font-bold text-green-600">{serviceChargeSummary.overdue}</div>
                    <div className="text-sm text-green-700">Overdue Payments</div>
                  </div>
                  {serviceChargeSummary.overdueItems.length > 0 ? (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {serviceChargeSummary.overdueItems.map(item => (
                        <div key={item.resident?.ID} className="p-2 bg-white rounded text-sm border border-green-100">
                          <div className="font-medium text-gray-900">
                            {item.resident?.["First Name"]} {item.resident?.["Last Name"]}
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs text-gray-600">
                              {item.count} overdue payment{item.count !== 1 ? 's' : ''}
                            </span>
                            <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                              Overdue
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-green-700 text-center py-4">All up to date ✅</p>
                  )}
                  <a href={createPageUrl("ServiceCharges")}>
                    <Button variant="link" className="w-full mt-3 text-green-700 hover:text-green-800">
                      View All Service Charges <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </a>
                </>
              )}
            </CardContent>
          </Card>


          {/* Row 2 - Card 5: Repairs Reminders */}
          {!isSCStaff && (
            <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2 text-gray-700">
                  <Wrench className="w-5 h-5" />
                  Repairs
                </CardTitle>
                <a href={createPageUrl("Repairs")}>
                  <Button variant="ghost" size="sm" className="text-gray-700 hover:text-gray-800">
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </a>
              </div>
            </CardHeader>
            <CardContent>
              {loadingReminders ? (
                <Skeleton className="h-24 w-full" />
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="text-center p-3 bg-white rounded border border-gray-100">
                      <div className="text-3xl font-bold text-gray-600">{repairsSummary.reported}</div>
                      <div className="text-xs text-gray-700">Reported</div>
                    </div>
                    <div className="text-center p-3 bg-white rounded border border-gray-100">
                      <div className="text-3xl font-bold text-gray-600">{repairsSummary.scheduled}</div>
                      <div className="text-xs text-gray-700">Scheduled</div>
                    </div>
                  </div>
                  {repairsSummary.recentRepairs.length > 0 ? (
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {repairsSummary.recentRepairs.map(repair => (
                        <div key={repair.ID} className="p-2 bg-white rounded text-sm border border-gray-100">
                          <div className="font-medium text-gray-900">{repair.Title || repair.Description?.slice(0, 50)}</div>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs text-gray-600">
                              Priority: <span className={`capitalize font-semibold ${repair.Priority === 'Emergency' ? 'text-red-500' : repair.Priority === 'Urgent' ? 'text-orange-500' : 'text-gray-500'}`}>{repair.Priority}</span>
                            </span>
                            <Badge className="bg-gray-100 text-gray-800 border-gray-200 text-xs capitalize">
                              {repair.Status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-700 text-center py-4">No urgent repairs</p>
                  )}
                  <a href={createPageUrl("Repairs")}>
                    <Button variant="link" className="w-full mt-3 text-gray-700 hover:text-gray-800">
                      View All Repairs <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </a>
                </>
              )}
            </CardContent>
          </Card>
          )}

          {/* Row 2 - Card 6: Referrals Reminders */}
          {!isSCStaff && (
            <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2 text-indigo-700">
                  <ArrowRightLeft className="w-5 h-5" />
                  Referrals
                </CardTitle>
                <a href={createPageUrl("Referrals")}>
                  <Button variant="ghost" size="sm" className="text-indigo-700 hover:text-indigo-800">
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </a>
              </div>
            </CardHeader>
            <CardContent>
              {loadingReminders ? (
                <Skeleton className="h-24 w-full" />
              ) : (
                <>
                  <div className="text-center mb-4">
                    <div className="text-4xl font-bold text-indigo-600">{referralsSummary.underAssessment}</div>
                    <div className="text-sm text-indigo-700">Under Assessment</div>
                  </div>
                  {referralsSummary.recentReferrals.length > 0 ? (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {referralsSummary.recentReferrals.map(referral => (
                        <div key={referral.ID} className="p-2 bg-white rounded text-sm border border-indigo-100">
                          <div className="font-medium text-gray-900">{referral["Applicant Name"]}</div>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs text-gray-600">
                              {format(new Date(referral["Referral Date"]), 'MMM d, yyyy')}
                            </span>
                            <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200 text-xs">
                              Assessment
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-indigo-700 text-center py-4">No referrals under assessment</p>
                  )}
                  <a href={createPageUrl("Referrals")}>
                    <Button variant="link" className="w-full mt-3 text-indigo-700 hover:text-indigo-800">
                      View All Referrals <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </a>
                </>
              )}
            </CardContent>
          </Card>
          )}
        </div>

        {/* Housing Benefit Alerts - Full Width */}
        {!isSCStaff && (
          <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl flex items-center gap-2 text-purple-700">
                  <HandCoins className="w-6 h-6" />
                  Housing Benefits
                </CardTitle>
                <p className="text-sm text-purple-600 mt-1">Logs from the last 4 weeks</p>
              </div>
              <a href={createPageUrl("Benefits")}>
                <Button variant="outline" size="sm" className="text-purple-700 hover:text-purple-800 border-purple-300">
                  View All Benefits <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </a>
            </div>
          </CardHeader>
          <CardContent>
            {loadingReminders ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                {[1, 2, 3, 4, 5, 6, 7].map(i => <Skeleton key={i} className="h-24 w-full" />)}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-4">
                  <div className="text-center p-4 bg-white rounded-lg border border-purple-100 shadow-sm">
                    <div className={`text-3xl font-bold mb-1 ${housingBenefitSummary.requestedSupportNotes > 0 ? 'text-purple-600' : 'text-gray-400'}`}>
                      {housingBenefitSummary.requestedSupportNotes}
                    </div>
                    <div className="text-xs text-gray-700 font-medium">Support Notes</div>
                  </div>

                  <div className="text-center p-4 bg-white rounded-lg border border-purple-100 shadow-sm">
                    <div className={`text-3xl font-bold mb-1 ${housingBenefitSummary.requestedDocuments > 0 ? 'text-purple-600' : 'text-gray-400'}`}>
                      {housingBenefitSummary.requestedDocuments}
                    </div>
                    <div className="text-xs text-gray-700 font-medium">Documents</div>
                  </div>

                  <div className="text-center p-4 bg-white rounded-lg border border-red-100 shadow-sm">
                    <div className={`text-3xl font-bold mb-1 ${housingBenefitSummary.suspendedClaims > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                      {housingBenefitSummary.suspendedClaims}
                    </div>
                    <div className="text-xs text-gray-700 font-medium">Suspended Claims</div>
                  </div>

                  <div className="text-center p-4 bg-white rounded-lg border border-purple-100 shadow-sm">
                    <div className={`text-3xl font-bold mb-1 ${housingBenefitSummary.changeOfAddresses > 0 ? 'text-purple-600' : 'text-gray-400'}`}>
                      {housingBenefitSummary.changeOfAddresses}
                    </div>
                    <div className="text-xs text-gray-700 font-medium">Address Changes</div>
                  </div>

                  <div className="text-center p-4 bg-white rounded-lg border border-purple-100 shadow-sm">
                    <div className={`text-3xl font-bold mb-1 ${housingBenefitSummary.roomTransfers > 0 ? 'text-purple-600' : 'text-gray-400'}`}>
                      {housingBenefitSummary.roomTransfers}
                    </div>
                    <div className="text-xs text-gray-700 font-medium">Room Transfers</div>
                  </div>

                  <div className="text-center p-4 bg-white rounded-lg border border-purple-100 shadow-sm">
                    <div className={`text-3xl font-bold mb-1 ${housingBenefitSummary.hbCalls > 0 ? 'text-purple-600' : 'text-gray-400'}`}>
                      {housingBenefitSummary.hbCalls}
                    </div>
                    <div className="text-xs text-gray-700 font-medium">HB Calls</div>
                  </div>

                  <div className="text-center p-4 bg-white rounded-lg border border-purple-100 shadow-sm">
                    <div className={`text-3xl font-bold mb-1 ${housingBenefitSummary.hbLeavers > 0 ? 'text-purple-600' : 'text-gray-400'}`}>
                      {housingBenefitSummary.hbLeavers}
                    </div>
                    <div className="text-xs text-gray-700 font-medium">HB Leavers</div>
                  </div>
                </div>

                {housingBenefitSummary.pendingSupportNoteRequests.length > 0 && (
                  <div className="mt-6 border-t border-purple-200 pt-4">
                    <h4 className="text-sm font-semibold text-purple-800 mb-3 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Support Note Request Deadlines
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {housingBenefitSummary.pendingSupportNoteRequests.map(request => {
                        const resident = residents.find(r => r.ID === request["Resident ID"]);
                        const isOverdue = request.daysRemaining < 0;
                        const isDueSoon = request.daysRemaining >= 0 && request.daysRemaining <= 3;
                        const isSent = request["Support Notes Sent"] || request.support_notes_sent || false;

                        return (
                          <div
                            key={request.ID}
                            className={`p-3 rounded-lg border flex flex-col justify-between ${
                              isSent ? 'bg-green-50 border-green-200' :
                              isOverdue ? 'bg-red-50 border-red-200' :
                              isDueSoon ? 'bg-orange-50 border-orange-200' :
                              'bg-white border-purple-100'
                            }`}
                          >
                            <div>
                              <div className="flex items-start justify-between gap-2">
                                <div className="font-medium text-slate-900 truncate flex-1">
                                  {resident ? `${resident["First Name"]} ${resident["Last Name"]}` : request.Title}
                                </div>
                                {isSent && (
                                  <Badge className="bg-green-100 text-green-700 border-green-200 text-[10px] h-4 px-1 shadow-none">
                                    Sent
                                  </Badge>
                                )}
                              </div>
                              <div className="text-xs text-slate-600 mt-1 truncate">
                                {request.Title}
                              </div>
                            </div>
                            <div className="flex items-center justify-between mt-3">
                              <div className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                isSent ? 'bg-green-100 text-green-700' :
                                isOverdue ? 'bg-red-100 text-red-700' :
                                isDueSoon ? 'bg-orange-100 text-orange-700' :
                                'bg-purple-100 text-purple-700'
                              }`}>
                                <CountdownDisplay deadline={request.exactDeadline || request["Deadline Date"] || request.deadline_date} />
                              </div>
                              <div className="text-[10px] text-slate-500">
                                Due: {format(new Date(request["Deadline Date"] || request.deadline_date), 'MMM d')}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="text-center pt-3 border-t border-purple-200 mt-4">
                  <div className="inline-flex items-center gap-2 text-sm text-purple-700">
                    <span className="font-semibold">Total Logs:</span>
                    <Badge className="bg-purple-600 text-white text-base px-3 py-1">
                      {housingBenefitSummary.total}
                    </Badge>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
        )}

        {/* Summary Stats Row */}
        {!isSCStaff && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <a href={createPageUrl("Residents")}>
              <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 hover:shadow-lg transition-all duration-200 cursor-pointer">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2 text-blue-700">
                    <UserCheck className="w-5 h-5" />
                    Active Residents
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-5xl font-bold text-blue-600 mb-2">{stats.residents}</div>
                    <div className="text-sm text-blue-700">currently active in system</div>
                  </div>
                  <Button variant="link" className="w-full mt-4 text-blue-700 hover:text-blue-800">
                    View All Residents <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            </a>

            <a href={createPageUrl("Incidents")}>
              <Card className="bg-gradient-to-br from-red-50 to-orange-50 border-red-200 hover:shadow-lg transition-all duration-200 cursor-pointer">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2 text-red-700">
                    <AlertTriangle className="w-5 h-5" />
                    Open Incidents
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-5xl font-bold text-red-600 mb-2">{stats.activeIncidents}</div>
                    <div className="text-sm text-red-700">requiring attention</div>
                  </div>
                  <Button variant="link" className="w-full mt-4 text-red-700 hover:text-red-800">
                    View All Incidents <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            </a>

            <a href={createPageUrl("OfficeLogs")}>
              <Card className="bg-gradient-to-br from-sky-50 to-blue-50 border-blue-200 hover:shadow-lg transition-all duration-200 cursor-pointer">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2 text-blue-700">
                    <FileText className="w-5 h-5" />
                    Today's Logs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-5xl font-bold text-blue-600 mb-2">{stats.todayLogs}</div>
                    <div className="text-sm text-blue-700">office logs recorded today</div>
                  </div>
                  <Button variant="link" className="w-full mt-4 text-blue-700 hover:text-blue-800">
                    View All Logs <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            </a>
          </div>
        )}

        {/* Recent Activity Row */}
        {!isSCStaff && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-gray-700">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    Recent Incidents (Last 4 Weeks)
                  </CardTitle>
                  <a href={createPageUrl("Incidents")}>
                    <Button variant="link" className="text-blue-600 hover:text-blue-700 text-sm">
                      View All <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </a>
                </div>
              </CardHeader>
              <CardContent>
                {recentActivity.incidents.length > 0 ? (
                  <div className="space-y-3">
                    {recentActivity.incidents.map((incident) => (
                      <div key={incident.ID} className="border-l-4 border-red-400 pl-3 py-2">
                        <div className="flex items-center justify-between mb-1">
                          <Badge className="bg-red-100 text-red-800 text-xs">
                                {(incident["Incident Type"] || incident.incident_type)?.replace(/_/g, ' ')}
                          </Badge>
                          <span className="text-xs text-gray-500">
                                {format(new Date(incident["Incident Date"] || incident.incident_date), 'MMM d')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 font-medium">{incident.Description?.slice(0, 60)}...</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-8">No incidents in the last 4 weeks</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-gray-700">
                    <FileText className="w-5 h-5 text-blue-500" />
                    This Week's Office Logs
                  </CardTitle>
                  <a href={createPageUrl("OfficeLogs")}>
                    <Button variant="link" className="text-blue-600 hover:text-blue-700 text-sm">
                      View All <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </a>
                </div>
              </CardHeader>
              <CardContent>
                {recentActivity.logs.length > 0 ? (
                  <div className="space-y-3">
                    {recentActivity.logs.map((log) => (
                      <div key={log.ID} className="border-l-4 border-blue-400 pl-3 py-2">
                        <div className="flex items-center justify-between mb-1">
                          <Badge className="bg-blue-100 text-blue-800 text-xs capitalize">
                                {(log["Log Type"] || log.log_type)?.replace(/_/g, ' ')}
                          </Badge>
                          <span className="text-xs text-gray-500">
                                {format(new Date(log["Date Time"] || log.date_time || log["Date/Time"]), 'MMM d')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 font-medium">
                          {log.Title || log.Description?.slice(0, 60) || 'Office log entry'}
                        </p>
                        {log["Person Involved"] && (
                          <p className="text-xs text-gray-500 mt-1">By: {log["Person Involved"]}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-8">No office logs this week</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quarterly Review Reminders */}
        {!isSCStaff && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-gray-700">
                  <Heart className="w-5 h-5 text-pink-500" />
                  Quarterly Review Reminders
                </CardTitle>
                <a href={createPageUrl("SupportPlans")}>
                  <Button variant="link" className="text-blue-600 hover:text-blue-700 text-sm">
                    View Support Plans <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </a>
              </div>
            </CardHeader>
            <CardContent>
              {loadingReminders ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-red-700 mb-3 flex items-center gap-2">
                      <Bell className="w-4 h-4" />
                      Overdue ({quarterlyReviewSummary.overdue.length})
                    </h3>
                    {quarterlyReviewSummary.overdue.length > 0 ? (
                      <div className="space-y-2">
                        {quarterlyReviewSummary.overdue.slice(0, 3).map(review => (
                          <div key={review.ID} className="p-3 bg-red-50 rounded-lg text-sm border border-red-200">
                            <div className="font-medium text-gray-900">{review.Title}</div>
                            <div className="text-xs text-gray-600 mt-1">
                              Due: {review["Next Review Date"] ? format(new Date(review["Next Review Date"]), 'MMM d, yyyy') : 'N/A'}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 py-4">No overdue reviews ✅</p>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-yellow-700 mb-3 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Due Soon ({quarterlyReviewSummary.dueSoon.length})
                    </h3>
                    {quarterlyReviewSummary.dueSoon.length > 0 ? (
                      <div className="space-y-2">
                        {quarterlyReviewSummary.dueSoon.slice(0, 3).map(review => (
                          <div key={review.ID} className="p-3 bg-yellow-50 rounded-lg text-sm border border-yellow-200">
                            <div className="font-medium text-gray-900">{review.Title}</div>
                            <div className="text-xs text-gray-600 mt-1">
                              Due: {review["Next Review Date"] ? format(new Date(review["Next Review Date"]), 'MMM d, yyyy') : 'N/A'}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 py-4">No reviews due soon</p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
