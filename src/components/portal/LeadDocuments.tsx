import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, FileText, Loader2, Upload, CheckCircle2, Clock } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { GHL_FILE_ACCEPT, ghlFileProblem, ghlFileProblemMessage } from "../../../supabase/functions/_shared/ghl-file-rules";
import { Button } from "@/components/ui/button";


/** Partner/admin document attachments for a referred lead; each upload is pushed to the GoHighLevel contact. */
type Kind = "lead" | "inquiry";
const CONFIG = {
  lead: { table: "affiliate_lead_documents", bucket: "lead-documents", fk: "lead_id" },
  inquiry: { table: "inquiry_documents", bucket: "inquiry-documents", fk: "order_id" },
} as const;

export default function LeadDocuments({ leadId, affiliateId, kind = "lead" }: { leadId: string; affiliateId: string; kind?: Kind }) {
  const qc = useQueryClient();
  const cfg = CONFIG[kind];
  const [uploading, setUploading] = useState(false);
  const key = [cfg.table, leadId];
  const { data: docs = [], isLoading } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const cols = "id, filename, storage_path, ghl_uploaded_at, created_at";
      const { data, error } = kind === "lead"
        ? await supabase.from("affiliate_lead_documents").select(cols).eq("lead_id", leadId).order("created_at", { ascending: false })
        : await supabase.from("inquiry_documents").select(cols).eq("order_id", leadId).order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as { id: string; filename: string; storage_path: string; ghl_uploaded_at: string | null; created_at: string }[];
    },
  });

  const upload = async (file: File) => {
    const problem = ghlFileProblem({ name: file.name, size: file.size });
    if (problem) { toast.error(ghlFileProblemMessage(problem)); return; }
    setUploading(true);
    try {
      const ext = (file.name.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
      const path = `${affiliateId}/${leadId}/${kind === "inquiry" ? "other-" : ""}${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from(cfg.bucket).upload(path, file, { contentType: file.type || "application/octet-stream" });
      if (upErr) throw upErr;
      const { data: u } = await supabase.auth.getUser();
      const base = { filename: file.name, storage_path: path, mime_type: file.type || null, size_bytes: file.size, uploaded_by: u.user?.id ?? null };
      const { error: dbErr } = kind === "lead"
        ? await supabase.from("affiliate_lead_documents").insert({ ...base, lead_id: leadId, affiliate_id: affiliateId })
        : await supabase.from("inquiry_documents").insert({ ...base, order_id: leadId, category: "other" });
      if (dbErr) throw dbErr;
      const { data, error } = await supabase.functions.invoke("push-lead-documents", { body: { kind, id: leadId } });
      if (error) toast.error("Saved, but sending to Ryland Partners failed. Our team will retry.");
      else if (data?.state === "uploaded") toast.success("Document sent to Ryland Partners");
      else if (data?.state === "queued") toast.success("Document saved. It will be sent to Ryland Partners in a moment.");
      else toast.success("Document saved. It will be sent once this lead is in our system.");
    } catch (e) {
      console.error(e);
      toast.error(`Upload failed: ${e instanceof Error ? e.message : "please try again"}`);
    } finally {
      setUploading(false);
      qc.invalidateQueries({ queryKey: key });
      if (kind === "inquiry") qc.invalidateQueries({ queryKey: ["inquiry-documents"] });
    }
  };

  const view = async (path: string) => {
    const { data, error } = await supabase.storage.from(cfg.bucket).createSignedUrl(path, 300);
    if (error || !data) return toast.error("Could not open document");
    window.open(data.signedUrl, "_blank", "noopener");
  };

  return (
    <div className="space-y-2 py-2">
      <label className="block">
        <input type="file" accept={GHL_FILE_ACCEPT} className="sr-only" disabled={uploading}
          onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) upload(f); }} />
        <span className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-accent transition-colors">
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          Attach document
        </span>
      </label>
      <p className="text-xs text-muted-foreground">PDF, Word, Excel, JPG, PNG, GIF, CSV, TXT or ZIP, up to 50 MB</p>
      {isLoading ? null : docs.length === 0 ? (
        <p className="text-sm text-muted-foreground">No documents yet.</p>
      ) : docs.map((d) => (
        <div key={d.id} className="flex items-center justify-between gap-2 text-sm">
          <span className="flex min-w-0 items-center gap-1.5 text-muted-foreground">
            <FileText className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{d.filename}</span>
          </span>
          <span className="flex shrink-0 items-center gap-1">
            {d.ghl_uploaded_at
              ? <span className="flex items-center gap-1 text-xs text-muted-foreground"><CheckCircle2 className="h-3.5 w-3.5" />Sent</span>
              : <span className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3.5 w-3.5" />Pending</span>}
            <Button variant="ghost" size="sm" aria-label={`View ${d.filename}`} onClick={() => view(d.storage_path)}>
              <Eye className="h-3.5 w-3.5" />
            </Button>
          </span>
        </div>
      ))}
    </div>
  );
}
