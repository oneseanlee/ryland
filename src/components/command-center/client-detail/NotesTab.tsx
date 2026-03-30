import { useState } from "react";
import { format } from "date-fns";
import { FileText, Send, Trash2, User, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import type { ClientNote } from "@/hooks/useClientNotes";

interface NotesTabProps {
  notes: ClientNote[];
  isLoading: boolean;
  error: Error | null;
  onAddNote: (content: string) => void;
  onDeleteNote: (noteId: string) => void;
  isAddingNote: boolean;
  isDeletingNote: boolean;
  userId: string | undefined;
}

export function NotesTab({
  notes,
  isLoading,
  error,
  onAddNote,
  onDeleteNote,
  isAddingNote,
  isDeletingNote,
  userId,
}: NotesTabProps) {
  const [newNoteContent, setNewNoteContent] = useState("");
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim()) return;

    onAddNote(newNoteContent.trim());
    setNewNoteContent("");
    toast({
      title: "Note added",
      description: "Your note has been added successfully.",
    });
  };

  const handleDelete = () => {
    if (noteToDelete) {
      onDeleteNote(noteToDelete);
      setNoteToDelete(null);
      toast({
        title: "Note deleted",
        description: "The note has been deleted.",
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-24 w-full" />
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-red-600">
            <p>Failed to load notes</p>
            <p className="text-sm text-slate-500">{error.message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add Note Form */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-slate-500" />
            Add Note
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Textarea
              placeholder="Enter your note here..."
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              className="min-h-[100px] resize-none"
            />
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={!newNoteContent.trim() || isAddingNote}
              >
                <Send className="h-4 w-4 mr-2" />
                {isAddingNote ? "Adding..." : "Add Note"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Notes List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-slate-500" />
              Notes History
            </span>
            {notes.length > 0 && (
              <span className="text-sm font-normal text-slate-500">
                {notes.length} note{notes.length !== 1 ? "s" : ""}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {notes.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-slate-300" />
              <p className="font-medium">No notes yet</p>
              <p className="text-sm mt-1">
                Add a note above to keep track of important information.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {notes.map((note) => {
                const authorName =
                  note.created_by_user?.raw_user_meta_data?.full_name ||
                  note.created_by_user?.email ||
                  "Unknown";

                const isAuthor = note.created_by === userId;

                return (
                  <div
                    key={note.id}
                    className="p-4 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-800 whitespace-pre-wrap">
                          {note.content}
                        </p>
                        <div className="flex items-center gap-2 mt-3 text-xs text-slate-500">
                          <User className="h-3 w-3" />
                          <span>{authorName}</span>
                          <span>•</span>
                          <span>
                            {format(
                              new Date(note.created_at),
                              "MMM d, yyyy 'at' h:mm a"
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Delete button - only show for author's own notes or admin */}
                      {(isAuthor || !note.created_by) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-400 hover:text-red-600 shrink-0"
                          onClick={() => setNoteToDelete(note.id)}
                          disabled={isDeletingNote}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!noteToDelete}
        onOpenChange={(open) => !open && setNoteToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Note</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this note? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingNote}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeletingNote}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeletingNote ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
