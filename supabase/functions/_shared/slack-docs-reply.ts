// deno-lint-ignore-file no-explicit-any
import { slackDocsAddedReply } from './inquiry-delivery.ts';
declare const Deno: { env: { get(name: string): string | undefined } };

/** Best-effort Slack thread reply under the order's initial notice; never throws. */
export async function postDocsAddedThreadReply(db: any, orderId: string, added: number): Promise<void> {
  try {
    const delivery = await db.from('inquiry_lead_delivery').select('slack_ts').eq('order_id', orderId).maybeSingle();
    if (delivery.error) throw delivery.error;
    const threadTs = delivery.data?.slack_ts?.trim();
    if (!threadTs) {
      console.log(`push-lead-documents: no slack_ts for order ${orderId}, thread reply skipped`);
      return;
    }
    const order = await db.from('inquiry_orders').select('client_id').eq('id', orderId).maybeSingle();
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
  } catch (e) {
    console.error('push-lead-documents: Slack thread reply failed:', e instanceof Error ? e.message : String(e));
  }
}
