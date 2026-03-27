import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Building2, Globe, Calendar, Link2, Mail, Phone } from "lucide-react";
import { format } from "date-fns";

interface AffiliateProfileTabProps {
  affiliate: {
    id: string;
    affiliate_id: string;
    full_name: string;
    email: string;
    phone: string | null;
    company_name: string | null;
    website: string | null;
    ghl_contact_id: string | null;
    status: string;
    created_at: string;
    payment_email: string | null;
  };
}

function InfoRow({ icon: Icon, label, value, isLink, href }: { icon: React.ElementType; label: string; value: string | null; isLink?: boolean; href?: string }) {
  const link = href || (isLink && value ? (value.startsWith('http') ? value : `https://${value}`) : undefined);
  const isExternal = link?.startsWith('http');
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
      <Icon className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</p>
        {link && value ? (
          <a href={link} target={isExternal ? '_blank' : undefined} rel={isExternal ? 'noopener noreferrer' : undefined} className="text-sm text-blue-600 hover:text-blue-800 hover:underline break-all">{value}</a>
        ) : (
          <p className="text-sm text-slate-900">{value || "—"}</p>
        )}
      </div>
    </div>
  );
}

export default function AffiliateProfileTab({ affiliate }: AffiliateProfileTabProps) {
  const statusColors: Record<string, string> = {
    approved: "bg-green-100 text-green-700",
    pending: "bg-yellow-100 text-yellow-700",
    suspended: "bg-red-100 text-red-700",
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">Personal Information</h3>
          <InfoRow icon={User} label="Full Name" value={affiliate.full_name} />
          <InfoRow icon={Mail} label="Email" value={affiliate.email} href={affiliate.email ? `mailto:${affiliate.email}` : undefined} />
          <InfoRow icon={Phone} label="Phone" value={affiliate.phone} href={affiliate.phone ? `tel:${affiliate.phone}` : undefined} />
          <InfoRow icon={Link2} label="Affiliate ID" value={affiliate.affiliate_id} />
          <div className="flex items-start gap-3 py-3 border-b border-slate-100">
            <Calendar className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Status</p>
              <Badge className={statusColors[affiliate.status] || "bg-slate-100 text-slate-700"}>
                {affiliate.status}
              </Badge>
            </div>
          </div>
          <InfoRow icon={Calendar} label="Joined" value={format(new Date(affiliate.created_at), "MMM d, yyyy")} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">Business Information</h3>
          <InfoRow icon={Building2} label="Company" value={affiliate.company_name} />
          <InfoRow icon={Globe} label="Website" value={affiliate.website} isLink />
          <InfoRow icon={Mail} label="Payment Email" value={affiliate.payment_email} href={affiliate.payment_email ? `mailto:${affiliate.payment_email}` : undefined} />
          <InfoRow icon={Link2} label="GHL Contact ID" value={affiliate.ghl_contact_id} />
          <InfoRow icon={Link2} label="Referral Link" value={`rylandpartners.com/?ref=${affiliate.affiliate_id}`} />
        </CardContent>
      </Card>
    </div>
  );
}
