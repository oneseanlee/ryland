import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import AdminLeadDetailDrawer from "@/components/admin/AdminLeadDetailDrawer";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  UserCheck,
  Search,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  TrendingUp,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  ExternalLink,
  FileText
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { toast } from "sonner";

interface Lead {
  id: string;
  affiliate_id: string;
  ghl_contact_id: string | null;
  ghl_opportunity_id: string | null;
  full_name: string;
  email: string | null;
  phone: string | null;
  company_name: string | null;
  status: string;
  pipeline_stage: string;
  deal_amount: number | null;
  commission_amount: number | null;
  commission_status: string | null;
  assigned_rep: string | null;
  next_appointment_at: string | null;
  next_step: string | null;
  latest_update: string | null;
  notes: string | null;
  referred_at: string;
  created_at: string;
  updated_at: string;
  affiliate: {
    full_name: string;
    affiliate_id: string;
  } | null;
}

export default function AdminLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Lead | null>(null);

  const handleDeleteLead = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase.from("affiliate_leads").delete().eq("id", deleteTarget.id);
    if (error) {
      toast.error("Failed to delete lead");
    } else {
      setLeads((prev) => prev.filter((l) => l.id !== deleteTarget.id));
      toast.success(`${deleteTarget.full_name} deleted`);
    }
    setDeleteTarget(null);
  };
  const [stats, setStats] = useState({
    totalLeads: 0,
    totalValue: 0,
    avgDealSize: 0,
    conversionRate: 0,
  });

  useEffect(() => {
    fetchLeads();
  }, [statusFilter]);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('affiliate_leads')
        .select(`
          id,
          affiliate_id,
          ghl_contact_id,
          ghl_opportunity_id,
          full_name,
          email,
          phone,
          company_name,
          status,
          pipeline_stage,
          deal_amount,
          commission_amount,
          commission_status,
          assigned_rep,
          next_appointment_at,
          next_step,
          latest_update,
          notes,
          referred_at,
          created_at,
          updated_at,
          affiliates(full_name, affiliate_id)
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('pipeline_stage', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const transformedData: Lead[] = (data || []).map((item: any) => ({
        id: item.id,
        affiliate_id: item.affiliate_id,
        ghl_contact_id: item.ghl_contact_id,
        ghl_opportunity_id: item.ghl_opportunity_id,
        full_name: item.full_name,
        email: item.email,
        phone: item.phone,
        company_name: item.company_name,
        status: item.status,
        pipeline_stage: item.pipeline_stage,
        deal_amount: item.deal_amount,
        commission_amount: item.commission_amount,
        commission_status: item.commission_status,
        assigned_rep: item.assigned_rep,
        next_appointment_at: item.next_appointment_at,
        next_step: item.next_step,
        latest_update: item.latest_update,
        notes: item.notes,
        referred_at: item.referred_at,
        created_at: item.created_at,
        updated_at: item.updated_at,
        affiliate: item.affiliates,
      }));

      setLeads(transformedData);

      // Calculate stats
      const totalValue = transformedData.reduce((sum, l) => sum + (l.deal_amount || 0), 0);
      const dealsWithValue = transformedData.filter(l => l.deal_amount && l.deal_amount > 0).length;
      
      setStats({
        totalLeads: transformedData.length,
        totalValue,
        avgDealSize: dealsWithValue > 0 ? totalValue / dealsWithValue : 0,
        conversionRate: transformedData.length > 0 
          ? (transformedData.filter(l => l.status === 'Closed Won').length / transformedData.length) * 100 
          : 0,
      });
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStageBadge = (stage: string) => {
    const stageColors: Record<string, string> = {
      'New Lead': 'bg-blue-100 text-blue-700',
      'Contacted': 'bg-sky-100 text-sky-700',
      'Credit Optimization': 'bg-violet-100 text-violet-700',
      'Funding': 'bg-amber-100 text-amber-700',
      'Approved': 'bg-emerald-100 text-emerald-700',
      'Funded': 'bg-green-100 text-green-700',
      'Closed Won': 'bg-green-100 text-green-700',
      'Closed Lost': 'bg-red-100 text-red-700',
    };
    return <Badge className={stageColors[stage] || 'bg-slate-100 text-slate-700'}>{stage}</Badge>;
  };

  const filteredLeads = leads.filter(lead =>
    lead.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lead.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lead.affiliate?.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Lead Management</h1>
          <p className="text-slate-500 mt-1">View and track all leads referred by affiliates</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Leads</p>
                <p className="text-2xl font-bold text-slate-900">{stats.totalLeads}</p>
              </div>
              <UserCheck className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Pipeline Value</p>
                <p className="text-2xl font-bold text-slate-900">${stats.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Avg Deal Size</p>
                <p className="text-2xl font-bold text-slate-900">${stats.avgDealSize.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Conversion Rate</p>
                <p className="text-2xl font-bold text-slate-900">{stats.conversionRate.toFixed(1)}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>All Leads</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search leads..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stages</SelectItem>
                  <SelectItem value="New Lead">New Lead</SelectItem>
                  <SelectItem value="Contacted">Contacted</SelectItem>
                  <SelectItem value="Credit Optimization">Credit Optimization</SelectItem>
                  <SelectItem value="Funding">Funding</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Funded">Funded</SelectItem>
                  <SelectItem value="Closed Won">Closed Won</SelectItem>
                  <SelectItem value="Closed Lost">Closed Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
                    <TableHead>Lead</TableHead>
                    <TableHead>Referred By</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead>Deal Amount</TableHead>
                    <TableHead>Referred</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                        No leads found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLeads.map((lead) => (
                      <TableRow key={lead.id} className="cursor-pointer hover:bg-slate-50" onClick={() => setSelectedLead(lead)}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-sm font-semibold text-white">
                              {lead.full_name.charAt(0)}
                            </div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-slate-900">{lead.full_name}</p>
                              {lead.notes && (
                                <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                                  <FileText className="h-2.5 w-2.5" />
                                  Notes
                                </span>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-slate-900">
                              {lead.affiliate?.full_name || 'Unknown'}
                            </p>
                            <p className="text-xs text-slate-500">
                              {lead.affiliate?.affiliate_id}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{getStageBadge(lead.pipeline_stage)}</TableCell>
                        <TableCell className="font-medium text-slate-900">
                          {lead.deal_amount ? `$${lead.deal_amount.toLocaleString()}` : '-'}
                        </TableCell>
                        <TableCell className="text-slate-500">
                          {format(new Date(lead.referred_at), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-slate-100">
                                  <MoreHorizontal className="h-4 w-4 text-slate-500" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-44 p-1.5">
                                <DropdownMenuItem onClick={() => setSelectedLead(lead)} className="gap-3 px-3 py-2.5 rounded-md">
                                  <Pencil className="h-4 w-4 text-slate-400" />
                                  <span>Edit</span>
                                </DropdownMenuItem>
                                {lead.email && (
                                  <DropdownMenuItem onClick={() => window.open(`mailto:${lead.email}`)} className="gap-3 px-3 py-2.5 rounded-md">
                                    <Mail className="h-4 w-4 text-blue-500" />
                                    <span>Email</span>
                                  </DropdownMenuItem>
                                )}
                                {lead.phone && (
                                  <DropdownMenuItem onClick={() => window.open(`tel:${lead.phone}`)} className="gap-3 px-3 py-2.5 rounded-md">
                                    <Phone className="h-4 w-4 text-green-500" />
                                    <span>Call</span>
                                  </DropdownMenuItem>
                                )}
                                {lead.ghl_contact_id && (
                                  <DropdownMenuItem onClick={() => toast.info("GHL link coming soon")} className="gap-3 px-3 py-2.5 rounded-md">
                                    <ExternalLink className="h-4 w-4 text-slate-400" />
                                    <span>Open in GHL</span>
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => setSelectedLead(lead)} className="gap-3 px-3 py-2.5 rounded-md">
                                  <Eye className="h-4 w-4 text-slate-400" />
                                  <span>View Details</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="gap-3 px-3 py-2.5 rounded-md text-red-600 focus:text-red-600 focus:bg-red-50"
                                  onClick={() => setDeleteTarget(lead)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                  <span>Delete</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
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

      <AdminLeadDetailDrawer
        lead={selectedLead}
        open={!!selectedLead}
        onClose={() => setSelectedLead(null)}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete lead?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <span className="font-semibold">{deleteTarget?.full_name}</span> and all associated data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteLead} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
