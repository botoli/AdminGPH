import Link from "next/link";
import { ArrowUpRight, CheckCircle2, Clock3, ListTodo } from "lucide-react";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { formatHours } from "@/lib/utils";
import styles from "./dashboard-task-list.module.css";

export interface DashboardTaskItem {
  id: string;
  title: string;
  externalId: string | null;
  status: string;
  plannedDate: string | null;
  completedAt: string | null;
  actualHours: number;
}

const statusMeta: Record<string, { label: string; variant: BadgeVariant }> = {
  NEW: { label: "Новая", variant: "new" },
  PLANNED: { label: "Запланирована", variant: "planned" },
  IN_PROGRESS: { label: "В работе", variant: "in_progress" },
  COMPLETED: { label: "Завершена", variant: "completed" },
  PAID: { label: "Оплачена", variant: "paid" },
};

function formatTaskDate(value: string | null) {
  if (!value) return "Без даты";
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "Без даты";
  return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short" }).format(date);
}

export function DashboardTaskList({ tasks }: { tasks: DashboardTaskItem[] }) {
  const hasActiveTasks = tasks.some((task) => ["NEW", "PLANNED", "IN_PROGRESS"].includes(task.status));

  return (
    <article className={styles.card} aria-labelledby="dashboard-tasks-title">
      <header className={styles.header}>
        <div className={styles.heading}>
          <span className={styles.icon}><ListTodo aria-hidden="true" /></span>
          <div>
            <h2 id="dashboard-tasks-title">{hasActiveTasks ? "Актуальные задачи" : "Последние задачи"}</h2>
            <p>{hasActiveTasks ? "То, что требует внимания сейчас" : "Недавно завершённая работа"}</p>
          </div>
        </div>
        <Link href="/tasks" prefetch={false} className={styles.link}>Все задачи <ArrowUpRight aria-hidden="true" /></Link>
      </header>

      <div className={styles.list}>
        {tasks.map((task) => {
          const meta = statusMeta[task.status] ?? { label: task.status, variant: "outline" as BadgeVariant };
          const date = task.completedAt ?? task.plannedDate;
          return (
            <div className={styles.row} key={task.id}>
              <span className={styles.stateIcon}>
                {task.status === "COMPLETED" || task.status === "PAID" ? <CheckCircle2 aria-hidden="true" /> : <span />}
              </span>
              <div className={styles.copy}>
                <strong title={task.title}>{task.title}</strong>
                <span>{task.externalId ? `${task.externalId} · ` : ""}{formatTaskDate(date)}</span>
              </div>
              <div className={styles.meta}>
                <Badge variant={meta.variant} size="sm">{meta.label}</Badge>
                <span className={styles.hours}><Clock3 aria-hidden="true" /> {formatHours(task.actualHours)}</span>
              </div>
            </div>
          );
        })}
        {tasks.length === 0 ? <p className={styles.empty}>Задач пока нет. Новые задачи появятся здесь автоматически.</p> : null}
      </div>
    </article>
  );
}
