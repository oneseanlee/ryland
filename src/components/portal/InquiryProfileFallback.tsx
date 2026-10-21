import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAdminRole } from "@/hooks/useAdminRole";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

/** Admin accounts need no affiliate record; their destination remains guarded. */
export default function InquiryProfileFallback() {
  const { isAdmin, isLoading } = useAdminRole();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setTimedOut(true), 10000);
    return () => window.clearTimeout(timer);
  }, []);

  if (!isLoading && isAdmin) {
    return <Navigate to="/portal/admin/inquiries" replace />;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Credit Inquiry Orders</h1>
      {timedOut ? (
        <Alert>
          <AlertDescription className="space-y-3">
            <p>We couldn’t load your partner profile. Please try again.</p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      ) : (
        <div role="status" aria-label="Loading inquiry account" className="space-y-4">
          <p className="text-sm text-muted-foreground">Loading your inquiry account…</p>
          <Skeleton className="h-64 w-full" />
        </div>
      )}
    </div>
  );
}