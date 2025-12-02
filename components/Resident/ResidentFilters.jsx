import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Filter, X } from "lucide-react";

export default function ResidentFilters({ filters, onFilterChange, onClearFilters }) {
  return (
    <div className="flex flex-wrap gap-4 items-center">
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-slate-500" />
        <span className="text-sm font-medium text-slate-700">Filters:</span>
      </div>
      
      <Select 
        value={filters.accommodationType} 
        onValueChange={(value) => onFilterChange('accommodationType', value)}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Accommodation" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          <SelectItem value="shared_house">Shared House</SelectItem>
          <SelectItem value="studio_flat">Studio Flat</SelectItem>
          <SelectItem value="bedsit">Bedsit</SelectItem>
          <SelectItem value="supported_flat">Supported Flat</SelectItem>
        </SelectContent>
      </Select>

      <Select 
        value={filters.supportLevel} 
        onValueChange={(value) => onFilterChange('supportLevel', value)}
      >
        <SelectTrigger className="w-32">
          <SelectValue placeholder="Support Level" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Levels</SelectItem>
          <SelectItem value="low">Low</SelectItem>
          <SelectItem value="medium">Medium</SelectItem>
          <SelectItem value="high">High</SelectItem>
          <SelectItem value="intensive">Intensive</SelectItem>
        </SelectContent>
      </Select>

      <Button
        variant="outline"
        size="sm"
        onClick={onClearFilters}
        className="flex items-center gap-2"
      >
        <X className="w-4 h-4" />
        Clear
      </Button>
    </div>
  );
}