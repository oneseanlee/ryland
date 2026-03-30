import { Building2, Loader2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/hooks/useAuth";
import { useBureauStatus, type BureauName, type RemovalStatus } from "@/hooks/useBureauStatus";
import { BureauOverview, InquiryRemovalList } from "@/components/command-center/bureau";
import { useToast } from "@/hooks/use-toast";

interface BureauStatusTabProps {
  clientId: string;
}

export function BureauStatusTab({ clientId }: BureauStatusTabProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  // Check if user is admin (using user metadata or app_metadata)
  const isAdmin = 
    user?.user_metadata?.role === "admin" || 
    user?.app_metadata?.role === "admin";

  // Fetch bureau status and inquiry removals
  const {
    bureauStatuses,
    inquiryRemovals,
    isLoading,
    error,
    unpauseBureau,
    createRemoval,
    updateRemovalStatus,
    isUnpausing,
    isCreatingRemoval,
    isUpdatingRemoval,
  } = useBureauStatus(clientId);

  // Handle unpause action
  const handleUnpause = (bureau: BureauName) => {
    unpauseBureau(
      { bureau, userId: user?.id },
      {
        onSuccess: () => {
          toast({
            title: "Bureau Unpaused",
            description: `${bureau} has been unpaused and is now accepting applications.`,
          });
        },
        onError: (err) => {
          toast({
            variant: "destructive",
            title: "Error",
            description: `Failed to unpause ${bureau}: ${err instanceof Error ? err.message : "Unknown error"}`,
          });
        },
      }
    );
  };

  // Handle create removal request
  const handleCreateRemoval = (bureau: BureauName, notes: string | null) => {
    createRemoval(
      { bureau, notes, userId: user?.id },
      {
        onSuccess: () => {
          toast({
            title: "Removal Request Created",
            description: `Inquiry removal request for ${bureau} has been submitted.`,
          });
        },
        onError: (err) => {
          toast({
            variant: "destructive",
            title: "Error",
            description: `Failed to create removal request: ${err instanceof Error ? err.message : "Unknown error"}`,
          });
        },
      }
    );
  };

  // Handle update removal status
  const handleUpdateRemovalStatus = (removalId: string, status: RemovalStatus) => {
    updateRemovalStatus(
      { removalId, status, userId: user?.id },
      {
        onSuccess: () => {
          toast({
            title: "Status Updated",
            description: `Removal request status changed to ${status}.`,
          });
        },
        onError: (err) => {
          toast({
            variant: "destructive",
            title: "Error",
            description: `Failed to update status: ${err instanceof Error ? err.message : "Unknown error"}`,
          });
        },
      }
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-slate-500" />
              Bureau Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-16 w-full" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Skeleton className="h-48" />
                <Skeleton className="h-48" />
                <Skeleton className="h-48" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error Loading Bureau Status</AlertTitle>
        <AlertDescription>
          {error instanceof Error ? error.message : "Failed to load bureau status data."}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Bureau Overview Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-slate-500" />
            Bureau Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <BureauOverview
            bureauStatuses={bureauStatuses}
            isAdmin={isAdmin}
            onUnpause={handleUnpause}
            isUnpausing={isUnpausing}
          />
        </CardContent>
      </Card>

      {/* Inquiry Removal List Section */}
      <InquiryRemovalList
        clientId={clientId}
        inquiryRemovals={inquiryRemovals}
        bureauStatuses={bureauStatuses}
        onCreateRemoval={handleCreateRemoval}
        onUpdateStatus={handleUpdateRemovalStatus}
        isCreating={isCreatingRemoval}
        isUpdating={isUpdatingRemoval}
      />
    </div>
  );
}
