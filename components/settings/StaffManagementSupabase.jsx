import React, { useState, useEffect } from "react";
import { useClerkSupabaseClient } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Users, UserX, RotateCcw, Download, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UserEditForm_Supabase from "./UserEditForm";
import UserDeactivateForm_Supabase from "./UserDeactivateForm";
import { format } from "date-fns";

export default function StaffManagement_Supabase() {
    const supabase = useClerkSupabaseClient();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingUser, setEditingUser] = useState(null);
    const [deactivatingUser, setDeactivatingUser] = useState(null);
    const [activeTab, setActiveTab] = useState("active");

    const loadUsers = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .order('Full_Name', { ascending: true });

            if (error) throw error;
            setUsers(data || []);
        } catch (error) {
            console.error("Error loading users:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (supabase) {
            loadUsers();
        }
    }, [supabase]);

    const handleSave = async (userId, data) => {
        try {
            const { error } = await supabase
                .from('users')
                .update(data)
                .eq('Id', userId);

            if (error) throw error;
            
            setEditingUser(null);
            loadUsers();
        } catch (error) {
            console.error("Error updating user:", error);
            alert("Failed to update user: " + error.message);
        }
    };

    const handleDeactivate = async (userId, data) => {
        try {
            const { error } = await supabase
                .from('users')
                .update(data)
                .eq('Id', userId);

            if (error) throw error;
            
            setDeactivatingUser(null);
            loadUsers();
        } catch (error) {
            console.error("Error deactivating user:", error);
            alert("Failed to deactivate user: " + error.message);
        }
    };

    const handleReactivate = async (userId) => {
        try {
            const { error } = await supabase
                .from('users')
                .update({
                    Is_Active: true,
                    Deactivated_Date: null,
                    Deactivated_Reason: null,
                    Updated_Date: new Date().toISOString()
                })
                .eq('Id', userId);

            if (error) throw error;
            
            loadUsers();
        } catch (error) {
            console.error("Error reactivating user:", error);
            alert("Failed to reactivate user: " + error.message);
        }
    };

    const exportToCSV = () => {
        // Helper function to format dates - returns empty string if null/undefined
        const formatDate = (dateString) => {
            if (!dateString) return "";
            try {
                return format(new Date(dateString), 'yyyy-MM-dd');
            } catch {
                return "";
            }
        };

        // Helper function to format timestamps - returns empty string if null/undefined
        const formatDateTime = (dateString) => {
            if (!dateString) return "";
            try {
                return format(new Date(dateString), 'yyyy-MM-dd HH:mm:ss');
            } catch {
                return "";
            }
        };

        // Helper function to format permissions array
        const formatPermissions = (permissions) => {
            if (!permissions || permissions.length === 0) return "";
            // Format as PostgreSQL array: {item1,item2,item3}
            return `{${permissions.join(',')}}`;
        };

        const headers = [
            "ID",
            "Created Date",
            "Updated Date",
            "Created By",
            "Full Name",
            "Email",
            "Role",
            "Department",
            "Phone",
            "Start Date",
            "Permissions",
            "Display Color",
            "Is Active",
            "Deactivated Date",
            "Deactivated Reason"
        ];

        const rows = users.map(user => [
            user.Id || "",
            formatDateTime(user.Created_Date),
            formatDateTime(user.Updated_Date),
            user.Created_By || "",
            user.Full_Name || "",
            user.Email || "",
            user.Role || "",
            user.Department || "",
            user.Phone || "",
            formatDate(user.Start_Date),
            formatPermissions(user.Permissions),
            user.Display_Color || "",
            user.Is_Active === false ? "FALSE" : "TRUE",
            formatDate(user.Deactivated_Date),
            user.Deactivated_Reason || ""
        ]);

        // Escape CSV values properly
        const escapeCSV = (value) => {
            if (value === null || value === undefined || value === "") return '';
            const stringValue = String(value);
            // Only wrap in quotes if contains comma, newline, or quotes
            if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
                return `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
        };

        const csvContent = [
            headers.map(escapeCSV).join(','),
            ...rows.map(row => row.map(escapeCSV).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `staff_export_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        console.log("✅ Staff CSV export completed successfully");
    };

    const getDepartmentBadge = (department) => {
        switch (department) {
            case "management": return "bg-purple-100 text-purple-800";
            case "accommodation_support": return "bg-blue-100 text-blue-800";
            case "office_admin": return "bg-green-100 text-green-800";
            default: return "bg-gray-100 text-gray-800";
        }
    };

    const activeUsers = users.filter(user => user.Is_Active !== false);
    const inactiveUsers = users.filter(user => user.Is_Active === false);

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex-1">
                            <CardTitle className="flex items-center gap-2">
                                <Users className="w-5 h-5 text-slate-600" />
                                Staff Management
                            </CardTitle>
                            <CardDescription className="mt-1">
                                View and manage application-specific details for staff members. Note: User invitations and deletions are managed at the platform level.
                            </CardDescription>
                        </div>
                        <Button
                            onClick={exportToCSV}
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2 flex-shrink-0"
                            disabled={loading || users.length === 0}
                        >
                            <Download className="w-4 h-4" />
                            Export to CSV
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                        </div>
                    ) : (
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
                            <TabsList>
                                <TabsTrigger value="active">Active Staff ({activeUsers.length})</TabsTrigger>
                                <TabsTrigger value="inactive">Inactive Staff ({inactiveUsers.length})</TabsTrigger>
                            </TabsList>
                            
                            <TabsContent value="active">
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Name</TableHead>
                                                <TableHead>Email</TableHead>
                                                <TableHead>Role</TableHead>
                                                <TableHead>Department</TableHead>
                                                <TableHead>Phone</TableHead>
                                                <TableHead>Color</TableHead>
                                                <TableHead>Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {activeUsers.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan="7" className="text-center py-8 text-slate-500">
                                                        No active staff members
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                activeUsers.map(user => (
                                                    <TableRow key={user.Id}>
                                                        <TableCell className="font-medium">{user.Full_Name}</TableCell>
                                                        <TableCell>{user.Email}</TableCell>
                                                        <TableCell>
                                                            <Badge variant="outline" className="capitalize">
                                                                {user.Role || 'user'}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge className={getDepartmentBadge(user.Department)}>
                                                                {user.Department?.replace(/_/g, ' ') || 'N/A'}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>{user.Phone || 'N/A'}</TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-2">
                                                                <div
                                                                    className="w-5 h-5 rounded-full border"
                                                                    style={{ backgroundColor: user.Display_Color || '#cccccc' }}
                                                                ></div>
                                                                <span className="text-xs font-mono">{user.Display_Color || '#cccccc'}</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex gap-2">
                                                                <Button variant="ghost" size="icon" onClick={() => setEditingUser(user)} title="Edit User">
                                                                    <Edit className="w-4 h-4" />
                                                                </Button>
                                                                <AlertDialog>
                                                                    <AlertDialogTrigger asChild>
                                                                        <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700" title="Deactivate User">
                                                                            <UserX className="w-4 h-4" />
                                                                        </Button>
                                                                    </AlertDialogTrigger>
                                                                    <AlertDialogContent>
                                                                        <AlertDialogHeader>
                                                                            <AlertDialogTitle>Deactivate User</AlertDialogTitle>
                                                                            <AlertDialogDescription>
                                                                                Are you sure you want to deactivate {user.Full_Name}? They will be moved to inactive staff and hidden from most parts of the application.
                                                                            </AlertDialogDescription>
                                                                        </AlertDialogHeader>
                                                                        <AlertDialogFooter>
                                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                            <AlertDialogAction onClick={() => setDeactivatingUser(user)}>
                                                                                Deactivate
                                                                            </AlertDialogAction>
                                                                        </AlertDialogFooter>
                                                                    </AlertDialogContent>
                                                                </AlertDialog>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </TabsContent>

                            <TabsContent value="inactive">
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Name</TableHead>
                                                <TableHead>Email</TableHead>
                                                <TableHead>Department</TableHead>
                                                <TableHead>Deactivated Date</TableHead>
                                                <TableHead>Reason</TableHead>
                                                <TableHead>Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {inactiveUsers.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan="6" className="text-center text-slate-500 py-8">
                                                        No inactive staff members
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                inactiveUsers.map(user => (
                                                    <TableRow key={user.Id} className="opacity-75">
                                                        <TableCell className="font-medium">{user.Full_Name}</TableCell>
                                                        <TableCell>{user.Email}</TableCell>
                                                        <TableCell>
                                                            <Badge className={getDepartmentBadge(user.Department)}>
                                                                {user.Department?.replace(/_/g, ' ') || 'N/A'}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            {user.Deactivated_Date ? format(new Date(user.Deactivated_Date), 'MMM d, yyyy') : 'N/A'}
                                                        </TableCell>
                                                        <TableCell>{user.Deactivated_Reason || 'No reason provided'}</TableCell>
                                                        <TableCell>
                                                            <AlertDialog>
                                                                <AlertDialogTrigger asChild>
                                                                    <Button variant="ghost" size="icon" className="text-green-600 hover:text-green-700" title="Reactivate User">
                                                                        <RotateCcw className="w-4 h-4" />
                                                                    </Button>
                                                                </AlertDialogTrigger>
                                                                <AlertDialogContent>
                                                                    <AlertDialogHeader>
                                                                        <AlertDialogTitle>Reactivate User</AlertDialogTitle>
                                                                        <AlertDialogDescription>
                                                                            Are you sure you want to reactivate {user.Full_Name}? They will be moved back to active staff and visible throughout the application.
                                                                        </AlertDialogDescription>
                                                                    </AlertDialogHeader>
                                                                    <AlertDialogFooter>
                                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                        <AlertDialogAction onClick={() => handleReactivate(user.Id)} className="bg-green-600 hover:bg-green-700">
                                                                            Reactivate
                                                                        </AlertDialogAction>
                                                                    </AlertDialogFooter>
                                                                </AlertDialogContent>
                                                            </AlertDialog>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </TabsContent>
                        </Tabs>
                    )}
                </CardContent>
            </Card>

            <UserEditForm_Supabase
                user={editingUser}
                isOpen={!!editingUser}
                onSave={handleSave}
                onCancel={() => setEditingUser(null)}
            />

            <UserDeactivateForm_Supabase
                user={deactivatingUser}
                isOpen={!!deactivatingUser}
                onDeactivate={handleDeactivate}
                onCancel={() => setDeactivatingUser(null)}
            />
        </>
    );
}
