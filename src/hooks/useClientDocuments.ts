import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export type DocumentType =
  | "DriverLicense"
  | "SSNCard"
  | "TaxReturn"
  | "BankStatement"
  | "ArticlesOfOrganization"
  | "EINLetter"
  | "Other";

export const DOCUMENT_TYPES: DocumentType[] = [
  "DriverLicense",
  "SSNCard",
  "TaxReturn",
  "BankStatement",
  "ArticlesOfOrganization",
  "EINLetter",
  "Other",
];

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  DriverLicense: "Driver's License",
  SSNCard: "SSN Card",
  TaxReturn: "Tax Return",
  BankStatement: "Bank Statement",
  ArticlesOfOrganization: "Articles of Organization",
  EINLetter: "EIN Letter",
  Other: "Other",
};

export interface ClientDocument {
  id: string;
  client_id: string;
  type: DocumentType | null;
  filename: string;
  storage_path: string;
  uploaded_by: string | null;
  uploaded_at: string;
  version: number;
  uploaded_by_user?: {
    email: string;
    raw_user_meta_data?: {
      full_name?: string;
    };
  } | null;
}

interface UploadDocumentParams {
  file: File;
  type: DocumentType;
  userId: string | undefined;
}

interface ReplaceDocumentParams {
  documentId: string;
  file: File;
  userId: string | undefined;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/gif",
  "image/webp",
];

export function validateFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type: ${file.type}. Allowed types: PDF, PNG, JPG, JPEG, GIF, WEBP`,
    };
  }
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Maximum size is 10MB`,
    };
  }
  return { valid: true };
}

// Fetch all documents for a client
async function fetchClientDocuments(clientId: string): Promise<ClientDocument[]> {
  const { data, error } = await supabase
    .from("client_documents")
    .select(
      `
      *,
      uploaded_by_user:uploaded_by (
        id,
        email,
        raw_user_meta_data
      )
    `
    )
    .eq("client_id", clientId)
    .order("uploaded_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch documents: ${error.message}`);
  }

  return (data as unknown as ClientDocument[]) || [];
}

// Upload a document to Supabase Storage and create DB record
async function uploadDocument(
  clientId: string,
  params: UploadDocumentParams,
  onProgress?: (progress: number) => void
): Promise<ClientDocument> {
  const { file, type, userId } = params;

  // Validate file
  const validation = validateFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Generate storage path: {client_id}/{document_type}/{filename}
  const timestamp = Date.now();
  const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const storagePath = `${clientId}/${type}/${timestamp}-${sanitizedFilename}`;

  // Upload to Supabase Storage
  onProgress?.(10);
  const { error: uploadError } = await supabase.storage
    .from("client-documents")
    .upload(storagePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Failed to upload file: ${uploadError.message}`);
  }

  onProgress?.(50);

  // Insert database record
  const { data: document, error: dbError } = await supabase
    .from("client_documents")
    .insert({
      client_id: clientId,
      type,
      filename: file.name,
      storage_path: storagePath,
      uploaded_by: userId || null,
      version: 1,
    })
    .select()
    .single();

  if (dbError) {
    // Try to clean up the uploaded file
    await supabase.storage.from("client-documents").remove([storagePath]);
    throw new Error(`Failed to create document record: ${dbError.message}`);
  }

  onProgress?.(75);

  // Log activity
  const { error: activityError } = await supabase.from("client_activity_log").insert({
    client_id: clientId,
    user_id: userId || null,
    action_type: "DocumentUploaded",
    details: {
      document_id: document.id,
      filename: file.name,
      document_type: type,
      uploaded_at: new Date().toISOString(),
    } as Json,
  });

  if (activityError) {
    console.error("Failed to log document upload activity:", activityError);
  }

  onProgress?.(100);

  return document as ClientDocument;
}

// Delete a document from storage and database
async function deleteDocument(
  clientId: string,
  documentId: string,
  userId: string | undefined
): Promise<void> {
  // First get the document to get the storage path
  const { data: document, error: fetchError } = await supabase
    .from("client_documents")
    .select("*")
    .eq("id", documentId)
    .single();

  if (fetchError) {
    throw new Error(`Failed to fetch document: ${fetchError.message}`);
  }

  if (!document) {
    throw new Error("Document not found");
  }

  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from("client-documents")
    .remove([document.storage_path]);

  if (storageError) {
    console.error("Failed to delete file from storage:", storageError);
    // Continue anyway to delete the DB record
  }

  // Delete from database
  const { error: dbError } = await supabase
    .from("client_documents")
    .delete()
    .eq("id", documentId);

  if (dbError) {
    throw new Error(`Failed to delete document record: ${dbError.message}`);
  }

  // Log activity
  const { error: activityError } = await supabase.from("client_activity_log").insert({
    client_id: clientId,
    user_id: userId || null,
    action_type: "DocumentDeleted",
    details: {
      document_id: documentId,
      filename: document.filename,
      document_type: document.type,
      deleted_at: new Date().toISOString(),
    } as Json,
  });

  if (activityError) {
    console.error("Failed to log document delete activity:", activityError);
  }
}

// Replace a document (upload new version)
async function replaceDocument(
  clientId: string,
  params: ReplaceDocumentParams,
  onProgress?: (progress: number) => void
): Promise<ClientDocument> {
  const { documentId, file, userId } = params;

  // Validate file
  const validation = validateFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Get the existing document
  const { data: existingDoc, error: fetchError } = await supabase
    .from("client_documents")
    .select("*")
    .eq("id", documentId)
    .single();

  if (fetchError) {
    throw new Error(`Failed to fetch document: ${fetchError.message}`);
  }

  if (!existingDoc) {
    throw new Error("Document not found");
  }

  const documentType = existingDoc.type as DocumentType;
  const timestamp = Date.now();
  const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const newStoragePath = `${clientId}/${documentType}/${timestamp}-${sanitizedFilename}`;

  // Upload new file
  onProgress?.(10);
  const { error: uploadError } = await supabase.storage
    .from("client-documents")
    .upload(newStoragePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Failed to upload file: ${uploadError.message}`);
  }

  onProgress?.(50);

  // Delete old file from storage
  const { error: deleteError } = await supabase.storage
    .from("client-documents")
    .remove([existingDoc.storage_path]);

  if (deleteError) {
    console.error("Failed to delete old file from storage:", deleteError);
  }

  // Update database record with incremented version
  const { data: updatedDoc, error: dbError } = await supabase
    .from("client_documents")
    .update({
      filename: file.name,
      storage_path: newStoragePath,
      uploaded_by: userId || null,
      uploaded_at: new Date().toISOString(),
      version: existingDoc.version + 1,
    })
    .eq("id", documentId)
    .select()
    .single();

  if (dbError) {
    throw new Error(`Failed to update document record: ${dbError.message}`);
  }

  onProgress?.(75);

  // Log activity
  const { error: activityError } = await supabase.from("client_activity_log").insert({
    client_id: clientId,
    user_id: userId || null,
    action_type: "DocumentReplaced",
    details: {
      document_id: documentId,
      old_filename: existingDoc.filename,
      new_filename: file.name,
      document_type: documentType,
      old_version: existingDoc.version,
      new_version: existingDoc.version + 1,
      replaced_at: new Date().toISOString(),
    } as Json,
  });

  if (activityError) {
    console.error("Failed to log document replace activity:", activityError);
  }

  onProgress?.(100);

  return updatedDoc as ClientDocument;
}

