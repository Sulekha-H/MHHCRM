import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingCart,
  Calendar,
  Building2,
  PoundSterling,
  Tag,
  ExternalLink,
  Edit,
  Trash2,
  Eye,
  Truck
} from "lucide-react";
import { format } from "date-fns";

export default function PropertyPurchaseCard({
  purchase,
  onEdit,
  onViewDetails,
  onDelete,
  getPropertyName
}) {
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

  const cost = purchase["Cost"] || purchase.cost || 0;
  const itemName = purchase["Item Name"] || purchase.item_name || "Unknown Item";
  const purchaseDate = purchase["Purchase Date"] || purchase.purchase_date;
  const propertyId = purchase["Property ID"] || purchase.property_id;
  const category = purchase["Category"] || purchase.category;
  const status = purchase["Status"] || purchase.status || "Ordered";
  const receiptLink = purchase["Receipt Link"] || purchase.receipt_link;

  return (
    <Card className="group hover:shadow-md transition-all duration-200 border-slate-200 overflow-hidden">
      <CardHeader className="p-4 pb-2 space-y-0">
        <div className="flex justify-between items-start gap-2">
          <Badge className={`${getStatusColor(status)} font-medium`}>
            {status}
          </Badge>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-400 hover:text-blue-600"
              onClick={() => onViewDetails(purchase)}
            >
              <Eye className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-400 hover:text-orange-600"
              onClick={() => onEdit(purchase)}
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-400 hover:text-red-600"
              onClick={() => onDelete(purchase)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <h3 className="text-lg font-bold text-slate-900 mt-2 line-clamp-1 uppercase">
          {itemName}
        </h3>
      </CardHeader>

      <CardContent className="p-4 pt-2 space-y-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-slate-600">
            <PoundSterling className="w-4 h-4 text-orange-500" />
            <span className="font-bold text-slate-900">£{parseFloat(cost).toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <Calendar className="w-4 h-4 text-orange-500" />
            <span>{purchaseDate ? format(new Date(purchaseDate), 'dd MMM yyyy') : 'N/A'}</span>
          </div>
        </div>

        <div className="space-y-2 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Building2 className="w-4 h-4 text-slate-400" />
            <span className="truncate">{getPropertyName(propertyId)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Tag className="w-4 h-4 text-slate-400" />
            <span>{category || "Uncategorized"}</span>
          </div>
          {purchase["Supplier"] && (
             <div className="flex items-center gap-2 text-sm text-slate-600">
             <Truck className="w-4 h-4 text-slate-400" />
             <span className="truncate">{purchase["Supplier"]}</span>
           </div>
          )}
        </div>

        {receiptLink && (
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-2 text-xs h-8 gap-2 border-orange-100 hover:bg-orange-50 hover:text-orange-600 text-orange-600"
            asChild
          >
            <a href={receiptLink} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-3 h-3" />
              View Receipt
            </a>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
