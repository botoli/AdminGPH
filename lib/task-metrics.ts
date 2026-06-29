export interface CompletedMetricTask {
  id: string;
  title: string;
  externalId: string | null;
  status: string;
  plannedDate: string | null;
  completedAt: string | null;
  actualHours: number | null;
}

export interface CompletedTaskEntry {
  id: string;
  title: string;
  externalId: string | null;
  date: string;
  actualHours: number;
}

function normalizeDate(raw: string | null | undefined): string | null {
  if (!raw) return null;
  return raw.slice(0, 10);
}

export function getCompletedTaskDate(task: CompletedMetricTask): string | null {
  if (task.status !== "COMPLETED" && task.status !== "PAID") return null;
  return normalizeDate(task.completedAt) ?? normalizeDate(task.plannedDate);
}

export function getCompletedTasksInRange(
  tasks: CompletedMetricTask[],
  start: string,
  end: string,
): CompletedTaskEntry[] {
  return tasks
    .map((task) => {
      const date = getCompletedTaskDate(task);
      if (!date || date < start || date > end) return null;
      return {
        id: task.id,
        title: task.title,
        externalId: task.externalId,
        date,
        actualHours: task.actualHours ?? 0,
      };
    })
    .filter((task): task is CompletedTaskEntry => task !== null);
}

export function groupCompletedTasksByDate(tasks: CompletedTaskEntry[]) {
  return tasks.reduce<Record<string, CompletedTaskEntry[]>>((acc, task) => {
    acc[task.date] ??= [];
    acc[task.date].push(task);
    return acc;
  }, {});
}
