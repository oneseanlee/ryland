import { useState, useMemo, useCallback, useRef } from "react";
import {
  FileText,
  Image,
  File,
  Grid3X3,
  List,
  MoreVertical,
  Eye,
  Download,
  RefreshCw,
  Trash2,
  Loader2,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  useDeleteDocument,
  useDownloadUrl,
  useReplaceDocument,
  type ClientDocument,
  type DocumentType,
  DOCUMENT_TYPES,
  DOCUMENT_TYPE_LABELS,
  getFileExtension,
  isImageFile,
  isPdfFile,
  validateFile,
} from "@/hooks/useClientDocuments";
import { DocumentCategoryBadge } from "./DocumentCategoryBadge";

type ViewMode = "grid" | "list";
type SortField = "uploaded_at" | "type" | "filename";
type SortOrder = "asc" | "desc";

interface DocumentListProps {
  clientId: string;
  documents: ClientDocument[];
  isLoading: boolean;
  userId: string | undefined;
  onPreview: (document: ClientDocument) => void;
}

export function DocumentList({
  clientId,
  documents,
  isLoading,
  userId,
  onPreview,
}: DocumentListProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [filterType, setFilterType] = useState<DocumentType | "all">("all");
  const [sortField, setSortField] = useState<SortField>("uploaded_at");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<ClientDocument | null>(null);
  const [replacingDocument, setReplacingDocument] = useState<string | null>(null);
  const [downloadingDocument, setDownloadingDocument] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const deleteMutation = useDeleteDocument(clientId);
  const replaceMutation = useReplaceDocument(clientId);
  const downloadUrlMutation = useDownloadUrl();

  // Filter and sort documents
  const filteredAndSortedDocuments = useMemo(() => {
    let result = [...documents];

    // Filter by type
    if (filterType !== "all") {
      result = result.filter((doc) => doc.type === filterType);
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "uploaded_at":
          comparison = new Date(a.uploaded_at).getTime() - new Date(b.uploaded_at).getTime();
          break;
        case "type":
          comparison = (a.type || "zzz").localeCompare(b.type || "zzz");
          break;
        case "filename":
          comparison = a.filename.localeCompare(b.filename);
          break;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return result;
  }, [documents, filterType, sortField, sortOrder]);

  const handleDeleteClick = useCallback((document: ClientDocument) => {
    setDocumentToDelete(document);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!documentToDelete) return;

    try {
      await deleteMutation.mutateAsync({
        documentId: documentToDelete.id,
        userId,
      });
      toast({
        title: "Document deleted",
        description: `${documentToDelete.filename} has been deleted.`,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to delete document";
      toast({
        title: "Delete failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
    }
  }, [documentToDelete, deleteMutation, userId, toast]);

  const handleDownload = useCallback(
    async (document: ClientDocument) => {
      setDownloadingDocument(document.id);
      try {
        const url = await downloadUrlMutation.mutateAsync(document.storage_path);
        // Create a temporary link and trigger download
        const link = window.document.createElement("a");
        link.href = url;
        link.download = document.filename;
        link.target = "_blank";
        window.document.body.appendChild(link);
        link.click();
        window.document.body.removeChild(link);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to download document";
        toast({
          title: "Download failed",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setDownloadingDocument(null);
      }
    },
    [downloadUrlMutation, toast]
  );

  const handleReplaceClick = useCallback((document: ClientDocument) => {
    setReplacingDocument(document.id);
    // Trigger file input click
    setTimeout(() => {
      fileInputRef.current?.click();
    }, 0);
  }, []);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !replacingDocument) return;

      const validation = validateFile(file);
      if (!validation.valid) {
        toast({
          title: "Invalid file",
          description: validation.error,
          variant: "destructive",
        });
        setReplacingDocument(null);
        e.target.value = "";
        return;
      }

      try {
        await replaceMutation.mutateAsync({
          documentId: replacingDocument,
          file,
          userId,
        });
        toast({
          title: "Document replaced",
          description: `${file.name} has been uploaded as the new version.`,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to replace document";
        toast({
          title: "Replace failed",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setReplacingDocument(null);
        e.target.value = "";
      }
    },
    [replacingDocument, replaceMutation, userId, toast]
  );

  // Get file icon based on type
  const getFileIcon = (filename: string) => {
    if (isImageFile(filename)) {
      return <Image className="h-6 w-6 text-blue-500" />;
    }
    if (isPdfFile(filename)) {
      return <FileText className="h-6 w-6 text-red-500" />;
    }
    return <File className="h-6 w-6 text-slate-500" />;
  };

  // Format relative time
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Get uploader name
  const getUploaderName = (document: ClientDocument) => {
    if (document.uploaded_by_user?.raw_user_meta_data?.full_name) {
      return document.uploaded_by_user.raw_user_meta_data.full_name;
    }
    if (document.uploaded_by_user?.email) {
      return document.uploaded_by_user.email;
    }
    return "Unknown";
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (documents.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
          <FileText className="h-8 w-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-medium text-slate-900 mb-2">No documents uploaded yet</h3>
        <p className="text-slate-500 max-w-md mx-auto">
          Upload documents using the area above. Documents will appear here once added.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Hidden file input for replace */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg,.gif,.webp"
        onChange={handleFileSelect}
        className="hidden"
        aria-label="Replace document"
      />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Filter */}
        <Select
          value={filterType}
          onValueChange={(value) => setFilterType(value as DocumentType | "all")}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {DOCUMENT_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {DOCUMENT_TYPE_LABELS[type]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sort */}
        <Select
          value={`${sortField}-${sortOrder}`}
          onValueChange={(value) => {
            const [field, order] = value.split("-") as [SortField, SortOrder];
            setSortField(field);
            setSortOrder(order);
          }}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="uploaded_at-desc">Newest first</SelectItem>
            <SelectItem value="uploaded_at-asc">Oldest first</SelectItem>
            <SelectItem value="filename-asc">Name (A-Z)</SelectItem>
            <SelectItem value="filename-desc">Name (Z-A)</SelectItem>
            <SelectItem value="type-asc">Type (A-Z)</SelectItem>
            <SelectItem value="type-desc">Type (Z-A)</SelectItem>
          </SelectContent>
        </Select>

        {/* View toggle */}
        <div className="flex items-center border rounded-lg p-1 ml-auto">
          <Button
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("grid")}
            className="h-8 w-8 p-0"
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("list")}
            className="h-8 w-8 p-0"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-slate-500">
        {filteredAndSortedDocuments.length} document
        {filteredAndSortedDocuments.length !== 1 ? "s" : ""}
        {filterType !== "all" && ` in ${DOCUMENT_TYPE_LABELS[filterType]}`}
      </p>

      {/* Filtered empty state */}
      {filteredAndSortedDocuments.length === 0 && documents.length > 0 && (
        <div className="text-center py-8">
          <p className="text-slate-500">No documents match the current filter.</p>
          <Button
            variant="link"
            className="mt-2"
            onClick={() => setFilterType("all")}
          >
            Clear filter
          </Button>
        </div>
      )}

      {/* Grid View */}
      {viewMode === "grid" && filteredAndSortedDocuments.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAndSortedDocuments.map((document) => (
            <Card
              key={document.id}
              className="group hover:shadow-md transition-shadow"
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {/* File icon */}
                  <div className="h-12 w-12 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                    {getFileIcon(document.filename)}
                  </div>

                  {/* File info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-slate-900 truncate">
                      {document.filename}
                    </p>
                    <div className="mt-1">
                      <DocumentCategoryBadge type={document.type} />
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                      <Clock className="h-3 w-3" />
                      <span>{formatRelativeTime(document.uploaded_at)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onPreview(document)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDownload(document)}
                        disabled={downloadingDocument === document.id}
                      >
                        {downloadingDocument === document.id ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4 mr-2" />
                        )}
                        Download
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleReplaceClick(document)}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Replace
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteClick(document)}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Version badge */}
                {document.version > 1 && (
                  <div className="mt-3 pt-3 border-t">
                    <span className="text-xs text-slate-500">
                      Version {document.version}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === "list" && filteredAndSortedDocuments.length > 0 && (
        <div className="border rounded-lg divide-y">
          {filteredAndSortedDocuments.map((document) => (
            <div
              key={document.id}
              className="flex items-center gap-4 p-4 hover:bg-slate-50 group"
            >
              {/* File icon */}
              <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                {getFileIcon(document.filename)}
              </div>

              {/* File info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-slate-900 truncate">
                  {document.filename}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Uploaded by {getUploaderName(document)} •{" "}
                  {formatRelativeTime(document.uploaded_at)}
                </p>
              </div>

              {/* Category badge */}
              <DocumentCategoryBadge type={document.type} />

              {/* Version */}
              {document.version > 1 && (
                <span className="text-xs text-slate-500">v{document.version}</span>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onPreview(document)}
                  className="h-8"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDownload(document)}
                  disabled={downloadingDocument === document.id}
                  className="h-8"
                >
                  {downloadingDocument === document.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleReplaceClick(document)}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Replace
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDeleteClick(document)}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{documentToDelete?.filename}"? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
