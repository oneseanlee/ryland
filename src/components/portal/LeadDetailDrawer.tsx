import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Card, CardContent } from "@/components/ui/card";
import { User, Briefcase, CalendarClock, FileText } from "lucide-react";
import type { Lead } from "@/types/leads";
import { stageColors, statusColors } from "@/types/leads";
import { formatCurrency, formatDateTime, formatDateTimeWithTime } from "@/utils/formatters";

interface LeadDetailDrawerProps {
  lead: Lead | null;
  open: boolean;
  onClose: () => void;
}

function DetailRow({ label, value, href }: { label: string; value: string; href?: string }) {
  return (
    <div className="flex justify-between items-start gap-4 py-2">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider shrink-0">{label}</span>
      {href && value !== "—" ? (
        <a href={href} className="text-sm text-blue-600 hover:text-blue-800 hover:underline text-right">{value}</a>
      ) : (
        <span className="text-sm text-foreground text-right">{value}</span>
      )}
    </div>
  );
}

function SectionCard({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border/30">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
        </div>
        <div className="divide-y divide-border/20">{children}</div>
      </CardContent>
    </Card>
  );
}

export default function LeadDetailDrawer({ lead, open, onClose }: LeadDetailDrawerProps) {
  if (!lead) return null;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto border-border/40 bg-background">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-lg font-semibold text-foreground">{lead.full_name}</SheetTitle>
          <SheetDescription className="text-sm text-muted-foreground">Lead details and activity</SheetDescription>
        </SheetHeader>

        <div className="space-y-4 pb-8">
          {/* Contact Info */}
          <SectionCard icon={User} title="Contact Info">
            <DetailRow label="Name" value={lead.full_name} />
            <DetailRow label="Email" value={lead.email ?? "—"} href={lead.email ? `mailto:${lead.email}` : undefined} />
            <DetailRow label="Phone" value={lead.phone ?? "—"} href={lead.phone ? `tel:${lead.phone}` : undefined} />
            <DetailRow label="Company" value={lead.company_name ?? "—"} />
          </SectionCard>

          {/* Deal Status */}
          <SectionCard icon={Briefcase} title="Deal Status">
            <div className="flex justify-between items-center py-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</span>
              <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusColors[lead.status ?? ""] ?? "bg-muted text-muted-foreground border-border"}`}>
                {lead.status ?? "—"}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Stage</span>
              <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${stageColors[lead.pipeline_stage ?? ""] ?? "bg-muted text-muted-foreground border-border"}`}>
                {lead.pipeline_stage ?? "—"}
              </span>
            </div>
            <DetailRow label="Deal Amount" value={formatCurrency(lead.deal_amount)} />
            <DetailRow label="Commission" value={formatCurrency(lead.commission_amount)} />
            <DetailRow label="Comm. Status" value={lead.commission_status ?? "—"} />
            <DetailRow label="Assigned Rep" value={lead.assigned_rep ?? "—"} />
          </SectionCard>

          {/* Next Actions */}
          <SectionCard icon={CalendarClock} title="Next Actions">
            <DetailRow label="Next Appt" value={formatDateTimeWithTime(lead.next_appointment_at)} />
            <DetailRow label="Next Step" value={lead.next_step ?? "—"} />
          </SectionCard>

          {/* Notes & Updates */}
          <SectionCard icon={FileText} title="Notes & Updates">
            <div className="py-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1">Latest Update</span>
              <p className="text-sm text-foreground">{lead.latest_update ?? "—"}</p>
            </div>
            <div className="py-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1">Notes</span>
              <p className="text-sm text-foreground whitespace-pre-wrap">{lead.notes ?? "—"}</p>
            </div>
            <DetailRow label="Referred" value={formatDateTime(lead.referred_at)} />
            <DetailRow label="Last Updated" value={formatDateTimeWithTime(lead.updated_at)} />
          </SectionCard>
        </div>
      </SheetContent>
    </Sheet>
  );
}
