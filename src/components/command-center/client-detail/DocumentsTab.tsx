import { useState } from "react";
import { FileText, FolderOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useClientDocuments, DOCUMENT_TYPES, DOCUMENT_TYPE_LABELS, type ClientDocument, type DocumentType } from "@/hooks/useClientDocuments";
import { DocumentUpload } from "@/components/command-center/documents/DocumentUpload";
import { DocumentList } from "@/components/command-center/documents/DocumentList";
import { DocumentPreview } from "@/components/command-center/documents/DocumentPreview";

interface DocumentsTabProps {
  clientId: string;
}

export function DocumentsTab({ clientId }: DocumentsTabProps) {
  const { user } = useAuth();
  const [previewDocument, setPreviewDocument] = useState<ClientDocument | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const {
    data: documents,
    isLoading,
    error,
    refetch,
  } = useClientDocuments(clientId);

  const handlePreview = (document: ClientDocument) => {
    setPreviewDocument(document);
    setPreviewOpen(true);
  };

  const handlePreviewClose = (open: boolean) => {
    setPreviewOpen(open);
    if (!open) {
      setPreviewDocument(null);
    }
  };

  const handleDocumentReplaced = () => {
    refetch();
  };

  // Count documents by type
  const documentCounts = documents?.reduce(
    (acc, doc) => {
      const type = doc.type || "Other";
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-lg" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <p className="text-red-600 mb-2">Failed to load documents</p>
            <p className="text-sm text-slate-500">{error.message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-slate-500" />
            Upload Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DocumentUpload clientId={clientId} userId={user?.id} />
        </CardContent>
      </Card>

      {/* Document Summary */}
      {documents && documents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-slate-500" />
              Document Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {DOCUMENT_TYPES.map((type) => {
                const count = documentCounts?.[type] || 0;
                return (
                  <div
                    key={type}
                    className="p-3 rounded-lg border bg-slate-50 text-center"
                  >
                    <p className="text-2xl font-bold text-slate-900">{count}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {DOCUMENT_TYPE_LABELS[type]}
                    </p>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-slate-500">
                Total: <span className="font-medium text-slate-900">{documents.length}</span> document
                {documents.length !== 1 ? "s" : ""}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Document List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-slate-500" />
            Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DocumentList
            clientId={clientId}
            documents={documents || []}
            isLoading={false}
            userId={user?.id}
            onPreview={handlePreview}
          />
        </CardContent>
      </Card>

      {/* Document Preview Modal */}
      <DocumentPreview
        document={previewDocument}
        documents={documents || []}
        open={previewOpen}
        onOpenChange={handlePreviewClose}
        clientId={clientId}
        userId={user?.id}
        onDocumentReplaced={handleDocumentReplaced}
      />
    </div>
  );
}
