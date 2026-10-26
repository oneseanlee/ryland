import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GHL_DOCUMENTS_FIELD_ID, drainInquiryDocuments, pushDocsToGhl } from '../../supabase/functions/_shared/ghl-files';
import { GHL_FILE_ACCEPT, ghlFileProblem, ghlFileProblemMessage, ghlMimeFor } from '../../supabase/functions/_shared/ghl-file-rules';

declare global {
  var Deno: { env: { get(name: string): string | undefined } };
}

type Row = Record<string, any>;
const MB = 1024 * 1024;

/** In-memory db that really applies conditional updates. */
function fakeDb() {
  const tables: Record<string, Row[]> = { inquiry_documents: [], inquiry_lead_delivery: [], affiliate_lead_documents: [] };
  const missing = new Set<string>();
  const blobSizes: Record<string, number> = {};
  const hooks: { afterRelease?: () => Promise<void> } = {};
  function query(table: string, op: 'select' | 'update', patch?: Row) {
    const filters: ((r: Row) => boolean)[] = [];
    let returning = false;
    const q: any = {
      eq: (c: string, v: unknown) => (filters.push(r => r[c] === v), q),
      is: (c: string, v: unknown) => (filters.push(r => r[c] === v), q),
      in: (c: string, v: unknown[]) => (filters.push(r => v.includes(r[c])), q),
      or: (expr: string) => {
        const parts = expr.split(',').map(p => p.split('.'));
        filters.push(r => parts.some(([c, o, ...rest]) => {
          const v = rest.join('.');
          return o === 'is' ? r[c] === null : o === 'lt' ? r[c] !== null && r[c] < v : false;
        }));
        return q;
      },
      select: () => (returning = true, q),
      then: async (resolve: (v: unknown) => unknown, reject: (e: unknown) => unknown) => {
        try {
          const rows = (tables[table] ??= []).filter(r => filters.every(f => f(r)));
          if (op === 'select') return resolve({ data: rows.map(r => ({ ...r })), error: null });
          rows.forEach(r => Object.assign(r, patch));
          if (table === 'inquiry_lead_delivery' && patch && 'locked_until' in patch && patch.locked_until === null && hooks.afterRelease) {
            const h = hooks.afterRelease; hooks.afterRelease = undefined; await h();
          }
          return resolve({ data: returning ? rows.map(r => ({ ...r })) : null, error: null });
        } catch (e) { return reject(e); }
      },
    };
    return q;
  }
  const db = {
    from: (t: string) => ({ select: () => query(t, 'select'), update: (p: Row) => query(t, 'update', p) }),
    storage: { from: () => ({ download: async (path: string) => missing.has(path) ? { data: null, error: new Error('not found') } : { data: blobSizes[path] ? { size: blobSizes[path] } as Blob : new Blob(['doc']), error: null } }) },
  };
  let n = 0;
  const addDoc = (over: Row = {}) => {
    const id = over.id ?? `doc-${n++}`;
    const row = { id, order_id: 'order', filename: `${id}.pdf`, storage_path: `order/${id}.pdf`, mime_type: 'application/pdf', size_bytes: 10, ghl_uploaded_at: null, ghl_upload_error: null, ...over };
    tables.inquiry_documents.push(row);
    return row;
  };
  tables.inquiry_lead_delivery.push({ order_id: 'order', state: 'complete', locked_until: null });
  return { db, tables, missing, blobSizes, hooks, addDoc, docs: () => tables.inquiry_documents, delivery: () => tables.inquiry_lead_delivery[0] };
}

