import { describe, expect, it, vi } from 'vitest';
import { deliverInquiry, inquiryTags, normalizePhone, slackNotice, type DeliveryContext, type DeliveryRecord } from './inquiry-delivery';

const context: DeliveryContext = {
  order: { id: 'order-1', client_id: 'client-1', affiliate_id: 'affiliate-1', checkout_batch_id: 'batch-1', status: 'submitted', permission_confirmed: true, service_name: 'Credit Inquiry Removal', bureaus: ['Equifax', 'Experian'], add_ons: [], instructions: null, payment_status: 'unpaid' },
  client: { first_name: 'Test', last_name: 'Client', email: null, phone: null, notes: null },
  affiliate: { full_name: 'Gene Ryland', affiliate_id: 'GRyland1' },
  reference: 'CIR-TEST', documentCount: 2,
};
const empty: DeliveryRecord = { ghl_contact_id: null, ghl_opportunity_id: null, ghl_note_id: null, slack_ts: null };
function services() {
  return { contact: vi.fn().mockResolvedValue('contact'), opportunity: vi.fn().mockResolvedValue('opp'), note: vi.fn().mockResolvedValue('note'), slack: vi.fn().mockResolvedValue('timestamp'), save: vi.fn().mockResolvedValue(undefined) };
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
  it('does not upload private document copies without a verified private method', async () => {
    const s = services();
    await deliverInquiry(context, empty, s);
    expect(s.save).toHaveBeenCalledWith({ document_state: 'blocked_private_upload' });
  });
  it('allows orders with no uploads', async () => {
    const s = services();
    await deliverInquiry({ ...context, documentCount: 0 }, empty, s);
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
  it('excludes client identity and document content from Slack notifications', () => {
    const text = slackNotice(context, true);
    expect(text).not.toContain('Test Client');
    expect(text).toContain('Payment: not verified');
  });
  it('normalizes GRyland1 US phone numbers', () => {
    expect(normalizePhone('3056844158')).toBe('+13056844158');
    expect(normalizePhone(null)).toBeUndefined();
  });
});