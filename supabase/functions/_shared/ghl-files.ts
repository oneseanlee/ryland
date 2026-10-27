// deno-lint-ignore-file no-explicit-any
import { GHL_MAX_FILE_BYTES, ghlFileProblem, ghlMimeFor } from './ghl-file-rules.ts';
declare const Deno: { env: { get(name: string): string | undefined } };
/** GoHighLevel contact field "Inquiry Documents" (FILE_UPLOAD, multi-file). */
export const GHL_DOCUMENTS_FIELD_ID = '0MgqkrWiZLHJIc8SaRJg';
export const GHL_MC_WORKFLOW_ID = 'd4b879b2-1e07-4d5b-b192-9a2a85dad025'; // GHL workflow "Inquiry Removal -> Mission Control"

const TYPE_ERROR = 'Not sent to GoHighLevel: file type not accepted (PDF, Word, Excel, JPG, PNG, GIF, CSV, TXT, ZIP, MP4, SVG up to 50 MB)';
const SIZE_ERROR = 'Not sent to GoHighLevel: file is larger than 50 MB (PDF, Word, Excel, JPG, PNG, GIF, CSV, TXT, ZIP, MP4, SVG up to 50 MB)';
const MISSING_ERROR = 'Not sent to GoHighLevel: stored file is missing';
const WAITING_ERROR = 'Still waiting to send after 5 attempts; will retry on the next upload or admin retry';

interface OwnerDoc { id: string; filename: string; storage_path: string; mime_type: string | null; size_bytes: number | null; ghl_uploaded_at: string | null }

export interface PushOpts {
  table: string; bucket: string; ownerColumn: string; ownerId: string; contactId: string; locationId: string;
  excludeIds?: Set<string>;
  beforeMark?: () => Promise<boolean>;
  fetch?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
}
export interface PushResult { sent: number; added: number; skippedIds: string[]; leaseLost?: boolean }

const defaultSleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

/**
 * One pass: uploads the owner's full supported set in a single request when new rows exist,
 * verifies the contact's file count (bounded retry) and only then marks new rows sent.
 * Unsupported or missing files get a per-row error and are excluded.
 */
