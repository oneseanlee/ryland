import { useState } from "react";
import { useParams } from "react-router-dom";
import {
  User,
  Send,
  Building2,
  FileText,
  Activity,
  MessageSquare,
  ListOrdered,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import {
  useClient,
  useUpdateClient,
  useChangeClientStage,
  useArchiveClient,
  type ClientStage,
} from "@/hooks/useClient";
import { useClientActivity } from "@/hooks/useClientActivity";
import { useClientNotes, useAddNote, useDeleteNote } from "@/hooks/useClientNotes";
import { ClientHeader } from "@/components/command-center/client-detail/ClientHeader";
import { OverviewTab } from "@/components/command-center/client-detail/OverviewTab";
import { ApplicationsTab } from "@/components/command-center/client-detail/ApplicationsTab";
import { BureauStatusTab } from "@/components/command-center/client-detail/BureauStatusTab";
import { DocumentsTab } from "@/components/command-center/client-detail/DocumentsTab";
import { ActivityTab } from "@/components/command-center/client-detail/ActivityTab";
import { NotesTab } from "@/components/command-center/client-detail/NotesTab";
import { SequenceTab } from "@/components/command-center/client-detail/SequenceTab";

export default function ClientDetailView() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [activityPage, setActivityPage] = useState(1);

  // Fetch client data
  const {
    data: clientData,
    isLoading: isLoadingClient,
    error: clientError,
  } = useClient(id);

  // Fetch activity log
  const {
    data: activityData,
    isLoading: isLoadingActivity,
    error: activityError,
  } = useClientActivity(id, activityPage);

  // Fetch notes
  const {
    data: notesData,
    isLoading: isLoadingNotes,
    error: notesError,
  } = useClientNotes(id);

  // Mutations
  const updateClient = useUpdateClient(id || "");
  const changeStage = useChangeClientStage(id || "");
  const archiveClient = useArchiveClient();
  const addNote = useAddNote(id || "");
  const deleteNote = useDeleteNote(id || "");

  const handleStageChange = (newStage: ClientStage) => {
    changeStage.mutate({ newStage, userId: user?.id });
  };

  const handleUpdateClient = (updates: Parameters<typeof updateClient.mutate>[0]) => {
    updateClient.mutate(updates);
  };

  const handleArchive = () => {
    if (id) {
      archiveClient.mutate(id);
    }
  };

  const handleAddNote = (content: string) => {
    addNote.mutate({ content, userId: user?.id });
  };

  const handleDeleteNote = (noteId: string) => {
    deleteNote.mutate(noteId);
  };

  // Loading state
  if (isLoadingClient) {
    return (
      <div className="space-y-8">
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  // Error state
  if (clientError || !clientData) {
    return (
      <div className="space-y-8">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-red-600 mb-2">
            Failed to load client
          </h2>
          <p className="text-slate-500">
            {clientError?.message || "Client not found"}
          </p>
        </div>
      </div>
    );
  }

  const { assignments, primary_assignment, ...client } = clientData;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <ClientHeader
        client={client}
        assignments={assignments}
        primaryAssignment={primary_assignment}
        onStageChange={handleStageChange}
        onArchive={handleArchive}
        isUpdating={changeStage.isPending}
        isArchiving={archiveClient.isPending}
        userId={user?.id}
      />

      {/* Tabbed Content */}
      <Tabs defaultValue="overview" className="space-y-8">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-7 h-auto">
          <TabsTrigger value="overview" className="gap-2">
            <User className="h-4 w-4 hidden sm:inline" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="applications" className="gap-2">
            <Send className="h-4 w-4 hidden sm:inline" />
            <span>Applications</span>
          </TabsTrigger>
          <TabsTrigger value="bureau" className="gap-2">
            <Building2 className="h-4 w-4 hidden sm:inline" />
            <span>Bureau Status</span>
          </TabsTrigger>
          <TabsTrigger value="documents" className="gap-2">
            <FileText className="h-4 w-4 hidden sm:inline" />
            <span>Documents</span>
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-2">
            <Activity className="h-4 w-4 hidden sm:inline" />
            <span>Activity</span>
          </TabsTrigger>
          <TabsTrigger value="notes" className="gap-2">
            <MessageSquare className="h-4 w-4 hidden sm:inline" />
            <span>Notes</span>
          </TabsTrigger>
          <TabsTrigger value="sequence" className="gap-2">
            <ListOrdered className="h-4 w-4 hidden sm:inline" />
            <span>Sequence</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <OverviewTab
            client={client}
            onUpdate={handleUpdateClient}
            isUpdating={updateClient.isPending}
          />
        </TabsContent>

        {/* Applications Tab */}
        <TabsContent value="applications">
          <ApplicationsTab clientId={client.id} />
        </TabsContent>

        {/* Bureau Status Tab */}
        <TabsContent value="bureau">
          {id && <BureauStatusTab clientId={id} />}
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents">
          <DocumentsTab clientId={id || ""} />
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity">
          <ActivityTab
            activities={activityData?.data || []}
            isLoading={isLoadingActivity}
            error={activityError}
            page={activityPage}
            totalCount={activityData?.count || null}
            onPageChange={setActivityPage}
          />
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes">
          <NotesTab
            notes={notesData?.data || []}
            isLoading={isLoadingNotes}
            error={notesError}
            onAddNote={handleAddNote}
            onDeleteNote={handleDeleteNote}
            isAddingNote={addNote.isPending}
            isDeletingNote={deleteNote.isPending}
            userId={user?.id}
          />
        </TabsContent>

        {/* Sequence Tab */}
        <TabsContent value="sequence">
          {id && <SequenceTab clientId={id} />}
        </TabsContent>
      </Tabs>
    </div>
  );
}
