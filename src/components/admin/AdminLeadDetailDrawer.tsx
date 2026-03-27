import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Briefcase, CalendarClock, FileText, UserCheck, Link2 } from "lucide-react";
import type { Lead } from "@/types/leads";
import { stageColors, statusColors } from "@/types/leads";
import { formatCurrency, formatDateTime, formatDateTimeWithTime } from "@/utils/formatters";
import { differenceInDays } from "date-fns";

interface AdminLeadDetailDrawerProps {
  lead: (Lead & { affiliate?: { full_name: string; affiliate_id: string } | null }) | null;
  open: boolean;
  onClose: () => void;
}

function DetailRow({ label, value, href }: { label: string; value: string; href?: string }) {
  return (
    <div className="flex justify-between items-start gap-4 py-2">
      <span className="text-xs font-medium text-slate-500 uppercase tracking-wider shrink-0">{label}</span>
      {href && value !== "—" ? (
        <a href={href} className="text-sm text-blue-600 hover:text-blue-800 hover:underline text-right" target={href.startsWith('http') ? '_blank' : undefined} rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}>{value}</a>
      ) : (
        <span className="text-sm text-slate-900 text-right">{value}</span>
      )}
    </div>
  );
}

function SectionCard({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <Card className="border-slate-200">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
          <Icon className="h-4 w-4 text-slate-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</h3>
        </div>
        <div className="divide-y divide-slate-100">{children}</div>
      </CardContent>
    </Card>
  );
}

export default function AdminLeadDetailDrawer({ lead, open, onClose }: AdminLeadDetailDrawerProps) {
  if (!lead) return null;

  const daysInStage = lead.updated_at
    ? differenceInDays(new Date(), new Date(lead.updated_at))
    : null;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-lg font-semibold text-slate-900">{lead.full_name}</SheetTitle>
          <SheetDescription className="text-sm text-slate-500">Lead details and pipeline status</SheetDescription>
        </SheetHeader>

        <div className="space-y-4 pb-8">
          {/* Contact Info */}
          <SectionCard icon={User} title="Contact Information">
            <DetailRow label="Name" value={lead.full_name} />
            <DetailRow label="Email" value={lead.email ?? "—"} href={lead.email ? `mailto:${lead.email}` : undefined} />
            <DetailRow label="Phone" value={lead.phone ?? "—"} href={lead.phone ? `tel:${lead.phone}` : undefined} />
            <DetailRow label="Company" value={lead.company_name ?? "—"} />
          </SectionCard>

          {/* Referred By */}
          {lead.affiliate && (
            <SectionCard icon={UserCheck} title="Referred By">
              <DetailRow label="Affiliate" value={lead.affiliate.full_name} />
              <DetailRow label="Affiliate ID" value={lead.affiliate.affiliate_id} />
            </SectionCard>
          )}

          {/* Pipeline Status */}
          <SectionCard icon={Briefcase} title="Pipeline Status">
            <div className="flex justify-between items-center py-2">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Status</span>
              <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusColors[lead.status ?? ""] ?? "bg-slate-100 text-slate-600 border-slate-200"}`}>
                {lead.status ?? "—"}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Stage</span>
              <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${stageColors[lead.pipeline_stage ?? ""] ?? "bg-slate-100 text-slate-600 border-slate-200"}`}>
                {lead.pipeline_stage ?? "—"}
              </span>
            </div>
            {daysInStage !== null && (
              <DetailRow label="Days in Stage" value={`${daysInStage} day${daysInStage !== 1 ? 's' : ''}`} />
            )}
            <DetailRow label="Deal Amount" value={formatCurrency(lead.deal_amount)} />
          </SectionCard>

          {/* Commission Info */}
          <SectionCard icon={Briefcase} title="Commission">
            <DetailRow label="Amount" value={formatCurrency(lead.commission_amount)} />
            <DetailRow label="Status" value={lead.commission_status ?? "—"} />
          </SectionCard>

          {/* Assignment & Next Actions */}
          <SectionCard icon={CalendarClock} title="Assignment & Next Actions">
            <DetailRow label="Assigned Rep" value={lead.assigned_rep ?? "—"} />
            <DetailRow label="Next Step" value={lead.next_step ?? "—"} />
            <DetailRow label="Next Appointment" value={formatDateTimeWithTime(lead.next_appointment_at)} />
          </SectionCard>

          {/* Notes & Updates */}
          <SectionCard icon={FileText} title="Notes & Updates">
            <div className="py-2">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block mb-1">Latest Update</span>
              <p className="text-sm text-slate-900">{lead.latest_update ?? "—"}</p>
            </div>
            <div className="py-2">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block mb-1">Notes</span>
              <p className="text-sm text-slate-900 whitespace-pre-wrap">{lead.notes ?? "—"}</p>
            </div>
            <DetailRow label="Referred" value={formatDateTime(lead.referred_at)} />
            <DetailRow label="Last Updated" value={formatDateTimeWithTime(lead.updated_at)} />
          </SectionCard>

          {/* ClickUp Placeholder */}
          <SectionCard icon={Link2} title="ClickUp Integration">
            <div className="py-3 text-center">
              <p className="text-sm text-slate-400">ClickUp integration coming soon</p>
              <p className="text-xs text-slate-400 mt-1">Task data and notes will appear here once API credentials are configured</p>
            </div>
          </SectionCard>
        </div>
      </SheetContent>
    </Sheet>
  );
}
