import { afterEach, describe, expect, it, vi } from 'vitest';
import { GHL_DOCUMENTS_FIELD_ID, pushDocsToGhl } from '../../supabase/functions/_shared/ghl-files';

declare global {
  var Deno: { env: { get(name: string): string | undefined } };
}

function setup(timestamps: (string | null)[], value: unknown) {
  const rows = timestamps.map((ghl_uploaded_at, i) => ({ id: `doc-${i}`, filename: `${i}.pdf`, storage_path: `order/${i}.pdf`, mime_type: 'application/pdf', ghl_uploaded_at, ghl_upload_error: 'old error' as string | null }));
  const select = vi.fn(() => ({ eq: vi.fn(async () => ({ data: rows, error: null })) }));
  const update = vi.fn((patch: Partial<typeof rows[number]>) => ({
    in: (_column: string, ids: string[]) => {
      const apply = (pendingOnly = false) => {
        rows.filter(row => ids.includes(row.id) && (!pendingOnly || row.ghl_uploaded_at === null)).forEach(row => Object.assign(row, patch));
        return { error: null };
      };
      return { then: (resolve: (result: { error: null }) => unknown) => resolve(apply()), is: async () => apply(true) };
    },
  }));
  const download = vi.fn(async () => ({ data: new Blob(['test document']), error: null }));
  const db = { from: vi.fn(() => ({ select, update })), storage: { from: vi.fn(() => ({ download })) } };
  const fetchMock = vi.fn().mockResolvedValueOnce(new Response('{}')).mockResolvedValueOnce(new Response(JSON.stringify({ contact: { customFields: [{ id: GHL_DOCUMENTS_FIELD_ID, value }] } })));
  vi.stubGlobal('fetch', fetchMock);
  vi.stubGlobal('Deno', { env: { get: () => 'mock-key' } });
  vi.stubGlobal('AbortSignal', { timeout: vi.fn(() => new AbortController().signal) });
  const opts = { table: 'inquiry_documents', bucket: 'inquiry-documents', ownerColumn: 'order_id', ownerId: 'order', contactId: 'contact', locationId: 'location' };
  return { rows, db, opts, fetchMock, download, update };
}

afterEach(() => vi.unstubAllGlobals());

describe('full-set GoHighLevel document upload', () => {
  it('sends all four files in one POST, verifies them, and preserves previous timestamps', async () => {
    const s = setup(['previous', null, null, null], { a: {}, b: {}, c: {}, d: {} });
    expect(await pushDocsToGhl(s.db, s.opts)).toBe(4);
    expect(s.download).toHaveBeenCalledTimes(4);
    expect(s.fetchMock).toHaveBeenCalledTimes(2);
    const request = s.fetchMock.mock.calls[0][1];
    expect(request.method).toBe('POST');
    const keys = [...request.body.keys()];
    expect(keys).toHaveLength(4);
    expect(new Set(keys).size).toBe(4);
    expect(keys.every(key => key.startsWith(`${GHL_DOCUMENTS_FIELD_ID}_`))).toBe(true);
    expect(s.fetchMock.mock.calls[1][1].method).toBe('GET');
    expect(s.rows[0].ghl_uploaded_at).toBe('previous');
    expect(s.rows.slice(1).every(row => row.ghl_uploaded_at !== null)).toBe(true);
    expect(s.rows.every(row => row.ghl_upload_error === null)).toBe(true);
  });

  it.each([{ timestamps: [] }, { timestamps: ['previous', 'previous'] }])('skips upload when no new files exist: %j', async ({ timestamps }) => {
    const s = setup(timestamps, {});
    expect(await pushDocsToGhl(s.db, s.opts)).toBe(0);
    expect(s.fetchMock).not.toHaveBeenCalled();
    expect(s.download).not.toHaveBeenCalled();
  });

  it.each([{ value: { a: {} } }, { value: [] }, { value: undefined }])('records a count mismatch without marking new files: %j', async ({ value }) => {
    const s = setup(['previous', null, null, null], value);
    const count = value && !Array.isArray(value) ? 1 : 0;
    const message = `GoHighLevel holds ${count} of 4 files after upload`;
    await expect(pushDocsToGhl(s.db, s.opts)).rejects.toThrow(message);
    expect(s.rows.map(row => row.ghl_uploaded_at)).toEqual(['previous', null, null, null]);
    expect(s.rows.every(row => row.ghl_upload_error === message)).toBe(true);
  });

  it('accepts a matching array read-back', async () => {
    const s = setup([null, null], ['a', 'b']);
    expect(await pushDocsToGhl(s.db, s.opts)).toBe(2);
  });

  it('records the first 1000 response characters on every row when the POST fails', async () => {
    const s = setup(['previous', null], {});
    s.fetchMock.mockReset().mockResolvedValueOnce(new Response('x'.repeat(1200), { status: 502 }));
    await expect(pushDocsToGhl(s.db, s.opts)).rejects.toThrow('GoHighLevel upload [502]');
    expect(s.rows.every(row => row.ghl_upload_error === 'x'.repeat(1000))).toBe(true);
    expect(s.rows.map(row => row.ghl_uploaded_at)).toEqual(['previous', null]);
    expect(s.fetchMock).toHaveBeenCalledTimes(1);
  });
});