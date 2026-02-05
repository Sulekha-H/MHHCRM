import React, { useState, useEffect } from "react";
import { useClerkSupabaseClient } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { List, Tag, Trash2, Plus, Save, Download, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";

export default function DropdownSettings_Supabase() {
    const client = useClerkSupabaseClient();
    const [settings, setSettings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingSetting, setEditingSetting] = useState(null);
    const [tempOptions, setTempOptions] = useState([]);
    const [deletingOption, setDeletingOption] = useState(null);
    const [saving, setSaving] = useState(false);

    const loadSettings = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('settings')
                .select('*')
                .ilike('Key', 'dropdown_options_%')
                .order('Key', { ascending: false });

            if (error) throw error;
            setSettings(data || []);
        } catch (error) {
            console.error("Error loading settings:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSettings();
    }, []);

    const handleEditClick = (setting) => {
        setEditingSetting(setting);
        // Handle both PascalCase and snake_case, and ensure value.options exists
        const settingValue = setting.Value || setting.value || {};
        const options = settingValue.options || [];
        setTempOptions(options.map(opt => ({ id: Math.random(), value: opt })));
    };

    const handleSave = async () => {
        if (!editingSetting) return;
        
        setSaving(true);
        try {
            const updatedValue = { 
                options: tempOptions.map(opt => opt.value).filter(Boolean) 
            };
            
            const { error } = await supabase
                .from('settings')
                .update({
                    Value: updatedValue,
                    Updated_Date: new Date().toISOString()
                })
                .eq('Id', editingSetting.Id || editingSetting.id);

            if (error) throw error;
            
            setEditingSetting(null);
            loadSettings();
        } catch (error) {
            console.error("Error updating setting:", error);
            alert("Failed to update setting: " + error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleOptionChange = (id, newValue) => {
        setTempOptions(currentOptions =>
            currentOptions.map(opt => (opt.id === id ? { ...opt, value: newValue } : opt))
        );
    };

    const addOption = () => {
        setTempOptions(currentOptions => [...currentOptions, { id: Math.random(), value: "" }]);
    };

    const removeOption = (id) => {
        setTempOptions(currentOptions => currentOptions.filter(opt => opt.id !== id));
    };

    const handleDeleteOption = (optionId) => {
        setDeletingOption(optionId);
    };

    const confirmDeleteOption = () => {
        if (deletingOption !== null) {
            removeOption(deletingOption);
            setDeletingOption(null);
        }
    };

    const exportToCSV = () => {
        const formatDateTime = (dateString) => {
            if (!dateString) return "";
            try {
                return format(new Date(dateString), 'yyyy-MM-dd HH:mm:ss');
            } catch {
                return dateString;
            }
        };

        const formatOptions = (options) => {
            if (!options || options.length === 0) return "[]";
            return JSON.stringify(options);
        };

        const headers = [
            "ID",
            "Created Date",
            "Updated Date",
            "Created By",
            "Key",
            "Label",
            "Description",
            "Options"
        ];

        const rows = settings.map(setting => {
            const settingValue = setting.Value || setting.value || {};
            const options = settingValue.options || [];
            
            return [
                setting.Id || setting.id || "",
                formatDateTime(setting.Created_Date || setting.created_date),
                formatDateTime(setting.Updated_Date || setting.updated_date),
                setting.Created_By || setting.created_by || "",
                setting.Key || setting.key || "",
                setting.Label || setting.label || "",
                setting.Description || setting.description || "",
                formatOptions(options)
            ];
        });

        const escapeCSV = (value) => {
            if (value === null || value === undefined) return '';
            const stringValue = String(value);
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
        link.setAttribute('download', `dropdown_settings_export_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        console.log("✅ Dropdown Settings CSV export completed successfully");
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex-1">
                            <CardTitle className="flex items-center gap-2">
                                <List className="w-5 h-5 text-slate-600" />
                                Dropdown Field Management
                            </CardTitle>
                            <CardDescription className="mt-1">
                                Add, edit, or remove options for various dropdown fields used across the application.
                            </CardDescription>
                        </div>
                        <Button
                            onClick={exportToCSV}
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2 flex-shrink-0"
                            disabled={loading || settings.length === 0}
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
                    ) : settings.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-slate-500">No dropdown settings found</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {settings.map(setting => {
                                const settingValue = setting.Value || setting.value || {};
                                const options = settingValue.options || [];
                                const label = setting.Label || setting.label || "Unnamed Setting";
                                const description = setting.Description || setting.description || "";
                                
                                return (
                                    <div key={setting.Id || setting.id} className="p-4 border rounded-lg flex justify-between items-start hover:bg-slate-50 transition-colors">
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-slate-800">{label}</h4>
                                            {description && (
                                                <p className="text-sm text-slate-500 mb-2">{description}</p>
                                            )}
                                            <div className="flex flex-wrap gap-2">
                                                {options.slice(0, 8).map((option, idx) => (
                                                    <Badge key={idx} variant="secondary" className="flex items-center gap-1">
                                                        <Tag className="w-3 h-3" />
                                                        {option}
                                                    </Badge>
                                                ))}
                                                {options.length > 8 && (
                                                    <Badge variant="outline">+{options.length - 8} more</Badge>
                                                )}
                                                {options.length === 0 && (
                                                    <span className="text-sm text-slate-400 italic">No options defined</span>
                                                )}
                                            </div>
                                        </div>
                                        <Button variant="outline" onClick={() => handleEditClick(setting)}>
                                            Edit
                                        </Button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={!!editingSetting} onOpenChange={() => setEditingSetting(null)}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>
                            Editing: {editingSetting?.Label || editingSetting?.label || "Dropdown Setting"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4 max-h-[60vh] overflow-y-auto pr-4">
                        <div className="space-y-2">
                            {tempOptions.map((option, index) => (
                                <div key={option.id} className="flex items-center gap-2">
                                    <Input
                                        value={option.value}
                                        onChange={(e) => handleOptionChange(option.id, e.target.value)}
                                        placeholder={`Option ${index + 1}`}
                                    />
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        onClick={() => handleDeleteOption(option.id)}
                                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                        <Button variant="outline" size="sm" onClick={addOption} className="mt-4">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Option
                        </Button>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline" disabled={saving}>Cancel</Button>
                        </DialogClose>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    Save Changes
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!deletingOption} onOpenChange={(open) => !open && setDeletingOption(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Option</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this option? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={confirmDeleteOption}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
