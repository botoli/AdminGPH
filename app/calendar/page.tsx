import { AppShell } from "@/components/layout/app-shell";
import { CalendarView } from "@/components/calendar/calendar-view";
import type { CalendarEvent } from "@/components/calendar/calendar-view";
import { db } from "@/lib/db";
import { getCompletedTasksInRange } from "@/lib/task-metrics";
import styles from "./page.module.css";
import { startOfMonth, endOfMonth, format } from "date-fns";

export const dynamic = "force-dynamic";

const COLORS = [
  "#8f73e6", "#b18cff", "#6f9bd1", "#6faf95",
  "#c28b69", "#a96f91", "#7e78b8", "#8b6eaa",
];

export default async function CalendarPage() {
  const now = new Date();
  const start = format(startOfMonth(now), "yyyy-MM-dd");
  const end = format(endOfMonth(now), "yyyy-MM-dd");

  const [schedules, tasks] = await Promise.all([
    db.taskSchedule.findMany({
      where: { scheduleDate: { gte: start, lte: end } },
      include: { task: true },
    }),
    db.task.findMany({
      select: {
        id: true,
        title: true,
        externalId: true,
        status: true,
        plannedDate: true,
        completedAt: true,
        actualHours: true,
      },
    }),
  ]);

  // Assign consistent colors per task
  const taskColorMap = new Map<string, string>();
  tasks.forEach((t, i) => taskColorMap.set(t.id, COLORS[i % COLORS.length]));

  const events: CalendarEvent[] = schedules.map((s) => ({
    id: s.id,
    taskId: s.taskId,
    title: s.task?.title ?? "Без названия",
    start: s.scheduleDate,
    plannedHours: s.plannedHours,
    kind: "schedule",
    backgroundColor: taskColorMap.get(s.taskId) ?? COLORS[0],
    borderColor: taskColorMap.get(s.taskId) ?? COLORS[0],
  }));

  const completedEvents: CalendarEvent[] = getCompletedTasksInRange(tasks, start, end).map((task) => ({
    id: `completed-${task.id}`,
    taskId: task.id,
    title: `✓ ${task.title}`,
    start: task.date,
    plannedHours: task.actualHours,
    kind: "completed",
    backgroundColor: "#4f9c78",
    borderColor: "#4f9c78",
  }));

  const taskList = tasks.map((t) => ({
    id: t.id,
    title: t.title,
    externalId: t.externalId,
  }));

  return (
    <AppShell>
      <div className={styles.page}>
        <div>
          <h1 className={styles.title}>Календарь</h1>
          <p className={styles.subtitle}>Планируйте задачи по дням</p>
        </div>
        <CalendarView initialEvents={[...events, ...completedEvents]} tasks={taskList} />
      </div>
    </AppShell>
  );
}
