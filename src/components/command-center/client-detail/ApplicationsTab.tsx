import { Send, Plus, AlertTriangle, PauseCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  ApplicationForm,
  ApplicationList,
  ApprovedFundingTotal,
} from "@/components/command-center/applications";
import {
  useClientApplications,
  useBanks,
  useBureauStatus,
  useCreateApplication,
  useUpdateApplicationStatus,
  type ApplicationStatus,
} from "@/hooks/useClientApplications";

interface ApplicationsTabProps {
  clientId: string;
}

export function ApplicationsTab({ clientId }: ApplicationsTabProps) {
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch data
  const {
    data: applicationsData,
    isLoading: isLoadingApplications,
    error: applicationsError,
  } = useClientApplications(clientId);

  const { data: banks, isLoading: isLoadingBanks } = useBanks();

  const { data: bureauStatus, isLoading: isLoadingBureauStatus } =
    useBureauStatus(clientId);

  // Mutations
  const createApplication = useCreateApplication(clientId);
  const updateStatus = useUpdateApplicationStatus(clientId);

  // Get paused bureaus
  const pausedBureaus =
    bureauStatus?.filter((b) => b.is_paused).map((b) => b.bureau) || [];

  const handleCreateApplication = (data: {
    bankId: string;
    productType: ApplicationStatus extends infer R ? R : never;
    applicationUrl: string;
    appliedDate: string;
    bureauPulled: "Experian" | "Equifax" | "TransUnion";
    notes: string | null;
  }) => {
    createApplication.mutate(
      {
        bankId: data.bankId,
        productType: data.productType,
        applicationUrl: data.applicationUrl,
        appliedDate: data.appliedDate,
        bureauPulled: data.bureauPulled,
        notes: data.notes,
        userId: user?.id,
      },
      {
        onSuccess: () => {
          toast({
            title: "Application logged",
            description: "The application has been recorded successfully.",
          });
        },
        onError: (error) => {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleUpdateStatus = (params: {
    applicationId: string;
    newStatus: ApplicationStatus;
    approvalAmount: number | null;
  }) => {
    updateStatus.mutate(
      {
        applicationId: params.applicationId,
        newStatus: params.newStatus,
        approvalAmount: params.approvalAmount,
        userId: user?.id,
      },
      {
        onSuccess: () => {
          toast({
            title: "Status updated",
            description: `Application status changed to ${params.newStatus}.`,
          });
        },
        onError: (error) => {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
        },
      }
    );
  };

  // Loading state
  if (isLoadingApplications || isLoadingBanks || isLoadingBureauStatus) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-slate-500" />
            Applications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-24 bg-slate-100 animate-pulse rounded-lg" />
            <div className="h-64 bg-slate-100 animate-pulse rounded-lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (applicationsError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-slate-500" />
            Applications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {applicationsError.message || "Failed to load applications"}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const applications = applicationsData?.data || [];

  return (
    <div className="space-y-6">
      {/* Approved Funding Summary */}
      <ApprovedFundingTotal applications={applications} />

      {/* Bureau Pause Warnings */}
      {pausedBureaus.length > 0 && (
        <Alert variant="destructive" className="border-red-300 bg-red-50">
          <PauseCircle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800">Bureau Pause Alert</AlertTitle>
          <AlertDescription className="text-red-700">
            The following bureaus are paused due to reaching the inquiry
            threshold:
            <div className="flex flex-wrap gap-2 mt-2">
              {pausedBureaus.map((bureau) => (
                <Badge
                  key={bureau}
                  variant="outline"
                  className="bg-red-100 text-red-800 border-red-300"
                >
                  {bureau}
                </Badge>
              ))}
            </div>
            <p className="mt-2 text-sm">
              Complete inquiry removal before submitting more applications with
              these bureaus.
            </p>
          </AlertDescription>
        </Alert>
      )}

      {/* Applications Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-slate-500" />
            Applications
          </CardTitle>
          <ApplicationForm
            banks={banks || []}
            bureauStatus={bureauStatus || []}
            onSubmit={handleCreateApplication}
            isSubmitting={createApplication.isPending}
            trigger={
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Log Application
              </Button>
            }
          />
        </CardHeader>
        <CardContent>
          <ApplicationList
            applications={applications}
            onUpdateStatus={handleUpdateStatus}
            isUpdating={updateStatus.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}
