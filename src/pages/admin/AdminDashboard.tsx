import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users, 
  DollarSign, 
  UserCheck, 
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardStats {
  totalAffiliates: number;
  pendingApprovals: number;
  totalLeads: number;
  totalCommissions: number;
  pendingPayouts: number;
  thisMonthRevenue: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Get affiliate counts
        const { count: totalAffiliates } = await supabase
          .from('affiliates')
          .select('*', { count: 'exact', head: true });
        
        const { count: pendingApprovals } = await supabase
          .from('affiliates')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending');

        // Get lead count
        const { count: totalLeads } = await supabase
          .from('affiliate_leads')
          .select('*', { count: 'exact', head: true });

        // Get commission stats
        const { data: commissionData } = await supabase
          .from('commissions')
          .select('commission_amount, commission_status');

        const totalCommissions = commissionData?.reduce((sum, c) => 
          sum + (c.commission_amount || 0), 0) || 0;
        
        const pendingPayouts = commissionData?.filter(c => 
          c.commission_status === 'pending').length || 0;

        // Get this month's revenue (commissions created this month)
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const { data: monthlyData } = await supabase
          .from('commissions')
          .select('commission_amount')
          .gte('created_at', startOfMonth.toISOString());

        const thisMonthRevenue = monthlyData?.reduce((sum, c) => 
          sum + (c.commission_amount || 0), 0) || 0;

        setStats({
          totalAffiliates: totalAffiliates || 0,
          pendingApprovals: pendingApprovals || 0,
          totalLeads: totalLeads || 0,
          totalCommissions,
          pendingPayouts,
          thisMonthRevenue,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const navigate = useNavigate();

  const statCards = [
    {
      title: "Total Affiliates",
      value: stats?.totalAffiliates || 0,
      icon: Users,
      trend: "+12%",
      trendUp: true,
      subtitle: `${stats?.pendingApprovals || 0} pending approval`,
      link: "/portal/admin/affiliates",
    },
    {
      title: "Total Leads",
      value: stats?.totalLeads || 0,
      icon: UserCheck,
      trend: "+8%",
      trendUp: true,
      subtitle: "Across all affiliates",
      link: "/portal/admin/leads",
    },
    {
      title: "Total Commissions",
      value: formatCurrency(stats?.totalCommissions || 0),
      icon: DollarSign,
      trend: "+23%",
      trendUp: true,
      subtitle: `${stats?.pendingPayouts || 0} pending payout`,
      link: "/portal/admin/commissions",
    },
    {
      title: "This Month",
      value: formatCurrency(stats?.thisMonthRevenue || 0),
      icon: TrendingUp,
      trend: "+15%",
      trendUp: true,
      subtitle: "Revenue generated",
      link: "/portal/admin/commissions?period=month",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">Overview of your affiliate program performance</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          const TrendIcon = card.trendUp ? ArrowUpRight : ArrowDownRight;
          
          return (
            <Card
              key={index}
              className="cursor-pointer hover:shadow-md hover:border-blue-200 transition-all group"
              onClick={() => navigate(card.link)}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">
                  {card.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-slate-400" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <>
                    <div className="text-2xl font-bold text-slate-900">{card.value}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`flex items-center text-xs ${card.trendUp ? 'text-green-600' : 'text-red-600'}`}>
                        <TrendIcon className="h-3 w-3 mr-0.5" />
                        {card.trend}
                      </span>
                      <span className="text-xs text-slate-500">{card.subtitle}</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Activity Section */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Affiliates</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentAffiliates />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pending Commissions</CardTitle>
          </CardHeader>
          <CardContent>
            <PendingCommissions />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface Affiliate {
  id: string;
  full_name: string;
  email: string;
  status: string;
  created_at: string;
}

function RecentAffiliates() {
  const navigate = useNavigate();
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecent = async () => {
      const { data } = await supabase
        .from('affiliates')
        .select('id, full_name, email, status, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      setAffiliates(data || []);
      setLoading(false);
    };
    fetchRecent();
  }, []);

  if (loading) {
    return <div className="space-y-3">
      {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
    </div>;
  }

  if (affiliates.length === 0) {
    return <p className="text-sm text-slate-500">No affiliates yet</p>;
  }

  return (
    <div className="space-y-1">
      {affiliates.map((affiliate) => (
        <div
          key={affiliate.id}
          className="flex items-center justify-between py-2 px-2 -mx-2 rounded-md border-b border-slate-100 last:border-0 cursor-pointer hover:bg-slate-50 transition-colors"
          onClick={() => navigate(`/portal/admin/affiliates/${affiliate.id}`)}
        >
          <div>
            <p className="text-sm font-medium text-slate-900">{affiliate.full_name}</p>
            <p className="text-xs text-slate-500">{affiliate.email}</p>
          </div>
          <span className={`text-xs px-2 py-1 rounded-full ${
            affiliate.status === 'approved' ? 'bg-green-100 text-green-700' :
            affiliate.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
            'bg-red-100 text-red-700'
          }`}>
            {affiliate.status}
          </span>
        </div>
      ))}
    </div>
  );
}

interface CommissionWithAffiliate {
  commission_amount: number;
  commission_status: string;
  created_at: string;
  affiliates: { full_name: string } | null;
}

function PendingCommissions() {
  const [commissions, setCommissions] = useState<CommissionWithAffiliate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPending = async () => {
      const { data } = await supabase
        .from('commissions')
        .select('commission_amount, commission_status, created_at, affiliates(full_name)')
        .eq('commission_status', 'pending')
        .order('created_at', { ascending: false })
        .limit(5);
      
      setCommissions(data || []);
      setLoading(false);
    };
    fetchPending();
  }, []);

  if (loading) {
    return <div className="space-y-3">
      {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
    </div>;
  }

  if (commissions.length === 0) {
    return <p className="text-sm text-slate-500">No pending commissions</p>;
  }

  return (
    <div className="space-y-3">
      {commissions.map((commission, idx) => (
        <div key={idx} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
          <div>
            <p className="text-sm font-medium text-slate-900">
              ${commission.commission_amount?.toFixed(2)}
            </p>
            <p className="text-xs text-slate-500">
              {commission.affiliates?.full_name || 'Unknown'}
            </p>
          </div>
          <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700">
            Pending
          </span>
        </div>
      ))}
    </div>
  );
}
