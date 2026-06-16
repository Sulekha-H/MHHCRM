import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ShoppingCart,
  Calendar,
  Building2,
  PoundSterling,
  Tag,
  ExternalLink,
  Edit,
  Trash2,
  Clock,
  User,
  Truck,
  FileText
} from "lucide-react";
import { format } from "date-fns";

export default function PropertyPurchaseDetailModal({
  purchase,
  getPropertyName,
  onClose,
  onEdit,
  onDelete
}) {
  if (!purchase) return null;

  const getStatusColor = (status) => {
    const s = (status || "Ordered").toLowerCase();
    switch (s) {
      case "delivered": return "bg-green-100 text-green-800 border-green-200";
      case "pending": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "ordered": return "bg-blue-100 text-blue-800 border-blue-200";
      case "cancelled": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  const itemName = purchase["Item Name"] || purchase.item_name;
  const cost = purchase["Cost"] || purchase.cost || 0;
  const purchaseDate = purchase["Purchase Date"] || purchase.purchase_date;
  const propertyId = purchase["Property ID"] || purchase.property_id;
  const category = purchase["Category"] || purchase.category;
  const status = purchase["Status"] || purchase.status;
  const receiptLink = purchase["Receipt Link"] || purchase.receipt_link;
  const supplier = purchase["Supplier"] || purchase.supplier;
  const loggedBy = purchase["Logged By"] || purchase.logged_by;
  const notes = purchase["Notes"] || purchase.notes;
  const createdDate = purchase["Created Date"] || purchase.created_date;

  return (
    <Dialog open={!!purchase} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <div className="flex justify-between items-start gap-4">
            <div className="space-y-1">
              <Badge className={`${getStatusColor(status)} mb-2`}>
                {status}
              </Badge>
              <DialogTitle className="text-2xl font-bold text-slate-900 uppercase">
                {itemName}
              </DialogTitle>
              <DialogDescription className="text-slate-500">
                Purchase Detail
              </DialogDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => onEdit(purchase)}
                className="h-9 w-9 text-slate-600 hover:text-orange-600 border-slate-200"
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => onDelete(purchase)}
                className="h-9 w-9 text-slate-600 hover:text-red-600 border-slate-200"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="p-6 pt-4 max-h-[calc(90vh-100px)]">
          <div className="space-y-8">
            {/* Main Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="space-y-1">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Cost</span>
                <div className="flex items-center gap-1.5 text-lg font-bold text-orange-600">
                  <PoundSterling className="w-5 h-5" />
                  £{parseFloat(cost).toFixed(2)}
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Purchase Date</span>
                <div className="flex items-center gap-1.5 text-lg font-semibold text-slate-900">
                  <Calendar className="w-5 h-5 text-slate-400" />
                  {purchaseDate ? format(new Date(purchaseDate), 'dd MMM yyyy') : 'N/A'}
                </div>
              </div>
              <div className="space-y-1 col-span-2 md:col-span-1">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Category</span>
                <div className="flex items-center gap-1.5 text-lg font-semibold text-slate-900">
                  <Tag className="w-5 h-5 text-slate-400" />
                  {category || "N/A"}
                </div>
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest border-b pb-2">Property & Supplier</h4>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Building2 className="w-4 h-4 text-slate-400 mt-1" />
                    <div className="space-y-0.5">
                      <p className="text-xs text-slate-500 uppercase">Property</p>
                      <p className="text-sm font-medium text-slate-900">{getPropertyName(propertyId)}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Truck className="w-4 h-4 text-slate-400 mt-1" />
                    <div className="space-y-0.5">
                      <p className="text-xs text-slate-500 uppercase">Supplier</p>
                      <p className="text-sm font-medium text-slate-900">{supplier || "Not specified"}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest border-b pb-2">Logging Details</h4>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <User className="w-4 h-4 text-slate-400 mt-1" />
                    <div className="space-y-0.5">
                      <p className="text-xs text-slate-500 uppercase">Logged By</p>
                      <p className="text-sm font-medium text-slate-900">{loggedBy || "System"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="w-4 h-4 text-slate-400 mt-1" />
                    <div className="space-y-0.5">
                      <p className="text-xs text-slate-500 uppercase">Created On</p>
                      <p className="text-sm font-medium text-slate-900">
                        {createdDate ? format(new Date(createdDate), 'dd MMM yyyy HH:mm') : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            {notes && (
              <div className="space-y-3 pt-4 border-t">
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-400" />
                  Notes
                </h4>
                <div className="bg-slate-50 p-4 rounded-lg text-sm text-slate-700 leading-relaxed italic whitespace-pre-wrap">
                  "{notes}"
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="pt-6 border-t flex flex-col gap-3">
              {receiptLink ? (
                <Button
                  className="w-full bg-orange-600 hover:bg-orange-700 h-11 gap-2"
                  asChild
                >
                  <a href={receiptLink} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4" />
                    View Receipt / Invoice
                  </a>
                </Button>
              ) : (
                <div className="text-center p-4 bg-slate-50 rounded-lg text-sm text-slate-500 italic">
                  No receipt link provided
                </div>
              )}
              <Button
                variant="outline"
                className="w-full h-11"
                onClick={onClose}
              >
                Close Details
              </Button>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
