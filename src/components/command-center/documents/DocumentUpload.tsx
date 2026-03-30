import { useState, useCallback, useRef } from "react";
import { Upload, File, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  useUploadDocument,
  DOCUMENT_TYPES,
  DOCUMENT_TYPE_LABELS,
  validateFile,
  type DocumentType,
} from "@/hooks/useClientDocuments";

interface DocumentUploadProps {
  clientId: string;
  userId: string | undefined;
}

interface PendingFile {
  file: File;
  id: string;
}

export function DocumentUpload({ clientId, userId }: DocumentUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<DocumentType | "">("");
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const uploadMutation = useUploadDocument(clientId);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const processFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const validFiles: PendingFile[] = [];
    const errors: string[] = [];

    for (const file of fileArray) {
      const validation = validateFile(file);
      if (validation.valid) {
        validFiles.push({ file, id: `${Date.now()}-${Math.random().toString(36).slice(2)}` });
      } else {
        errors.push(`${file.name}: ${validation.error}`);
      }
    }

    if (errors.length > 0) {
      toast({
        title: "Invalid files",
        description: errors.join("\n"),
        variant: "destructive",
      });
    }

    if (validFiles.length > 0) {
      setPendingFiles(validFiles);
      setSelectedCategory("");
      setCategoryDialogOpen(true);
    }
  }, [toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  }, [processFiles]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
    // Reset input to allow re-uploading the same file
    e.target.value = "";
  }, [processFiles]);

  const handleBrowseClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleCategorySubmit = useCallback(async () => {
    if (!selectedCategory) {
      toast({
        title: "Select a category",
        description: "Please select a document category before uploading.",
        variant: "destructive",
      });
      return;
    }

    setCategoryDialogOpen(false);

    // Upload all pending files with the selected category
    for (const pendingFile of pendingFiles) {
      try {
        setUploadProgress((prev) => ({ ...prev, [pendingFile.id]: 0 }));
        await uploadMutation.mutateAsync({
          file: pendingFile.file,
          type: selectedCategory as DocumentType,
          userId,
          onProgress: (progress) => {
            setUploadProgress((prev) => ({ ...prev, [pendingFile.id]: progress }));
          },
        });
        toast({
          title: "Document uploaded",
          description: `${pendingFile.file.name} has been uploaded successfully.`,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to upload document";
        toast({
          title: "Upload failed",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setUploadProgress((prev) => {
          const updated = { ...prev };
          delete updated[pendingFile.id];
          return updated;
        });
      }
    }

    setPendingFiles([]);
    setSelectedCategory("");
  }, [selectedCategory, pendingFiles, uploadMutation, userId, toast]);

  const handleDialogClose = useCallback(() => {
    setCategoryDialogOpen(false);
    setPendingFiles([]);
    setSelectedCategory("");
  }, []);

  const isUploading = Object.keys(uploadProgress).length > 0;

  return (
    <>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative border-2 border-dashed rounded-lg p-8 transition-colors duration-200",
          isDragOver
            ? "border-primary bg-primary/5 border-solid"
            : "border-slate-200 hover:border-slate-300",
          isUploading && "opacity-50 pointer-events-none"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.png,.jpg,.jpeg,.gif,.webp"
          onChange={handleFileSelect}
          className="hidden"
          aria-label="Upload documents"
        />

        <div className="flex flex-col items-center justify-center text-center">
          <div
            className={cn(
              "h-12 w-12 rounded-full flex items-center justify-center mb-4 transition-colors",
              isDragOver ? "bg-primary/10" : "bg-slate-100"
            )}
          >
            <Upload
              className={cn(
                "h-6 w-6",
                isDragOver ? "text-primary" : "text-slate-400"
              )}
            />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-900">
              {isDragOver ? "Drop files here" : "Drag and drop files here"}
            </p>
            <p className="text-xs text-slate-500">
              or{" "}
              <button
                type="button"
                onClick={handleBrowseClick}
                className="text-primary hover:underline font-medium"
              >
                browse to upload
              </button>
            </p>
          </div>

          <p className="mt-4 text-xs text-slate-400">
            PDF, PNG, JPG, JPEG, GIF, WEBP up to 10MB
          </p>
        </div>
      </div>

      {/* Upload Progress */}
      {Object.keys(uploadProgress).length > 0 && (
        <div className="space-y-2 mt-4">
          {Object.entries(uploadProgress).map(([id, progress]) => {
            const pendingFile = pendingFiles.find((f) => f.id === id);
            return (
              <div
                key={id}
                className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg"
              >
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {pendingFile?.file.name || "Uploading..."}
                  </p>
                  <Progress value={progress} className="h-1.5 mt-1" />
                </div>
                <span className="text-xs text-slate-500">{progress}%</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Category Selection Dialog */}
      <Dialog open={categoryDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select Document Category</DialogTitle>
            <DialogDescription>
              Choose a category for {pendingFiles.length} file(s) before uploading.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {/* File Preview List */}
            {pendingFiles.length > 0 && (
              <div className="mb-4 space-y-2 max-h-40 overflow-y-auto">
                {pendingFiles.map((pf) => (
                  <div
                    key={pf.id}
                    className="flex items-center gap-2 p-2 bg-slate-50 rounded text-sm"
                  >
                    <File className="h-4 w-4 text-slate-400" />
                    <span className="truncate flex-1">{pf.file.name}</span>
                    <span className="text-xs text-slate-400">
                      {(pf.file.size / 1024).toFixed(1)}KB
                    </span>
                  </div>
                ))}
              </div>
            )}

            <Select
              value={selectedCategory}
              onValueChange={(value) => setSelectedCategory(value as DocumentType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select document category" />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {DOCUMENT_TYPE_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleDialogClose}>
              Cancel
            </Button>
            <Button
              onClick={handleCategorySubmit}
              disabled={!selectedCategory}
            >
              Upload {pendingFiles.length} file(s)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
