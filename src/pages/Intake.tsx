import { useState } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
import PageMeta from "@/components/PageMeta";
import { Button } from "@/components/ui/button";

const INTAKE_URL = "https://gene-mission-control-main-production.up.railway.app/intake";

export default function Intake() {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="relative min-h-screen bg-background">
      <PageMeta
        title="Client Intake | Ryland Partners"
        description="Complete your secure Ryland Partners client intake application."
        noindex
      />
      <h1 className="sr-only">Ryland Partners Client Intake</h1>

      {!loaded && (
        <div
          className="absolute inset-0 z-10 flex min-h-screen items-center justify-center bg-background px-4"
          role="status"
          aria-live="polite"
        >
          <div className="text-center">
            <Loader2 className="mx-auto h-7 w-7 animate-spin text-primary" aria-hidden="true" />
            <p className="mt-3 text-sm font-medium text-foreground">Loading your secure intake form…</p>
            <Button asChild variant="outline" className="mt-5 min-h-11">
              <a href={INTAKE_URL} target="_blank" rel="noopener noreferrer">
                Open intake form
                <ExternalLink className="ml-2 h-4 w-4" aria-hidden="true" />
              </a>
            </Button>
          </div>
        </div>
      )}

      <iframe
        src={INTAKE_URL}
        title="Ryland Partners secure client intake application"
        className="block h-screen min-h-[640px] w-full border-0 bg-background"
        onLoad={() => setLoaded(true)}
        allow="camera; microphone"
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  );
}