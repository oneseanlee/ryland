import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DollarSign,
  CheckCircle2,
  Clock,
  Ban,
  TrendingUp,
  Calendar,
  X
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { format } from "date-fns";

type CommissionStatus = 'pending' | 'approved' | 'paid';

interface Commission {
  id: string;
  affiliate_id: string;
  lead_id: string | null;
  commission_type: string;
  commission_amount: number;
  commission_status: CommissionStatus;
  payout_date: string | null;
  created_at: string;
  affiliate: {
    full_name: string;
    email: string;
  } | null;
  lead: {
    full_name: string;
    deal_amount: number | null;
  } | null;
}

export default function AdminCommissions() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | CommissionStatus>('all');
  const [selectedCommissions, setSelectedCommissions] = useState<string[]>([]);
  const [periodFilter, setPeriodFilter] = useState<'all' | 'month'>(
    searchParams.get('period') === 'month' ? 'month' : 'all'
  );
  const [stats, setStats] = useState({
    totalPending: 0,
    totalApproved: 0,
    totalPaid: 0,
    totalAmount: 0,
  });

  useEffect(() => {
    fetchCommissions();
  }, [statusFilter, periodFilter]);

  const fetchCommissions = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('commissions')
        .select(`
          id,
          affiliate_id,
          lead_id,
          commission_type,
          commission_amount,
          commission_status,
          payout_date,
          created_at,
          affiliates(full_name, email),
          affiliate_leads(full_name, deal_amount)
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('commission_status', statusFilter);
      }

      if (periodFilter === 'month') {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        query = query.gte('created_at', startOfMonth.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      // Transform data to match interface
      interface RawCommission {
        id: string;
        affiliate_id: string;
        lead_id: string | null;
        commission_type: string;
        commission_amount: number;
        commission_status: CommissionStatus;
        payout_date: string | null;
        created_at: string;
        affiliates: { full_name: string; email: string } | null;
        affiliate_leads: { full_name: string; deal_amount: number | null } | null;
      }
      
      const transformedData: Commission[] = (data || []).map((item: RawCommission) => ({
        id: item.id,
        affiliate_id: item.affiliate_id,
        lead_id: item.lead_id,
        commission_type: item.commission_type,
        commission_amount: item.commission_amount,
        commission_status: item.commission_status,
        payout_date: item.payout_date,
        created_at: item.created_at,
        affiliate: item.affiliates,
        lead: item.affiliate_leads,
      }));

      setCommissions(transformedData);

      // Calculate stats
      const pending = transformedData.filter(c => c.commission_status === 'pending');
      const approved = transformedData.filter(c => c.commission_status === 'approved');
      const paid = transformedData.filter(c => c.commission_status === 'paid');

      setStats({
        totalPending: pending.length,
        totalApproved: approved.length,
        totalPaid: paid.length,
        totalAmount: pending.reduce((sum, c) => sum + c.commission_amount, 0),
      });
    } catch (error) {
      console.error('Error fetching commissions:', error);
      toast.error('Failed to load commissions');
    } finally {
      setLoading(false);
    }
  };

  interface CommissionUpdate {
    commission_status: 'approved' | 'paid';
    payout_date?: string;
  }

  const updateCommissionStatus = async (ids: string[], status: 'approved' | 'paid') => {
    try {
      const updates: CommissionUpdate = { commission_status: status };
      if (status === 'paid') {
        updates.payout_date = new Date().toISOString();
      }

      const { error } = await supabase
        .from('commissions')
        .update(updates)
        .in('id', ids);

      if (error) throw error;

      setCommissions(prev => prev.map(c => 
        ids.includes(c.id) ? { ...c, commission_status: status, payout_date: updates.payout_date || c.payout_date } : c
      ));

      toast.success(`${ids.length} commission(s) marked as ${status}`);
      setSelectedCommissions([]);
    } catch (error) {
      console.error('Error updating commissions:', error);
      toast.error('Failed to update commissions');
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedCommissions(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    const pendingIds = commissions
      .filter(c => c.commission_status === 'pending')
      .map(c => c.id);
    
    if (selectedCommissions.length === pendingIds.length) {
      setSelectedCommissions([]);
    } else {
      setSelectedCommissions(pendingIds);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-700"><CheckCircle2 className="h-3 w-3 mr-1" /> Paid</Badge>;
      case 'approved':
        return <Badge className="bg-blue-100 text-blue-700"><TrendingUp className="h-3 w-3 mr-1" /> Approved</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const pendingCommissions = commissions.filter(c => c.commission_status === 'pending');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Commission Management</h1>
          <p className="text-slate-500 mt-1">Review, approve, and process affiliate commissions</p>
        </div>
      </div>

      {/* Period Filter Chip */}
      {periodFilter === 'month' && (
        <div className="flex items-center gap-2">
          <Badge className="bg-blue-100 text-blue-700 px-3 py-1.5 text-sm">
            <Calendar className="h-3.5 w-3.5 mr-1.5" />
            Showing: This Month
            <button
              className="ml-2 hover:bg-blue-200 rounded-full p-0.5"
              onClick={() => {
                setPeriodFilter('all');
                setSearchParams({});
              }}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Pending</p>
                <p className="text-2xl font-bold text-slate-900">{stats.totalPending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Approved</p>
                <p className="text-2xl font-bold text-slate-900">{stats.totalApproved}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Paid</p>
                <p className="text-2xl font-bold text-slate-900">{stats.totalPaid}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Pending Amount</p>
                <p className="text-2xl font-bold text-slate-900">${stats.totalAmount.toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-slate-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bulk Actions */}
      {selectedCommissions.length > 0 && (
        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <span className="text-sm text-blue-900">
            {selectedCommissions.length} commission(s) selected
          </span>
          <div className="flex gap-2 ml-auto">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => updateCommissionStatus(selectedCommissions, 'approved')}
            >
              Approve Selected
            </Button>
            <Button 
              size="sm"
              onClick={() => updateCommissionStatus(selectedCommissions, 'paid')}
            >
              Mark as Paid
            </Button>
          </div>
        </div>
      )}

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>All Commissions</CardTitle>
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as 'all' | CommissionStatus)}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox 
                        checked={selectedCommissions.length === pendingCommissions.length && pendingCommissions.length > 0}
                        onCheckedChange={toggleAll}
                      />
                    </TableHead>
                    <TableHead>Affiliate</TableHead>
                    <TableHead>Lead/Deal</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {commissions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                        No commissions found
                      </TableCell>
                    </TableRow>
                  ) : (
                    commissions.map((commission) => (
                      <TableRow key={commission.id}>
                        <TableCell>
                          {commission.commission_status === 'pending' && (
                            <Checkbox 
                              checked={selectedCommissions.includes(commission.id)}
                              onCheckedChange={() => toggleSelection(commission.id)}
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-slate-900">
                              {commission.affiliate?.full_name || 'Unknown'}
                            </p>
                            <p className="text-xs text-slate-500">
                              {commission.affiliate?.email}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {commission.lead ? (
                            <div>
                              <p className="text-sm">{commission.lead.full_name}</p>
                              {commission.lead.deal_amount && (
                                <p className="text-xs text-slate-500">
                                  Deal: ${commission.lead.deal_amount.toFixed(2)}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={
                            commission.commission_type === 'backend'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-blue-100 text-blue-700'
                          }>
                            {commission.commission_type === 'backend' ? 'Backend' : 'Upfront'}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium text-slate-900">
                          ${commission.commission_amount.toFixed(2)}
                        </TableCell>
                        <TableCell>{getStatusBadge(commission.commission_status)}</TableCell>
                        <TableCell className="text-slate-500">
                          {format(new Date(commission.created_at), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell className="text-right">
                          {commission.commission_status === 'pending' && (
                            <div className="flex gap-2 justify-end">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => updateCommissionStatus([commission.id], 'approved')}
                              >
                                Approve
                              </Button>
                              <Button 
                                size="sm"
                                onClick={() => updateCommissionStatus([commission.id], 'paid')}
                              >
                                Pay
                              </Button>
                            </div>
                          )}
                          {commission.commission_status === 'approved' && (
                            <Button 
                              size="sm"
                              onClick={() => updateCommissionStatus([commission.id], 'paid')}
                            >
                              Mark Paid
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