export async function pushDocsToGhl(db: any, opts: PushOpts): Promise<PushResult> {
  const doFetch = opts.fetch ?? fetch;
  const sleep = opts.sleep ?? defaultSleep;
  const result = await db.from(opts.table).select('id, filename, storage_path, mime_type, size_bytes, ghl_uploaded_at').eq(opts.ownerColumn, opts.ownerId);
  if (result.error) throw result.error;
  const all = ((result.data ?? []) as OwnerDoc[]).filter(d => !opts.excludeIds?.has(d.id));
  const skippedIds: string[] = [];
  const setRowError = async (ids: string[], message: string) => {
    if (ids.length === 0) return;
    const r = await db.from(opts.table).update({ ghl_upload_error: message.slice(0, 1000) }).in('id', ids);
    if (r.error) throw r.error;
  };
  const typeIds: string[] = [], sizeIds: string[] = [];
  let docs: OwnerDoc[] = [];
  for (const d of all) {
    const problem = ghlFileProblem({ name: d.filename, size: d.size_bytes });
    if (problem === 'type') typeIds.push(d.id);
    else if (problem === 'size') sizeIds.push(d.id);
    else docs.push(d);
  }
  await setRowError(typeIds, TYPE_ERROR);
  await setRowError(sizeIds, SIZE_ERROR);
  skippedIds.push(...typeIds, ...sizeIds);
  if (docs.filter(d => d.ghl_uploaded_at === null).length === 0) return { sent: 0, added: 0, skippedIds };

  const key = Deno.env.get('GHL_API_KEY');
  if (!key) throw new Error('GoHighLevel credentials missing');
  const files: { doc: OwnerDoc; file: File }[] = [];
  for (const d of docs) {
    const file = await db.storage.from(opts.bucket).download(d.storage_path);
    if (file.error || !file.data) {
      await setRowError([d.id], MISSING_ERROR); skippedIds.push(d.id); continue;
    }
    if (file.data.size > GHL_MAX_FILE_BYTES) {
      await setRowError([d.id], SIZE_ERROR); skippedIds.push(d.id); continue;
    }
    files.push({ doc: d, file: new File([file.data], d.filename, { type: ghlMimeFor(d.filename, d.mime_type) }) });
  }
  docs = files.map(f => f.doc);
  const pendingIds = docs.filter(d => d.ghl_uploaded_at === null).map(d => d.id);
  if (docs.length === 0 || pendingIds.length === 0) return { sent: 0, added: 0, skippedIds };
  const ids = docs.map(d => d.id);
  const recordError = (message: string) => setRowError(ids, message);

  const form = new FormData();
  for (const f of files) form.append(`${GHL_DOCUMENTS_FIELD_ID}_${crypto.randomUUID()}`, f.file);
  const headers = { Authorization: `Bearer ${key}`, Version: '2021-07-28' };
  const res = await doFetch(`https://services.leadconnectorhq.com/forms/upload-custom-files?contactId=${encodeURIComponent(opts.contactId)}&locationId=${encodeURIComponent(opts.locationId)}`, {
    method: 'POST', headers, body: form, signal: AbortSignal.timeout(120000),
  });
  const text = await res.text();
  if (!res.ok) {
    await recordError(text);
    throw new Error(`GoHighLevel upload [${res.status}]: ${text}`);
  }

  let count = 0;
  let lastProblem = '';
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) await sleep(attempt * 1000);
    const contactRes = await doFetch(`https://services.leadconnectorhq.com/contacts/${encodeURIComponent(opts.contactId)}`, {
      method: 'GET', headers, signal: AbortSignal.timeout(60000),
    });
    if (!contactRes.ok) { lastProblem = `GoHighLevel contact read-back [${contactRes.status}]: ${await contactRes.text()}`; continue; }
    const contactData = await contactRes.json();
    const value = contactData.contact?.customFields?.find((field: { id: string }) => field.id === GHL_DOCUMENTS_FIELD_ID)?.value;
    count = Array.isArray(value) ? value.length : value && typeof value === 'object' ? Object.keys(value).length : 0;
    if (count === docs.length) { lastProblem = ''; break; }
    lastProblem = `GoHighLevel holds ${count} of ${docs.length} files after upload`;
  }
  if (lastProblem) {
    const message = lastProblem.startsWith('GoHighLevel contact read-back') ? lastProblem : `GoHighLevel holds ${count} of ${docs.length} files after upload`;
    await recordError(message);
    throw new Error(message);
  }

  if (opts.beforeMark && !(await opts.beforeMark())) return { sent: 0, added: 0, skippedIds, leaseLost: true };
  const alreadyIds = docs.filter(d => d.ghl_uploaded_at !== null).map(d => d.id);
  if (alreadyIds.length) {
    const cleared = await db.from(opts.table).update({ ghl_upload_error: null }).in('id', alreadyIds);
    if (cleared.error) throw cleared.error;
  }
  const marked = await db.from(opts.table).update({ ghl_uploaded_at: new Date().toISOString(), ghl_upload_error: null }).in('id', pendingIds).is('ghl_uploaded_at', null).select('id');
  if (marked.error) throw marked.error;
  const added = Array.isArray(marked.data) ? marked.data.length : pendingIds.length;
  return { sent: docs.length, added, skippedIds };
}

export type DrainResult = { state: 'queued' } | { state: 'uploaded'; uploaded: number };

/**
 * Serialises pushes per inquiry order with the inquiry_lead_delivery.locked_until lease
 * (only while state = 'complete'; the stored locked_until value is the holder token).
 * Release-then-recheck: a row landing after the holder's last check finds the lease free.
 */
