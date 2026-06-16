import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Save, ShoppingCart, Link as LinkIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function PropertyPurchaseForm({ purchase, properties, currentUser, onSubmit, onCancel, hideCard = false }) {
  const [formData, setFormData] = useState({
    item_name: "",
    purchase_date: new Date().toISOString().split('T')[0],
    cost: "",
    property_id: "",
    supplier: "",
    category: "",
    status: "ordered",
    receipt_link: "",
    notes: ""
  });

  const categories = [
    "Furniture",
    "Maintenance",
    "Office Supplies",
    "Cleaning Supplies",
    "Appliances",
    "Safety & Security",
    "Decor",
    "Other"
  ];

  const statuses = [
    { value: "ordered", label: "Ordered" },
    { value: "pending", label: "Pending" },
    { value: "delivered", label: "Delivered" },
    { value: "cancelled", label: "Cancelled" }
  ];

  useEffect(() => {
    if (purchase) {
      // Reverse mapping from database PascalCase format if necessary
      setFormData({
        item_name: purchase["Item Name"] || purchase.item_name || "",
        purchase_date: purchase["Purchase Date"] || purchase.purchase_date || new Date().toISOString().split('T')[0],
        cost: purchase["Cost"] || purchase.cost || "",
        property_id: purchase["Property ID"] || purchase.property_id || "",
        supplier: purchase["Supplier"] || purchase.supplier || "",
        category: (purchase["Category"] || purchase.category || "").toLowerCase(),
        status: (purchase["Status"] || purchase.status || "ordered").toLowerCase(),
        receipt_link: purchase["Receipt Link"] || purchase.receipt_link || "",
        notes: purchase["Notes"] || purchase.notes || ""
      });
    }
  }, [purchase]);

  const handleSubmit = (e) => {
    e.preventDefault();

    const statusMap = {
      'ordered': 'Ordered',
      'pending': 'Pending',
      'delivered': 'Delivered',
      'cancelled': 'Cancelled'
    };

    const submitData = {
      ...formData,
      status: statusMap[formData.status] || 'Ordered',
      category: formData.category.charAt(0).toUpperCase() + formData.category.slice(1),
      logged_by: currentUser?.fullName || currentUser?.full_name || currentUser?.primaryEmailAddress?.emailAddress || "Unknown"
    };

    onSubmit(submitData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <Label htmlFor="item_name" className="mb-2 block">Item/Service Name *</Label>
          <Input
            id="item_name"
            value={formData.item_name}
            onChange={(e) => handleChange("item_name", e.target.value)}
            placeholder="e.g., New Sofa, Boiler Repair"
            required
          />
        </div>

        <div>
          <Label htmlFor="purchase_date" className="mb-2 block">Purchase Date *</Label>
          <Input
            id="purchase_date"
            type="date"
            value={formData.purchase_date}
            onChange={(e) => handleChange("purchase_date", e.target.value)}
            required
          />
        </div>

        <div>
          <Label htmlFor="cost" className="mb-2 block">Cost (£) *</Label>
          <Input
            id="cost"
            type="number"
            step="0.01"
            min="0"
            value={formData.cost}
            onChange={(e) => handleChange("cost", e.target.value)}
            placeholder="0.00"
            required
          />
        </div>

        <div>
          <Label htmlFor="property_id" className="mb-2 block">Property *</Label>
          <Select
            value={formData.property_id}
            onValueChange={(value) => handleChange("property_id", value)}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Select property" />
            </SelectTrigger>
            <SelectContent>
              {properties.map((property) => (
                <SelectItem key={property.ID || property.id} value={property.ID || property.id}>
                  {property.Name || property.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="supplier" className="mb-2 block">Supplier/Vendor</Label>
          <Input
            id="supplier"
            value={formData.supplier}
            onChange={(e) => handleChange("supplier", e.target.value)}
            placeholder="e.g., Amazon, Local Plumber"
          />
        </div>

        <div>
          <Label htmlFor="category" className="mb-2 block">Category *</Label>
          <Select
            value={formData.category}
            onValueChange={(value) => handleChange("category", value)}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.toLowerCase()} value={cat.toLowerCase()}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="status" className="mb-2 block">Status</Label>
          <Select
            value={formData.status}
            onValueChange={(value) => handleChange("status", value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statuses.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="receipt_link" className="mb-2 block flex items-center gap-2">
            <LinkIcon className="w-4 h-4" />
            Receipt/Invoice (Google Drive Link)
          </Label>
          <Input
            id="receipt_link"
            value={formData.receipt_link}
            onChange={(e) => handleChange("receipt_link", e.target.value)}
            placeholder="https://drive.google.com/..."
          />
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="notes" className="mb-2 block">Notes</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => handleChange("notes", e.target.value)}
            placeholder="Any additional details..."
            rows={3}
          />
        </div>

        <div className="md:col-span-2">
          <Label className="mb-2 block">Logged By</Label>
          <Input
            value={currentUser?.fullName || currentUser?.full_name || currentUser?.primaryEmailAddress?.emailAddress || "Unknown"}
            disabled
            className="bg-slate-50"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex items-center gap-2"
        >
          <X className="w-4 h-4" />
          Cancel
        </Button>
        <Button
          type="submit"
          className="bg-orange-600 hover:bg-orange-700 flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {purchase ? "Update Purchase" : "Log Purchase"}
        </Button>
      </div>
    </form>
  );

  if (hideCard) {
    return (
      <Dialog open={true} onOpenChange={onCancel}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-orange-600" />
              {purchase ? "Edit Purchase" : "Log New Purchase"}
            </DialogTitle>
            <DialogDescription>
              Enter the details of the property purchase below.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="p-6 max-h-[calc(90vh-120px)]">
            {formContent}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Card className="mb-6 shadow-md border-orange-100">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-orange-600" />
          {purchase ? "Edit Purchase" : "Log New Purchase"}
        </CardTitle>
        <CardDescription>
          Enter the details of the property purchase below.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {formContent}
      </CardContent>
    </Card>
  );
}
