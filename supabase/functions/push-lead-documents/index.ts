import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'https://esm.sh/zod@3.25.76';
import { pushDocsToGhl } from '../_shared/ghl-files.ts';

const schema = z.object({ kind: z.enum(['inquiry', 'lead']), id: z.string().uuid() });
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  try {
    const url = Deno.env.get('SUPABASE_URL')!;
    const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anon = Deno.env.get('SUPABASE_ANON_KEY')!;
    const locationId = Deno.env.get('GHL_LOCATION_ID');
    if (!locationId) return json({ error: 'GoHighLevel location not configured' }, 503);
    const token = req.headers.get('Authorization')?.replace(/^Bearer /, '');
    if (!token) return json({ error: 'Unauthorized' }, 401);
    const auth = createClient(url, anon, { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false } });
    const { data: u, error: ue } = await auth.auth.getUser();
    if (ue || !u.user) return json({ error: 'Unauthorized' }, 401);
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return json({ error: 'Invalid request' }, 400);
    const { kind, id } = parsed.data;
    const db = createClient(url, key, { auth: { persistSession: false } });

    const role = await db.rpc('has_role', { _user_id: u.user.id, _role: 'admin' });
    const isAdmin = role.data === true;
    const own = await db.from('affiliates').select('id').eq('user_id', u.user.id).maybeSingle();

    let contactId: string | null = null;
    let table: string, bucket: string, filterCol: string;
    if (kind === 'inquiry') {
      const o = await db.from('inquiry_orders').select('affiliate_id, status').eq('id', id).maybeSingle();
      if (!o.data) return json({ error: 'Not found' }, 404);
      if (!isAdmin && o.data.affiliate_id !== own.data?.id) return json({ error: 'Forbidden' }, 403);
      const d = await db.from('inquiry_lead_delivery').select('ghl_contact_id, state, locked_until').eq('order_id', id).maybeSingle();
      // Not yet delivered (or delivery running): the delivery itself attaches pending files.
      if (!d.data?.ghl_contact_id || d.data.state !== 'complete' || (d.data.locked_until && new Date(d.data.locked_until) > new Date())) {
        return json({ state: 'pending', message: 'Documents will be sent with the lead.' });
      }
      contactId = d.data.ghl_contact_id;
      table = 'inquiry_documents'; bucket = 'inquiry-documents'; filterCol = 'order_id';
    } else {
      const l = await db.from('affiliate_leads').select('affiliate_id, ghl_contact_id').eq('id', id).maybeSingle();
      if (!l.data) return json({ error: 'Not found' }, 404);
      if (!isAdmin && l.data.affiliate_id !== own.data?.id) return json({ error: 'Forbidden' }, 403);
      if (!l.data.ghl_contact_id) return json({ state: 'pending', message: 'This lead is not linked to GoHighLevel yet.' });
      contactId = l.data.ghl_contact_id;
      table = 'affiliate_lead_documents'; bucket = 'lead-documents'; filterCol = 'lead_id';
    }
    const docs = await db.from(table).select('id, filename, storage_path, mime_type').eq(filterCol, id).is('ghl_uploaded_at', null);
    if (docs.error) throw docs.error;
    const uploaded = await pushDocsToGhl(db, { table, bucket, docs: docs.data ?? [], contactId: contactId!, locationId });
    return json({ state: 'uploaded', uploaded });
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    console.error('push-lead-documents failed:', error);
    return json({ error }, 502);
  }
});
