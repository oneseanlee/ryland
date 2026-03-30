import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  createCCNotification,
  hasRecentNotification,
} from "@/utils/createCommandCenterNotification";

export type TaskStatus = "Open" | "InProgress" | "Completed";

export interface Task {
  id: string;
  client_id: string | null;
  application_id: string | null;
  title: string;
  description: string | null;
  due_date: string | null;
  assigned_to: string | null;
  status: TaskStatus;
  created_by: string | null;
  created_at: string;
  completed_at: string | null;
  client_name?: string | null;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  client_id?: string;
  due_date?: string;
  assigned_to?: string;
}

interface FetchMyTasksOptions {
  statusFilter?: "all" | "open" | "completed";
}

async function fetchMyTasks(options: FetchMyTasksOptions = {}): Promise<Task[]> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    throw new Error("Not authenticated");
  }

  const userId = userData.user.id;

  let query = supabase
    .from("client_tasks")
    .select(
      `
      id,
      client_id,
      application_id,
      title,
      description,
      due_date,
      assigned_to,
      status,
      created_by,
      created_at,
      completed_at,
      funding_clients:client_id(full_name)
    `
    )
    .eq("assigned_to", userId);

  // Apply status filter
  if (options.statusFilter === "open") {
    query = query.in("status", ["Open", "InProgress"]);
  } else if (options.statusFilter === "completed") {
    query = query.eq("status", "Completed");
  }

  const { data: tasks, error: tasksError } = await query.order("due_date", {
    ascending: true,
    nullsFirst: false,
  });

  if (tasksError) {
    throw new Error(tasksError.message);
  }

  if (!tasks || tasks.length === 0) {
    return [];
  }

  // Transform data to include client_name
  return tasks.map((task) => {
    const clientData = task.funding_clients as
      | { full_name: string }[]
      | { full_name: string }
      | null;
    const clientName = Array.isArray(clientData)
      ? clientData[0]?.full_name
      : clientData?.full_name;

    return {
      id: task.id,
      client_id: task.client_id,
      application_id: task.application_id,
      title: task.title,
      description: task.description,
      due_date: task.due_date,
      assigned_to: task.assigned_to,
      status: task.status as TaskStatus,
      created_by: task.created_by,
      created_at: task.created_at,
      completed_at: task.completed_at,
      client_name: clientName || null,
    };
  });
}

export function useMyTasks(options: FetchMyTasksOptions = {}) {
  return useQuery({
    queryKey: ["my-tasks", options],
    queryFn: () => fetchMyTasks(options),
    staleTime: 1000 * 60 * 1, // 1 minute
  });
}

// Hook to get task statistics
export function useMyTaskStats() {
  return useQuery({
    queryKey: ["my-task-stats"],
    queryFn: async () => {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        throw new Error("Not authenticated");
      }

      const userId = userData.user.id;
      const today = new Date().toISOString().split("T")[0];
      const todayStart = `${today}T00:00:00.000Z`;
      const todayEnd = `${today}T23:59:59.999Z`;

      // Fetch all tasks for the user
      const { data: tasks, error } = await supabase
        .from("client_tasks")
        .select("status, due_date, completed_at")
        .eq("assigned_to", userId);

      if (error) throw new Error(error.message);

      const now = new Date();

      const openTasks =
        tasks?.filter((t) => t.status === "Open" || t.status === "InProgress") ||
        [];
      const overdueTasks =
        openTasks.filter((t) => t.due_date && new Date(t.due_date) < now) || [];
      const completedToday =
        tasks?.filter(
          (t) =>
            t.status === "Completed" &&
            t.completed_at &&
            t.completed_at >= todayStart &&
            t.completed_at <= todayEnd
        ) || [];

      return {
        totalOpen: openTasks.length,
        overdue: overdueTasks.length,
        completedToday: completedToday.length,
      };
    },
    staleTime: 1000 * 30, // 30 seconds
  });
}

