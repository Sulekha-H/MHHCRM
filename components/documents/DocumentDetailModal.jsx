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
    FileText, Calendar, User, Shield, Edit, Link2, Tag, Trash2
} from 'lucide-react';
import { format } from 'date-fns';

const DetailItem = ({ icon, label, children }) => (
  <div className="flex items-start gap-4">
    <div className="flex-shrink-0 w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
      {React.cloneElement(icon, { className: "w-5 h-5 text-slate-600" })}
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <div className="text-md font-semibold text-slate-900 break-words">{children || <span className="text-sm font-normal text-slate-400">Not provided</span>}</div>
    </div>
  </div>
);

export default function DocumentDetailModal({
  document,
  getResidentName,
  getConfidentialityColor,
  getLoggedByName,
  onClose,
  onEdit,
  onDelete
}) {
  if (!document) return null;

  // Handle both snake_case (Base44) and Title Case (Supabase) field names
  const title = document.title || document.Title || document["Title"];
  const documentType = document.document_type || document["Document Type"];
  const confidentiality = document.confidentiality || document.Confidentiality;
  const residentId = document.resident_id || document["Resident ID"];
  const createdDate = document.created_date || document["Created Date"];
  const createdBy = document.created_by || document["Created By"];
  const fileUrl = document.file_url || document["File URL"];
  const description = document.description || document.Description;
  const tags = document.tags || document.Tags;
  const category = document.category || document.Category;
  const expiryDate = document.expiry_date || document["Expiry Date"];
  const loggedBy = document.logged_by || document["Logged By"];

  console.log("📄 Extracted fields:", {
    title,
    documentType,
    confidentiality,
    residentId,
    createdDate,
    createdBy,
    fileUrl,
    description,
    tags,
    category,
    expiryDate,
    loggedBy
  });

  const residentName = residentId ? getResidentName(residentId) : null;

  const getDocumentTypeLabel = (type) => {
    if (!type) return "Not specified";
    const labels = {
      policy: "Policy",
      procedure: "Procedure", 
      form: "Form",
      report: "Report",
      correspondence: "Correspondence",
      resident_file: "Resident File",
      other: "Other",
      // Title case versions
      "Policy": "Policy",
      "Procedure": "Procedure",
      "Form": "Form",
      "Report": "Report",
      "Correspondence": "Correspondence",
      "Resident File": "Resident File",
      "Other": "Other"
    };
    return labels[type] || type?.replace(/_/g, ' ');
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

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-full p-0">
        <ScrollArea className="max-h-[80vh]">
          <div className="p-6">
            <DialogHeader className="mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-sm">
                  <FileText className="w-8 h-8 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-bold text-slate-900">{title}</DialogTitle>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <Badge variant="outline">{getDocumentTypeLabel(documentType)}</Badge>
                    <Badge className={getConfidentialityColor(confidentiality)}>{confidentiality}</Badge>
                    {residentName && <Badge variant="outline" className="border-purple-500 text-purple-700">{residentName}</Badge>}
                  </div>
                </div>
              </div>
            </DialogHeader>

            <h3 className="text-xl font-semibold text-slate-800 mb-4">Document Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DetailItem icon={<Tag />} label="Document Type">{getDocumentTypeLabel(documentType)}</DetailItem>
              <DetailItem icon={<Shield />} label="Confidentiality Level">{confidentiality}</DetailItem>
              {residentName && (
                <DetailItem icon={<User />} label="Related Resident">{residentName}</DetailItem>
              )}
              <DetailItem icon={<Calendar />} label="Entry Date & Time">
                {createdDate ? format(new Date(createdDate), 'dd/MM/yyyy HH:mm') : 'N/A'}
              </DetailItem>
              <DetailItem icon={<User />} label="Created By">{createdBy}</DetailItem>
              {getLoggedByName && loggedBy && (
                <DetailItem icon={<User />} label="Logged By">
                  <span className="text-purple-700 font-semibold">{loggedBy}</span>
                </DetailItem>
              )}
              {expiryDate && (
                <DetailItem icon={<Calendar />} label="Expiry Date">
                  {formatDate(expiryDate)}
                </DetailItem>
              )}
            </div>

            {description && (
              <>
                <Separator className="my-6" />
                <h3 className="text-xl font-semibold text-slate-800 mb-4">Description</h3>
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-slate-700 whitespace-pre-wrap">{description}</p>
                </div>
              </>
            )}

            {tags && tags.length > 0 && (
              <>
                <Separator className="my-6" />
                <h3 className="text-xl font-semibold text-slate-800 mb-4">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="text-sm">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </>
            )}

            {category && (
              <>
                <Separator className="my-6" />
                <h3 className="text-xl font-semibold text-slate-800 mb-4">Category</h3>
                <Badge variant="outline" className="text-sm">{category}</Badge>
              </>
            )}

            <Separator className="my-6" />
            <h3 className="text-xl font-semibold text-slate-800 mb-4">Document File</h3>
            <DetailItem icon={<Link2 />} label="File URL">
              <a 
                href={fileUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-blue-600 hover:underline flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                View Document
              </a>
            </DetailItem>

            <DialogFooter className="mt-8">
              <Button onClick={() => {
                onClose();
                onEdit(document);
              }} className="bg-blue-600 hover:bg-blue-700">
                <Edit className="w-4 h-4 mr-2" />
                Edit Document
              </Button>
              {onDelete && (
                <Button onClick={() => {
                  if (window.confirm("Are you sure you want to delete this document? It will be moved to deleted entries.")) {
                    onDelete(document.id || document.ID);
                  }
                }} variant="destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Document
                </Button>
              )}
            </DialogFooter>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}