// Generate a signed URL for downloading a document
async function getDownloadUrl(storagePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from("client-documents")
    .createSignedUrl(storagePath, 3600); // 1 hour expiry

  if (error) {
    throw new Error(`Failed to generate download URL: ${error.message}`);
  }

  return data.signedUrl;
}

// React Query hook for fetching client documents
export function useClientDocuments(clientId: string | undefined) {
  return useQuery({
    queryKey: ["client-documents", clientId],
    queryFn: () => fetchClientDocuments(clientId!),
    enabled: !!clientId,
  });
}

// React Query hook for uploading a document
export function useUploadDocument(clientId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      file,
      type,
      userId,
      onProgress,
    }: UploadDocumentParams & { onProgress?: (progress: number) => void }) =>
      uploadDocument(clientId, { file, type, userId }, onProgress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-documents", clientId] });
      queryClient.invalidateQueries({ queryKey: ["client-activity", clientId] });
    },
  });
}

// React Query hook for deleting a document
export function useDeleteDocument(clientId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      documentId,
      userId,
    }: {
      documentId: string;
      userId: string | undefined;
    }) => deleteDocument(clientId, documentId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-documents", clientId] });
      queryClient.invalidateQueries({ queryKey: ["client-activity", clientId] });
    },
  });
}

// React Query hook for replacing a document
export function useReplaceDocument(clientId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      documentId,
      file,
      userId,
      onProgress,
    }: ReplaceDocumentParams & { onProgress?: (progress: number) => void }) =>
      replaceDocument(clientId, { documentId, file, userId }, onProgress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-documents", clientId] });
      queryClient.invalidateQueries({ queryKey: ["client-activity", clientId] });
    },
  });
}

// Hook for getting download URL
export function useDownloadUrl() {
  return useMutation({
    mutationFn: getDownloadUrl,
  });
}

// Helper to get file extension icon
export function getFileExtension(filename: string): string {
  const parts = filename.split(".");
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
}

// Check if file is an image based on extension
export function isImageFile(filename: string): boolean {
  const ext = getFileExtension(filename);
  return ["png", "jpg", "jpeg", "gif", "webp"].includes(ext);
}

// Check if file is a PDF
export function isPdfFile(filename: string): boolean {
  const ext = getFileExtension(filename);
  return ext === "pdf";
}