/** Fake GHL: field holds whatever the LAST POST contained. */
function fakeGhl() {
  const state = { field: [] as string[], posts: [] as string[][], gets: 0, getCounts: [] as (number | 'error')[], onPost: undefined as undefined | ((i: number) => Promise<void>), postStatus: 200 };
  const fetch = vi.fn(async (_url: string, init: { method: string; body?: FormData }) => {
    if (init.method === 'POST') {
      const names = [...init.body!.values()].map(v => (v as File).name);
      const i = state.posts.push(names) - 1;
      if (state.onPost) await state.onPost(i);
      if (state.postStatus !== 200) return new Response('x'.repeat(1200), { status: state.postStatus });
      state.field = names;
      return new Response('{}');
    }
    const override = state.getCounts[state.gets++];
    if (override === 'error') return new Response('down', { status: 503 });
    const value = typeof override === 'number' ? Array.from({ length: override }, (_, k) => `f${k}`) : state.field;
    return new Response(JSON.stringify({ contact: { customFields: [{ id: GHL_DOCUMENTS_FIELD_ID, value }] } }));
  });
  return { state, fetch: fetch as unknown as typeof globalThis.fetch, mock: fetch };
}

const sleep = vi.fn(async () => {});
const pushOpts = (ghl: ReturnType<typeof fakeGhl>) => ({ table: 'inquiry_documents', bucket: 'inquiry-documents', ownerColumn: 'order_id', ownerId: 'order', contactId: 'contact', locationId: 'location', fetch: ghl.fetch, sleep });
const drainOpts = (ghl: ReturnType<typeof fakeGhl>, onAdded = vi.fn(async (_n: number) => {})) => ({ orderId: 'order', contactId: 'contact', locationId: 'location', onAdded, fetch: ghl.fetch, sleep });

beforeEach(() => {
  vi.stubGlobal('Deno', { env: { get: () => 'mock-key' } });
  sleep.mockClear();
});
afterEach(() => vi.unstubAllGlobals());

describe('ghl file rules', () => {
  it('flags heic as type, 51 MB pdf as size, accepts uppercase PDF', () => {
    expect(ghlFileProblem({ name: 'photo.heic', size: 10 })).toBe('type');
    expect(ghlFileProblem({ name: 'big.pdf', size: 51 * MB })).toBe('size');
    expect(ghlFileProblem({ name: 'SCAN.PDF', size: 10 })).toBeNull();
    expect(ghlFileProblem({ name: 'noext', size: 10 })).toBe('type');
    expect(ghlFileProblem({ name: 'a.pdf', size: null })).toBeNull();
  });
  it('gives the user messages and accept list', () => {
    expect(ghlFileProblemMessage('type')).toBe("This file type can't be sent. Please upload a PDF, JPG or PNG under 50 MB.");
    expect(ghlFileProblemMessage('size')).toBe('This file is too large. Please upload a PDF, JPG or PNG under 50 MB.');
    expect(GHL_FILE_ACCEPT.split(',')).toContain('.pdf');
    expect(GHL_FILE_ACCEPT.split(',')).not.toContain('.heic');
    expect(ghlMimeFor('a.docx', null)).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    expect(ghlMimeFor('a.png', 'image/x')).toBe('image/x');
    expect(ghlMimeFor('a.weird', '')).toBe('application/octet-stream');
  });
});

