// deno-lint-ignore-file no-explicit-any
declare const Deno: { env: { get(name: string): string | undefined } };
/** GoHighLevel contact field "Inquiry Documents" (FILE_UPLOAD, multi-file). */
export const GHL_DOCUMENTS_FIELD_ID = '0MgqkrWiZLHJIc8SaRJg';

interface OwnerDoc { id: string; filename: string; storage_path: string; mime_type: string | null; ghl_uploaded_at: string | null }

/**
 * When new documents exist, uploads the owner's full document set in one request.
 * Checks the contact's file count by reading it back before marking new rows sent;
 * already-sent rows retain their timestamps, and sets without new files are skipped.
 */
export async function pushDocsToGhl(db: any, opts: { table: string; bucket: string; ownerColumn: string; ownerId: string; contactId: string; locationId: string }) {
  const result = await db.from(opts.table).select('id, filename, storage_path, mime_type, ghl_uploaded_at').eq(opts.ownerColumn, opts.ownerId);
  if (result.error) throw result.error;
  const docs = (result.data ?? []) as OwnerDoc[];
  if (!docs.some(d => d.ghl_uploaded_at === null)) return 0;
  const key = Deno.env.get('GHL_API_KEY');
  if (!key) throw new Error('GoHighLevel credentials missing');
  const ids = docs.map(d => d.id);
  const recordError = async (message: string) => {
    const r = await db.from(opts.table).update({ ghl_upload_error: message.slice(0, 1000) }).in('id', ids);
    if (r.error) throw r.error;
  };
  const form = new FormData();
  for (const d of docs) {
    const file = await db.storage.from(opts.bucket).download(d.storage_path);
    if (file.error || !file.data) throw new Error(`Could not read ${d.filename}`);
    form.append(`${GHL_DOCUMENTS_FIELD_ID}_${crypto.randomUUID()}`, new File([file.data], d.filename, { type: d.mime_type || 'application/octet-stream' }));
  }
  const headers = { Authorization: `Bearer ${key}`, Version: '2021-07-28' };
  const res = await fetch(`https://services.leadconnectorhq.com/forms/upload-custom-files?contactId=${encodeURIComponent(opts.contactId)}&locationId=${encodeURIComponent(opts.locationId)}`, {
    method: 'POST', headers, body: form, signal: AbortSignal.timeout(120000),
  });
  const text = await res.text();
  if (!res.ok) {
    await recordError(text);
    throw new Error(`GoHighLevel upload [${res.status}]: ${text}`);
  }
  const contactRes = await fetch(`https://services.leadconnectorhq.com/contacts/${encodeURIComponent(opts.contactId)}`, {
    method: 'GET', headers, signal: AbortSignal.timeout(60000),
  });
  if (!contactRes.ok) {
    const message = `GoHighLevel contact read-back [${contactRes.status}]: ${await contactRes.text()}`;
    await recordError(message);
    throw new Error(message);
  }
  const contactData = await contactRes.json();
  const value = contactData.contact?.customFields?.find((field: { id: string }) => field.id === GHL_DOCUMENTS_FIELD_ID)?.value;
  const count = Array.isArray(value) ? value.length : value && typeof value === 'object' ? Object.keys(value).length : 0;
  if (count !== docs.length) {
    const message = `GoHighLevel holds ${count} of ${docs.length} files after upload`;
    await recordError(message);
    throw new Error(message);
  }
  const marked = await db.from(opts.table).update({ ghl_uploaded_at: new Date().toISOString(), ghl_upload_error: null }).in('id', ids).is('ghl_uploaded_at', null);
  if (marked.error) throw marked.error;
  const cleared = await db.from(opts.table).update({ ghl_upload_error: null }).in('id', ids);
  if (cleared.error) throw cleared.error;
  return docs.length;
}