export async function drainInquiryDocuments(db: any, opts: {
  orderId: string; contactId: string; locationId: string;
  onAdded?: (n: number) => Promise<void>;
  fetch?: typeof fetch; sleep?: (ms: number) => Promise<void>;
}): Promise<DrainResult> {
  const LEASE_MS = 300_000;
  const lease = () => new Date(Date.now() + LEASE_MS).toISOString();
  const claim = async (): Promise<string | null> => {
    const now = new Date().toISOString();
    const r = await db.from('inquiry_lead_delivery').update({ locked_until: lease() })
      .eq('order_id', opts.orderId).eq('state', 'complete').or(`locked_until.is.null,locked_until.lt.${now}`).select('locked_until');
    if (r.error) throw r.error;
    return r.data?.length === 1 ? r.data[0].locked_until : null;
  };
  const renew = async (token: string): Promise<string | null> => {
    const r = await db.from('inquiry_lead_delivery').update({ locked_until: lease() }).eq('order_id', opts.orderId).eq('locked_until', token).select('locked_until');
    if (r.error) throw r.error;
    return r.data?.length === 1 ? r.data[0].locked_until : null;
  };
  const release = async (token: string) => {
    const r = await db.from('inquiry_lead_delivery').update({ locked_until: null }).eq('order_id', opts.orderId).eq('locked_until', token);
    if (r.error) throw r.error;
  };
  const pendingRows = async (skipped: Set<string>) => {
    const r = await db.from('inquiry_documents').select('id, filename, size_bytes, ghl_uploaded_at').eq('order_id', opts.orderId).is('ghl_uploaded_at', null);
    if (r.error) throw r.error;
    return ((r.data ?? []) as OwnerDoc[]).filter(d => !skipped.has(d.id) && !ghlFileProblem({ name: d.filename, size: d.size_bytes }));
  };

  const skipped = new Set<string>();
  let total = 0;
  for (let round = 1; round <= 5; round++) {
    let token: string | null = await claim();
    if (!token) return round === 1 ? { state: 'queued' } : { state: 'uploaded', uploaded: total };
    let result: PushResult;
    try {
      result = await pushDocsToGhl(db, {
        table: 'inquiry_documents', bucket: 'inquiry-documents', ownerColumn: 'order_id', ownerId: opts.orderId,
        contactId: opts.contactId, locationId: opts.locationId, excludeIds: new Set(skipped),
        beforeMark: async () => (token = await renew(token!)) !== null,
        fetch: opts.fetch, sleep: opts.sleep,
      });
    } finally {
      if (token) {
        try { await release(token); }
        catch (e) { console.error('drainInquiryDocuments: lease release failed (lease TTL will free it):', opts.orderId, e instanceof Error ? e.message : String(e)); }
      }
    }
    result.skippedIds.forEach(id => skipped.add(id));
    if (result.leaseLost) return { state: 'queued' };
    if (result.added > 0) {
      total += result.added;
      try { await opts.onAdded?.(result.added); } catch (e) { console.error('Document added callback failed:', e instanceof Error ? e.message : String(e)); }
    }
    const pending = await pendingRows(skipped);
    if (pending.length === 0) return { state: 'uploaded', uploaded: total };
    if (round === 5) {
      const r = await db.from('inquiry_documents').update({ ghl_upload_error: WAITING_ERROR }).in('id', pending.map(d => d.id));
      if (r.error) throw r.error;
      console.error(`drainInquiryDocuments: order ${opts.orderId}: ${WAITING_ERROR}`);
    }
  }
  return { state: 'queued' };
}

const MC_ERROR_PREFIX = 'Mission Control workflow enrollment failed';

/**
 * Best-effort, single request (no retry): re-adds the contact to the Mission Control workflow so it
 * re-sends the full file set. Never throws. Failures go to inquiry_lead_delivery.last_error (informational
 * on complete rows); a 2xx clears only a stale enrollment error.
 */
export async function enrollInMissionControlWorkflow(db: any, opts: { orderId: string; contactId: string; fetch?: typeof fetch }): Promise<boolean> {
  let message: string;
  try {
    const key = Deno.env.get('GHL_API_KEY');
    if (!key) {
      message = `${MC_ERROR_PREFIX} [config]: GHL_API_KEY is not configured`;
    } else {
      const doFetch = opts.fetch ?? fetch;
      let res: Response;
      try {
        res = await doFetch(`https://services.leadconnectorhq.com/contacts/${encodeURIComponent(opts.contactId)}/workflow/${GHL_MC_WORKFLOW_ID}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${key}`, Version: '2021-07-28', 'Content-Type': 'application/json' },
          body: '{}',
          signal: AbortSignal.timeout(20000),
        });
      } catch (e) {
        throw Object.assign(new Error(e instanceof Error ? e.message : String(e)), { network: true });
      }
      if (res.ok) {
        try {
          const { error } = await db.from('inquiry_lead_delivery').update({ last_error: null }).eq('order_id', opts.orderId).like('last_error', `${MC_ERROR_PREFIX}%`);
          if (error) console.error('Mission Control enrollment error clear failed:', error instanceof Error ? error.message : String(error));
        } catch (e) { console.error('Mission Control enrollment error clear failed:', e instanceof Error ? e.message : String(e)); }
        return true;
      }
      const body = await res.text().catch(() => '');
      message = `${MC_ERROR_PREFIX} [${res.status}]: ${body.slice(0, 200)}`;
    }
  } catch (e: any) {
    message = `${MC_ERROR_PREFIX} [network]: ${String(e?.message ?? e).slice(0, 200)}`;
  }
  console.error(`order ${opts.orderId}: ${message}`);
  try {
    const { error } = await db.from('inquiry_lead_delivery').update({ last_error: message }).eq('order_id', opts.orderId);
    if (error) console.error('Mission Control enrollment error write failed:', error instanceof Error ? error.message : String(error));
  } catch (e) { console.error('Mission Control enrollment error write failed:', e instanceof Error ? e.message : String(e)); }
  return false;
}
