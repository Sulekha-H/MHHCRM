"use client"

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  Calendar as CalendarIcon,
  Clock,
  AlertCircle,
  Loader2,
  RefreshCw
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";

export default function RotaCloudPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [staff, setStaff] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [leave, setLeave] = useState([]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch users (staff)
      const usersRes = await fetch('/api/rotacloud?endpoint=users');
      if (!usersRes.ok) throw new Error('Failed to fetch staff data');
      const usersData = await usersRes.json();
      setStaff(Array.isArray(usersData) ? usersData : []);

      // Fetch upcoming shifts (next 7 days)
      const start = format(new Date(), 'yyyy-MM-dd');
      const end = format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
      const shiftsRes = await fetch(`/api/rotacloud?endpoint=shifts&start=${start}&end=${end}`);
      if (!shiftsRes.ok) throw new Error('Failed to fetch shift data');
      const shiftsData = await shiftsRes.json();
      setShifts(Array.isArray(shiftsData) ? shiftsData : []);

      // Fetch leave
      const leaveRes = await fetch('/api/rotacloud?endpoint=leave');
      if (!leaveRes.ok) throw new Error('Failed to fetch leave data');
      const leaveData = await leaveRes.json();
      setLeave(Array.isArray(leaveData) ? leaveData : []);

    } catch (err) {
      console.error('Error fetching RotaCloud data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="flex flex-col space-y-6 pb-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">RotaCloud Integration</h1>
          <p className="text-slate-600">Staff schedules, shifts, and leave management</p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Refresh Data
        </button>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-red-700">
              <AlertCircle className="w-5 h-5" />
              <p className="font-medium">Error: {error}</p>
            </div>
            <p className="mt-2 text-sm text-red-600 ml-8">
              Please ensure your ROTACLOUD_API_KEY is correctly configured and that the API is reachable.
            </p>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="shifts" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="shifts" className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4" />
            Upcoming Shifts
          </TabsTrigger>
          <TabsTrigger value="staff" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Staff
          </TabsTrigger>
          <TabsTrigger value="leave" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Leave
          </TabsTrigger>
        </TabsList>

        <TabsContent value="shifts" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-indigo-600" />
                Shifts for the Next 7 Days
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                </div>
              ) : shifts.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Staff</th>
                        <th className="px-4 py-3 font-semibold">Date</th>
                        <th className="px-4 py-3 font-semibold">Time</th>
                        <th className="px-4 py-3 font-semibold">Location</th>
                        <th className="px-4 py-3 font-semibold">Role</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {shifts.map((shift) => {
                        const staffMember = staff.find(s => s.id === shift.user);
                        return (
                          <tr key={shift.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3 font-medium text-slate-900">
                              {staffMember ? `${staffMember.first_name} ${staffMember.last_name}` : 'Unknown'}
                            </td>
                            <td className="px-4 py-3 text-slate-600">
                              {format(new Date(shift.start_time * 1000), 'EEE, do MMM')}
                            </td>
                            <td className="px-4 py-3 text-slate-600">
                              {format(new Date(shift.start_time * 1000), 'HH:mm')} - {format(new Date(shift.end_time * 1000), 'HH:mm')}
                            </td>
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {shift.location_name || 'N/A'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-slate-600">
                              {shift.role_name || 'N/A'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500">
                  No shifts scheduled for the next 7 days.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="staff" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                Staff Directory
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                </div>
              ) : staff.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {staff.map((member) => (
                    <div key={member.id} className="p-4 border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                          {member.first_name?.[0]}{member.last_name?.[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{member.first_name} {member.last_name}</p>
                          <p className="text-xs text-slate-500">{member.job_title || 'Staff Member'}</p>
                        </div>
                      </div>
                      <div className="mt-4 space-y-1 text-sm">
                        <p className="text-slate-600 flex items-center gap-2">
                          <span className="font-medium text-slate-500 w-16">Email:</span>
                          {member.email || 'N/A'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500">
                  No staff members found.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leave" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-600" />
                Leave Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                </div>
              ) : leave.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Staff</th>
                        <th className="px-4 py-3 font-semibold">Period</th>
                        <th className="px-4 py-3 font-semibold">Type</th>
                        <th className="px-4 py-3 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {leave.map((item) => {
                        const staffMember = staff.find(s => s.id === item.user);
                        const statusColors = {
                          approved: 'bg-green-100 text-green-800',
                          pending: 'bg-yellow-100 text-yellow-800',
                          denied: 'bg-red-100 text-red-800'
                        };
                        return (
                          <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3 font-medium text-slate-900">
                              {staffMember ? `${staffMember.first_name} ${staffMember.last_name}` : 'Unknown'}
                            </td>
                            <td className="px-4 py-3 text-slate-600">
                              {format(new Date(item.start_date * 1000), 'do MMM')} - {format(new Date(item.end_date * 1000), 'do MMM yyyy')}
                            </td>
                            <td className="px-4 py-3 text-slate-600">
                              {item.leave_type_name || 'Annual Leave'}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[item.status] || 'bg-slate-100 text-slate-800'}`}>
                                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500">
                  No leave records found.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
