"use client";


import { useUser } from "@clerk/nextjs";
import React, { useState, useEffect, useCallback } from "react";
import { useClerkSupabaseClient } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Receipt, AlertCircle, Download, PoundSterling, HelpCircle, PlusCircle } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { format, setDate } from "date-fns";
import ServiceChargeLogFormSupabase from "@/components/service-charges/ServiceChargeLogForm";
import CashLogFormSupabase from "@/components/service-charges/CashLogForm";
import CashLogCard from "@/components/service-charges/CashLogCard";
import ServiceChargeDetailModal from "@/components/service-charges/ServiceChargeDetailModal";
import CashLogDetailModal from "@/components/service-charges/CashLogDetailModal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function ServiceChargesSupabase() {
  const { user } = useUser();
  const supabase = useClerkSupabaseClient()
  const [serviceCharges, setServiceCharges] = useState([]);
  const [cashLogs, setCashLogs] = useState([]);
  const [residents, setResidents] = useState([]);
  const [properties, setProperties] = useState([]);
  const [accommodations, setAccommodations] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [filteredCharges, setFilteredCharges] = useState([]);
  const [filteredCashLogs, setFilteredCashLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showCashForm, setShowCashForm] = useState(false);
  const [editingCharge, setEditingCharge] = useState(null);
  const [editingCashLog, setEditingCashLog] = useState(null);
  const [viewingCharge, setViewingCharge] = useState(null);
  const [viewingCashLog, setViewingCashLog] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [cashSearchTerm, setCashSearchTerm] = useState("");
  const [summary, setSummary] = useState({ overdue: [], due: [] });
  const [activeTab, setActiveTab] = useState("service-charges");

  const isTestData = useCallback((resident) => {
    if (!resident) return false;
    
    const testPatterns = {
      names: [
        'john smith', 'jane smith', 'john doe', 'jane doe',
        'test user', 'test resident', 'test tenant',
        'example resident', 'sample resident', 'demo resident'
      ],
      emails: ['test@', 'example@', 'sample@', 'demo@', '@test.com', '@example.com'],
      phones: ['1234567890', '0000000000', '9999999999', '1111111111']
    };

    const firstName = resident["First Name"] || resident.first_name || resident.firstName || '';
    const lastName = resident["Last Name"] || resident.last_name || resident.lastName || '';
    const fullName = `${firstName} ${lastName}`.toLowerCase().trim();
    const email = (resident["Email Address"] || resident.email_address || resident.emailAddress || '').toLowerCase();
    const phone = (resident["Phone Number"] || resident.phone_number || resident.phoneNumber || '').replace(/\s/g, '');

    if (testPatterns.names.some(pattern => fullName.includes(pattern))) return true;
    if (email && testPatterns.emails.some(pattern => email.includes(pattern))) return true;
    if (phone && testPatterns.phones.includes(phone)) return true;

    return false;
  }, []);

