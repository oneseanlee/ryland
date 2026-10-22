// deno-lint-ignore-file no-explicit-any
/** GoHighLevel contact field "Inquiry Documents" (FILE_UPLOAD, multi-file). */
export const GHL_DOCUMENTS_FIELD_ID = '0MgqkrWiZLHJIc8SaRJg';

interface PendingDoc { id: string; filename: string; storage_path: string; mime_type: string | null }

/**
 * Uploads each not-yet-sent document to the contact's file field, marking each row
 * (ghl_uploaded_at) as it succeeds so retries never duplicate files.
 */
export async function pushDocsToGhl(db: any, opts: { table: string; bucket: string; docs: PendingDoc[]; contactId: string; locationId: string }) {
  const key = Deno.env.get('GHL_API_KEY');
  if (!key) throw new Error('GoHighLevel credentials missing');
  let uploaded = 0;
  for (const d of opts.docs) {
    const file = await db.storage.from(opts.bucket).download(d.storage_path);
    if (file.error || !file.data) throw new Error(`Could not read ${d.filename}`);
    const form = new FormData();
    form.append(`${GHL_DOCUMENTS_FIELD_ID}_${crypto.randomUUID()}`, new File([file.data], d.filename, { type: d.mime_type || 'application/octet-stream' }));
    const res = await fetch(`https://services.leadconnectorhq.com/forms/upload-custom-files?contactId=${encodeURIComponent(opts.contactId)}&locationId=${encodeURIComponent(opts.locationId)}`, {
      method: 'POST', headers: { Authorization: `Bearer ${key}`, Version: '2021-07-28' }, body: form, signal: AbortSignal.timeout(60000),
    });
    const text = await res.text();
    if (!res.ok) {
      await db.from(opts.table).update({ ghl_upload_error: text.slice(0, 1000) }).eq('id', d.id);
      throw new Error(`GoHighLevel upload [${res.status}]: ${text}`);
    }
    const r = await db.from(opts.table).update({ ghl_uploaded_at: new Date().toISOString(), ghl_upload_error: null }).eq('id', d.id);
    if (r.error) throw r.error;
    uploaded++;
  }
  return uploaded;
}
