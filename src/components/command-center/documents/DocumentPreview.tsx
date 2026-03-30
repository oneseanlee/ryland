import { useState, useEffect, useCallback, useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  RefreshCw,
  X,
  ZoomIn,
  ZoomOut,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  useDownloadUrl,
  useReplaceDocument,
  type ClientDocument,
  isImageFile,
  isPdfFile,
  validateFile,
} from "@/hooks/useClientDocuments";
import { DocumentCategoryBadge } from "./DocumentCategoryBadge";

interface DocumentPreviewProps {
  document: ClientDocument | null;
  documents: ClientDocument[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  userId: string | undefined;
  onDocumentReplaced: () => void;
}

export function DocumentPreview({
  document,
  documents,
  open,
  onOpenChange,
  clientId,
  userId,
  onDocumentReplaced,
}: DocumentPreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [isReplacing, setIsReplacing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const downloadUrlMutation = useDownloadUrl();
  const replaceMutation = useReplaceDocument(clientId);

  // Get current document index
  const currentIndex = document
    ? documents.findIndex((d) => d.id === document.id)
    : -1;

  // Check if can navigate
  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < documents.length - 1;

  // Fetch preview URL when document changes
  useEffect(() => {
    if (document && open) {
      setIsLoadingUrl(true);
      downloadUrlMutation
        .mutateAsync(document.storage_path)
        .then((url) => {
          setPreviewUrl(url);
        })
        .catch((error) => {
          const errorMessage = error instanceof Error ? error.message : "Failed to load preview";
          toast({
            title: "Preview failed",
            description: errorMessage,
            variant: "destructive",
          });
        })
        .finally(() => {
          setIsLoadingUrl(false);
        });
    } else {
      setPreviewUrl(null);
      setZoom(1);
    }
  }, [document, open, downloadUrlMutation, toast]);

  // Handle navigation
  const handlePrev = useCallback(() => {
    if (canGoPrev && documents[currentIndex - 1]) {
      onOpenChange(true);
      // The parent component should handle the document change
    }
  }, [canGoPrev, currentIndex, documents, onOpenChange]);

  const handleNext = useCallback(() => {
    if (canGoNext && documents[currentIndex + 1]) {
      onOpenChange(true);
    }
  }, [canGoNext, currentIndex, documents, onOpenChange]);

  // Handle zoom
  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.5, 3));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.5, 0.5));
  };

  // Handle download
  const handleDownload = useCallback(async () => {
    if (!document || !previewUrl) return;

    setIsDownloading(true);
    try {
      const link = window.document.createElement("a");
      link.href = previewUrl;
      link.download = document.filename;
      link.target = "_blank";
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to download";
      toast({
        title: "Download failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  }, [document, previewUrl, toast]);

  // Handle replace
  const handleReplaceClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !document) return;

      const validation = validateFile(file);
      if (!validation.valid) {
        toast({
          title: "Invalid file",
          description: validation.error,
          variant: "destructive",
        });
        e.target.value = "";
        return;
      }

      setIsReplacing(true);
      try {
        await replaceMutation.mutateAsync({
          documentId: document.id,
          file,
          userId,
        });
        toast({
          title: "Document replaced",
          description: `${file.name} has been uploaded as the new version.`,
        });
        onDocumentReplaced();
        onOpenChange(false);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to replace document";
        toast({
          title: "Replace failed",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setIsReplacing(false);
        e.target.value = "";
      }
    },
    [document, replaceMutation, userId, toast, onDocumentReplaced, onOpenChange]
  );

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get uploader name
  const getUploaderName = () => {
    if (!document) return "Unknown";
    if (document.uploaded_by_user?.raw_user_meta_data?.full_name) {
      return document.uploaded_by_user.raw_user_meta_data.full_name;
    }
    if (document.uploaded_by_user?.email) {
      return document.uploaded_by_user.email;
    }
    return "Unknown";
  };

  if (!document) return null;

  const isImage = isImageFile(document.filename);
  const isPdf = isPdfFile(document.filename);

  return (
    <>
      {/* Hidden file input for replace */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg,.gif,.webp"
        onChange={handleFileSelect}
        className="hidden"
        aria-label="Replace document"
      />

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <DialogTitle className="truncate">{document.filename}</DialogTitle>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-slate-500">
                  <DocumentCategoryBadge type={document.type} />
                  {document.version > 1 && (
                    <span className="text-xs bg-slate-100 px-2 py-0.5 rounded">
                      Version {document.version}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </DialogHeader>

          {/* Preview Area */}
          <div className="flex-1 min-h-0 relative bg-slate-100 rounded-lg overflow-hidden">
            {isLoadingUrl && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
              </div>
            )}

            {previewUrl && !isLoadingUrl && (
              <>
                {isImage && (
                  <div
                    className="absolute inset-0 overflow-auto flex items-center justify-center p-4"
                    style={{
                      cursor: zoom > 1 ? "grab" : "default",
                    }}
                  >
                    <img
                      src={previewUrl}
                      alt={document.filename}
                      className="max-w-full h-auto transition-transform origin-center"
                      style={{
                        transform: `scale(${zoom})`,
                      }}
                    />
                  </div>
                )}

                {isPdf && (
                  <div className="absolute inset-0 flex flex-col">
                    <div className="flex-1">
                      <iframe
                        src={previewUrl}
                        className="w-full h-full border-0"
                        title={document.filename}
                      />
                    </div>
                  </div>
                )}

                {!isImage && !isPdf && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                    <div className="h-16 w-16 rounded-lg bg-slate-200 flex items-center justify-center">
                      <span className="text-2xl font-bold text-slate-400 uppercase">
                        {document.filename.split(".").pop()}
                      </span>
                    </div>
                    <p className="text-slate-500">Preview not available for this file type</p>
                    <Button onClick={handleDownload}>
                      <Download className="h-4 w-4 mr-2" />
                      Download to view
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Controls */}
          <div className="flex-shrink-0 flex items-center justify-between pt-4 border-t">
            {/* Zoom controls (only for images) */}
            <div className="flex items-center gap-2">
              {isImage && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleZoomOut}
                    disabled={zoom <= 0.5}
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-slate-500 w-16 text-center">
                    {Math.round(zoom * 100)}%
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleZoomIn}
                    disabled={zoom >= 3}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!canGoPrev}
                className="gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Prev
              </Button>
              <span className="text-sm text-slate-500">
                {currentIndex + 1} / {documents.length}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={!canGoNext}
                className="gap-1"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {isPdf && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (previewUrl) {
                      window.open(previewUrl, "_blank");
                    }
                  }}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open in new tab
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                disabled={isDownloading || !previewUrl}
              >
                {isDownloading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Download
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleReplaceClick}
                disabled={isReplacing}
              >
                {isReplacing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Replace
              </Button>
            </div>
          </div>

          {/* Metadata */}
          <div className="flex-shrink-0 text-xs text-slate-500 pt-2 border-t">
            Uploaded by {getUploaderName()} on {formatDate(document.uploaded_at)}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
