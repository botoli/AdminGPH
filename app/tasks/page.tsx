import { AppShell } from "@/components/layout/app-shell";
import { TaskTable } from "@/components/tasks/task-table";
import type { TaskRow } from "@/components/tasks/task-table";
import styles from "./page.module.css";
import { getTasksWithActualHours } from "@/actions/task-actions";
import { db } from "@/lib/db";
import { calculateAfterNdfl } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const [tasks, settings] = await Promise.all([
    getTasksWithActualHours(),
    db.settings.findUnique({ where: { id: "default" } }),
  ]);

  const taskRows: TaskRow[] = tasks.map((t) => ({
    id: t.id,
    externalId: t.externalId,
    title: t.title,
    plannedHours: t.plannedHours ?? 0,
    actualHours: t.actualHours ?? 0,
    status: t.status,
    plannedDate: t.plannedDate,
    completedAt: t.completedAt,
  }));

  return (
    <AppShell variant="dashboard">
      <div className={styles.page}>
        <header className={styles.pageHeader}>
          <p className={styles.eyebrow}>Рабочий процесс</p>
          <h1 className={styles.title}>Задачи</h1>
          <p className={styles.subtitle}>
            Управление задачами и отслеживание прогресса
          </p>
        </header>
        <TaskTable initialTasks={taskRows} netHourlyRate={calculateAfterNdfl(settings?.hourlyRate ?? 1000)} />
      </div>
    </AppShell>
  );
}
