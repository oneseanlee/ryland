import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Archive,
  User,
  ChevronDown,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import type {
  FundingClient,
  ClientAssignment,
  ClientStage,
  CLIENT_STAGES,
} from "@/hooks/useClient";

interface ClientHeaderProps {
  client: FundingClient;
  assignments: ClientAssignment[];
  primaryAssignment?: ClientAssignment;
  onStageChange: (newStage: ClientStage) => void;
  onArchive: () => void;
  isUpdating: boolean;
  isArchiving: boolean;
  userId: string | undefined;
}

const stageColors: Record<ClientStage, string> = {
  Onboarding: "bg-blue-100 text-blue-800 border-blue-200",
  Analysis: "bg-purple-100 text-purple-800 border-purple-200",
  "Kickoff Call": "bg-amber-100 text-amber-800 border-amber-200",
  Remediation: "bg-orange-100 text-orange-800 border-orange-200",
  "Post-Audit Check": "bg-cyan-100 text-cyan-800 border-cyan-200",
  "Funding Execution": "bg-emerald-100 text-emerald-800 border-emerald-200",
  "Closed/Funded": "bg-green-100 text-green-800 border-green-200",
  "Inquiry Removal": "bg-rose-100 text-rose-800 border-rose-200",
};

export function ClientHeader({
  client,
  assignments,
  primaryAssignment,
  onStageChange,
  onArchive,
  isUpdating,
  isArchiving,
  userId,
}: ClientHeaderProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);

  const assignedRepName = primaryAssignment?.user?.raw_user_meta_data?.full_name ||
    primaryAssignment?.user?.email ||
    "Unassigned";

  const handleStageChange = (value: string) => {
    onStageChange(value as ClientStage);
  };

  const handleArchive = () => {
    onArchive();
    setShowArchiveDialog(false);
    toast({
      title: "Client archived",
      description: `${client.full_name} has been archived.`,
    });
    navigate("/command-center/pipeline");
  };

  return (
    <div className="space-y-4">
      {/* Top row: Back button and actions */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/command-center/pipeline")}
          className="text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Pipeline
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowArchiveDialog(true)}
            disabled={isArchiving || client.is_archived}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
          >
            <Archive className="h-4 w-4 mr-2" />
            {client.is_archived ? "Archived" : "Archive"}
          </Button>
        </div>
      </div>

      {/* Main header content */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-6 border-b border-slate-200">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-900">{client.full_name}</h1>
          <div className="flex flex-wrap items-center gap-3">
            {/* Stage selector */}
            <Select
              value={client.current_stage}
              onValueChange={handleStageChange}
              disabled={isUpdating || client.is_archived}
            >
              <SelectTrigger
                className={`w-auto min-w-[160px] border-0 font-medium ${stageColors[client.current_stage]}`}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(
                  [
                    "Onboarding",
                    "Analysis",
                    "Kickoff Call",
                    "Remediation",
                    "Post-Audit Check",
                    "Funding Execution",
                    "Closed/Funded",
                    "Inquiry Removal",
                  ] as ClientStage[]
                ).map((stage) => (
                  <SelectItem key={stage} value={stage}>
                    {stage}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Assigned rep */}
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <User className="h-4 w-4" />
              <span>Assigned to: <span className="font-medium text-slate-900">{assignedRepName}</span></span>
            </div>
          </div>
        </div>

        {/* Archive badge if archived */}
        {client.is_archived && (
          <Badge variant="secondary" className="bg-slate-100 text-slate-600">
            <Archive className="h-3 w-3 mr-1" />
            Archived
          </Badge>
        )}
      </div>

      {/* Archive confirmation dialog */}
      <Dialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Archive Client
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to archive <strong>{client.full_name}</strong>?
              This will hide the client from the main pipeline view. You can still
              access archived clients through filters.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowArchiveDialog(false)}
              disabled={isArchiving}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleArchive}
              disabled={isArchiving}
            >
              {isArchiving ? "Archiving..." : "Archive Client"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
