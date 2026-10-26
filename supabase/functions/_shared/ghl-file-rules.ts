/** Pure rules for files GoHighLevel's POST /forms/upload-custom-files accepts. Shared by edge functions and the web app; keep free of imports and runtime globals. */
export const GHL_MAX_FILE_BYTES = 50 * 1024 * 1024;

export const GHL_ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'gif', 'csv', 'xls', 'xlsx', 'mp4', 'mpeg', 'zip', 'rar', 'txt', 'svg'] as const;

export const GHL_FILE_ACCEPT = GHL_ALLOWED_EXTENSIONS.map(ext => `.${ext}`).join(',');

export type GhlFileProblem = 'type' | 'size';

const MIME: Record<string, string> = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  csv: 'text/csv',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  mp4: 'video/mp4',
  mpeg: 'video/mpeg',
  zip: 'application/zip',
  rar: 'application/vnd.rar',
  txt: 'text/plain',
  svg: 'image/svg+xml',
};

function extensionOf(name: string): string | null {
  const dot = name.lastIndexOf('.');
  if (dot <= 0 && !(dot === 0 && name.length > 1)) return null;
  const ext = name.slice(dot + 1).toLowerCase();
  return ext || null;
}

export function ghlFileProblem(file: { name: string; size: number | null | undefined }): GhlFileProblem | null {
  const ext = extensionOf(file.name);
  if (!ext || !(GHL_ALLOWED_EXTENSIONS as readonly string[]).includes(ext)) return 'type';
  if (typeof file.size === 'number' && file.size > GHL_MAX_FILE_BYTES) return 'size';
  return null;
}

export function ghlFileProblemMessage(problem: GhlFileProblem): string {
  return problem === 'type'
    ? "This file type can't be sent. Please upload a PDF, JPG or PNG under 50 MB."
    : 'This file is too large. Please upload a PDF, JPG or PNG under 50 MB.';
}

export function ghlMimeFor(filename: string, mime: string | null | undefined): string {
  if (mime) return mime;
  const ext = extensionOf(filename);
  return (ext && MIME[ext]) || 'application/octet-stream';
}
