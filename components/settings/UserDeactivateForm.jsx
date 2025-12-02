import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { X, UserX, AlertTriangle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function UserDeactivateForm_Supabase({ user, isOpen, onDeactivate, onCancel }) {
    const [reason, setReason] = useState("");
    const [deactivating, setDeactivating] = useState(false);

    const handleDeactivate = async () => {
        setDeactivating(true);
        try {
            // Convert to PascalCase for Supabase
            const supabaseData = {
                Is_Active: false,
                Deactivated_Date: new Date().toISOString(),
                Deactivated_Reason: reason || null,
                Updated_Date: new Date().toISOString()
            };
            
            await onDeactivate(user.Id || user.id, supabaseData);
            setReason("");
        } catch (error) {
            console.error("Error deactivating user:", error);
            alert("Failed to deactivate user: " + error.message);
        } finally {
            setDeactivating(false);
        }
    };

    if (!isOpen || !user) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onCancel}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-orange-500" />
                        Deactivate User: {user.Full_Name || user.full_name}
                    </DialogTitle>
                </DialogHeader>
                <div className="py-4">
                    <Alert className="mb-4 border-orange-200 bg-orange-50">
                        <AlertTriangle className="w-4 h-4 text-orange-600" />
                        <AlertDescription className="text-sm text-orange-800">
                            <strong>Note:</strong> This will hide the user from dropdown lists and most views in the application, 
                            but will not delete their account from the platform. They can be reactivated later if needed.
                        </AlertDescription>
                    </Alert>
                    
                    <div className="space-y-2">
                        <Label htmlFor="reason">Reason for deactivation (optional)</Label>
                        <Textarea
                            id="reason"
                            placeholder="e.g., Left organization, Role changed, etc."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            rows={3}
                            disabled={deactivating}
                        />
                    </div>

                    {(user.Email || user.email) && (
                        <div className="mt-4 p-3 bg-slate-50 rounded border border-slate-200">
                            <p className="text-xs text-slate-600">
                                <strong>User Email:</strong> {user.Email || user.email}
                            </p>
                            <p className="text-xs text-slate-600 mt-1">
                                <strong>Role:</strong> <span className="capitalize">{user.Role || user.role || "user"}</span>
                            </p>
                            {(user.Department || user.department) && (
                                <p className="text-xs text-slate-600 mt-1">
                                    <strong>Department:</strong> <span className="capitalize">{(user.Department || user.department).replace(/_/g, ' ')}</span>
                                </p>
                            )}
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onCancel} disabled={deactivating}>
                        <X className="w-4 h-4 mr-2" /> Cancel
                    </Button>
                    <Button 
                        onClick={handleDeactivate}
                        className="bg-red-600 hover:bg-red-700"
                        disabled={deactivating}
                    >
                        {deactivating ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Deactivating...
                            </>
                        ) : (
                            <>
                                <UserX className="w-4 h-4 mr-2" /> 
                                Deactivate User
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}