import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'https://esm.sh/zod@3.25.76';
import { deliverInquiry, inquiryNote, inquiryTags, normalizePhone, slackNotice, type DeliveryContext, type DeliveryOrder } from '../_shared/inquiry-delivery.ts';
import { pushDocsToGhl } from '../_shared/ghl-files.ts';

const schema = z.object({ orderIds: z.array(z.string().uuid()).min(1).max(100) });
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

async function ghl(path: string, method: string, body?: unknown) {
  const key = Deno.env.get('GHL_API_KEY');
  if (!key) throw new Error('GoHighLevel credentials missing');
  const res = await fetch(`https://services.leadconnectorhq.com${path}`, {
    method,
    headers: { Authorization: `Bearer ${key}`, Version: '2021-07-28', 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(20000),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`GoHighLevel [${res.status}]: ${text}`);
  return text ? JSON.parse(text) : {};
}

serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  try {
    const url = Deno.env.get('SUPABASE_URL');
    const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const anon = Deno.env.get('SUPABASE_ANON_KEY');
    if (!url || !key || !anon) return json({ error: 'Server configuration missing' }, 503);
    const token = req.headers.get('Authorization')?.replace(/^Bearer /, '');
    if (!token) return json({ error: 'Unauthorized' }, 401);
    const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    let userId: string | null = null;
    let isAdmin = token === key;
    if (!isAdmin) {
      const auth = createClient(url, anon, { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false } });
      const { data, error } = await auth.auth.getUser();
      if (error || !data.user) return json({ error: 'Unauthorized' }, 401);
      userId = data.user.id;
      const role = await db.rpc('has_role', { _user_id: userId, _role: 'admin' });
      if (role.error) return json({ error: 'Could not verify permissions' }, 500);
      isAdmin = role.data === true;
    }
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return json({ error: 'Provide between 1 and 100 valid order IDs' }, 400);
    const ordersRes = await db.from('inquiry_orders').select('*').in('id', parsed.data.orderIds);
    if (ordersRes.error) throw ordersRes.error;
    const orders = (ordersRes.data ?? []) as DeliveryOrder[];
    if (orders.length !== new Set(parsed.data.orderIds).size) return json({ error: 'Order not found' }, 404);
    // Authorize every requested order before producing any external side effects.
    const affiliatesRes = await db.from('affiliates').select('id, user_id, full_name, affiliate_id').in('id', [...new Set(orders.map(o => o.affiliate_id))]);
    if (affiliatesRes.error) throw affiliatesRes.error;
    const affiliates = affiliatesRes.data ?? [];
    if (!isAdmin && orders.some(o => !affiliates.some(a => a.id === o.affiliate_id && a.user_id === userId))) return json({ error: 'Forbidden' }, 403);
    if (orders.some(o => o.status !== 'submitted' || !o.checkout_batch_id || !o.permission_confirmed)) return json({ error: 'Only submitted, permission-confirmed orders can be sent' }, 400);
    const locationId = Deno.env.get('GHL_LOCATION_ID');
    const pipelineId = Deno.env.get('GHL_FUNDING_PIPELINE_ID');
    if (!locationId || !pipelineId) return json({ error: 'GoHighLevel location or Funding pipeline not configured' }, 503);
    const results: { orderId: string; state: string; error?: string }[] = [];
    for (const order of orders) {
      let claimed = false;
      try {
        const seed = await db.from('inquiry_lead_delivery').upsert({ order_id: order.id }, { onConflict: 'order_id', ignoreDuplicates: true });
        if (seed.error) throw seed.error;
        const claim = await db.rpc('claim_inquiry_delivery', { _order_id: order.id });
        if (claim.error) throw claim.error;
        if (!claim.data) { results.push({ orderId: order.id, state: 'already_complete_or_processing' }); continue; }
        claimed = true;
        const [clientRes, batchRes, docsRes, recordRes] = await Promise.all([
          db.from('inquiry_clients').select('first_name,last_name,email,phone,notes,affiliate_id').eq('id', order.client_id ?? '').maybeSingle(),
          db.from('checkout_batches').select('reference').eq('id', order.checkout_batch_id).single(),
          db.from('inquiry_documents').select('id').eq('order_id', order.id),
          db.from('inquiry_lead_delivery').select('*').eq('order_id', order.id).single(),
        ]);
        for (const r of [clientRes, batchRes, docsRes, recordRes]) if (r.error) throw r.error;
        const affiliate = affiliates.find(a => a.id === order.affiliate_id);
        if (!clientRes.data || clientRes.data.affiliate_id !== order.affiliate_id || !affiliate || !batchRes.data || !recordRes.data) throw new Error('Client or partner record missing');
        const context: DeliveryContext = { order, client: clientRes.data, affiliate, reference: batchRes.data.reference, documentCount: docsRes.data?.length ?? 0 };
        await deliverInquiry(context, recordRes.data, {
          save: async patch => {
            const r = await db.from('inquiry_lead_delivery').update({ ...patch, updated_at: new Date().toISOString() }).eq('order_id', order.id);
            if (r.error) throw r.error;
          },
          contact: async c => {
            const payload = { locationId, firstName: c.client.first_name, lastName: c.client.last_name, email: c.client.email || undefined, phone: normalizePhone(c.client.phone), source: `Partner Referral: ${c.affiliate.full_name}` };
            // Upsert by email/phone when provided. Name-only clients are created independently, never matched by name.
            const data = await ghl(c.client.email || normalizePhone(c.client.phone) ? '/contacts/upsert' : '/contacts/', 'POST', payload);
            const id = data.contact?.id;
            if (!id) throw new Error('GoHighLevel returned no contact ID');
            await ghl(`/contacts/${id}/tags`, 'POST', { tags: inquiryTags(c.affiliate) });
            return id;
          },
          opportunity: async (c, contactId) => {
            const pipelines = await ghl(`/opportunities/pipelines?locationId=${encodeURIComponent(locationId)}`, 'GET');
            const stage = pipelines.pipelines?.find((p: { id: string }) => p.id === pipelineId)?.stages?.find((s: { name: string }) => /^new\s+lead$/i.test(s.name));
            if (!stage?.id) throw new Error('The Funding pipeline New Lead stage was not found');
            // Create this inquiry's opportunity; never reset an existing Funding opportunity via upsert.
            const data = await ghl('/opportunities/', 'POST', { pipelineId, pipelineStageId: stage.id, locationId, contactId, name: `${c.client.first_name} ${c.client.last_name} — Credit Inquiry Removal (${c.reference})`, status: 'open', source: `Partner: ${c.affiliate.full_name}` });
            const id = data.opportunity?.id || data.id;
            if (!id) throw new Error('GoHighLevel returned no opportunity ID');
            return id;
          },
          note: async (c, contactId) => {
            const data = await ghl(`/contacts/${contactId}/notes`, 'POST', { body: inquiryNote(c) });
            const id = data.note?.id || data.id;
            if (!id) throw new Error('GoHighLevel returned no note ID');
            return id;
          },
          documents: async (c, contactId) => {
            await pushDocsToGhl(db, { table: 'inquiry_documents', bucket: 'inquiry-documents', ownerColumn: 'order_id', ownerId: c.order.id, contactId, locationId });
          },
          slack: async (c, documentsPending) => {
            const apiKey = Deno.env.get('SLACK_API_KEY');
            const lovableKey = Deno.env.get('LOVABLE_API_KEY');
            if (!apiKey || !lovableKey) throw new Error('Slack connection is missing');
            const res = await fetch('https://connector-gateway.lovable.dev/slack/api/chat.postMessage', {
              method: 'POST', headers: { Authorization: `Bearer ${lovableKey}`, 'X-Connection-Api-Key': apiKey, 'Content-Type': 'application/json' },
              body: JSON.stringify({ channel: 'C0CAZUKCYSZ', text: slackNotice(c, documentsPending), unfurl_links: false, unfurl_media: false, client_msg_id: c.order.id }),
              signal: AbortSignal.timeout(20000),
            });
            const text = await res.text();
            if (!res.ok) throw new Error(`Slack [${res.status}]: ${text}`);
            const data = JSON.parse(text);
            if (!data.ok || !data.ts) throw new Error(`Slack [${res.status}]: ${text}`);
            return data.ts;
          },
        });
        await db.from('inquiry_lead_delivery').update({ locked_until: null }).eq('order_id', order.id);
        results.push({ orderId: order.id, state: 'complete' });
      } catch (e) {
        const error = e instanceof Error ? e.message : String(e);
        console.error('Inquiry delivery failed:', order.id, error);
        if (claimed) await db.from('inquiry_lead_delivery').update({ state: 'failed', last_error: error.slice(0, 4000), locked_until: null, updated_at: new Date().toISOString() }).eq('order_id', order.id);
        results.push({ orderId: order.id, state: 'failed', error });
      }
    }
    return json({ success: results.every(r => r.state !== 'failed'), results });
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    console.error('Inquiry delivery error:', error);
    return json({ error }, 500);
  }
});