describe('single-pass pushDocsToGhl', () => {
  it('sends all four files in one POST and preserves previous timestamps', async () => {
    const f = fakeDb(); const g = fakeGhl();
    f.addDoc({ ghl_uploaded_at: 'previous', ghl_upload_error: 'old' }); f.addDoc(); f.addDoc(); f.addDoc();
    expect(await pushDocsToGhl(f.db, pushOpts(g))).toEqual({ sent: 4, added: 3, skippedIds: [] });
    expect(g.state.posts).toHaveLength(1);
    expect(g.state.posts[0]).toHaveLength(4);
    expect(f.docs()[0].ghl_uploaded_at).toBe('previous');
    expect(f.docs().every(r => r.ghl_uploaded_at !== null && r.ghl_upload_error === null)).toBe(true);
  });

  it('skips upload when no new files exist', async () => {
    const f = fakeDb(); const g = fakeGhl();
    f.addDoc({ ghl_uploaded_at: 'previous' });
    expect(await pushDocsToGhl(f.db, pushOpts(g))).toEqual({ sent: 0, added: 0, skippedIds: [] });
    expect(g.mock).not.toHaveBeenCalled();
  });

  it('records the first 1000 response characters when the POST fails', async () => {
    const f = fakeDb(); const g = fakeGhl(); g.state.postStatus = 502;
    f.addDoc({ ghl_uploaded_at: 'previous' }); f.addDoc();
    await expect(pushDocsToGhl(f.db, pushOpts(g))).rejects.toThrow('GoHighLevel upload [502]');
    expect(f.docs().every(r => r.ghl_upload_error === 'x'.repeat(1000))).toBe(true);
    expect(f.docs()[1].ghl_uploaded_at).toBeNull();
  });

  it('excludes unsupported files, sends and marks the rest', async () => {
    const f = fakeDb(); const g = fakeGhl();
    const heic = f.addDoc({ filename: 'photo.heic' });
    const big = f.addDoc({ filename: 'big.pdf', size_bytes: 60 * MB });
    f.addDoc(); f.addDoc();
    const r = await pushDocsToGhl(f.db, pushOpts(g));
    expect(r.sent).toBe(2); expect(r.added).toBe(2);
    expect(r.skippedIds.sort()).toEqual([heic.id, big.id].sort());
    expect(g.state.posts[0]).toHaveLength(2);
    expect(heic.ghl_uploaded_at).toBeNull(); expect(big.ghl_uploaded_at).toBeNull();
    expect(heic.ghl_upload_error).toMatch(/file type not accepted/);
    expect(big.ghl_upload_error).toMatch(/larger than 50 MB/);
    expect(f.docs().slice(2).every(d => d.ghl_uploaded_at !== null)).toBe(true);
  });

  it('records missing storage objects per row and still sends the others', async () => {
    const f = fakeDb(); const g = fakeGhl();
    const gone = f.addDoc(); f.addDoc();
    f.missing.add(gone.storage_path);
    const r = await pushDocsToGhl(f.db, pushOpts(g));
    expect(r).toEqual({ sent: 1, added: 1, skippedIds: [gone.id] });
    expect(gone.ghl_upload_error).toBe('Not sent to GoHighLevel: stored file is missing');
    expect(f.docs()[1].ghl_uploaded_at).not.toBeNull();
    expect(f.docs()[1].ghl_upload_error).toBeNull();
  });

  it('re-checks the downloaded blob size', async () => {
    const f = fakeDb(); const g = fakeGhl();
    const liar = f.addDoc({ size_bytes: 10 }); f.blobSizes[liar.storage_path] = 60 * MB;
    expect(await pushDocsToGhl(f.db, pushOpts(g))).toEqual({ sent: 0, added: 0, skippedIds: [liar.id] });
    expect(g.state.posts).toHaveLength(0);
  });

  it('succeeds when the count matches on the 2nd GET', async () => {
    const f = fakeDb(); const g = fakeGhl(); g.state.getCounts = [0];
    f.addDoc(); f.addDoc();
    expect((await pushDocsToGhl(f.db, pushOpts(g))).added).toBe(2);
    expect(g.state.gets).toBe(2);
    expect(sleep).toHaveBeenCalledWith(1000);
  });

  it('records an error and marks nothing when 3 GETs never match', async () => {
    const f = fakeDb(); const g = fakeGhl(); g.state.getCounts = [1, 'error', 1];
    f.addDoc(); f.addDoc();
    await expect(pushDocsToGhl(f.db, pushOpts(g))).rejects.toThrow('GoHighLevel holds 1 of 2 files after upload');
    expect(g.state.gets).toBe(3);
    expect(sleep.mock.calls.map(c => c[0])).toEqual([1000, 2000]);
    expect(f.docs().every(d => d.ghl_uploaded_at === null && d.ghl_upload_error === 'GoHighLevel holds 1 of 2 files after upload')).toBe(true);
  });
});

