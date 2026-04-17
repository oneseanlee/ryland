import { useEffect, useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link2, Loader2, CheckCircle2, Copy, Download, QrCode, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { validateSlug, isReservedSlug } from "@/lib/reservedSlugs";

const SITE_URL = "https://rylandpartners.com";

function suggestSlugFromName(fullName: string): string {
  const first = fullName.trim().split(/\s+/)[0] || "";
  return first.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 20);
}

export default function ReferralLinkCard() {
  const { affiliate } = useAuth();
  const { toast } = useToast();

  const [slug, setSlug] = useState("");
  const [savedSlug, setSavedSlug] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [available, setAvailable] = useState<boolean | null>(null);

  // Load existing slug
  useEffect(() => {
    if (!affiliate) return;
    supabase
      .from("affiliates")
      .select("referral_slug")
      .eq("id", affiliate.id)
      .maybeSingle()
      .then(({ data }) => {
        const existing = (data as { referral_slug: string | null } | null)?.referral_slug ?? null;
        setSavedSlug(existing);
        setSlug(existing ?? suggestSlugFromName(affiliate.full_name));
      });
  }, [affiliate]);

  // Debounced availability check
  useEffect(() => {
    setError(null);
    setAvailable(null);
    const trimmed = slug.trim().toLowerCase();
    if (!trimmed || trimmed === savedSlug) return;
    const v = validateSlug(trimmed);
    if (!v.valid) {
      setError(v.error || "Invalid handle");
      return;
    }
    const t = setTimeout(async () => {
      setChecking(true);
      const { data } = await supabase.rpc("lookup_affiliate_by_ref", { _ref: trimmed });
      setChecking(false);
      if (data && data.length > 0) {
        setAvailable(false);
        setError("That handle is taken. Try another.");
      } else {
        setAvailable(true);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [slug, savedSlug]);

  const activeRef = savedSlug || affiliate?.affiliate_id || "";
  const shortLink = useMemo(() => `${SITE_URL}/${activeRef}`, [activeRef]);
  const fallbackLink = useMemo(
    () => `${SITE_URL}/r/${affiliate?.affiliate_id || ""}`,
    [affiliate?.affiliate_id]
  );

  const handleSave = async () => {
    if (!affiliate) return;
    const trimmed = slug.trim().toLowerCase();
    const v = validateSlug(trimmed);
    if (!v.valid) {
      setError(v.error || "Invalid handle");
      return;
    }
    if (isReservedSlug(trimmed)) {
      setError("This handle is reserved. Try another.");
      return;
    }
    setLoading(true);
    const { error: updateErr } = await supabase
      .from("affiliates")
      .update({ referral_slug: trimmed })
      .eq("id", affiliate.id);
    setLoading(false);
    if (updateErr) {
      // Unique violation
      if (updateErr.code === "23505") {
        setError("That handle is taken. Try another.");
      } else {
        toast({ title: "Couldn't save", description: updateErr.message, variant: "destructive" });
      }
      return;
    }
    setSavedSlug(trimmed);
    toast({ title: "Handle saved", description: `Your link is now ${SITE_URL}/${trimmed}` });
  };

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Copied", description: `${label} copied to clipboard.` });
    } catch {
      toast({ title: "Copy failed", description: "Try selecting and copying manually.", variant: "destructive" });
    }
  };

  const downloadQR = () => {
    const svg = document.getElementById("affiliate-qr-code") as unknown as SVGSVGElement | null;
    if (!svg) return;
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svg);
    const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      const size = 1024;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, 0, 0, size, size);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const dlUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = dlUrl;
        a.download = `ryland-referral-${activeRef}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(dlUrl);
      }, "image/png");
    };
    img.src = url;
  };

  if (!affiliate) return null;

  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
          <Link2 className="h-4 w-4 text-slate-400" />
          Your Referral Link
        </CardTitle>
        <CardDescription className="text-slate-500">
          Claim a custom handle for a memorable link, then share or scan the QR code.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Slug claim */}
        <div className="space-y-2">
          <Label className="text-xs text-slate-500">Custom Handle</Label>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 flex items-stretch rounded-md border border-slate-200 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/40">
              <span className="px-3 flex items-center text-xs sm:text-sm text-slate-400 bg-slate-50 border-r border-slate-200 select-none">
                rylandpartners.com/
              </span>
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase())}
                placeholder="brittany"
                maxLength={30}
                className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none"
                aria-label="Referral handle"
              />
            </div>
            <Button
              onClick={handleSave}
              disabled={loading || !!error || slug.trim() === (savedSlug ?? "") || !slug.trim()}
              className="shrink-0"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              )}
              {savedSlug ? "Update" : "Claim"}
            </Button>
          </div>
          <div className="min-h-[1.25rem] text-xs">
            {checking && <span className="text-slate-400">Checking availability…</span>}
            {!checking && error && <span className="text-red-600">{error}</span>}
            {!checking && !error && available && slug.trim() !== savedSlug && (
              <span className="text-emerald-600 inline-flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Available — click {savedSlug ? "Update" : "Claim"} to save.
              </span>
            )}
            {!checking && !error && savedSlug && slug.trim() === savedSlug && (
              <span className="text-slate-400">3–30 chars, lowercase letters, numbers, and hyphens.</span>
            )}
            {!checking && !error && !savedSlug && !available && (
              <span className="text-slate-400">3–30 chars, lowercase letters, numbers, and hyphens.</span>
            )}
          </div>
        </div>

        {/* Active links */}
        <div className="grid sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
          <div className="space-y-2">
            <Label className="text-xs text-slate-500">Primary link</Label>
            <div className="flex gap-2">
              <Input value={shortLink} readOnly className="font-mono text-xs sm:text-sm bg-slate-50 border-slate-200" />
              <Button variant="outline" size="icon" onClick={() => copy(shortLink, "Link")} aria-label="Copy primary link" className="shrink-0">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-[11px] text-slate-400">
              {savedSlug ? "Your custom vanity URL." : "Set a custom handle above for a cleaner link."}
            </p>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-slate-500">Backup link</Label>
            <div className="flex gap-2">
              <Input value={fallbackLink} readOnly className="font-mono text-xs sm:text-sm bg-slate-50 border-slate-200" />
              <Button variant="outline" size="icon" onClick={() => copy(fallbackLink, "Backup link")} aria-label="Copy backup link" className="shrink-0">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-[11px] text-slate-400">Always works, even before a handle is set.</p>
          </div>
        </div>

        {/* QR code */}
        <div className="pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2 mb-3">
            <QrCode className="h-4 w-4 text-slate-400" />
            <span className="text-sm font-medium text-slate-700">QR Code</span>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
              <QRCodeSVG
                id="affiliate-qr-code"
                value={shortLink}
                size={180}
                level="H"
                includeMargin={false}
                bgColor="#ffffff"
                fgColor="#003A70"
              />
            </div>
            <div className="flex-1 space-y-3 text-center sm:text-left">
              <p className="text-sm text-slate-600 leading-relaxed">
                Print on business cards, flyers, or show on your phone for instant scanning.
                Anyone who scans lands directly on your referral form.
              </p>
              <Button onClick={downloadQR} variant="outline" className="border-slate-200">
                <Download className="h-4 w-4 mr-2" />
                Download PNG
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
