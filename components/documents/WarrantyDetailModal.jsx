import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
    Shield, Calendar, Building2, PoundSterling, Edit, Link2, Package, User, Trash2
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

const formatPaymentDay = (day) => {
  if (!day) return null;
  const suffix = ['th', 'st', 'nd', 'rd'];
  const v = day % 100;
  return day + (suffix[(v - 20) % 10] || suffix[v] || suffix[0]);
};

export default function WarrantyDetailModal({
  warranty,
  getPropertyName,
  getAccommodationName,
  getStatusColor,
  getLoggedByName,
  onClose,
  onEdit,
  onDelete
}) {
  if (!warranty) return null;

  // Handle both snake_case (Base44) and Title Case (Supabase) field names
  const productName = warranty.product_name || warranty["Product Name"];
  const brand = warranty.brand || warranty.Brand;
  const modelNumber = warranty.model_number || warranty["Model Number"];
  const serialNumber = warranty.serial_number || warranty["Serial Number"];
  const propertyId = warranty.property_id || warranty["Property ID"];
  const accommodationId = warranty.accommodation_id || warranty["Accommodation ID"];
  const purchaseDate = warranty.purchase_date || warranty["Purchase Date"];
  const warrantyStartDate = warranty.warranty_start_date || warranty["Warranty Start Date"];
  const warrantyEndDate = warranty.warranty_end_date || warranty["Warranty End Date"];
  const warrantyPeriodMonths = warranty.warranty_period_months || warranty["Warranty Period Months"];
  const supplier = warranty.supplier || warranty.Supplier;
  const purchasePrice = warranty.purchase_price || warranty["Purchase Price"];
  const warrantyType = warranty.warranty_type || warranty["Warranty Type"];
  const status = warranty.status || warranty.Status;
  const policyProvider = warranty.policy_provider || warranty["Policy Provider"];
  const policyNumber = warranty.policy_number || warranty["Policy Number"];
  const letterReceivedFrom = warranty.letter_received_from || warranty["Letter Received From"];
  const directDebitPaymentDay = warranty.direct_debit_payment_day || warranty["Direct Debit Payment Day"];
  const onlineAccountWebsite = warranty.online_account_website || warranty["Online Account Website"];
  const onlineAccountEmail = warranty.online_account_email || warranty["Online Account Email"];
  const onlineAccountPassword = warranty.online_account_password || warranty["Online Account Password"];
  const warrantyDocumentUrl = warranty.warranty_document_url || warranty["Warranty Document URL"];
  const receiptUrl = warranty.receipt_url || warranty["Receipt URL"];
  const notes = warranty.notes || warranty.Notes;
  const createdDate = warranty.created_date || warranty["Created Date"];
  const loggedBy = warranty.logged_by || warranty["Logged By"];

  console.log("🛡️ WarrantyDetailModal - Extracted fields:", {
    productName,
    brand,
    modelNumber,
    serialNumber,
    propertyId,
    accommodationId,
    purchaseDate,
    warrantyStartDate,
    warrantyEndDate,
    warrantyPeriodMonths,
    supplier,
    purchasePrice,
    warrantyType,
    status,
    policyProvider,
    policyNumber,
    letterReceivedFrom,
    directDebitPaymentDay,
    onlineAccountWebsite,
    onlineAccountEmail,
    warrantyDocumentUrl,
    receiptUrl,
    notes,
    createdDate,
    loggedBy
  });

  const getWarrantyTypeLabel = (type) => {
    if (!type) return "Not specified";
    const labels = {
      manufacturer: "Manufacturer Warranty",
      extended: "Extended Warranty",
      retailer: "Retailer Warranty",
      insurance: "Insurance Warranty",
      // Title case versions
      "Manufacturer": "Manufacturer Warranty",
      "Extended": "Extended Warranty",
      "Retailer": "Retailer Warranty",
      "Insurance": "Insurance Warranty"
    };
    return labels[type] || type;
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
        <ScrollArea className="max-h-[90vh]">
          <div className="p-6">
            <DialogHeader className="mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-sm">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-3xl font-bold text-slate-900">{productName}</DialogTitle>
                  <p className="text-slate-600 mt-1">{brand} {modelNumber}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className={getStatusColor(status)}>{status}</Badge>
                    <Badge variant="outline">{getWarrantyTypeLabel(warrantyType)}</Badge>
                  </div>
                </div>
              </div>
            </DialogHeader>

            <h3 className="text-xl font-semibold text-slate-800 mb-4">Product Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DetailItem icon={<Package />} label="Brand">{brand}</DetailItem>
              <DetailItem icon={<Package />} label="Model Number">{modelNumber}</DetailItem>
              <DetailItem icon={<Package />} label="Serial Number">{serialNumber}</DetailItem>
              <DetailItem icon={<Building2 />} label="Location">
                {getPropertyName(propertyId)}
                {accommodationId && ` - ${getAccommodationName(accommodationId)}`}
              </DetailItem>
            </div>

            <Separator className="my-6" />

            <h3 className="text-xl font-semibold text-slate-800 mb-4">Purchase & Warranty Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DetailItem icon={<Calendar />} label="Purchase Date">
                {formatDate(purchaseDate)}
              </DetailItem>
              <DetailItem icon={<Calendar />} label="Warranty Period">
                <div>
                  <div>{warrantyStartDate && warrantyEndDate ? `${formatDate(warrantyStartDate)} - ${formatDate(warrantyEndDate)}` : <span className="text-sm font-normal text-slate-400">Not provided</span>}</div>
                  {warrantyPeriodMonths && <div className="text-sm text-slate-500 mt-1">{warrantyPeriodMonths} months</div>}
                </div>
              </DetailItem>
              <DetailItem icon={<User />} label="Supplier">{supplier}</DetailItem>
              <DetailItem icon={<PoundSterling />} label="Purchase Price">
                {purchasePrice ? `£${purchasePrice.toFixed(2)}` : null}
              </DetailItem>
            </div>

            {(policyProvider || policyNumber || letterReceivedFrom || directDebitPaymentDay) && (
              <>
                <Separator className="my-6" />
                <h3 className="text-xl font-semibold text-slate-800 mb-4">Policy & Payment Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {policyProvider && (
                    <DetailItem icon={<Shield />} label="Policy Provider">{policyProvider}</DetailItem>
                  )}
                  {policyNumber && (
                    <DetailItem icon={<Package />} label="Policy Number">{policyNumber}</DetailItem>
                  )}
                  {letterReceivedFrom && (
                    <DetailItem icon={<User />} label="Letter Received From">{letterReceivedFrom}</DetailItem>
                  )}
                  {directDebitPaymentDay && (
                    <DetailItem icon={<Calendar />} label="Direct Debit Payment Day">
                      {formatPaymentDay(directDebitPaymentDay)}
                    </DetailItem>
                  )}
                </div>
              </>
            )}

            {(onlineAccountWebsite || onlineAccountEmail || onlineAccountPassword) && (
              <>
                <Separator className="my-6" />
                <h3 className="text-xl font-semibold text-slate-800 mb-4">Online Account Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {onlineAccountWebsite && (
                    <DetailItem icon={<Link2 />} label="Website">
                      <a 
                        href={onlineAccountWebsite} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-blue-600 hover:underline"
                      >
                        Visit Portal
                      </a>
                    </DetailItem>
                  )}
                  {onlineAccountEmail && (
                    <DetailItem icon={<User />} label="Login Email">{onlineAccountEmail}</DetailItem>
                  )}
                  {onlineAccountPassword && (
                    <DetailItem icon={<Shield />} label="Password">••••••••</DetailItem>
                  )}
                </div>
              </>
            )}

            {(warrantyDocumentUrl || receiptUrl) && (
              <>
                <Separator className="my-6" />
                <h3 className="text-xl font-semibold text-slate-800 mb-4">Documents</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {warrantyDocumentUrl && (
                    <DetailItem icon={<Link2 />} label="Warranty Document">
                      <a 
                        href={warrantyDocumentUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-blue-600 hover:underline flex items-center gap-2"
                      >
                        <Shield className="w-4 h-4" />
                        View Warranty
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
                  {loggedBy || (getLoggedByName ? getLoggedByName(warranty) : null)}
                </span>
              </DetailItem>
            </div>

            <DialogFooter className="mt-8">
              <Button onClick={() => {
                onClose();
                onEdit(warranty);
              }} className="bg-blue-600 hover:bg-blue-700">
                <Edit className="w-4 h-4 mr-2" />
                Edit Warranty
              </Button>
              {onDelete && (
                <Button onClick={() => {
                  if (window.confirm("Are you sure you want to delete this warranty? It will be moved to deleted entries.")) {
                    onDelete(warranty.id || warranty.ID);
                  }
                }} variant="destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Warranty
                </Button>
              )}
            </DialogFooter>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
