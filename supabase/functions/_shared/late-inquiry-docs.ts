// deno-lint-ignore-file no-explicit-any
import { enrollInMissionControlWorkflow } from './ghl-files.ts';
import { postDocsAddedThreadReply } from './slack-docs-reply.ts';

/** onAdded for late inquiry pushes: Slack thread reply, then Mission Control re-enrollment; each isolated. */
export function lateInquiryDocsAdded(db: any, opts: { orderId: string; contactId: string; fetch?: typeof fetch; postReply?: typeof postDocsAddedThreadReply }) {
  return async (n: number): Promise<void> => {
    try { await (opts.postReply ?? postDocsAddedThreadReply)(db, opts.orderId, n); } catch (e) { console.error('Slack thread reply failed:', e instanceof Error ? e.message : String(e)); }
    try { await enrollInMissionControlWorkflow(db, { orderId: opts.orderId, contactId: opts.contactId, fetch: opts.fetch }); } catch (e) { console.error('Mission Control enrollment failed:', e instanceof Error ? e.message : String(e)); }
  };
}
