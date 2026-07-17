import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageMeta from "@/components/PageMeta";
import { Button } from "@/components/ui/button";
import { Download, Loader2, AlertCircle } from "lucide-react";

const DownloadRedirect = () => {
  const { token } = useParams<{ token: string }>();
  const [status, setStatus] = useState<"loading" | "error">("loading");

  const downloadUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/download-ebook?token=${token}`;

  useEffect(() => {
    if (!token) {
      setStatus("error");
      return;
    }
    // Auto-trigger download
    window.location.href = downloadUrl;
    // If still here after 3s, something went wrong
    const timer = setTimeout(() => setStatus("error"), 5000);
    return () => clearTimeout(timer);
  }, [token, downloadUrl]);

  return (
    <>
      <PageMeta
        title="Download E-Book | Ryland"
        description="Download your purchased e-book."
        noindex
      />
      <Navbar />
      <main className="min-h-screen bg-background pt-24 pb-16 flex items-center justify-center">
        <div className="text-center px-4">
          {status === "loading" ? (
            <>
              <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
              <p className="text-foreground text-lg font-medium">Preparing your download…</p>
              <p className="text-muted-foreground text-sm mt-2">
                If the download doesn't start,{" "}
                <a href={downloadUrl} className="underline text-primary">
                  click here
                </a>
              </p>
            </>
          ) : (
            <>
              <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-4" />
              <p className="text-foreground text-lg font-medium mb-2">Download Failed</p>
              <p className="text-muted-foreground text-sm mb-4">
                The download link may be invalid. Please check your email or visit your download library.
              </p>
              <Button asChild>
                <a href="/my-orders">Go to My Downloads</a>
              </Button>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
};

export default DownloadRedirect;
