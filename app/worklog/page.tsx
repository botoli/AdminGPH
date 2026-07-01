import { AppShell } from "@/components/layout/app-shell";
import { WorklogTable } from "@/components/worklog/worklog-table";
import { getWorklogs } from "@/actions/worklog-actions";
import { db } from "@/lib/db";
import { getMonthDateRange } from "@/lib/selected-month";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export default async function WorklogPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const { month } = await searchParams;
  const { startDate, endDate, monthValue } = getMonthDateRange(month);
  const [settings, worklogs, tasks] = await Promise.all([
    db.settings.findUnique({ where: { id: "default" } }),
    getWorklogs({ startDate, endDate }),
    db.task.findMany({
      select: { id: true, title: true, externalId: true },
      orderBy: { title: "asc" },
    }),
  ]);

  return (
    <AppShell variant="dashboard">
      <div className={styles.page}>
        <header className={styles.pageHeader}>
          <p className={styles.eyebrow}>Рабочий процесс</p>
          <h1 className={styles.title}>Учёт времени</h1>
          <p className={styles.subtitle}>Записывай фактические часы по задачам и используй их в отчётах.</p>
        </header>
        <WorklogTable
          initialWorklogs={worklogs.map((item) => ({
            id: item.id,
            taskId: item.taskId,
            taskTitle: item.task.title,
            taskExternalId: item.task.externalId,
            workDate: item.workDate,
            hours: item.hours,
            comment: item.comment,
            hourlyRate: (settings?.dailyRate ?? (settings?.hourlyRate ?? 1000) * 8) / 8,
          }))}
          initialTasks={tasks}
          hourlyRate={(settings?.dailyRate ?? (settings?.hourlyRate ?? 1000) * 8) / 8}
          selectedMonth={monthValue}
          initialStartDate={startDate}
          initialEndDate={endDate}
        />
      </div>
    </AppShell>
  );
}
