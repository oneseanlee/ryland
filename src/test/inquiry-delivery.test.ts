import { describe, expect, it, vi } from 'vitest';
import { deliverInquiry, inquiryTags, normalizePhone, slackNotice, slackEscape, slackDocsAddedReply, type DeliveryContext, type DeliveryRecord } from '../../supabase/functions/_shared/inquiry-delivery';

const context: DeliveryContext = {
  order: { id: 'order-1', client_id: 'client-1', affiliate_id: 'affiliate-1', checkout_batch_id: 'batch-1', status: 'submitted', permission_confirmed: true, service_name: 'Credit Inquiry Removal', bureaus: ['Equifax', 'Experian'], add_ons: [], instructions: null, payment_status: 'unpaid' },
  client: { first_name: 'Test', last_name: 'Client', email: null, phone: null, notes: null },
  affiliate: { full_name: 'Gene Ryland', affiliate_id: 'GRyland1' },
  reference: 'CIR-TEST', documentCount: 2,
};
const empty: DeliveryRecord = { ghl_contact_id: null, ghl_opportunity_id: null, ghl_note_id: null, slack_ts: null };
function services() {
  return { contact: vi.fn().mockResolvedValue('contact'), opportunity: vi.fn().mockResolvedValue('opp'), note: vi.fn().mockResolvedValue('note'), documents: vi.fn().mockResolvedValue(undefined), slack: vi.fn().mockResolvedValue('timestamp'), save: vi.fn().mockResolvedValue(undefined) };
}
describe('inquiry lead delivery', () => {
  it('attributes the lead to GRyland1 and the referring partner name', () => {
    expect(inquiryTags(context.affiliate)).toEqual(['partner-referral', 'credit-inquiry-removal', 'partner:Gene Ryland', 'partner-id:GRyland1']);
  });
  it('delivers clients without optional phone or email', async () => {
    const s = services();
    await deliverInquiry(context, empty, s);
    expect(s.contact).toHaveBeenCalledWith(context);
    expect(s.slack).toHaveBeenCalledOnce();
  });
  it('uploads documents to the GoHighLevel contact', async () => {
    const s = services();
    await deliverInquiry(context, empty, s);
    expect(s.documents).toHaveBeenCalledWith(context, 'contact');
    expect(s.save).toHaveBeenCalledWith({ document_state: 'uploaded' });
  });
  it('never notifies Slack when a document upload failed', async () => {
    const s = services(); s.documents.mockRejectedValue(new Error('upload failed'));
    await expect(deliverInquiry(context, empty, s)).rejects.toThrow('upload failed');
    expect(s.slack).not.toHaveBeenCalled();
  });
  it('allows orders with no uploads', async () => {
    const s = services();
    await deliverInquiry({ ...context, documentCount: 0 }, empty, s);
    expect(s.documents).not.toHaveBeenCalled();
    expect(s.save).toHaveBeenCalledWith({ document_state: 'not_needed' });
  });
  it('resumes after partial success without recreating completed steps', async () => {
    const s = services();
    await deliverInquiry(context, { ...empty, ghl_contact_id: 'saved-contact', ghl_opportunity_id: 'saved-opp', ghl_note_id: 'saved-note' }, s);
    expect(s.contact).not.toHaveBeenCalled();
    expect(s.opportunity).not.toHaveBeenCalled();
    expect(s.note).not.toHaveBeenCalled();
    expect(s.slack).toHaveBeenCalledOnce();
  });
  it('never notifies Slack when creating the opportunity failed', async () => {
    const s = services(); s.opportunity.mockRejectedValue(new Error('scope missing'));
    await expect(deliverInquiry(context, empty, s)).rejects.toThrow('scope missing');
    expect(s.slack).not.toHaveBeenCalled();
  });
  it('does not deliver draft orders', async () => {
    const s = services();
    await expect(deliverInquiry({ ...context, order: { ...context.order, status: 'draft' } }, empty, s)).rejects.toThrow('Only submitted');
    expect(s.contact).not.toHaveBeenCalled();
  });
  it('requires permission confirmation', async () => {
    const s = services();
    await expect(deliverInquiry({ ...context, order: { ...context.order, permission_confirmed: false } }, empty, s)).rejects.toThrow('permission-confirmed');
    expect(s.contact).not.toHaveBeenCalled();
  });
  it('includes only trimmed client names and the required notice lines in order', () => {
    const c = { ...context, client: { first_name: ' Test ', last_name: ' Client ', email: 'private-email', phone: 'private-phone', notes: 'private-notes' } };
    expect(slackNotice(c, true).split('\n')).toEqual([
      'New inquiry-removal lead — CIR-TEST',
      'Client: Test Client',
      'Partner: Gene Ryland',
      'Bureaus: Equifax, Experian',
      'GoHighLevel: contact and New Lead opportunity created.',
      'Mission Control: task assigned to the credit repair specialist.',
      'Payment: not verified.',
      'Documents: 2 attached to the GoHighLevel contact.',
      'Review: https://rylandpartners.com/portal/admin/inquiries?order=order-1',
    ]);
  });
  it('describes later uploads when there are no documents', () => {
    const c = { ...context, documentCount: 0, order: { ...context.order, bureaus: [] } };
    const lines = slackNotice(c, true).split('\n');
    expect(lines[3]).toBe('Bureaus: none');
    expect(lines[7]).toBe('Documents: none yet. Later uploads will be added in this thread.');
  });
  it('escapes Slack controls in client and partner names', () => {
    const c = { ...context, client: { ...context.client, first_name: ' <@all> ', last_name: ' A&B ' }, affiliate: { ...context.affiliate, full_name: '<partner>&' } };
    const lines = slackNotice(c, false).split('\n');
    expect(lines[1]).toBe('Client: &lt;@all&gt; A&amp;B');
    expect(lines[2]).toBe('Partner: &lt;partner&gt;&amp;');
    expect(slackEscape('<>&')).toBe('&lt;&gt;&amp;');
  });
  it('formats a names-only escaped and trimmed document reply', () => {
    expect(slackDocsAddedReply(3, ' <First> ', ' Last& ')).toBe('3 document(s) added for &lt;First&gt; Last&amp;');
  });
  it('persists the initial Slack timestamp and skips an existing notice on retry', async () => {
    const s = services();
    await deliverInquiry(context, empty, s);
    expect(s.save).toHaveBeenCalledWith({ slack_ts: 'timestamp' });
    s.slack.mockClear();
    await deliverInquiry(context, { ...empty, slack_ts: 'timestamp' }, s);
    expect(s.slack).not.toHaveBeenCalled();
  });
  it('normalizes GRyland1 US phone numbers', () => {
    expect(normalizePhone('3056844158')).toBe('+13056844158');
    expect(normalizePhone(null)).toBeUndefined();
  });
});