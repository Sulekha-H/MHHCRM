import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Save, Palette, Loader2 } from "lucide-react";

export default function UserEditForm_Supabase({ user, isOpen, onSave, onCancel }) {
    const [formData, setFormData] = useState(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        // When the user prop changes (e.g., a user is selected for editing),
        // update the form's internal state.
        // Handle both PascalCase (Supabase) and snake_case field names
        if (user) {
            setFormData({
                department: user.Department || user.department || "",
                phone: user.Phone || user.phone || "",
                display_color: user.Display_Color || user.display_color || "#cccccc"
            });
        }
    }, [user]);

    const handleSave = async () => {
        if (!formData) return; // Prevent saving if formData is null
        
        setSaving(true);
        try {
            // Convert to PascalCase for Supabase
            const supabaseData = {
                Department: formData.department,
                Phone: formData.phone,
                Display_Color: formData.display_color,
                Updated_Date: new Date().toISOString()
            };
            
            await onSave(user.Id || user.id, supabaseData);
        } catch (error) {
            console.error("Error saving user:", error);
            alert("Failed to save user changes: " + error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (field, value) => {
        setFormData(prev => (prev ? { ...prev, [field]: value } : null));
    };

    if (!isOpen || !formData || !user) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onCancel}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <DialogTitle>Edit User: {user.Full_Name || user.full_name}</DialogTitle>
                    </div>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    {/* Email - Read Only */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="email" className="text-right">Email</Label>
                        <Input 
                            id="email" 
                            value={user.Email || user.email || ""} 
                            disabled 
                            className="col-span-3 bg-slate-50 cursor-not-allowed" 
                        />
                    </div>

                    {/* Role - Read Only */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="role" className="text-right">Role</Label>
                        <div className="col-span-3 space-y-1">
                            <Input 
                                id="role" 
                                value={user.Role || user.role || "user"} 
                                disabled 
                                className="bg-slate-50 capitalize cursor-not-allowed" 
                            />
                            <p className="text-xs text-slate-500">
                                Role can only be changed via platform settings
                            </p>
                        </div>
                    </div>

                    {/* Department */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="department" className="text-right">
                            Department <span className="text-red-500">*</span>
                        </Label>
                        <Select
                            value={formData.department || ''} 
                            onValueChange={(value) => handleChange("department", value)}
                        >
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select a department" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="accommodation_support">Accommodation Support</SelectItem>
                                <SelectItem value="office_admin">Office Admin</SelectItem>
                                <SelectItem value="management">Management</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Phone */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="phone" className="text-right">
                            Phone <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="phone"
                            value={formData.phone || ''}
                            onChange={(e) => handleChange("phone", e.target.value)}
                            className="col-span-3"
                            placeholder="e.g., 07xxx xxxxxx"
                        />
                    </div>

                    {/* Display Color */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="display_color" className="text-right flex items-center gap-1">
                            <Palette className="w-4 h-4" /> Color
                        </Label>
                        <div className="col-span-3 flex items-center gap-3">
                            <Input
                                id="display_color"
                                type="color"
                                value={formData.display_color || '#cccccc'}
                                onChange={(e) => handleChange("display_color", e.target.value)}
                                className="h-10 w-20 cursor-pointer"
                            />
                            <div className="flex items-center gap-2">
                                <div
                                    className="w-8 h-8 rounded-full border-2 border-slate-200"
                                    style={{ backgroundColor: formData.display_color || '#cccccc' }}
                                ></div>
                                <span className="text-sm text-slate-600">
                                    Used to identify user in the system
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onCancel} disabled={saving}>
                        <X className="w-4 h-4 mr-2" /> Cancel
                    </Button>
                    <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700" disabled={saving}>
                        {saving ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4 mr-2" /> Save Changes
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}