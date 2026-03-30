import { useState } from "react";
import { Plus, ClipboardList, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useMyTasks, useTaskMutations, type TaskStatus } from "@/hooks/useMyTasks";
import TaskCard from "./TaskCard";
import TaskForm from "./TaskForm";

export default function TaskList() {
  const [activeTab, setActiveTab] = useState<"all" | "open" | "completed">("all");
  const [isFormOpen, setIsFormOpen] = useState(false);

  const { data: tasks, isLoading, error } = useMyTasks({
    statusFilter: activeTab,
  });

  const { updateTaskStatus, deleteTask } = useTaskMutations();

  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
    const task = tasks?.find((t) => t.id === taskId);
    updateTaskStatus.mutate({
      taskId,
      newStatus,
      clientId: task?.client_id,
    });
  };

  const handleDelete = (taskId: string) => {
    deleteTask.mutate(taskId);
  };

  // Sort tasks: overdue first, then by due_date ascending
  const sortedTasks = tasks?.sort((a, b) => {
    // Completed tasks go to the bottom
    if (a.status === "Completed" && b.status !== "Completed") return 1;
    if (b.status === "Completed" && a.status !== "Completed") return -1;

    // Overdue tasks first
    const now = new Date();
    const aOverdue = a.due_date && new Date(a.due_date) < now && a.status !== "Completed";
    const bOverdue = b.due_date && new Date(b.due_date) < now && b.status !== "Completed";

    if (aOverdue && !bOverdue) return -1;
    if (bOverdue && !aOverdue) return 1;

    // Then by due_date ascending
    if (a.due_date && b.due_date) {
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    }
    if (a.due_date) return -1;
    if (b.due_date) return 1;

    return 0;
  });

  const openTasksCount = tasks?.filter(
    (t) => t.status === "Open" || t.status === "InProgress"
  ).length || 0;
  const completedTasksCount = tasks?.filter((t) => t.status === "Completed").length || 0;

  if (isLoading) {
    return (
      <Card className="h-full border border-slate-200 rounded-xl shadow-none">
        <CardHeader className="px-5 pt-5">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ClipboardList className="h-5 w-5 text-slate-400" />
            My Tasks
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 px-5 pb-5">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="h-full border border-slate-200 rounded-xl shadow-none">
        <CardHeader className="px-5 pt-5">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ClipboardList className="h-5 w-5 text-slate-400" />
            My Tasks
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <p className="text-red-500">Error loading tasks: {error.message}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="h-full flex flex-col border border-slate-200 rounded-xl shadow-none">
        <CardHeader className="pb-4 px-5 pt-5">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ClipboardList className="h-5 w-5 text-slate-600" />
              My Tasks
            </CardTitle>
            <Button
              size="sm"
              onClick={() => setIsFormOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Plus className="h-4 w-4 mr-1" />
              New Task
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 p-0">
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as "all" | "open" | "completed")}
            className="w-full"
          >
            <div className="px-6 pb-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all">
                  All
                  {tasks && tasks.length > 0 && (
                    <span className="ml-1.5 text-xs bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded-full">
                      {tasks.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="open">
                  Open
                  {openTasksCount > 0 && (
                    <span className="ml-1.5 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">
                      {openTasksCount}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="completed">
                  Completed
                  {completedTasksCount > 0 && (
                    <span className="ml-1.5 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
                      {completedTasksCount}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="all" className="m-0 px-6 pb-6">
              <TaskListContent
                tasks={sortedTasks}
                onStatusChange={handleStatusChange}
                onDelete={handleDelete}
              />
            </TabsContent>

            <TabsContent value="open" className="m-0 px-6 pb-6">
              <TaskListContent
                tasks={sortedTasks}
                onStatusChange={handleStatusChange}
                onDelete={handleDelete}
              />
            </TabsContent>

            <TabsContent value="completed" className="m-0 px-6 pb-6">
              <TaskListContent
                tasks={sortedTasks}
                onStatusChange={handleStatusChange}
                onDelete={handleDelete}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <TaskForm open={isFormOpen} onOpenChange={setIsFormOpen} />
    </>
  );
}

interface TaskListContentProps {
  tasks: typeof sortedTasks;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onDelete: (taskId: string) => void;
}

function TaskListContent({ tasks, onStatusChange, onDelete }: TaskListContentProps) {
  if (!tasks || tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <CheckCircle2 className="h-12 w-12 text-slate-200 mb-4" />
        <h3 className="text-lg font-medium text-slate-900">No tasks found</h3>
        <p className="text-sm text-slate-500 mt-1 max-w-sm">
          You don&apos;t have any tasks in this category. Create a new task to get
          started.
        </p>
      </div>
    );
  }

  // Count overdue tasks
  const now = new Date();
  const overdueCount = tasks.filter(
    (t) => t.due_date && new Date(t.due_date) < now && t.status !== "Completed"
  ).length;

  return (
    <div className="space-y-3">
      {overdueCount > 0 && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-2 rounded-md mb-4">
          <AlertCircle className="h-4 w-4" />
          <span>
            {overdueCount} overdue {overdueCount === 1 ? "task" : "tasks"} need
            attention
          </span>
        </div>
      )}

      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          onStatusChange={onStatusChange}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