// Hook for task mutations
export function useTaskMutations() {
  const queryClient = useQueryClient();

  const createTask = useMutation({
    mutationFn: async (input: CreateTaskInput) => {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        throw new Error("Not authenticated");
      }

      const userId = userData.user.id;

      // Insert the task
      const { data: task, error: taskError } = await supabase
        .from("client_tasks")
        .insert({
          title: input.title,
          description: input.description || null,
          client_id: input.client_id || null,
          due_date: input.due_date || null,
          assigned_to: input.assigned_to || userId,
          created_by: userId,
          status: "Open",
        })
        .select()
        .single();

      if (taskError) throw new Error(taskError.message);

      // Create activity log entry
      if (input.client_id) {
        await supabase.from("client_activity_log").insert({
          client_id: input.client_id,
          user_id: userId,
          action_type: "TaskCreated",
          details: {
            task_id: task.id,
            task_title: input.title,
          },
        });
      }

      return task;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["my-task-stats"] });
    },
  });

  const updateTaskStatus = useMutation({
    mutationFn: async ({
      taskId,
      newStatus,
      clientId,
    }: {
      taskId: string;
      newStatus: TaskStatus;
      clientId?: string | null;
    }) => {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        throw new Error("Not authenticated");
      }

      const userId = userData.user.id;

      const updates: {
        status: TaskStatus;
        completed_at?: string | null;
      } = {
        status: newStatus,
      };

      if (newStatus === "Completed") {
        updates.completed_at = new Date().toISOString();
      } else {
        updates.completed_at = null;
      }

      const { data: task, error: taskError } = await supabase
        .from("client_tasks")
        .update(updates)
        .eq("id", taskId)
        .select()
        .single();

      if (taskError) throw new Error(taskError.message);

      // Create activity log entry for completion
      if (newStatus === "Completed" && clientId) {
        await supabase.from("client_activity_log").insert({
          client_id: clientId,
          user_id: userId,
          action_type: "TaskCompleted",
          details: {
            task_id: taskId,
            task_title: task.title,
          },
        });
      }

      return task;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["my-task-stats"] });
    },
  });

  const deleteTask = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from("client_tasks")
        .delete()
        .eq("id", taskId);

      if (error) throw new Error(error.message);

      return taskId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["my-task-stats"] });
    },
  });

  // Helper to cycle through statuses
  const cycleTaskStatus = (
    currentStatus: TaskStatus
  ): Extract<TaskStatus, "Open" | "InProgress" | "Completed"> => {
    switch (currentStatus) {
      case "Open":
        return "InProgress";
      case "InProgress":
        return "Completed";
      case "Completed":
        return "Open";
      default:
        return "Open";
    }
  };

  return {
    createTask,
    updateTaskStatus,
    deleteTask,
    cycleTaskStatus,
  };
}

/**
 * Hook to check for overdue tasks and send notifications
 * This should be called once on page load for the My Clients page
 * Notifications are only sent if no recent notification exists for the same task
 */
export function useOverdueTaskNotifications() {
  return useQuery({
    queryKey: ["overdue-task-notifications"],
    queryFn: async () => {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        return { notificationsSent: 0 };
      }

      const userId = userData.user.id;
      const now = new Date();

      // Fetch overdue tasks assigned to this user
      const { data: overdueTasks, error: tasksError } = await supabase
        .from("client_tasks")
        .select("id, title, due_date, client_id")
        .eq("assigned_to", userId)
        .in("status", ["Open", "InProgress"])
        .lt("due_date", now.toISOString());

      if (tasksError || !overdueTasks || overdueTasks.length === 0) {
        return { notificationsSent: 0 };
      }

      let notificationsSent = 0;

      // Check each overdue task and send notification if not recently notified
      for (const task of overdueTasks) {
        const link = "/command-center/my-clients";

        // Check if we already sent a notification for this recently
        const recentlyNotified = await hasRecentNotification(userId, link, 24);

        if (!recentlyNotified) {
          await createCCNotification(
            userId,
            `Task overdue: ${task.title}`,
            `You have an overdue task: "${task.title}". The due date was ${new Date(task.due_date!).toLocaleDateString()}.`,
            link
          );
          notificationsSent++;

          // Only send one notification per check to avoid spam
          // (the notification will aggregate all overdue tasks)
          break;
        }
      }

      return { notificationsSent };
    },
    staleTime: Infinity, // Only run once per session
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
}
