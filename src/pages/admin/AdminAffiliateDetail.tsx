import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, User, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import AffiliateProfileTab from "@/components/admin/affiliate-detail/AffiliateProfileTab";
import AffiliateCommissionsTab from "@/components/admin/affiliate-detail/AffiliateCommissionsTab";
import AffiliateLeadsTab from "@/components/admin/affiliate-detail/AffiliateLeadsTab";
import AffiliatePayoutsTab from "@/components/admin/affiliate-detail/AffiliatePayoutsTab";
import AffiliateSettingsTab from "@/components/admin/affiliate-detail/AffiliateSettingsTab";

interface Affiliate {
  id: string;
  user_id: string;
  affiliate_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  company_name: string | null;
  website: string | null;
  ghl_contact_id: string | null;
  status: string;
  payment_email: string | null;
  w9_file_url: string | null;
  upfront_commission_rate: number;
  backend_commission_rate: number;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export default function AdminAffiliateDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null);
  const [loading, setLoading] = useState(true);
  const [leadCount, setLeadCount] = useState(0);

  const fetchAffiliate = async () => {
    if (!id) return;
    try {
      const { data, error } = await supabase
        .from("affiliates")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setAffiliate(data as Affiliate);

      // Get lead count
      const { count } = await supabase
        .from("affiliate_leads")
        .select("*", { count: "exact", head: true })
        .eq("affiliate_id", id);
      setLeadCount(count || 0);
    } catch (error) {
      console.error("Error fetching affiliate:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAffiliate();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!affiliate) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-slate-500 mb-4">Affiliate not found</p>
        <Button variant="outline" onClick={() => navigate("/portal/admin/affiliates")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Affiliates
        </Button>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    approved: "bg-green-100 text-green-700",
    pending: "bg-yellow-100 text-yellow-700",
    suspended: "bg-red-100 text-red-700",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate("/portal/admin/affiliates")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="h-14 w-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xl font-bold text-white">
          {affiliate.full_name.charAt(0)}
        </div>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">{affiliate.full_name}</h1>
            <Badge className={statusColors[affiliate.status] || "bg-slate-100 text-slate-700"}>
              {affiliate.status}
            </Badge>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-sm text-slate-500">{affiliate.email}</span>
            <span className="text-sm text-slate-400">|</span>
            <span className="text-sm text-slate-500">ID: {affiliate.affiliate_id}</span>
            <span className="text-sm text-slate-400">|</span>
            <span className="text-sm text-slate-500">{leadCount} leads</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="bg-slate-100">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="commissions">Commissions</TabsTrigger>
          <TabsTrigger value="leads">Leads</TabsTrigger>
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <AffiliateProfileTab affiliate={affiliate} onUpdate={fetchAffiliate} />
        </TabsContent>

        <TabsContent value="commissions">
          <AffiliateCommissionsTab
            affiliateId={affiliate.id}
            upfrontRate={affiliate.upfront_commission_rate}
            backendRate={affiliate.backend_commission_rate}
          />
        </TabsContent>

        <TabsContent value="leads">
          <AffiliateLeadsTab
            affiliateId={affiliate.id}
            affiliateName={affiliate.full_name}
            affiliateAffiliateId={affiliate.affiliate_id}
          />
        </TabsContent>

        <TabsContent value="payouts">
          <AffiliatePayoutsTab
            affiliateId={affiliate.id}
            paymentEmail={affiliate.payment_email}
            w9FileUrl={affiliate.w9_file_url}
          />
        </TabsContent>

        <TabsContent value="settings">
          <AffiliateSettingsTab
            affiliate={affiliate}
            onUpdate={fetchAffiliate}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
