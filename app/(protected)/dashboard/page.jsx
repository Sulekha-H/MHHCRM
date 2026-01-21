"use client";

import { useUser } from "@clerk/nextjs";
import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
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

export default function Dashboard() {
  const { user } = useUser();
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
    total: 0
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
      try {
        console.log("Loading dashboard data...");
        
        // Load all data in parallel
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
          referralsResult,
          propertiesResult
        ] = await Promise.all([
          retryApiCall(() => supabase.from('residents').select('*').eq('"Deleted"', false).order('"Created Date"', { ascending: false })),
          retryApiCall(() => supabase.from('incidents').select('*').eq('"Deleted"', false).order('"Incident Date"', { ascending: false })),
          retryApiCall(() => supabase.from('office_logs').select('*').order('"Date/Time"', { ascending: false })),
          retryApiCall(() => supabase.from('tasks').select('*').eq('"Deleted"', false).order('"Due Date"', { ascending: false })),
          retryApiCall(() => supabase.from('compliance_logs').select('*').eq('"Deleted"', false)),
          retryApiCall(() => supabase.from('accommodations').select('*').eq('"Deleted"', false)),
          retryApiCall(() => supabase.from('quarterly_reviews').select('*').eq('"Deleted"', false)),
          retryApiCall(() => supabase.from('service_charges').select('*').eq('"Deleted"', false)),
          retryApiCall(() => supabase.from('repairs').select('*').order('"Reported Date"', { ascending: false })),
          retryApiCall(() => supabase.from('housing_benefit_logs').select('*').eq('"Deleted"', false).order('"Log Date"', { ascending: false })),
          retryApiCall(() => supabase.from('referrals').select('*').order('"Referral Date"', { ascending: false })),
          retryApiCall(() => supabase.from('properties').select('*').eq('"Deleted"', false))
        ]);

        console.log("✅ All data loaded");

        const residents = residentsResult.data || [];
        const allIncidents = incidentsResult.data || [];
        const officeLogs = officeLogsResult.data || [];
        const tasks = tasksResult.data || [];
        const complianceLogs = complianceLogsResult.data || [];
        const allAccommodations = accommodationsResult.data || [];
        const quarterlyReviewsData = quarterlyReviewsResult.data || [];
        const serviceCharges = serviceChargesResult.data || [];
        const repairs = repairsResult.data || [];
        const benefitLogs = benefitLogsResult.data || [];
        const allReferrals = referralsResult.data || [];
        const allProperties = propertiesResult.data || [];

        setProperties(allProperties);

        // Calculate stats
        const activeResidents = residents.filter(r => {
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
          const logDate = new Date(log["Date/Time"]);
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
          const logDate = new Date(log["Date/Time"]);
          return logDate >= weekStart && logDate <= weekEnd;
        });

        // Last 4 weeks incidents
        const fourWeeksAgo = new Date(currentDate);
        fourWeeksAgo.setDate(currentDate.getDate() - 28);
        fourWeeksAgo.setHours(0, 0, 0, 0);

        const recentIncidents = allIncidents.filter(incident => {
          const incidentDate = new Date(incident["Incident Date"]);
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
          return status !== 'completed' && new Date(t["Due Date"]) < now;
        });
        const dueSoonTasks = tasks.filter(t => {
          const status = (t.Status || '').toLowerCase().replace(/ /g, '_');
          const dueDate = new Date(t["Due Date"]);
          return status !== 'completed' && dueDate >= now && dueDate <= threeDaysFromNow;
        });

        // Find current user's name from Clerk
        const currentUserName = user?.fullName?.trim().toLowerCase();
        
        const myOverdueTasks = overdueTasks.filter(t => {
          const assignedTo = t["Assigned to (User ID)"]?.trim().toLowerCase();
          return assignedTo && currentUserName && assignedTo === currentUserName;
        });
        
        const myDueSoonTasks = dueSoonTasks.filter(t => {
          const assignedTo = t["Assigned to (User ID)"]?.trim().toLowerCase();
          return assignedTo && currentUserName && assignedTo === currentUserName;
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
        const overdueCompliance = complianceLogs.filter(c => new Date(c["Expiry Date"]) < now && !c.Actioned);
        const expiringSoonCompliance = complianceLogs.filter(c => 
          new Date(c["Expiry Date"]) >= now && 
          new Date(c["Expiry Date"]) <= thirtyDaysFromNow &&
          !c.Actioned
        );

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

        setHousingBenefitSummary({
          requestedSupportNotes,
          requestedDocuments,
          suspendedClaims,
          changeOfAddresses,
          roomTransfers,
          hbCalls,
          hbLeavers,
          total: recentHBLogs.length
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

        setLoadingReminders(false);
      } catch (error) {
        console.error("❌ Error loading dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadDashboardData();
    }
  }, [user, delay, retryApiCall]);

  if (loading) {
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
    <div className="min-h-screen bg-gray-50">
      {/* Welcome Section */}
      <div className="bg-white border-b px-8 py-8 mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          Welcome back{user?.firstName ? `, ${user.firstName}` : ''}
        </h1>
        <p className="text-gray-500 text-sm mt-1">Here's what's happening today</p>
      </div>

      <div className="px-8 pb-8 space-y-8">
        {/* Quick Action Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <a href={createPageUrl("residents")}>
            <Card className="bg-[#3b82f6] hover:bg-[#2563eb] cursor-pointer transition-colors duration-200 h-28 flex items-center justify-center border-0 shadow-sm rounded-xl">
              <CardContent className="p-4 text-center text-white">
                <Users className="w-7 h-7 mx-auto mb-2" />
                <p className="font-semibold text-sm">Add Resident</p>
              </CardContent>
            </Card>
          </a>

          <a href={createPageUrl("incidents")}>
            <Card className="bg-[#ef4444] hover:bg-[#dc2626] cursor-pointer transition-colors duration-200 h-28 flex items-center justify-center border-0 shadow-sm rounded-xl">
              <CardContent className="p-4 text-center text-white">
                <AlertTriangle className="w-7 h-7 mx-auto mb-2" />
                <p className="font-semibold text-sm">Report Incident</p>
              </CardContent>
            </Card>
          </a>

          <a href={createPageUrl("referrals")}>
            <Card className="bg-[#a855f7] hover:bg-[#9333ea] cursor-pointer transition-colors duration-200 h-28 flex items-center justify-center border-0 shadow-sm rounded-xl">
              <CardContent className="p-4 text-center text-white">
                <FileUp className="w-7 h-7 mx-auto mb-2" />
                <p className="font-semibold text-sm">Add Enquiry</p>
              </CardContent>
            </Card>
          </a>

          <a href={createPageUrl("documents")}>
            <Card className="bg-[#10b981] hover:bg-[#059669] cursor-pointer transition-colors duration-200 h-28 flex items-center justify-center border-0 shadow-sm rounded-xl">
              <CardContent className="p-4 text-center text-white">
                <Upload className="w-7 h-7 mx-auto mb-2" />
                <p className="font-semibold text-sm">Upload Document</p>
              </CardContent>
            </Card>
          </a>

          <a href={createPageUrl("tasks")}>
            <Card className="bg-[#06b6d4] hover:bg-[#0891b2] cursor-pointer transition-colors duration-200 h-28 flex items-center justify-center border-0 shadow-sm rounded-xl">
              <CardContent className="p-4 text-center text-white">
                <CheckSquare className="w-7 h-7 mx-auto mb-2" />
                <p className="font-semibold text-sm">Add Task</p>
              </CardContent>
            </Card>
          </a>

          <a href={createPageUrl("repairs")}>
            <Card className="bg-[#f97316] hover:bg-[#ea580c] cursor-pointer transition-colors duration-200 h-28 flex items-center justify-center border-0 shadow-sm rounded-xl">
              <CardContent className="p-4 text-center text-white">
                <Wrench className="w-7 h-7 mx-auto mb-2" />
                <p className="font-semibold text-sm">Add Repair</p>
              </CardContent>
            </Card>
          </a>
        </div>

        {/* Six Reminder Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Row 1 - Card 1: Voids / Available Rooms */}
          <Card className="bg-[#f0f9f9] border-[#ccfbf1] shadow-none rounded-xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold flex items-center gap-2 text-[#0d9488]">
                  <DoorOpen className="w-5 h-5" />
                  Voids / Available Rooms
                </CardTitle>
                <a href={createPageUrl("accommodations")}>
                  <ArrowRight className="w-5 h-5 text-[#0d9488]" />
                </a>
              </div>
            </CardHeader>
            <CardContent>
              {loadingReminders ? (
                <Skeleton className="h-24 w-full" />
              ) : (
                <>
                  <div className="text-center mb-6">
                    <div className="text-5xl font-bold text-[#0d9488]">{voidsSummary.count}</div>
                    <div className="text-sm font-medium text-[#0d9488] mt-1">rooms currently available</div>
                  </div>
                  {voidsSummary.recentVoids.length > 0 ? (
                    <div className="space-y-3 max-h-52 overflow-y-auto pr-1">
                      {voidsSummary.recentVoids.map(void_item => {
                        const property = properties.find(p => p.ID === void_item["Property ID"]);
                        return (
                          <div key={void_item.ID} className="flex items-center justify-between p-3 bg-white rounded-lg border border-[#e0f2f1]">
                            <div>
                              <div className="font-bold text-gray-800">R{void_item["Room Number"] || void_item.ID.slice(0,2)}</div>
                              {property && (
                                <div className="text-xs text-gray-500">{property.Name}</div>
                              )}
                              <div className="text-xs text-gray-500 capitalize">
                                {void_item["Accommodation Type"]?.replace(/_/g, ' ')}
                              </div>
                            </div>
                            <Badge className="bg-[#f0fdfa] text-[#0d9488] border-[#ccfbf1] hover:bg-[#ccfbf1]">
                              Available
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-[#0d9488] text-center py-4">No voids available</p>
                  )}
                  <a href={createPageUrl("accommodations")} className="block text-center mt-6">
                    <Button variant="link" className="text-[#0d9488] hover:text-[#0f766e] font-bold p-0">
                      View All Accommodations <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </a>
                </>
              )}
            </CardContent>
          </Card>

          {/* Row 1 - Card 2: Task Reminders */}
          <Card className="bg-[#fffcf0] border-[#fef3c7] shadow-none rounded-xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold flex items-center gap-2 text-[#b45309]">
                  <Bell className="w-5 h-5" />
                  Task Reminders
                </CardTitle>
                <a href={createPageUrl("tasks")}>
                  <ArrowRight className="w-5 h-5 text-[#b45309]" />
                </a>
              </div>
            </CardHeader>
            <CardContent>
              {loadingReminders ? (
                <Skeleton className="h-24 w-full" />
              ) : (
                <>
                  <div className="mb-6">
                    <h4 className="text-sm font-bold text-[#b45309] mb-3">My Tasks</h4>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="text-center p-4 bg-white rounded-lg border border-[#fef3c7]">
                        <div className="text-3xl font-bold text-[#d97706]">{taskSummary.myDueSoon}</div>
                        <div className="text-xs font-bold text-[#b45309]">Due soon</div>
                      </div>
                      <div className="text-center p-4 bg-white rounded-lg border border-[#fee2e2]">
                        <div className="text-3xl font-bold text-[#dc2626]">{taskSummary.myOverdue}</div>
                        <div className="text-xs font-bold text-[#991b1b]">Overdue</div>
                      </div>
                    </div>
                    {taskSummary.myRecentTasks.length === 0 && (
                      <p className="text-xs text-[#b45309] text-center py-2 italic">No tasks assigned to you</p>
                    )}
                  </div>

                  <div className="border-t border-[#fde68a] pt-4">
                    <h4 className="text-sm font-bold text-[#b45309] mb-3">All Tasks</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-white rounded-lg border border-[#fef3c7]">
                        <div className="text-3xl font-bold text-[#d97706]">{taskSummary.dueSoon}</div>
                        <div className="text-xs font-bold text-[#b45309]">Due soon</div>
                      </div>
                      <div className="text-center p-4 bg-white rounded-lg border border-[#fee2e2]">
                        <div className="text-3xl font-bold text-[#dc2626]">{taskSummary.overdueTasks}</div>
                        <div className="text-xs font-bold text-[#991b1b]">Overdue</div>
                      </div>
                    </div>
                  </div>

                  <a href={createPageUrl("tasks")} className="block text-center mt-6">
                    <Button variant="link" className="text-[#b45309] hover:text-[#92400e] font-bold p-0">
                      View All Tasks <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </a>
                </>
              )}
            </CardContent>
          </Card>

          {/* Row 1 - Card 3: Compliance Reminders */}
          <Card className="bg-[#fff5f5] border-[#fee2e2] shadow-none rounded-xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold flex items-center gap-2 text-[#b91c1c]">
                  <ShieldCheck className="w-5 h-5" />
                  Compliance Reminders
                </CardTitle>
                <a href={createPageUrl("compliance")}>
                  <ArrowRight className="w-5 h-5 text-[#b91c1c]" />
                </a>
              </div>
            </CardHeader>
            <CardContent>
              {loadingReminders ? (
                <Skeleton className="h-24 w-full" />
              ) : (
                <>
                  <div className="text-center mb-6">
                    <div className="text-6xl font-bold text-[#dc2626]">{complianceSummary.overdue}</div>
                    <div className="text-sm font-bold text-[#b91c1c] mt-2">Expired</div>
                  </div>
                  {complianceSummary.recentItems.length > 0 ? (
                    <div className="space-y-3 max-h-52 overflow-y-auto pr-1">
                      {complianceSummary.recentItems.slice(0, 3).map(item => {
                        const property = properties.find(p => p.ID === item["Property ID"]);
                        return (
                          <div key={item.ID} className="p-3 bg-white rounded-lg border border-[#fee2e2]">
                            <div className="font-bold text-gray-800">{item["Certificate Name"]}</div>
                            {property && (
                              <div className="text-xs text-gray-500 mt-1">{property.Name}</div>
                            )}
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs font-medium text-gray-500">
                                Expires: {format(new Date(item["Expiry Date"]), 'MMM d, yyyy')}
                              </span>
                              <Badge variant="destructive" className="text-[10px] h-5 px-1.5">
                                Expired
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-6 text-[#15803d]">
                      <p className="text-sm font-bold">All up to date</p>
                      <div className="mt-2 bg-green-100 p-1 rounded-full">
                        <Badge className="bg-[#15803d] hover:bg-[#166534] border-none">
                          <CheckSquare className="w-3 h-3" />
                        </Badge>
                      </div>
                    </div>
                  )}
                  <a href={createPageUrl("compliance")} className="block text-center mt-6">
                    <Button variant="link" className="text-[#b91c1c] hover:text-[#991b1b] font-bold p-0">
                      View All Compliance <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </a>
                </>
              )}
            </CardContent>
          </Card>

          {/* Row 2 - Card 4: Service Charge Reminders */}
          <Card className="bg-[#f0fdf4] border-[#dcfce7] shadow-none rounded-xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold flex items-center gap-2 text-[#15803d]">
                  <PoundSterling className="w-5 h-5" />
                  Service Charges
                </CardTitle>
                <a href={createPageUrl("servicecharges")}>
                  <ArrowRight className="w-5 h-5 text-[#15803d]" />
                </a>
              </div>
            </CardHeader>
            <CardContent>
              {loadingReminders ? (
                <Skeleton className="h-24 w-full" />
              ) : (
                <>
                  <div className="text-center mb-6">
                    <div className="text-5xl font-bold text-[#16a34a]">{serviceChargeSummary.overdue}</div>
                    <div className="text-sm font-bold text-[#15803d] mt-1">Overdue Payments</div>
                  </div>
                  {serviceChargeSummary.overdueItems.length > 0 ? (
                    <div className="space-y-3 max-h-52 overflow-y-auto pr-1">
                      {serviceChargeSummary.overdueItems.map(item => (
                        <div key={item.resident?.ID} className="p-3 bg-white rounded-lg border border-[#dcfce7]">
                          <div className="font-bold text-gray-800">
                            {item.resident?.["First Name"]} {item.resident?.["Last Name"]}
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs font-medium text-gray-500">
                              {item.count} overdue payment{item.count !== 1 ? 's' : ''}
                            </span>
                            <Badge className="bg-[#f0fdf4] text-[#15803d] border-[#dcfce7] hover:bg-[#dcfce7] text-[10px]">
                              Overdue
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-[#15803d] text-center py-4 font-bold">All up to date ✅</p>
                  )}
                  <a href={createPageUrl("servicecharges")} className="block text-center mt-6">
                    <Button variant="link" className="text-[#15803d] hover:text-[#166534] font-bold p-0">
                      View All Service Charges <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </a>
                </>
              )}
            </CardContent>
          </Card>

          {/* Row 2 - Card 5: Repairs Reminders */}
          <Card className="bg-[#fff7ed] border-[#ffedd5] shadow-none rounded-xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold flex items-center gap-2 text-gray-700">
                  <Wrench className="w-5 h-5" />
                  Repairs Reminders
                </CardTitle>
                <a href={createPageUrl("repairs")}>
                  <ArrowRight className="w-5 h-5 text-gray-700" />
                </a>
              </div>
            </CardHeader>
            <CardContent>
              {loadingReminders ? (
                <Skeleton className="h-24 w-full" />
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="text-center p-4 bg-white rounded-lg border border-[#ffedd5]">
                      <div className="text-4xl font-bold text-gray-800">{repairsSummary.reported}</div>
                      <div className="text-xs font-bold text-gray-600 mt-1">Reported</div>
                    </div>
                    <div className="text-center p-4 bg-white rounded-lg border border-[#ffedd5]">
                      <div className="text-4xl font-bold text-gray-800">{repairsSummary.scheduled}</div>
                      <div className="text-xs font-bold text-gray-600 mt-1">Scheduled</div>
                    </div>
                  </div>
                  {repairsSummary.recentRepairs.length > 0 ? (
                    <div className="space-y-3 max-h-40 overflow-y-auto pr-1">
                      {repairsSummary.recentRepairs.map(repair => (
                        <div key={repair.ID} className="p-3 bg-white rounded-lg border border-[#ffedd5]">
                          <div className="font-bold text-gray-800 text-sm truncate">{repair.Title || repair.Description?.slice(0, 50)}</div>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                              <span className={`px-1.5 py-0.5 rounded ${repair.Priority === 'Emergency' ? 'bg-red-100 text-red-600' : repair.Priority === 'Urgent' ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-600'}`}>{repair.Priority}</span>
                            </span>
                            <Badge className="bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100 text-[10px] capitalize">
                              {repair.Status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600 text-center py-4 italic">No urgent repairs</p>
                  )}
                  <a href={createPageUrl("repairs")} className="block text-center mt-6">
                    <Button variant="link" className="text-gray-700 hover:text-gray-900 font-bold p-0">
                      View All Repairs <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </a>
                </>
              )}
            </CardContent>
          </Card>

          {/* Row 2 - Card 6: Referrals Reminders */}
          <Card className="bg-[#f5f3ff] border-[#ede9fe] shadow-none rounded-xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold flex items-center gap-2 text-[#6d28d9]">
                  <ArrowRightLeft className="w-5 h-5" />
                  Referrals
                </CardTitle>
                <a href={createPageUrl("referrals")}>
                  <ArrowRight className="w-5 h-5 text-[#6d28d9]" />
                </a>
              </div>
            </CardHeader>
            <CardContent>
              {loadingReminders ? (
                <Skeleton className="h-24 w-full" />
              ) : (
                <>
                  <div className="text-center mb-6">
                    <div className="text-5xl font-bold text-[#7c3aed]">{referralsSummary.underAssessment}</div>
                    <div className="text-sm font-bold text-[#6d28d9] mt-1">Under Assessment</div>
                  </div>
                  {referralsSummary.recentReferrals.length > 0 ? (
                    <div className="space-y-3 max-h-52 overflow-y-auto pr-1">
                      {referralsSummary.recentReferrals.map(referral => (
                        <div key={referral.ID} className="p-3 bg-white rounded-lg border border-[#ede9fe]">
                          <div className="font-bold text-gray-800">{referral["Applicant Name"]}</div>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs font-medium text-gray-500">
                              {format(new Date(referral["Referral Date"]), 'MMM d, yyyy')}
                            </span>
                            <Badge className="bg-[#f5f3ff] text-[#6d28d9] border-[#ede9fe] hover:bg-[#ede9fe] text-[10px]">
                              Assessment
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-[#6d28d9] text-center py-4 italic">No referrals under assessment</p>
                  )}
                  <a href={createPageUrl("referrals")} className="block text-center mt-6">
                    <Button variant="link" className="text-[#6d28d9] hover:text-[#5b21b6] font-bold p-0">
                      View All Referrals <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </a>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Housing Benefit Alerts - Full Width */}
        <Card className="bg-[#fdfaff] border-[#f3e8ff] shadow-sm rounded-xl overflow-hidden">
          <CardHeader className="bg-white border-b border-[#f3e8ff] pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold flex items-center gap-2 text-[#7e22ce]">
                  <HandCoins className="w-6 h-6" />
                  Housing Benefits
                </CardTitle>
                <p className="text-sm text-purple-500 mt-1">Last 4 weeks summary</p>
              </div>
              <a href={createPageUrl("benefits")}>
                <Button variant="outline" size="sm" className="text-[#7e22ce] border-[#e9d5ff] hover:bg-[#f3e8ff] font-bold rounded-lg px-4">
                  Full Reports <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </a>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {loadingReminders ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                {[1, 2, 3, 4, 5, 6, 7].map(i => <Skeleton key={i} className="h-24 w-full" />)}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
                  <div className="text-center p-4 bg-white rounded-xl border border-[#f3e8ff] shadow-sm">
                    <div className={`text-3xl font-bold mb-1 ${housingBenefitSummary.requestedSupportNotes > 0 ? 'text-[#9333ea]' : 'text-gray-300'}`}>
                      {housingBenefitSummary.requestedSupportNotes}
                    </div>
                    <div className="text-[10px] text-gray-600 font-bold uppercase tracking-tight">Support Notes</div>
                  </div>

                  <div className="text-center p-4 bg-white rounded-xl border border-[#f3e8ff] shadow-sm">
                    <div className={`text-3xl font-bold mb-1 ${housingBenefitSummary.requestedDocuments > 0 ? 'text-[#9333ea]' : 'text-gray-300'}`}>
                      {housingBenefitSummary.requestedDocuments}
                    </div>
                    <div className="text-[10px] text-gray-600 font-bold uppercase tracking-tight">Documents</div>
                  </div>

                  <div className="text-center p-4 bg-white rounded-xl border border-[#fee2e2] shadow-sm">
                    <div className={`text-3xl font-bold mb-1 ${housingBenefitSummary.suspendedClaims > 0 ? 'text-[#dc2626]' : 'text-gray-300'}`}>
                      {housingBenefitSummary.suspendedClaims}
                    </div>
                    <div className="text-[10px] text-red-600 font-bold uppercase tracking-tight">Suspensions</div>
                  </div>

                  <div className="text-center p-4 bg-white rounded-xl border border-[#f3e8ff] shadow-sm">
                    <div className={`text-3xl font-bold mb-1 ${housingBenefitSummary.changeOfAddresses > 0 ? 'text-[#9333ea]' : 'text-gray-300'}`}>
                      {housingBenefitSummary.changeOfAddresses}
                    </div>
                    <div className="text-[10px] text-gray-600 font-bold uppercase tracking-tight">Addresses</div>
                  </div>

                  <div className="text-center p-4 bg-white rounded-xl border border-[#f3e8ff] shadow-sm">
                    <div className={`text-3xl font-bold mb-1 ${housingBenefitSummary.roomTransfers > 0 ? 'text-[#9333ea]' : 'text-gray-300'}`}>
                      {housingBenefitSummary.roomTransfers}
                    </div>
                    <div className="text-[10px] text-gray-600 font-bold uppercase tracking-tight">Transfers</div>
                  </div>

                  <div className="text-center p-4 bg-white rounded-xl border border-[#f3e8ff] shadow-sm">
                    <div className={`text-3xl font-bold mb-1 ${housingBenefitSummary.hbCalls > 0 ? 'text-[#9333ea]' : 'text-gray-300'}`}>
                      {housingBenefitSummary.hbCalls}
                    </div>
                    <div className="text-[10px] text-gray-600 font-bold uppercase tracking-tight">HB Calls</div>
                  </div>

                  <div className="text-center p-4 bg-white rounded-xl border border-[#f3e8ff] shadow-sm">
                    <div className={`text-3xl font-bold mb-1 ${housingBenefitSummary.hbLeavers > 0 ? 'text-[#9333ea]' : 'text-gray-300'}`}>
                      {housingBenefitSummary.hbLeavers}
                    </div>
                    <div className="text-[10px] text-gray-600 font-bold uppercase tracking-tight">HB Leavers</div>
                  </div>
                </div>

                <div className="flex items-center justify-center pt-2">
                  <Badge className="bg-[#7e22ce] hover:bg-[#6b21a8] text-sm px-6 py-1.5 rounded-full border-none">
                    Total Logs: {housingBenefitSummary.total}
                  </Badge>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Summary Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <a href={createPageUrl("residents")}>
            <Card className="bg-white border-blue-100 hover:shadow-md transition-shadow duration-200 cursor-pointer rounded-xl overflow-hidden">
              <div className="h-2 bg-blue-500 w-full" />
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold flex items-center gap-2 text-blue-700">
                  <UserCheck className="w-5 h-5" />
                  Active Residents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-2">
                  <div className="text-5xl font-extrabold text-blue-600 mb-2">{stats.residents}</div>
                  <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">Active Residents</div>
                </div>
                <Button variant="link" className="w-full mt-4 text-blue-600 font-bold">
                  Manage Directory <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </CardContent>
            </Card>
          </a>

          <a href={createPageUrl("incidents")}>
            <Card className="bg-white border-red-100 hover:shadow-md transition-shadow duration-200 cursor-pointer rounded-xl overflow-hidden">
              <div className="h-2 bg-red-500 w-full" />
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold flex items-center gap-2 text-red-700">
                  <AlertTriangle className="w-5 h-5" />
                  Open Incidents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-2">
                  <div className="text-5xl font-extrabold text-red-600 mb-2">{stats.activeIncidents}</div>
                  <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">Unresolved Issues</div>
                </div>
                <Button variant="link" className="w-full mt-4 text-red-600 font-bold">
                  View Incident Log <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </CardContent>
            </Card>
          </a>

          <a href={createPageUrl("officelogs")}>
            <Card className="bg-white border-cyan-100 hover:shadow-md transition-shadow duration-200 cursor-pointer rounded-xl overflow-hidden">
              <div className="h-2 bg-cyan-500 w-full" />
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold flex items-center gap-2 text-cyan-700">
                  <FileText className="w-5 h-5" />
                  Today's Logs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-2">
                  <div className="text-5xl font-extrabold text-cyan-600 mb-2">{stats.todayLogs}</div>
                  <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">New Entries Today</div>
                </div>
                <Button variant="link" className="w-full mt-4 text-cyan-600 font-bold">
                  Daily Summary <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </CardContent>
            </Card>
          </a>
        </div>

        {/* Restore missing sections: Recent Activity and Quarterly Reviews */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="rounded-xl shadow-sm border-gray-100">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-gray-700">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  Recent Incidents (Last 4 Weeks)
                </CardTitle>
                <a href={createPageUrl("incidents")}>
                  <Button variant="link" className="text-blue-600 hover:text-blue-700 text-sm font-bold">
                    View All <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </a>
              </div>
            </CardHeader>
            <CardContent>
              {recentActivity.incidents.length > 0 ? (
                <div className="space-y-3">
                  {recentActivity.incidents.map((incident) => (
                    <div key={incident.ID} className="border-l-4 border-red-400 pl-3 py-2 bg-gray-50 rounded-r-lg">
                      <div className="flex items-center justify-between mb-1">
                        <Badge className="bg-red-100 text-red-800 text-[10px] uppercase font-bold">
                          {incident["Incident Type"]?.replace(/_/g, ' ')}
                        </Badge>
                        <span className="text-[10px] font-bold text-gray-400">
                          {format(new Date(incident["Incident Date"]), 'MMM d')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 font-medium line-clamp-2">{incident.Description}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-8 italic">No incidents in the last 4 weeks</p>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-xl shadow-sm border-gray-100">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-gray-700">
                  <FileText className="w-5 h-5 text-blue-500" />
                  This Week's Office Logs
                </CardTitle>
                <a href={createPageUrl("officelogs")}>
                  <Button variant="link" className="text-blue-600 hover:text-blue-700 text-sm font-bold">
                    View All <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </a>
              </div>
            </CardHeader>
            <CardContent>
              {recentActivity.logs.length > 0 ? (
                <div className="space-y-3">
                  {recentActivity.logs.map((log) => (
                    <div key={log.ID} className="border-l-4 border-blue-400 pl-3 py-2 bg-gray-50 rounded-r-lg">
                      <div className="flex items-center justify-between mb-1">
                        <Badge className="bg-blue-100 text-blue-800 text-[10px] uppercase font-bold">
                          {log["Log Type"]?.replace(/_/g, ' ')}
                        </Badge>
                        <span className="text-[10px] font-bold text-gray-400">
                          {format(new Date(log["Date/Time"]), 'MMM d')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 font-medium line-clamp-1">
                        {log.Title || log.Description || 'Office log entry'}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-8 italic">No office logs this week</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quarterly Review Reminders */}
        <Card className="rounded-xl shadow-sm border-gray-100">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-gray-700">
                <Heart className="w-5 h-5 text-pink-500" />
                Quarterly Review Reminders
              </CardTitle>
              <a href={createPageUrl("supportplans")}>
                <Button variant="link" className="text-blue-600 hover:text-blue-700 text-sm font-bold">
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
                  <h3 className="text-sm font-bold text-red-700 mb-3 flex items-center gap-2">
                    <Bell className="w-4 h-4" />
                    Overdue ({quarterlyReviewSummary.overdue.length})
                  </h3>
                  {quarterlyReviewSummary.overdue.length > 0 ? (
                    <div className="space-y-2">
                      {quarterlyReviewSummary.overdue.slice(0, 3).map(review => (
                        <div key={review.ID} className="p-3 bg-red-50 rounded-lg text-sm border border-red-100">
                          <div className="font-bold text-gray-800">{review.Title}</div>
                          <div className="text-[10px] font-bold text-red-600 mt-1 uppercase">
                            Overdue: {review["Next Review Date"] ? format(new Date(review["Next Review Date"]), 'MMM d, yyyy') : 'N/A'}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 py-2 italic">No overdue reviews</p>
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-amber-700 mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Due Soon ({quarterlyReviewSummary.dueSoon.length})
                  </h3>
                  {quarterlyReviewSummary.dueSoon.length > 0 ? (
                    <div className="space-y-2">
                      {quarterlyReviewSummary.dueSoon.slice(0, 3).map(review => (
                        <div key={review.ID} className="p-3 bg-amber-50 rounded-lg text-sm border border-amber-100">
                          <div className="font-bold text-gray-800">{review.Title}</div>
                          <div className="text-[10px] font-bold text-amber-600 mt-1 uppercase">
                            Due: {review["Next Review Date"] ? format(new Date(review["Next Review Date"]), 'MMM d, yyyy') : 'N/A'}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 py-2 italic">No reviews due soon</p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
