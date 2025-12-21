"use client";

import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import ProtectedPage from "../pages/ProtectedPage";
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

export default function DashboardPage() {
  return (
    <ProtectedPage>
      <Dashboard/>
    </ProtectedPage>
  );
}   

function Dashboard() {
  const [user, setUser] = useState(null);
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
        
        // Get current user
        let userData = null;
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        
        if (currentUser) {
          const { data } = await supabase
            .from('users')
            .select('*')
            .eq('ID', currentUser.id)
            .single();
          
          userData = data;
          setUser(userData);
          console.log("✅ User loaded");
        }

        await delay(500);

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

        const currentUserName = userData?.["Full Name"]?.trim().toLowerCase();
        
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

        console.log('📊 Total benefit logs:', benefitLogs.length);
        console.log('📊 Sample benefit log:', benefitLogs[0]);

        const recentHBLogs = benefitLogs.filter(log => {
          const deleted = log.Deleted || log.deleted || false;
          if (deleted) return false;
          const benefitType = (log["Benefit Type"] || '').toLowerCase().replace(/ /g, '_');
          if (benefitType !== 'housing_benefit') return false; 
          const logDate = new Date(log["Log Date"]);
          return logDate >= fourWeeksAgoHB;
        });

        console.log('📊 Recent HB logs:', recentHBLogs.length);
        console.log('📊 Sample HB log:', recentHBLogs[0]);

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

    loadDashboardData();
  }, [delay, retryApiCall]);

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
      <div className="bg-white border-b px-6 py-6">
        <h1 className="text-2xl font-semibold text-gray-700">
          Welcome back{user?.["Full Name"] ? `, ${user["Full Name"].split(' ')[0]}` : ''}
        </h1>
        <p className="text-gray-500 text-sm mt-1">Here's what's happening today</p>
      </div>

      <div className="p-6 space-y-6">
        {/* Quick Action Buttons */}
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

          <a href={createPageUrl("Tasks")}>
            <Card className="bg-gradient-to-br from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 cursor-pointer transition-all duration-200 h-24 flex items-center justify-center border-0 shadow-md">
              <CardContent className="p-4 text-center text-white">
                <CheckSquare className="w-6 h-6 mx-auto mb-2" />
                <p className="font-medium text-sm">Add Task</p>
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

        {/* Six Reminder Cards - 2 Rows of 3 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Row 1 - Card 1: Voids / Available Rooms */}
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

          {/* Row 1 - Card 2: Task Reminders */}
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

          {/* Row 1 - Card 3: Compliance Reminders */}
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

          {/* Row 2 - Card 6: Referrals Reminders */}
          <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2 text-indigo-700">
                  <ArrowRightLeft className="w-5 h-5" />
                  Referrals
                </CardTitle>
                <a href={createPageUrl("Referral")}>
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
                  <a href={createPageUrl("Referral")}>
                    <Button variant="link" className="w-full mt-3 text-indigo-700 hover:text-indigo-800">
                      View All Referrals <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </a>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Housing Benefit Alerts - Full Width */}
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

                <div className="text-center pt-3 border-t border-purple-200">
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

        {/* Summary Stats Row */}
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

        {/* Recent Activity Row */}
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
                          {incident["Incident Type"]?.replace(/_/g, ' ')}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {format(new Date(incident["Incident Date"]), 'MMM d')}
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
                          {log["Log Type"]?.replace(/_/g, ' ')}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {format(new Date(log["Date/Time"]), 'MMM d')}
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

        {/* Quarterly Review Reminders */}
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
      </div>
    </div>
  );
}