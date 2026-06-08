import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, MapPin, Building2, Eye, Edit, Trash2 } from "lucide-react";

export default function UtilityCard({ utility, propertyName, onEdit, onViewDetails, onDelete, isManagement }) {
  const utilityType = utility["Utility Type"] || "Utility";
  const companyName = utility["Company Name"] || "Unknown Provider";
  const accountNumber = utility["Account Number"] || utility["Company Account Number"] || "N/A";

  const getUtilityIconColor = (type) => {
    switch (type.toLowerCase()) {
      case 'electricity': return 'text-yellow-500 bg-yellow-50';
      case 'gas': return 'text-orange-500 bg-orange-50';
      case 'water': return 'text-blue-500 bg-blue-50';
      case 'broadband': return 'text-purple-500 bg-purple-50';
      default: return 'text-teal-500 bg-teal-50';
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-300 overflow-hidden border-slate-200">
      <CardContent className="p-0">
        <div className="p-5">
          <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-xl ${getUtilityIconColor(utilityType)}`}>
              <Zap className="w-6 h-6" />
            </div>
            <Badge variant="secondary" className="capitalize">
              {utilityType}
            </Badge>
          </div>

          <div className="space-y-3">
            <div>
              <h3 className="text-lg font-bold text-slate-900 leading-tight">
                {companyName}
              </h3>
              {propertyName && (
                <div className="flex items-center text-slate-500 text-sm mt-1">
                  <MapPin className="w-3.5 h-3.5 mr-1" />
                  {propertyName}
                </div>
              )}
            </div>

            <div className="pt-2 space-y-2">
              <div className="flex items-center text-sm text-slate-600">
                <Building2 className="w-4 h-4 mr-2 text-slate-400" />
                <span className="font-medium mr-2">Account:</span> {accountNumber}
              </div>
            </div>
          </div>
        </div>

        <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex justify-between gap-2">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDetails(utility)}
              className="h-8 px-2"
            >
              <Eye className="w-4 h-4 mr-1" /> View
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(utility)}
              className="h-8 px-2"
            >
              <Edit className="w-4 h-4 mr-1" /> Edit
            </Button>
          </div>
          {isManagement && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(utility)}
              className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
