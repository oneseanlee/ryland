import { useCallback, useEffect, useState } from "react";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface Row { id: string; first_name: string; email: string; phone: string | null; total_score: number; track: string; crm_status: string; crm_error: string | null; created_at: string; utm: Record<string, string> | null }

async function call(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke("fundability-retry", { body });
  if (error) throw new Error(error instanceof FunctionsHttpError ? await error.context.text() : error.message);
  return data;
}

export default function AdminFundability() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setRows((await call({ action: "list" })).rows ?? []); } catch (e) { toast.error(`Could not load: ${(e as Error).message}`); }
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const retry = async (id?: string) => {
    setBusy(id ?? "all");
    try {
      const { results } = await call(id ? { action: "retry", id } : { action: "retry", all: true });
      const ok = results.filter((r: { crm: string }) => r.crm === "synced").length;
      ok === results.length ? toast.success(`Synced ${ok} to GoHighLevel`) : toast.error(`${ok} of ${results.length} synced. Check the error column.`);
    } catch (e) { toast.error(`Retry failed: ${(e as Error).message}`); }
    setBusy(null); load();
  };

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold font-heading">Fundability Score sync</h1>
        <Button onClick={() => retry()} disabled={!rows.length || !!busy} className="min-h-[44px]">
          <RefreshCw className={`h-4 w-4 ${busy === "all" ? "animate-spin" : ""}`} aria-hidden="true" />Retry all failed
        </Button>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Submissions not yet in GoHighLevel</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : !rows.length ? <p className="text-sm text-muted-foreground">Every submission is synced.</p> :
            rows.map((r) => <div key={r.id} className="flex flex-col sm:flex-row sm:items-center gap-3 border-b last:border-0 pb-3">
              <div className="flex-1 min-w-0">
                <p className="font-semibold">{r.first_name} · {r.email}{r.phone ? ` · ${r.phone}` : ""}</p>
                <p className="text-sm text-muted-foreground">Score {r.total_score}/12 · {new Date(r.created_at).toLocaleString()} · source {r.utm?.utm_source ?? "direct"} · {r.crm_status}</p>
                {r.crm_error && <p className="text-xs text-destructive break-words mt-1">{r.crm_error}</p>}
              </div>
              <Button variant="outline" onClick={() => retry(r.id)} disabled={!!busy} className="min-h-[44px]">
                <RefreshCw className={`h-4 w-4 ${busy === r.id ? "animate-spin" : ""}`} aria-hidden="true" />Retry GHL sync
              </Button>
            </div>)}
        </CardContent>
      </Card>
    </div>
  );
}
