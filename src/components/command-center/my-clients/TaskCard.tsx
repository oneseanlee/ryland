import { Link } from "react-router-dom";
import { format, isPast, isToday, formatDistanceToNow } from "date-fns";
import { CheckCircle2, Circle, Clock, AlertCircle, MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Task, TaskStatus } from "@/hooks/useMyTasks";

interface TaskCardProps {
  task: Task;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onDelete?: (taskId: string) => void;
}

const statusConfig: Record<
  TaskStatus,
  { icon: React.ReactNode; label: string; color: string }
> = {
  Open: {
    icon: <Circle className="h-4 w-4" />,
    label: "Open",
    color: "bg-slate-100 text-slate-700 border-slate-200",
  },
  InProgress: {
    icon: <Clock className="h-4 w-4" />,
    label: "In Progress",
    color: "bg-blue-100 text-blue-700 border-blue-200",
  },
  Completed: {
    icon: <CheckCircle2 className="h-4 w-4" />,
    label: "Completed",
    color: "bg-green-100 text-green-700 border-green-200",
  },
};

export default function TaskCard({
  task,
  onStatusChange,
  onDelete,
}: TaskCardProps) {
  const isOverdue =
    task.due_date &&
    isPast(new Date(task.due_date)) &&
    !isToday(new Date(task.due_date)) &&
    task.status !== "Completed";

  const status = statusConfig[task.status];

  const handleStatusClick = () => {
    const nextStatus: Record<TaskStatus, TaskStatus> = {
      Open: "InProgress",
      InProgress: "Completed",
      Completed: "Open",
    };
    onStatusChange(task.id, nextStatus[task.status]);
  };

  return (
    <div
      className={`p-4 rounded-lg border transition-all ${
        isOverdue
          ? "bg-red-50 border-red-200 hover:border-red-300"
          : "bg-white border-slate-200 hover:border-slate-300"
      }`}
    >
      <div className="flex items-start gap-3">
        <Button
          variant="ghost"
          size="icon"
          className={`shrink-0 h-6 w-6 ${
            task.status === "Completed"
              ? "text-green-600 hover:text-green-700"
              : "text-slate-400 hover:text-slate-600"
          }`}
          onClick={handleStatusClick}
        >
          {task.status === "Completed" ? (
            <CheckCircle2 className="h-5 w-5" />
          ) : (
            <Circle className="h-5 w-5" />
          )}
        </Button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4
              className={`font-medium text-sm ${
                task.status === "Completed"
                  ? "text-slate-500 line-through"
                  : "text-slate-900"
              }`}
            >
              {task.title}
            </h4>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onStatusChange(task.id, "Open")}>
                  <Circle className="h-4 w-4 mr-2" />
                  Mark as Open
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onStatusChange(task.id, "InProgress")}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Mark as In Progress
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onStatusChange(task.id, "Completed")}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Mark as Completed
                </DropdownMenuItem>
                {onDelete && (
                  <>
                    <div className="h-px bg-slate-200 my-1" />
                    <DropdownMenuItem
                      onClick={() => onDelete(task.id)}
                      className="text-red-600 focus:text-red-600"
                    >
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {task.description && (
            <p className="text-xs text-slate-500 mt-1 line-clamp-2">
              {task.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2 mt-3">
            {task.client_id && task.client_name && (
              <Link
                to={`/command-center/clients/${task.client_id}`}
                className="text-xs text-emerald-600 hover:text-emerald-700 hover:underline"
              >
                {task.client_name}
              </Link>
            )}

            {task.due_date && (
              <div
                className={`flex items-center gap-1 text-xs ${
                  isOverdue ? "text-red-600 font-medium" : "text-slate-500"
                }`}
              >
                {isOverdue && <AlertCircle className="h-3 w-3" />}
                <span>
                  {isToday(new Date(task.due_date))
                    ? "Due today"
                    : isOverdue
                    ? `Overdue by ${formatDistanceToNow(
                        new Date(task.due_date),
                        { addSuffix: false }
                      )}`
                    : `Due ${format(new Date(task.due_date), "MMM d")}`}
                </span>
              </div>
            )}

            <Badge variant="outline" className={`text-xs ${status.color}`}>
              <span className="flex items-center gap-1">
                {status.icon}
                {status.label}
              </span>
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
