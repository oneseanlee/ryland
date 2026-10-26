import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'https://esm.sh/zod@3.25.76';
import { pushDocsToGhl } from '../_shared/ghl-files.ts';
import { slackDocsAddedReply } from '../_shared/inquiry-delivery.ts';

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
    let isAdmin = token === key;
    let userId: string | null = null;
    if (!isAdmin) {
      const auth = createClient(url, anon, { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false } });
      const { data: u, error: ue } = await auth.auth.getUser();
      if (ue || !u.user) return json({ error: 'Unauthorized' }, 401);
      userId = u.user.id;
    }
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return json({ error: 'Invalid request' }, 400);
    const { kind, id } = parsed.data;
    const db = createClient(url, key, { auth: { persistSession: false } });

    let own: { data: { id: string } | null } = { data: null };
    if (!isAdmin) {
      const role = await db.rpc('has_role', { _user_id: userId, _role: 'admin' });
      isAdmin = role.data === true;
      own = await db.from('affiliates').select('id').eq('user_id', userId).maybeSingle();
    }

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
    if (!contactId) return json({ error: 'GoHighLevel contact missing' }, 502);
    const { sent: uploaded, added } = await pushDocsToGhl(db, { table, bucket, ownerColumn: filterCol, ownerId: id, contactId, locationId });
    if (kind === 'inquiry' && added > 0) {
      try {
        const delivery = await db.from('inquiry_lead_delivery').select('slack_ts').eq('order_id', id).maybeSingle();
        if (delivery.error) throw delivery.error;
        const threadTs = delivery.data?.slack_ts?.trim();
        if (!threadTs) {
          console.log(`push-lead-documents: no slack_ts for order ${id}, thread reply skipped`);
        } else {
          const order = await db.from('inquiry_orders').select('client_id').eq('id', id).maybeSingle();
          if (order.error) throw order.error;
          if (!order.data?.client_id) throw new Error('Client record missing for document thread reply');
          const client = await db.from('inquiry_clients').select('first_name, last_name').eq('id', order.data.client_id).maybeSingle();
          if (client.error) throw client.error;
          if (!client.data) throw new Error('Client record missing for document thread reply');
          const apiKey = Deno.env.get('SLACK_API_KEY');
          const lovableKey = Deno.env.get('LOVABLE_API_KEY');
          if (!apiKey || !lovableKey) throw new Error('Slack connection is missing');
          const res = await fetch('https://connector-gateway.lovable.dev/slack/api/chat.postMessage', {
            method: 'POST',
            headers: { Authorization: `Bearer ${lovableKey}`, 'X-Connection-Api-Key': apiKey, 'Content-Type': 'application/json' },
            body: JSON.stringify({ channel: 'C0CAZUKCYSZ', thread_ts: threadTs, text: slackDocsAddedReply(added, client.data.first_name, client.data.last_name), unfurl_links: false, unfurl_media: false }),
            signal: AbortSignal.timeout(20000),
          });
          const text = await res.text();
          if (res.status !== 200) throw new Error(`Slack [${res.status}]: ${text}`);
          const data = JSON.parse(text);
          if (!data.ok) throw new Error(`Slack [${res.status}]: ${text}`);
        }
      } catch (e) {
        console.error('push-lead-documents: Slack thread reply failed:', e instanceof Error ? e.message : String(e));
      }
    }
    return json({ state: 'uploaded', uploaded });
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    console.error('push-lead-documents failed:', error);
    return json({ error }, 502);
  }
});
