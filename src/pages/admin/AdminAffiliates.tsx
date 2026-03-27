import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Users, Search, CheckCircle2, XCircle, Clock, Percent, ArrowUpDown, ArrowUp, ArrowDown,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface Affiliate {
  id: string;
  user_id: string;
  affiliate_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  company_name: string | null;
  status: "pending" | "approved" | "suspended";
  upfront_commission_rate: number;
  backend_commission_rate: number;
  created_at: string;
  total_leads: number;
  total_earnings: number;
}

export default function AdminAffiliates() {
  const navigate = useNavigate();
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<string>("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    fetchAffiliates();
  }, []);

  const fetchAffiliates = async () => {
    try {
      setLoading(true);

      const { data: affiliatesData, error } = await supabase
        .from("affiliates")
        .select(`
          id, user_id, affiliate_id, full_name, email, phone, company_name,
          status, upfront_commission_rate, backend_commission_rate, created_at
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get leads count and earnings for each affiliate
      const affiliatesWithStats = await Promise.all(
        (affiliatesData || []).map(async (affiliate) => {
          const { count: leadsCount } = await supabase
            .from("affiliate_leads")
            .select("*", { count: "exact", head: true })
            .eq("affiliate_id", affiliate.id);

          const { data: commissions } = await supabase
            .from("commissions")
            .select("commission_amount")
            .eq("affiliate_id", affiliate.id)
            .eq("commission_status", "paid");

          const totalEarnings = commissions?.reduce((sum, c) => sum + (c.commission_amount || 0), 0) || 0;

          return {
            ...affiliate,
            upfront_commission_rate: affiliate.upfront_commission_rate ?? 10,
            backend_commission_rate: affiliate.backend_commission_rate ?? 5,
            total_leads: leadsCount || 0,
            total_earnings: totalEarnings,
          };
        })
      );

      setAffiliates(affiliatesWithStats);
    } catch (error) {
      console.error("Error fetching affiliates:", error);
      toast.error("Failed to load affiliates");
    } finally {
      setLoading(false);
    }
  };

  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 ml-1 text-slate-300" />;
    return sortDir === "asc"
      ? <ArrowUp className="h-3 w-3 ml-1 text-blue-600" />
      : <ArrowDown className="h-3 w-3 ml-1 text-blue-600" />;
  };

  const filteredAffiliates = affiliates
    .filter((affiliate) => {
      const matchesSearch =
        affiliate.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        affiliate.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        affiliate.affiliate_id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || affiliate.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let aVal: string | number = "";
      let bVal: string | number = "";
      switch (sortField) {
        case "full_name": aVal = a.full_name.toLowerCase(); bVal = b.full_name.toLowerCase(); break;
        case "status": aVal = a.status; bVal = b.status; break;
        case "upfront_commission_rate": aVal = a.upfront_commission_rate; bVal = b.upfront_commission_rate; break;
        case "total_leads": aVal = a.total_leads; bVal = b.total_leads; break;
        case "total_earnings": aVal = a.total_earnings; bVal = b.total_earnings; break;
        case "created_at": aVal = a.created_at; bVal = b.created_at; break;
        default: return 0;
      }
      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100"><CheckCircle2 className="h-3 w-3 mr-1" /> Approved</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
      case "suspended":
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100"><XCircle className="h-3 w-3 mr-1" /> Suspended</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Affiliate Management</h1>
          <p className="text-slate-500 mt-1">Manage affiliates, approve applications, and set commission rates</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Users className="h-4 w-4" />
          <span>{affiliates.length} total affiliates</span>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>All Affiliates</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search affiliates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-full sm:w-64"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="cursor-pointer select-none hover:text-slate-900" onClick={() => toggleSort("full_name")}>
                      <span className="flex items-center">Affiliate<SortIcon field="full_name" /></span>
                    </TableHead>
                    <TableHead className="cursor-pointer select-none hover:text-slate-900 text-center" onClick={() => toggleSort("status")}>
                      <span className="flex items-center justify-center">Status<SortIcon field="status" /></span>
                    </TableHead>
                    <TableHead className="cursor-pointer select-none hover:text-slate-900 text-center" onClick={() => toggleSort("upfront_commission_rate")}>
                      <span className="flex items-center justify-center">Commission<SortIcon field="upfront_commission_rate" /></span>
                    </TableHead>
                    <TableHead className="cursor-pointer select-none hover:text-slate-900 text-center" onClick={() => toggleSort("total_leads")}>
                      <span className="flex items-center justify-center">Leads<SortIcon field="total_leads" /></span>
                    </TableHead>
                    <TableHead className="cursor-pointer select-none hover:text-slate-900 text-center" onClick={() => toggleSort("total_earnings")}>
                      <span className="flex items-center justify-center">Earnings<SortIcon field="total_earnings" /></span>
                    </TableHead>
                    <TableHead className="cursor-pointer select-none hover:text-slate-900 text-center" onClick={() => toggleSort("created_at")}>
                      <span className="flex items-center justify-center">Joined<SortIcon field="created_at" /></span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAffiliates.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                        No affiliates found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAffiliates.map((affiliate) => (
                      <TableRow
                        key={affiliate.id}
                        className="cursor-pointer hover:bg-slate-50"
                        onClick={() => navigate(`/portal/admin/affiliates/${affiliate.id}`)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-sm font-semibold text-white">
                              {affiliate.full_name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium text-slate-900">{affiliate.full_name}</p>
                              <p className="text-xs text-slate-500">{affiliate.affiliate_id}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">{getStatusBadge(affiliate.status)}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Percent className="h-3 w-3 text-slate-400" />
                            <span className="font-medium text-blue-600">{affiliate.upfront_commission_rate}%</span>
                            <span className="text-slate-400">/</span>
                            <span className="font-medium text-purple-600">{affiliate.backend_commission_rate}%</span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">upfront / backend</p>
                        </TableCell>
                        <TableCell className="text-center">{affiliate.total_leads}</TableCell>
                        <TableCell className="text-center font-medium text-slate-900">
                          ${affiliate.total_earnings.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-center text-slate-500">
                          {new Date(affiliate.created_at).toLocaleDateString()}
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
