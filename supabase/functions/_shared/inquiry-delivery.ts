export interface DeliveryOrder {
  id: string;
  client_id: string | null;
  affiliate_id: string;
  checkout_batch_id: string | null;
  status: string;
  permission_confirmed: boolean;
  service_name: string;
  bureaus: string[];
  add_ons: { name: string; price: number }[];
  instructions: string | null;
  payment_status: string;
}

export interface DeliveryRecord {
  ghl_contact_id: string | null;
  ghl_opportunity_id: string | null;
  ghl_note_id: string | null;
  slack_ts: string | null;
}

export interface DeliveryContext {
  order: DeliveryOrder;
  client: { first_name: string; last_name: string; email: string | null; phone: string | null; notes: string | null };
  affiliate: { full_name: string; affiliate_id: string };
  reference: string;
  documentCount: number;
}

export function inquiryTags(affiliate: DeliveryContext['affiliate']) {
  return ['partner-referral', 'credit-inquiry-removal', `partner:${affiliate.full_name}`, `partner-id:${affiliate.affiliate_id}`];
}

export function normalizePhone(phone: string | null): string | undefined {
  const digits = (phone ?? '').replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  if (phone?.trim().startsWith('+') && digits.length >= 8 && digits.length <= 15) return `+${digits}`;
  return undefined;
}

export function inquiryNote(c: DeliveryContext) {
  return [
    `${c.order.service_name} — ${c.reference}`,
    `Referred by: ${c.affiliate.full_name} (${c.affiliate.affiliate_id})`,
    `Bureaus: ${c.order.bureaus.join(', ') || 'none'}`,
    `Add-ons: ${c.order.add_ons.map(a => a.name).join(', ') || 'none'}`,
    `Payment status: ${c.order.payment_status} (submission is not payment confirmation)`,
    c.client.notes ? `Client notes: ${c.client.notes}` : '',
    c.order.instructions ? `Order instructions: ${c.order.instructions}` : '',
    `Uploaded documents: ${c.documentCount}. Copies are attached in the contact's Inquiry Documents field.`,
    `Authorized staff: https://rylandpartners.com/portal/admin/inquiries?order=${c.order.id}`,
  ].filter(Boolean).join('\n');
}

export function slackNotice(c: DeliveryContext, documentsPending: boolean) {
  return [
    `New inquiry-removal lead — ${c.reference}`,
    `Partner: ${c.affiliate.full_name}`,
    `Bureaus: ${c.order.bureaus.join(', ') || 'none'}`,
    `GoHighLevel: contact and New Lead opportunity created.`,
    `Payment: not verified.`,
    documentsPending ? `${c.documentCount} document(s) attached to the GoHighLevel contact.` : 'No documents uploaded.',
    `Review: https://rylandpartners.com/portal/admin/inquiries?order=${c.order.id}`,
  ].join('\n');
}

export interface DeliveryServices {
  contact(c: DeliveryContext): Promise<string>;
  opportunity(c: DeliveryContext, contactId: string): Promise<string>;
  note(c: DeliveryContext, contactId: string): Promise<string>;
  /** Uploads only files not yet sent, marking each as it succeeds. */
  documents(c: DeliveryContext, contactId: string): Promise<void>;
  slack(c: DeliveryContext, documentsPending: boolean): Promise<string>;
  save(patch: Partial<DeliveryRecord> & { state?: string; document_state?: string; last_error?: string | null }): Promise<void>;
}

/** Each successful external step is persisted before the next one; retries resume from that step. */
export async function deliverInquiry(c: DeliveryContext, record: DeliveryRecord, s: DeliveryServices) {
  if (c.order.status !== 'submitted' || !c.order.checkout_batch_id || !c.order.permission_confirmed) {
    throw new Error('Only submitted, permission-confirmed orders can be delivered');
  }
  let contactId = record.ghl_contact_id;
  if (!contactId) {
    contactId = await s.contact(c);
    await s.save({ ghl_contact_id: contactId });
  }
  if (!record.ghl_opportunity_id) {
    const id = await s.opportunity(c, contactId);
    await s.save({ ghl_opportunity_id: id });
  }
  if (!record.ghl_note_id) {
    const id = await s.note(c, contactId);
    await s.save({ ghl_note_id: id });
  }
  const documentsPending = c.documentCount > 0;
  if (documentsPending) await s.documents(c, contactId);
  await s.save({ document_state: documentsPending ? 'uploaded' : 'not_needed' });
  if (!record.slack_ts) {
    const ts = await s.slack(c, documentsPending);
    await s.save({ slack_ts: ts });
  }
  await s.save({ state: 'complete', last_error: null });
}