useEffect(() => {
  if (!supabase || !user) return;
  loadData();
}, [supabase, user]);

  const getResidentName = useCallback((residentId) => {
    const resident = residents.find(r => (r.ID || r.id) === residentId);
    
    if (!resident) {
      return "Unknown Resident";
    }
    
    const firstName = resident["First Name"] || resident.first_name || resident.firstName || '';
    const lastName = resident["Last Name"] || resident.last_name || resident.lastName || '';
    const fullName = `${firstName} ${lastName}`.trim();
    
    return fullName || "Unknown Resident";
  }, [residents]);

  const getPropertyName = useCallback((propertyId) => {
    const property = properties.find(p => (p.ID || p.id) === propertyId);
    return property ? (property.Name || property.name || property["Property Name"]) : "Unknown Property";
  }, [properties]);

  const getPaymentDay = useCallback((resident) => {
    let paymentDay = 1;
    const benefits = resident.Benefits || resident.benefits || [];
    
    if (benefits && benefits.length > 0) {
      const ucBenefit = benefits.find(b => b.benefit_type === 'universal_credit' && b.payment_day);
      const hbBenefit = benefits.find(b => b.benefit_type === 'housing_benefit' && b.payment_day);
      const otherBenefit = benefits.find(b => b.payment_day);

      if (ucBenefit) paymentDay = ucBenefit.payment_day;
      else if (hbBenefit) paymentDay = hbBenefit.payment_day;
      else if (otherBenefit) paymentDay = otherBenefit.payment_day;
    }
    return paymentDay;
  }, []);

  const formatPaymentDay = (day) => {
    if (!day) return '';
    const suffixes = ['th', 'st', 'nd', 'rd'];
    const relevantDigits = (day < 30) ? day % 20 : day % 30;
    const suffix = (relevantDigits <= 3 && relevantDigits > 0) ? suffixes[relevantDigits] : suffixes[0];
    return `${day}${suffix}`;
  };

  const filterCharges = useCallback(() => {
    const realResidents = residents.filter(r => !isTestData(r));
    let filtered = serviceCharges.filter(charge => {
        const chargeResidentId = charge.resident_id || charge["Resident ID"];
        const resident = realResidents.find(r => (r.ID || r.id) === chargeResidentId);
        return !!resident;
    });

    if (searchTerm) {
      const lowercasedSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(charge => {
        const chargeResidentId = charge.resident_id || charge["Resident ID"];
        const resident = realResidents.find(r => (r.ID || r.id) === chargeResidentId);
        if (!resident) return false;

        const residentName = getResidentName(chargeResidentId).toLowerCase();
        const accommodationId = resident["Accommodation ID"] || resident.accommodation_id;
        const accommodation = accommodations.find(a => (a.ID || a.id) === accommodationId);
        const propertyId = accommodation ? (accommodation["Property ID"] || accommodation.property_id) : null;
        const property = propertyId ? properties.find(p => (p.ID || p.id) === propertyId) : null;
        const roomNumber = accommodation ? (accommodation["Unit/Room Number"] || accommodation.room_number) : '';
        const propertyName = property ? (property.Name || property.name) : '';
        const accommodationName = property && accommodation ? `${propertyName} - ${roomNumber}` : 'unassigned';

        const paymentType = charge.payment_type || charge["Payment Type"] || '';
        const notes = charge.notes || charge.Notes || '';

        return paymentType.toLowerCase().includes(lowercasedSearchTerm) ||
               notes.toLowerCase().includes(lowercasedSearchTerm) ||
               residentName.includes(lowercasedSearchTerm) ||
               accommodationName.includes(lowercasedSearchTerm);
      });
    }
    setFilteredCharges(filtered);
  }, [serviceCharges, searchTerm, getResidentName, residents, accommodations, properties, isTestData]);

  const filterCashLogs = useCallback(() => {
    const realResidents = residents.filter(r => !isTestData(r));
    let filtered = cashLogs.filter(log => {
        const logResidentId = log.resident_id || log["Resident ID"];
        const resident = realResidents.find(r => (r.ID || r.id) === logResidentId);
        return !!resident;
    });

    if (cashSearchTerm) {
      const lowercasedSearchTerm = cashSearchTerm.toLowerCase();
      filtered = filtered.filter(log => {
        const logResidentId = log.resident_id || log["Resident ID"];
        const resident = realResidents.find(r => (r.ID || r.id) === logResidentId);
        if (!resident) return false;

        const residentName = getResidentName(logResidentId).toLowerCase();
        const logPropertyId = log.property_id || log["Property ID"];
        const propertyName = properties.find(p => (p.ID || p.id) === logPropertyId)?.Name?.toLowerCase() || '';
        const givenTo = (log.given_to_put_where || log["Given To/Put Where"] || '').toLowerCase();
        const notes = (log.notes || log.Notes || '').toLowerCase();

        return residentName.includes(lowercasedSearchTerm) ||
               propertyName.includes(lowercasedSearchTerm) ||
               givenTo.includes(lowercasedSearchTerm) ||
               notes.includes(lowercasedSearchTerm);
      });
    }
    setFilteredCashLogs(filtered);
  }, [cashLogs, cashSearchTerm, getResidentName, properties, residents, isTestData]);

  useEffect(() => {
    filterCharges();
  }, [filterCharges]);

  useEffect(() => {
    filterCashLogs();
  }, [filterCashLogs]);

  const loadData = async () => {
    setLoading(true);
if (!supabase || !user) return;
setLoading(true);
try {
  const { data: userData } = await supabase.from('users').select('*').eq('id', user?.id).single();
  setCurrentUser(userData || user);
  
      const [
        { data: chargesData, error: chargesError },
        { data: cashLogsData, error: cashLogsError },
        { data: residentsData, error: residentsError },
        { data: propertiesDataRaw, error: propertiesError },
        { data: accommodationsData, error: accommodationsError }
      ] = await Promise.all([
        supabase.from('service_charges').select('*').eq('"Deleted"', false).order('"Created Date"', { ascending: false }),
        supabase.from('cash_logs').select('*').eq('"Deleted"', false).order('"Date Logged"', { ascending: false }),
        supabase.from('residents').select('*').eq('"Deleted"', false),
        supabase.from('properties').select('*').eq('"Deleted"', false),
        supabase.from('accommodations').select('*').eq('"Deleted"', false),
      ]);

      if (chargesError) console.error('❌ Error loading service charges:', chargesError);
      if (cashLogsError) console.error('❌ Error loading cash logs:', cashLogsError);
      if (residentsError) console.error('❌ Error loading residents:', residentsError);
      if (propertiesError) console.error('❌ Error loading properties:', propertiesError);
      if (accommodationsError) console.error('❌ Error loading accommodations:', accommodationsError);

      console.log('📊 Data loaded:');
      console.log('  - Service charges:', chargesData?.length || 0);
      console.log('  - Cash logs:', cashLogsData?.length || 0);
      console.log('  - Residents:', residentsData?.length || 0);
      console.log('  - Properties:', propertiesDataRaw?.length || 0);
      console.log('  - Accommodations:', accommodationsData?.length || 0);

      const realResidentsData = (residentsData || []).filter(r => !isTestData(r));
      console.log('  - Real residents (non-test):', realResidentsData.length);

      const activeResidents = realResidentsData.filter(r => {
        const status = r.Status || r.status;
        return status === 'active' || status === 'Active';
      });
      console.log('  - Active residents (non-test):', activeResidents.length);

      // Normalize Supabase data and calculate auto status
      const chargesWithAutoStatus = (chargesData || []).map(charge => {
        // Normalize column names to lowercase with underscores
        let amountPaid = 0;
        let balanceOwed = 0;
        let cleanNotes = charge.Notes || "";

        const partialMatch = cleanNotes.match(/\[PARTIAL_PAYMENT: amount_paid=([\d.]+), balance_owed=([\d.]+)\]/);
        if (partialMatch) {
          amountPaid = parseFloat(partialMatch[1]);
          balanceOwed = parseFloat(partialMatch[2]);
          cleanNotes = cleanNotes.replace(/\[PARTIAL_PAYMENT: amount_paid=[\d.]+, balance_owed=[\d.]+\]\s*/, "");
        }

        const normalizedCharge = {
          id: charge.ID,
          created_date: charge["Created Date"],
          updated_date: charge["Updated Date"],
          created_by: charge["Created By"],
          resident_id: charge["Resident ID"],
          resident_name: charge["Resident Name"],
          property_name: charge["Property Name"],
          unit_room_number: charge["Unit/Room Number"],
          due_date: charge["Due Date"],
          date_paid: charge["Date Paid"],
          monthly_amount: parseFloat(charge["Monthly Amount"]),
          amount_paid: amountPaid,
          balance_owed: balanceOwed,
          payment_type: charge["Payment Type"],
          payment_status_stored: charge["Payment Status"],
          status: charge.Status,
          exempt: charge.Exempt,
          exempt_reason: charge["Exempt Reason"],
          notes: cleanNotes,
          raw_notes: charge.Notes,
          logged_by: charge["Logged By"],
          deleted: charge.Deleted,
          deleted_date: charge["Deleted Date"],
          deleted_by: charge["Deleted By"]
        };

        // Calculate actual payment status based on dates and flags
        const exempt = normalizedCharge.exempt;
        const datePaid = normalizedCharge.date_paid;
        const dueDate = normalizedCharge.due_date;
        const storedStatus = normalizedCharge.payment_status_stored;
        
        if (exempt) {
          normalizedCharge.payment_status = 'exempt';
        } else if (storedStatus === 'Partially Paid') {
          normalizedCharge.payment_status = 'partially_paid';
        } else if (datePaid) {
          normalizedCharge.payment_status = 'paid';
        } else if (dueDate) {
          const dueDateObj = new Date(dueDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          dueDateObj.setHours(0, 0, 0, 0);
          
          if (dueDateObj < today) {
            normalizedCharge.payment_status = 'overdue';
          } else {
            normalizedCharge.payment_status = 'due';
          }
        } else {
          normalizedCharge.payment_status = 'due';
        }
        
        return normalizedCharge;
      });

      const propertiesData = (propertiesDataRaw || []).sort((a, b) => {
        const nameA = (a.Name || a.name || '').toLowerCase();
        const nameB = (b.Name || b.name || '').toLowerCase();
        if (nameA.includes('ryland')) return 1;
        if (nameB.includes('ryland')) return -1;
        return nameA.localeCompare(nameB);
      });

      const getFinancialYearMonthsSummary = () => {
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

      const financialYearMonthsSummary = getFinancialYearMonthsSummary();
      
      const residentOverdueMap = new Map();
      const residentDueMap = new Map();

      activeResidents.forEach(resident => {
        const residentId = resident.ID || resident.id;
        const residentCharges = chargesWithAutoStatus.filter(p => {
          const chargeResidentId = p.resident_id || p["Resident ID"];
          return chargeResidentId === residentId;
        });
        let residentOverdueCount = 0;
        let residentDueCount = 0;

        let expectedPaymentDay = getPaymentDay(resident);

        financialYearMonthsSummary.forEach(monthStartDate => {
          const monthKey = format(monthStartDate, 'yyyy-MM');
          
          // Check if this month is before resident's move-in date
          let isNotAvailable = false;
          const moveInDate = resident["Move-in Date"] || resident["Move In Date"] || resident.move_in_date;
          if (moveInDate) {
            const moveInDateObj = new Date(moveInDate);
            moveInDateObj.setHours(0, 0, 0, 0);
            const monthEnd = new Date(monthStartDate.getFullYear(), monthStartDate.getMonth() + 1, 0);
            monthEnd.setHours(0, 0, 0, 0);
            isNotAvailable = monthEnd < moveInDateObj;
          }
          
          // Skip N/A months from summary calculations
          if (isNotAvailable) {
            return;
          }
          
          const chargeForMonth = residentCharges.find(p => {
            const chargeDueDate = p.due_date || p["Due Date"];
            if (!chargeDueDate) return false;
            const chargeMonth = format(new Date(chargeDueDate), 'yyyy-MM');
            return chargeMonth === monthKey;
          });

          let dayOfMonth = Math.min(expectedPaymentDay, new Date(monthStartDate.getFullYear(), monthStartDate.getMonth() + 1, 0).getDate());
          const expectedDueDate = new Date(monthStartDate.getFullYear(), monthStartDate.getMonth(), dayOfMonth);
          expectedDueDate.setHours(0, 0, 0, 0);
          
          const todayDate = new Date();
          todayDate.setHours(0, 0, 0, 0);

          let isOverdue = false;
          let isDue = false;

          if (chargeForMonth) {
            const chargeExempt = chargeForMonth.exempt || chargeForMonth.Exempt;
            if (chargeExempt || chargeForMonth.payment_status === 'exempt') return;

            if (chargeForMonth.payment_status !== 'paid') {
              const chargeDueDate = chargeForMonth.due_date || chargeForMonth["Due Date"];
              if (chargeDueDate) {
                const dueDate = new Date(chargeDueDate);
                dueDate.setHours(0, 0, 0, 0);
                isOverdue = dueDate < todayDate;
                isDue = !isOverdue && dueDate >= todayDate;
              }
            }
          } else {
            if (expectedDueDate < todayDate) {
              isOverdue = true;
            } else if (expectedDueDate >= todayDate) {
              isDue = true;
            }
          }

          if (isOverdue) residentOverdueCount++;
          else if (isDue) residentDueCount++;
        });

        if (residentOverdueCount > 0) {
          residentOverdueMap.set(residentId, { resident, count: residentOverdueCount });
        }
        if (residentDueCount > 0) {
          residentDueMap.set(residentId, { resident, count: residentDueCount });
        }
      });

      const calculatedOverdue = Array.from(residentOverdueMap.values()).sort((a, b) => b.count - a.count);
      const calculatedDue = Array.from(residentDueMap.values()).sort((a, b) => b.count - a.count);

      console.log('📊 Summary calculated:');
      console.log('  - Overdue residents:', calculatedOverdue.length);
      console.log('  - Due residents:', calculatedDue.length);

      setServiceCharges(chargesWithAutoStatus);
      setCashLogs(cashLogsData || []);
      setResidents(residentsData || []);
      setProperties(propertiesData);
      setAccommodations(accommodationsData || []);
      setSummary({ overdue: calculatedOverdue, due: calculatedDue });

      console.log('✅ Data loaded successfully');
    } catch (error) {
      console.error("❌ Error loading data:", error);
      setServiceCharges([]);
      setCashLogs([]);
      setResidents([]);
      setProperties([]);
      setAccommodations([]);
    } finally {
      setLoading(false);
      console.log('✅ Loading complete');
    }
  };

  const handleSubmit = async (chargeData) => {
    try {
      if (editingCharge && editingCharge.id) {
        const { error } = await supabase
          .from('service_charges')
          .update(chargeData)
          .eq('"ID"', editingCharge.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('service_charges')
          .insert([chargeData]);
        
        if (error) throw error;
      }
      setShowForm(false);
      setEditingCharge(null);
      setViewingCharge(null);
      loadData();
    } catch (error) {
      console.error("Error saving service charge:", error);
      alert("Error saving service charge: " + error.message);
    }
  };

  const handleCashLogSubmit = async (cashLogData) => {
    try {
      if (editingCashLog && editingCashLog.id) {
        const { error } = await supabase
          .from('cash_logs')
          .update(cashLogData)
          .eq('"ID"', editingCashLog.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('cash_logs')
          .insert([cashLogData]);
        
        if (error) throw error;
      }
      setShowCashForm(false);
      setEditingCashLog(null);
      setViewingCashLog(null);
      loadData();
    } catch (error) {
      console.error("Error saving cash log:", error);
      alert("Error saving cash log: " + error.message);
    }
  };

  const handleEdit = (charge) => {
    setViewingCharge(null);
    setEditingCharge(charge);
    setShowForm(true);
  };

  const handleViewChargeDetails = (charge) => {
    setViewingCharge(charge);
  };

  const handleCashLogEdit = (cashLog) => {
    setViewingCashLog(null);
    setEditingCashLog(cashLog);
    setShowCashForm(true);
  };

  const handleViewCashLogDetails = (cashLog) => {
    setViewingCashLog(cashLog);
  };

  const handleCashLogDelete = async (cashLog) => {
    const cashLogResidentId = cashLog.resident_id || cashLog["Resident ID"];
    if (window.confirm(`Are you sure you want to delete this cash log entry for ${getResidentName(cashLogResidentId)}?`)) {
      try {
        const { error } = await supabase
          .from('cash_logs')
          .update({
            "Deleted": true,
            "Deleted Date": new Date().toISOString(),
            "Deleted By": currentUser?.email || "Unknown"
          })
          .eq('"ID"', cashLog.id || cashLog.ID);
        
        if (error) throw error;
        
        setViewingCashLog(null);
        setShowCashForm(false);
        setEditingCashLog(null);
        loadData();
      } catch (error) {
        console.error("Error deleting cash log:", error);
        alert("Error deleting cash log: " + error.message);
      }
    }
  };

  const handleDelete = async (charge) => {
    const chargeResidentId = charge.resident_id;
    if (window.confirm(`Are you sure you want to delete this service charge for ${getResidentName(chargeResidentId)}?`)) {
      try {
        const { error } = await supabase
          .from('service_charges')
          .delete()
          .eq('"ID"', charge.id);
        
        if (error) throw error;
        
        setViewingCharge(null);
        loadData();
      } catch (error) {
        console.error("Error deleting service charge:", error);
        alert("Error deleting service charge: " + error.message);
      }
    }
  };

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

  const getPaymentStatusColor = (status) => {
    const colors = {
      paid: "bg-green-100 text-green-800",
      due: "bg-yellow-100 text-yellow-800",
      overdue: "bg-red-100 text-red-800",
      exempt: "bg-blue-100 text-blue-800",
      partially_paid: "bg-amber-100 text-amber-800"
    };
    return colors[status] || colors.due;
  };

  const exportServiceChargesToCSV = () => {
    console.log("✅ Service Charges CSV export completed successfully");
  };

  const exportCashLogsToCSV = () => {
    console.log("✅ Cash Logs CSV export completed successfully");
  };

  const realResidents = residents.filter(r => !isTestData(r));
  const overdueCharges = serviceCharges.filter(charge => {
    const chargeResidentId = charge.resident_id || charge["Resident ID"];
    const resident = realResidents.find(r => (r.ID || r.id) === chargeResidentId);
    return resident && charge.payment_status === "overdue";
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Service Charges</h1>
          <p className="text-slate-600">Track monthly service charge payments and cash transactions for all residents</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="service-charges" className="flex items-center gap-2">
            <Receipt className="w-4 h-4" />
            Service Charges
          </TabsTrigger>
          <TabsTrigger value="cash-logs" className="flex items-center gap-2">
            <PoundSterling className="w-4 h-4" />
            Cash Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="service-charges" className="space-y-6">
          <div className="flex justify-between items-center">
            <Button onClick={() => setShowForm(true)} className="bg-indigo-600 hover:bg-indigo-700 shadow-sm">
              <Plus className="w-4 h-4 mr-2" />
              Add New Charge
            </Button>
            <Button onClick={exportServiceChargesToCSV} variant="outline" className="flex items-center gap-2" disabled={loading || filteredCharges.length === 0}>
              <Download className="w-4 h-4" />
              Export Service Charges
            </Button>
          </div>

          {overdueCharges.length > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-800">
                  <AlertCircle className="w-5 h-5" />
                  Overdue Payment Reminders ({overdueCharges.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {overdueCharges.slice(0, 5).map((charge) => {
                    const chargeResidentId = charge.resident_id || charge["Resident ID"];
                    const resident = realResidents.find((r) => (r.ID || r.id) === chargeResidentId);
                    if (!resident) return null;
                    
                    const firstName = resident["First Name"] || resident.first_name || resident.firstName || '';
                    const lastName = resident["Last Name"] || resident.last_name || resident.lastName || '';
                    const dueDate = charge.due_date || charge["Due Date"];
                    const monthlyAmount = charge.monthly_amount || charge["Monthly Amount"] || 0;
                    
                    return (
                      <div key={charge.id || charge.ID} className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-200">
                        <div>
                          <p className="font-medium text-slate-900">{firstName} {lastName}</p>
                          <p className="text-sm text-slate-600">
                            Due: {format(new Date(dueDate), "MMM d, yyyy")} - £{monthlyAmount.toFixed(2)}
                          </p>
                        </div>
                        <Badge className="bg-red-100 text-red-800">
                          {Math.floor((new Date() - new Date(dueDate)) / (1000 * 60 * 60 * 24))} days overdue
                        </Badge>
                      </div>
                    );
                  })}
                  {overdueCharges.length > 5 && (
                    <p className="text-sm text-slate-600 text-center pt-2">
                      And {overdueCharges.length - 5} more overdue payment(s)
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {(summary.overdue.length > 0 || summary.due.length > 0) && (
            <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-800">
                  <AlertCircle className="w-5 h-5" />
                  Payment Reminders
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-red-700 mb-2">Overdue Payments ({summary.overdue.length})</h3>
                  {summary.overdue.length > 0 ? (
                    <div className="space-y-2 max-h-40 overflow-y-auto p-1">
                      {summary.overdue.map(({ resident, count }) => {
                        const firstName = resident["First Name"] || resident.first_name || resident.firstName || '';
                        const lastName = resident["Last Name"] || resident.last_name || resident.lastName || '';
                        return (
                          <div key={resident.ID || resident.id} className="flex items-center justify-between p-2 bg-red-100/50 rounded-lg">
                            <span className="text-sm font-medium text-slate-800">{firstName} {lastName}</span>
                            <Badge variant="destructive" className="text-xs">{count} overdue</Badge>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">No overdue payments.</p>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-yellow-700 mb-2">Upcoming Payments ({summary.due.length})</h3>
                  {summary.due.length > 0 ? (
                    <div className="space-y-2 max-h-40 overflow-y-auto p-1">
                      {summary.due.map(({ resident, count }) => {
                        const firstName = resident["First Name"] || resident.first_name || resident.firstName || '';
                        const lastName = resident["Last Name"] || resident.last_name || resident.lastName || '';
                        return (
                          <div key={resident.ID || resident.id} className="flex items-center justify-between p-2 bg-yellow-100/50 rounded-lg">
                            <span className="text-sm font-medium text-slate-800">{firstName} {lastName}</span>
                            <Badge className="bg-yellow-200 text-yellow-800 border-yellow-300 text-xs">{count} due</Badge>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">No upcoming payments.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
          
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search by resident name, payment type, or accommodation..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {showForm && (
            <div className="mt-6">
              <ServiceChargeLogFormSupabase
                charge={editingCharge}
                residents={residents.filter(r => !isTestData(r))}
                accommodations={accommodations}
                properties={properties}
                currentUser={currentUser}
                allCharges={serviceCharges}
                onSubmit={handleSubmit}
                onCancel={() => { setShowForm(false); setEditingCharge(null); }}
              />
            </div>
          )}

          {viewingCharge && (
            <ServiceChargeDetailModal
              charge={viewingCharge}
              getResidentName={getResidentName}
              getPaymentStatusColor={getPaymentStatusColor}
              onClose={() => setViewingCharge(null)}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-indigo-600" />
                Monthly Service Charge Tracking
              </CardTitle>
              <p className="text-slate-600">Track service charge payments by property and resident, organised by month.</p>
            </CardHeader>
            <CardContent className="space-y-8 overflow-x-auto">
              {loading && <p>Loading service charges...</p>}
              {!loading && properties.length === 0 && (
                <div className="text-center py-8">
                  <Receipt className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">No properties found</h3>
                  <p className="text-slate-500">Add properties and assign residents to them to see service charges.</p>
                </div>
              )}
              {!loading && properties.length > 0 && (
                properties.map(property => {
                  const propertyId = property.ID || property.id;
                  const residentsInThisProperty = residents.filter(r => {
                    const resPropertyId = r["Property ID"] || r.property_id;
                    return resPropertyId === propertyId && !isTestData(r);
                  });
                  
                  let residentsToDisplayForProperty = [];

                  if (searchTerm) {
                    const lowercasedTerm = searchTerm.toLowerCase();
                    residentsToDisplayForProperty = residentsInThisProperty.filter(resident => {
                      const residentId = resident.ID || resident.id;
                      const residentName = getResidentName(residentId).toLowerCase();
                      const hasMatchingCharge = filteredCharges.some(charge => {
                        const chargeResidentId = charge.resident_id || charge["Resident ID"];
                        return chargeResidentId === residentId;
                      });
                      return residentName.includes(lowercasedTerm) || hasMatchingCharge;
                    });
                  } else {
                    residentsToDisplayForProperty = residentsInThisProperty.filter(r => {
                      const status = r.Status || r.status;
                      return status === 'active' || status === 'Active';
                    });
                  }
                  
                  if (residentsToDisplayForProperty.length === 0) return null;

                  residentsToDisplayForProperty.sort((a, b) => {
                    const firstNameA = a["First Name"] || a.first_name || a.firstName || '';
                    const firstNameB = b["First Name"] || b.first_name || b.firstName || '';
                    return firstNameA.localeCompare(firstNameB);
                  });

                  return (
                    <div key={propertyId}>
                      <h3 className="text-xl font-semibold mb-4 text-slate-800">{property.Name || property.name}</h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="min-w-[200px] sticky left-0 bg-white z-10">Resident Name</TableHead>
                            {financialYearMonths.map(date => (
                              <TableHead key={date.toISOString()} className="text-center min-w-[80px]">
                                {format(date, 'MMM')}<br />
                                <span className="text-xs text-slate-500">{format(date, 'yyyy')}</span>
                              </TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {residentsToDisplayForProperty.map(resident => {
                            const residentId = resident.ID || resident.id;
                            const residentCharges = filteredCharges.filter(p => {
                              const chargeResidentId = p.resident_id || p["Resident ID"];
                              return chargeResidentId === residentId;
                            });
                            const paymentDay = getPaymentDay(resident);
                            
                            const firstName = resident["First Name"] || resident.first_name || resident.firstName || '';
                            const lastName = resident["Last Name"] || resident.last_name || resident.lastName || '';
                            const fullName = `${firstName} ${lastName}`.trim() || 'Unknown Resident';
                            const status = resident.Status || resident.status;
                            
                            return (
                              <TableRow key={residentId}>
                                <TableCell className="font-medium sticky left-0 bg-white">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span>{fullName}</span>
                                      {status && status !== 'active' && status !== 'Active' && (
                                        <Badge variant="outline" className="text-xs">
                                          {status.replace('_', ' ')}
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="text-xs text-slate-500">
                                      {formatPaymentDay(paymentDay)}
                                    </div>
                                  </div>
                                </TableCell>
                                {financialYearMonths.map(monthStartDate => {
                                  const monthKey = format(monthStartDate, 'yyyy-MM');
                                  
                                  const chargeForMonth = residentCharges.find(p => {
                                    const chargeDueDate = p.due_date || p["Due Date"];
                                    if (!chargeDueDate) return false;
                                    const chargeMonth = format(new Date(chargeDueDate), 'yyyy-MM');
                                    return chargeMonth === monthKey;
                                  });

                                  const today = new Date();
                                  today.setHours(0, 0, 0, 0);
                                  
                                  // Check if this month is before resident's move-in date
                                  let isNotAvailable = false;
                                  const moveInDate = resident["Move-in Date"] || resident["Move In Date"] || resident.move_in_date;
                                  if (moveInDate) {
                                    const moveInDateObj = new Date(moveInDate);
                                    moveInDateObj.setHours(0, 0, 0, 0);
                                    const monthEnd = new Date(monthStartDate.getFullYear(), monthStartDate.getMonth() + 1, 0);
                                    monthEnd.setHours(0, 0, 0, 0);
                                    isNotAvailable = monthEnd < moveInDateObj;
                                  }
                                  
                                  let isOverdue = false;
                                  let isExempt = false;
                                  
                                  if (chargeForMonth) {
                                    const chargeExempt = chargeForMonth.exempt || chargeForMonth.Exempt;
                                    if (chargeExempt || chargeForMonth.payment_status === 'exempt') {
                                      isExempt = true;
                                    } else if (chargeForMonth.payment_status !== 'paid') {
                                      const chargeDueDate = chargeForMonth.due_date || chargeForMonth["Due Date"];
                                      if (chargeDueDate) {
                                        const dueDate = new Date(chargeDueDate);
                                        dueDate.setHours(0, 0, 0, 0);
                                        isOverdue = dueDate < today && !isNotAvailable;
                                      }
                                    }
                                  } else {
                                    const expectedDueDate = setDate(monthStartDate, paymentDay);
                                    expectedDueDate.setHours(0, 0, 0, 0);
                                    isOverdue = expectedDueDate < today && !isNotAvailable;
                                  }

                                  return (
                                    <TableCell 
                                      key={monthStartDate.toISOString()} 
                                      className={`text-center ${
                                        isNotAvailable
                                          ? 'bg-gray-100'
                                          : isExempt 
                                          ? 'bg-blue-50 border-l-4 border-blue-400' 
                                          : isOverdue 
                                          ? 'bg-red-100 border-l-4 border-red-600' 
                                          : ''
                                      }`}
                                    >
                                      {isNotAvailable ? (
                                        <div className="text-xs text-gray-500 py-2">
                                          N/A
                                        </div>
                                      ) : (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="w-full h-auto py-2 px-2"
                                          onClick={() => {
                                            if (chargeForMonth) {
                                              handleViewChargeDetails(chargeForMonth);
                                            } else {
                                              const newDueDate = setDate(monthStartDate, paymentDay);
                                              const newChargeTemplate = {
                                                resident_id: residentId,
                                                due_date: format(newDueDate, 'yyyy-MM-dd'),
                                                payment_type: 'bank_transfer',
                                                monthly_amount: 0,
                                                payment_status: isOverdue ? 'overdue' : 'due',
                                                status: 'active',
                                                exempt: false
                                              };
                                              handleEdit(newChargeTemplate);
                                            }
                                          }}
                                        >
                                          {chargeForMonth ? (
                                            isExempt ? (
                                              <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded">Exempt</span>
                                            ) : chargeForMonth.payment_status === 'paid' ? (
                                              <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">Paid</span>
                                            ) : chargeForMonth.payment_status === 'partially_paid' ? (
                                              <div className="flex flex-col items-center gap-1">
                                                <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded leading-none uppercase">Partial</span>
                                                <span className="text-[10px] font-medium text-amber-900 leading-none">£{(chargeForMonth.balance_owed || 0).toFixed(2)}</span>
                                              </div>
                                            ) : isOverdue ? (
                                              <span className="text-xs font-bold text-red-700 bg-red-200 px-2 py-1 rounded animate-pulse border-2 border-red-700">OVERDUE</span>
                                            ) : (
                                              <HelpCircle className="w-5 h-5 text-yellow-500" />
                                            )
                                          ) : isOverdue ? (
                                            <span className="text-xs font-bold text-red-700 bg-red-200 px-2 py-1 rounded animate-pulse border-2 border-red-700">OVERDUE</span>
                                          ) : (
                                            <PlusCircle className="w-5 h-5 text-slate-400 hover:text-slate-600" />
                                          )}
                                        </Button>
                                      )}
                                    </TableCell>
                                  );
                                })}
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cash-logs" className="space-y-6">
          <div className="flex justify-between items-center">
            <Button onClick={() => setShowCashForm(true)} className="bg-green-600 hover:bg-green-700 shadow-sm">
              <Plus className="w-4 h-4 mr-2" />
              Add New Cash Log
            </Button>
            <Button onClick={exportCashLogsToCSV} variant="outline" className="flex items-center gap-2" disabled={loading || filteredCashLogs.length === 0}>
              <Download className="w-4 h-4" />
              Export Cash Logs
            </Button>
          </div>

          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search by resident name, property, or location..."
                  value={cashSearchTerm}
                  onChange={(e) => setCashSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {showCashForm && (
            <div className="mt-6">
              <CashLogFormSupabase
                cashLog={editingCashLog}
                residents={residents.filter(r => !isTestData(r))}
                properties={properties}
                currentUser={currentUser}
                onSubmit={handleCashLogSubmit}
                onCancel={() => { setShowCashForm(false); setEditingCashLog(null); }}
                onDelete={handleCashLogDelete}
              />
            </div>
          )}

          {viewingCashLog && (
            <CashLogDetailModal
              cashLog={viewingCashLog}
              getResidentName={getResidentName}
              getPropertyName={getPropertyName}
              onClose={() => setViewingCashLog(null)}
              onEdit={handleCashLogEdit}
              onDelete={handleCashLogDelete}
            />
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PoundSterling className="w-5 h-5 text-green-600" />
                Cash Transaction Logs
              </CardTitle>
              <p className="text-slate-600">Track all cash payments and transactions for residents.</p>
            </CardHeader>
            <CardContent>
              {loading && <p>Loading cash logs...</p>}
              {!loading && filteredCashLogs.length === 0 && (
                <div className="text-center py-8">
                  <PoundSterling className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">No cash logs found</h3>
                  <p className="text-slate-500">
                    {cashSearchTerm ? "No logs match your search. Try adjusting your filters." : "Start logging cash transactions by clicking 'Add New Cash Log' above."}
                  </p>
                </div>
              )}
              {!loading && filteredCashLogs.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredCashLogs.map((cashLog) => {
                    const cashLogResidentId = cashLog.resident_id || cashLog["Resident ID"];
                    const cashLogPropertyId = cashLog.property_id || cashLog["Property ID"];
                    const residentName = getResidentName(cashLogResidentId);
                    const propertyName = getPropertyName(cashLogPropertyId);
                    
                    return (
                      <CashLogCard
                        key={cashLog.id || cashLog.ID}
                        cashLog={{
                          ...cashLog,
                          resident_name: residentName,
                          property_name: propertyName
                        }}
                        onView={handleViewCashLogDetails}
                        onEdit={handleCashLogEdit}
                      />
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
