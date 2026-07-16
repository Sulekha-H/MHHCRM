import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
    Wrench, Calendar, Building2, PoundSterling, Edit, Link2, Package, User, Zap, Trash2
} from 'lucide-react';
import { format } from 'date-fns';

const DetailItem = ({ icon, label, children }) => (
  <div className="flex items-start gap-4">
    <div className="flex-shrink-0 w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
      {React.cloneElement(icon, { className: "w-5 h-5 text-slate-600" })}
    </div>
    <div>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <div className="text-md font-semibold text-slate-900">{children || <span className="text-sm font-normal text-slate-400">Not provided</span>}</div>
    </div>
  </div>
);

export default function ApplianceDetailModal({
  appliance,
  getPropertyName,
  getAccommodationName,
  getConditionColor,
  onClose,
  onEdit,
  onDelete
}) {
  if (!appliance) return null;

  console.log("🔧 ApplianceDetailModal - Raw appliance data:", appliance);
  console.log("🔧 All keys in appliance object:", Object.keys(appliance));

  // Helper function to get field value - prioritize SQL schema format (Title Case with spaces)
  const getField = (titleCaseSpaces, pascalCase, snakeCase) => {
    return appliance[titleCaseSpaces] || appliance[pascalCase] || appliance[snakeCase] || null;
  };

  // Extract all fields with SQL schema format as priority
  const applianceName = getField('Appliance Name', 'Appliance_Name', 'appliance_name');
  const category = getField('Category', 'Category', 'category');
  const brand = getField('Brand', 'Brand', 'brand');
  const modelNumber = getField('Model Number', 'Model_Number', 'model_number');
  const serialNumber = getField('Serial Number', 'Serial_Number', 'serial_number');
  const propertyId = getField('Property ID', 'Property_Id', 'property_id');
  const accommodationId = getField('Accommodation ID', 'Accommodation_Id', 'accommodation_id');
  const purchaseDate = getField('Purchase Date', 'Purchase_Date', 'purchase_date');
  const installationDate = getField('Installation Date', 'Installation_Date', 'installation_date');
  
  // Special handling for numeric fields
  let purchasePrice = appliance['Purchase Price'];
  if (purchasePrice === undefined || purchasePrice === null) {
    purchasePrice = appliance.Purchase_Price;
  }
  if (purchasePrice === undefined || purchasePrice === null) {
    purchasePrice = appliance.purchase_price;
  }
  
  const supplier = getField('Supplier', 'Supplier', 'supplier');
  const condition = getField('Condition', 'Condition', 'condition');
  const lastServiceDate = getField('Last Service Date', 'Last_Service_Date', 'last_service_date');
  const nextServiceDue = getField('Next Service Due', 'Next_Service_Due', 'next_service_due');
  const energyRating = getField('Energy Rating', 'Energy_Rating', 'energy_rating');
  const warrantyId = getField('Warranty ID', 'Warranty_Id', 'warranty_id');
  const manualUrl = getField('Manual URL', 'Manual_Url', 'manual_url');
  const receiptUrl = getField('Receipt URL', 'Receipt_Url', 'receipt_url');
  const notes = getField('Notes', 'Notes', 'notes');
  const createdDate = getField('Created Date', 'Created_Date', 'created_date');
  const updatedDate = getField('Updated Date', 'Updated_Date', 'updated_date');
  const loggedBy = getField('Logged By', 'Logged_By', 'logged_by');
  const createdBy = getField('Created By', 'Created_By', 'created_by');

  console.log("🔧 ApplianceDetailModal - Extracted fields:", {
    applianceName,
    category,
    brand,
    modelNumber,
    serialNumber,
    propertyId,
    accommodationId,
    purchaseDate,
    installationDate,
    purchasePrice,
    supplier,
    condition,
    lastServiceDate,
    nextServiceDue,
    energyRating,
    warrantyId,
    manualUrl,
    receiptUrl,
    notes,
    createdDate,
    updatedDate,
    loggedBy,
    createdBy
  });

  const getCategoryLabel = (cat) => {
    if (!cat) return "Not specified";
    const labels = {
      // SQL schema format (Title Case)
      "Kitchen": "Kitchen",
      "Laundry": "Laundry",
      "Heating & Cooling": "Heating & Cooling",
      "Electrical": "Electrical",
      "Plumbing": "Plumbing",
      "Furniture": "Furniture",
      "Electronics": "Electronics",
      "Other": "Other",
      // Alternative formats
      kitchen: "Kitchen",
      laundry: "Laundry",
      heating_cooling: "Heating & Cooling",
      electrical: "Electrical",
      plumbing: "Plumbing",
      furniture: "Furniture",
      electronics: "Electronics",
      other: "Other"
    };
    return labels[cat] || cat?.replace(/_/g, ' ');
  };

  const getConditionLabel = (cond) => {
    if (!cond) return "Not specified";
    const labels = {
      // SQL schema format (Title Case)
      "New": "New",
      "Good": "Good",
      "Fair": "Fair",
      "Needs Repair": "Needs Repair",
      "Out of Order": "Out of Order",
      // Alternative formats
      new: "New",
      good: "Good",
      fair: "Fair",
      needs_repair: "Needs Repair",
      out_of_order: "Out of Order"
    };
    return labels[cond] || cond?.replace(/_/g, ' ');
  };

  const getLoggedByNameLocal = () => {
    if (loggedBy) {
      return loggedBy;
    }
    if (createdBy) {
      return createdBy.split('@')[0];
    }
    return '-';
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return null;
      return format(date, 'dd MMMM yyyy');
    } catch (error) {
      return null;
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return null;
      return format(date, 'dd MMMM yyyy, HH:mm');
    } catch (error) {
      return null;
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl w-full p-0">
        <DialogDescription className="sr-only">
          View detailed information about the appliance including purchase details, maintenance schedule, and documents.
        </DialogDescription>
        <ScrollArea className="max-h-[90vh]">
          <div className="p-6">
            <DialogHeader className="mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl flex items-center justify-center shadow-sm">
                  <Wrench className="w-8 h-8 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-3xl font-bold text-slate-900">{applianceName || "Unnamed Appliance"}</DialogTitle>
                  {(brand || modelNumber) && (
                    <p className="text-slate-600 mt-1">
                      {brand && <span>{brand}</span>}
                      {brand && modelNumber && <span> </span>}
                      {modelNumber && <span>{modelNumber}</span>}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {condition && <Badge className={getConditionColor(condition)}>{getConditionLabel(condition)}</Badge>}
                    {category && <Badge variant="outline">{getCategoryLabel(category)}</Badge>}
                    {energyRating && (
                      <Badge variant="outline" className="border-green-500 text-green-700">
                        {energyRating} Energy
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </DialogHeader>

            <h3 className="text-xl font-semibold text-slate-800 mb-4">Appliance Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DetailItem icon={<Calendar />} label="Entry Date & Time">
                {createdDate ? format(new Date(createdDate), 'dd/MM/yyyy HH:mm') : 'N/A'}
              </DetailItem>
              <DetailItem icon={<Package />} label="Brand">{brand}</DetailItem>
              <DetailItem icon={<Package />} label="Model Number">{modelNumber}</DetailItem>
              <DetailItem icon={<Package />} label="Serial Number">{serialNumber}</DetailItem>
              <DetailItem icon={<Zap />} label="Energy Rating">{energyRating}</DetailItem>
              <DetailItem icon={<Building2 />} label="Location">
                {propertyId ? (
                  <>
                    {getPropertyName(propertyId)}
                    {accommodationId && ` - ${getAccommodationName(accommodationId)}`}
                  </>
                ) : null}
              </DetailItem>
            </div>

            <Separator className="my-6" />

            <h3 className="text-xl font-semibold text-slate-800 mb-4">Purchase & Installation</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DetailItem icon={<Calendar />} label="Purchase Date">
                {formatDate(purchaseDate)}
              </DetailItem>
              <DetailItem icon={<Calendar />} label="Installation Date">
                {formatDate(installationDate)}
              </DetailItem>
              <DetailItem icon={<User />} label="Supplier">{supplier}</DetailItem>
              <DetailItem icon={<PoundSterling />} label="Purchase Price">
                {purchasePrice !== undefined && purchasePrice !== null ? `£${Number(purchasePrice).toFixed(2)}` : null}
              </DetailItem>
            </div>

            {(lastServiceDate || nextServiceDue) && (
              <>
                <Separator className="my-6" />
                <h3 className="text-xl font-semibold text-slate-800 mb-4">Maintenance Schedule</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {lastServiceDate && (
                    <DetailItem icon={<Calendar />} label="Last Service Date">
                      {formatDate(lastServiceDate)}
                    </DetailItem>
                  )}
                  {nextServiceDue && (
                    <DetailItem icon={<Calendar />} label="Next Service Due">
                      {formatDate(nextServiceDue)}
                    </DetailItem>
                  )}
                </div>
              </>
            )}

            {(manualUrl || receiptUrl) && (
              <>
                <Separator className="my-6" />
                <h3 className="text-xl font-semibold text-slate-800 mb-4">Documents</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {manualUrl && (
                    <DetailItem icon={<Link2 />} label="User Manual">
                      <a 
                        href={manualUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-blue-600 hover:underline flex items-center gap-2"
                      >
                        <Package className="w-4 h-4" />
                        View Manual
                      </a>
                    </DetailItem>
                  )}
                  {receiptUrl && (
                    <DetailItem icon={<Link2 />} label="Purchase Receipt">
                      <a 
                        href={receiptUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-blue-600 hover:underline flex items-center gap-2"
                      >
                        <Package className="w-4 h-4" />
                        View Receipt
                      </a>
                    </DetailItem>
                  )}
                </div>
              </>
            )}

            {notes && (
              <>
                <Separator className="my-6" />
                <h3 className="text-xl font-semibold text-slate-800 mb-4">Additional Notes</h3>
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-slate-700 whitespace-pre-wrap">{notes}</p>
                </div>
              </>
            )}

            <Separator className="my-6" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DetailItem icon={<Calendar />} label="Created">
                {formatDateTime(createdDate)}
              </DetailItem>
              <DetailItem icon={<User />} label="Logged By">
                <span className="text-purple-700 font-medium">
                  {getLoggedByNameLocal()}
                </span>
              </DetailItem>
            </div>

            <DialogFooter className="mt-8">
              <Button onClick={() => {
                onClose();
                onEdit(appliance);
              }} className="bg-orange-600 hover:bg-orange-700">
                <Edit className="w-4 h-4 mr-2" />
                Edit Appliance
              </Button>
              {onDelete && (
                <Button onClick={() => {
                  if (window.confirm("Are you sure you want to delete this appliance? It will be moved to deleted entries.")) {
                    onDelete(appliance.id || appliance.ID || appliance.Id);
                  }
                }} variant="destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Appliance
                </Button>
              )}
            </DialogFooter>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}