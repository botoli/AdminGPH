import { AppShell } from "@/components/layout/app-shell";
import { TaskTable } from "@/components/tasks/task-table";
import type { TaskRow } from "@/components/tasks/task-table";
import styles from "./page.module.css";
import { getTasksWithActualHours } from "@/actions/task-actions";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const tasks = await getTasksWithActualHours();

  const taskRows: TaskRow[] = tasks.map((t) => ({
    id: t.id,
    externalId: t.externalId,
    title: t.title,
    plannedHours: t.plannedHours ?? 0,
    actualHours: t.actualHours ?? 0,
    status: t.status,
    plannedDate: t.plannedDate,
  }));

  return (
    <AppShell>
      <div className={styles.page}>
        <div>
          <h1 className={styles.title}>Задачи</h1>
          <p className={styles.subtitle}>
            Управление задачами и отслеживание прогресса
          </p>
        </div>
        <TaskTable initialTasks={taskRows} />
      </div>
    </AppShell>
  );
}
