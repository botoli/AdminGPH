import { AppShell } from "@/components/layout/app-shell";
import { WorklogTable } from "@/components/worklog/worklog-table";
import { getWorklogs } from "@/actions/worklog-actions";
import { db } from "@/lib/db";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export default async function WorklogPage() {
  const [settings, worklogs, tasks] = await Promise.all([
    db.settings.findUnique({ where: { id: "default" } }),
    getWorklogs(),
    db.task.findMany({
      select: { id: true, title: true, externalId: true },
      orderBy: { title: "asc" },
    }),
  ]);

  return (
    <AppShell>
      <div className={styles.page}>
        <div>
          <h1 className={styles.title}>Учёт времени</h1>
          <p className={styles.subtitle}>Записывай фактические часы по задачам и используй их в отчётах.</p>
        </div>
        <WorklogTable
          initialWorklogs={worklogs.map((item) => ({
            id: item.id,
            taskId: item.taskId,
            taskTitle: item.task.title,
            taskExternalId: item.task.externalId,
            workDate: item.workDate,
            hours: item.hours,
            comment: item.comment,
            hourlyRate: settings?.hourlyRate ?? 1000,
          }))}
          initialTasks={tasks}
          hourlyRate={settings?.hourlyRate ?? 1000}
        />
      </div>
    </AppShell>
  );
}