describe('drainInquiryDocuments lease', () => {
  it('race regression: B queues during A\'s POST, A re-pushes the full set', async () => {
    const f = fakeDb(); const g = fakeGhl();
    f.addDoc({ id: 'r1' });
    let bResult: unknown;
    const onAddedA = vi.fn(async (_n: number) => {});
    g.state.onPost = async i => {
      if (i !== 0) return;
      f.addDoc({ id: 'r2' });
      bResult = await drainInquiryDocuments(f.db, drainOpts(g));
    };
    const a = await drainInquiryDocuments(f.db, drainOpts(g, onAddedA));
    expect(bResult).toEqual({ state: 'queued' });
    expect(g.state.posts).toEqual([['r1.pdf'], ['r1.pdf', 'r2.pdf']]);
    expect(g.state.field).toEqual(['r1.pdf', 'r2.pdf']);
    expect(f.docs().every(d => d.ghl_uploaded_at !== null)).toBe(true);
    expect(onAddedA.mock.calls.map(c => c[0])).toEqual([1, 1]);
    expect(a).toEqual({ state: 'uploaded', uploaded: 2 });
    expect(f.delivery().locked_until).toBeNull();
  });

  it('late arrival after release: C pushes, A cannot reclaim and posts nothing more', async () => {
    const f = fakeDb(); const g = fakeGhl();
    f.addDoc({ id: 'r1' });
    let openGate!: () => void; const gate = new Promise<void>(r => (openGate = r));
    let cInPost!: () => void; const cStarted = new Promise<void>(r => (cInPost = r));
    let c: Promise<unknown> | undefined;
    f.hooks.afterRelease = async () => {
      f.addDoc({ id: 'r2' });
      g.state.onPost = async () => { cInPost(); await gate; };
      c = drainInquiryDocuments(f.db, drainOpts(g));
      await cStarted;
    };
    const a = await drainInquiryDocuments(f.db, drainOpts(g));
    expect(a).toEqual({ state: 'uploaded', uploaded: 1 });
    expect(g.state.posts).toHaveLength(2);
    openGate();
    expect(await c).toEqual({ state: 'uploaded', uploaded: 1 });
    expect(g.state.posts).toHaveLength(2);
    expect(g.state.field).toEqual(['r1.pdf', 'r2.pdf']);
    expect(f.delivery().locked_until).toBeNull();
  });

  it('stops after 5 rounds when a row lands during every POST', async () => {
    const f = fakeDb(); const g = fakeGhl();
    f.addDoc();
    g.state.onPost = async () => { f.addDoc(); };
    expect(await drainInquiryDocuments(f.db, drainOpts(g))).toEqual({ state: 'queued' });
    expect(g.state.posts).toHaveLength(5);
    const pending = f.docs().filter(d => d.ghl_uploaded_at === null);
    expect(pending).toHaveLength(1);
    expect(pending[0].ghl_upload_error).toBe('Still waiting to send after 5 attempts; will retry on the next upload or admin retry');
    expect(f.delivery().locked_until).toBeNull();
  });

  it('marks nothing when the lease is lost before marking', async () => {
    const f = fakeDb(); const g = fakeGhl();
    f.addDoc(); f.addDoc();
    g.state.onPost = async () => { f.delivery().locked_until = '9999-01-01T00:00:00.000Z'; };
    const onAdded = vi.fn(async () => {});
    expect(await drainInquiryDocuments(f.db, drainOpts(g, onAdded))).toEqual({ state: 'queued' });
    expect(f.docs().every(d => d.ghl_uploaded_at === null)).toBe(true);
    expect(onAdded).not.toHaveBeenCalled();
    expect(f.delivery().locked_until).toBe('9999-01-01T00:00:00.000Z');
  });

  it('does not claim while the delivery is not complete', async () => {
    const f = fakeDb(); const g = fakeGhl();
    f.addDoc(); f.delivery().state = 'processing';
    expect(await drainInquiryDocuments(f.db, drainOpts(g))).toEqual({ state: 'queued' });
    expect(g.mock).not.toHaveBeenCalled();
  });
});
