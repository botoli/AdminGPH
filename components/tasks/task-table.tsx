"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import styles from "./task-table.module.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { formatCurrency, formatHours } from "@/lib/utils";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { createTask, updateTask, deleteTask, updateTaskStatus } from "@/actions/task-actions";

export interface TaskRow {
  id: string;
  externalId: string | null;
  title: string;
  plannedHours: number;
  actualHours: number;
  status: string;
  plannedDate: string | null;
  completedAt: string | null;
}

interface TaskTableProps {
  initialTasks: TaskRow[];
  netHourlyRate: number;
}

const taskFormSchema = z.object({
  externalId: z.string().optional(),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  plannedHours: z.coerce.number().min(0, "Must be >= 0"),
  actualHours: z.coerce.number().min(0, "Must be >= 0"),
  status: z.string().min(1),
  plannedDate: z.string().optional(),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;
type TaskFormInput = z.input<typeof taskFormSchema>;

export function TaskTable({ initialTasks, netHourlyRate }: TaskTableProps) {
  const router = useRouter();
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [monthFilter, setMonthFilter] = useState(() => new Date().toISOString().slice(0, 7));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskRow | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<TaskRow | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const filteredByStatus = useMemo(() => {
    const query = globalFilter.trim().toLowerCase();
    return initialTasks.filter((task) => {
      const matchesStatus = statusFilter === "ALL" || task.status === statusFilter;
      const taskMonth = (task.completedAt ?? task.plannedDate ?? "").slice(0, 7);
      const matchesMonth = monthFilter === "ALL" || taskMonth === monthFilter;
      const matchesQuery = !query || task.title.toLowerCase().includes(query) || task.externalId?.toLowerCase().includes(query);
      return matchesStatus && matchesMonth && matchesQuery;
    });
  }, [initialTasks, statusFilter, monthFilter, globalFilter]);
  const totals = useMemo(() => filteredByStatus.reduce((sum, task) => ({ plan: sum.plan + task.plannedHours, actual: sum.actual + task.actualHours, amount: sum.amount + task.actualHours * netHourlyRate }), { plan: 0, actual: 0, amount: 0 }), [filteredByStatus, netHourlyRate]);

  const form = useForm<TaskFormInput, undefined, TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      externalId: "",
      title: "",
      description: "",
      plannedHours: 0,
      actualHours: 0,
      status: "NEW",
      plannedDate: "",
    },
  });

  const openCreate = () => {
    setEditingTask(null);
    form.reset({ externalId: "", title: "", description: "", plannedHours: 0, actualHours: 0, status: "NEW", plannedDate: "" });
    setDialogOpen(true);
  };

  const openEdit = (task: TaskRow) => {
    setEditingTask(task);
    form.reset({ externalId: task.externalId ?? "", title: task.title, description: "", plannedHours: task.plannedHours, actualHours: task.actualHours, status: task.status, plannedDate: task.plannedDate ?? "" });
    setDialogOpen(true);
  };

  const onSubmit = async (values: TaskFormValues) => {
    setSubmitting(true);
    try {
      const fd = new FormData();
      if (editingTask) fd.set("id", editingTask.id);
      fd.set("externalId", values.externalId ?? "");
      fd.set("title", values.title);
      fd.set("description", values.description ?? "");
      fd.set("plannedHours", String(values.plannedHours));
      fd.set("actualHours", String(values.actualHours));
      fd.set("status", values.status);
      fd.set("plannedDate", values.plannedDate ?? "");
      if (editingTask) await updateTask(fd);
      else await createTask(fd);
      setDialogOpen(false);
      router.refresh();
    } finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    await deleteTask(deleteConfirm.id);
    setDeleteConfirm(null);
    router.refresh();
  };

  const statusOptions = [
    { value: "ALL", label: "Все статусы" },
    { value: "NEW", label: "Новая" },
    { value: "PLANNED", label: "Запланирована" },
    { value: "IN_PROGRESS", label: "В работе" },
    { value: "COMPLETED", label: "Завершена" },
    { value: "PAID", label: "Оплачена" },
  ];

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <div className={styles.searchWrapper}>
          <Search className={styles.searchIcon} />
          <input
            placeholder="Поиск задач..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <Select options={statusOptions} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} />
        <input aria-label="Фильтр по месяцу" className={styles.monthInput} type="month" value={monthFilter === "ALL" ? "" : monthFilter} onChange={(e) => setMonthFilter(e.target.value || "ALL")} />
        <Button onClick={openCreate} style={{ marginLeft: "auto" }}><Plus style={{ width: "1rem", height: "1rem", marginRight: "0.375rem" }} />Добавить задачу</Button>
      </div>
      <div className={styles.filterSummary}><span>{filteredByStatus.length} задач</span><span>План: <strong>{formatHours(totals.plan)}</strong></span><span>Факт: <strong>{formatHours(totals.actual)}</strong></span><span>Сумма: <strong>{formatCurrency(totals.amount)}</strong></span></div>
      <Card>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead className={styles.thead}>
              <tr><th className={styles.th}>ID</th><th className={styles.th}>Название</th><th className={styles.th}>План</th><th className={styles.th}>Факт</th><th className={styles.th}>Разница</th><th className={styles.th}>Статус</th><th className={styles.th}>Дата завершения</th><th className={styles.th}>Сумма</th><th className={styles.th}>Действия</th></tr>
            </thead>
            <tbody>
              {filteredByStatus.map((task) => (
                <tr key={task.id} className={styles.tr} onClick={() => openEdit(task)}>
                  <td className={`${styles.td} ${styles.externalId}`}>{task.externalId ?? "\u2014"}</td>
                  <td className={`${styles.td} ${styles.title}`}>{task.title}</td>
                  <td className={`${styles.td} ${styles.hoursText}`}>{formatHours(task.plannedHours)}</td>
                  <td className={`${styles.td} ${task.actualHours > (task.plannedHours || 0) ? styles.hoursOver : styles.hoursText}`}>{formatHours(task.actualHours)}</td>
                  <td className={`${styles.td} ${task.actualHours - task.plannedHours > 0 ? styles.hoursOver : styles.hoursText}`}>{task.actualHours - task.plannedHours > 0 ? "+" : ""}{formatHours(task.actualHours - task.plannedHours)}</td>
                  <td className={styles.td} onClick={(e)=>e.stopPropagation()}><select className={`${styles.inlineStatus} ${styles[`status_${task.status}`] ?? ""}`} value={task.status} onChange={async (e)=>{await updateTaskStatus(task.id,e.target.value);router.refresh();}}>{statusOptions.filter((o)=>o.value!=="ALL").map((option)=><option key={option.value} value={option.value}>{option.label}</option>)}</select></td>
                  <td className={`${styles.td} ${styles.dateText}`}>{task.completedAt?.slice(0,10) ?? "\u2014"}</td>
                  <td className={`${styles.td} ${styles.amountText}`}>{formatCurrency(task.actualHours * netHourlyRate)}</td>
                  <td className={styles.td} style={{ textAlign: "right" }}>
                    <div className={styles.actions}>
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); openEdit(task); }}><Pencil className={styles.actionIcon} /></Button>
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setDeleteConfirm(task); }}><Trash2 className={styles.deleteIcon} /></Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredByStatus.length === 0 && (
                <tr><td colSpan={9} className={styles.emptyRow}>Задачи не найдены.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogOverlay />
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTask ? "Редактировать" : "Создать задачу"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogBody>
              <Input label="Название" {...form.register("title")} error={form.formState.errors.title?.message} />
              <div className={styles.dialogGrid}>
                <Input label="Внешний ID" {...form.register("externalId")} />
                <Input label="План (часы)" type="number" step="0.5" {...form.register("plannedHours")} error={form.formState.errors.plannedHours?.message} />
              </div>
              <div className={styles.dialogGrid}>
                <Input label="Факт (часы)" type="number" step="0.5" {...form.register("actualHours")} error={form.formState.errors.actualHours?.message} />
                <div />
              </div>
              <div className={styles.dialogGrid}>
                <Select label="Статус" options={statusOptions.filter((o) => o.value !== "ALL")} {...form.register("status")} />
                <Input label="Дата" type="date" {...form.register("plannedDate")} />
              </div>
            </DialogBody>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Отмена</Button>
              <Button type="submit" disabled={submitting}>{submitting ? "Сохранение..." : editingTask ? "Сохранить" : "Создать"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogOverlay />
        <DialogContent>
          <DialogHeader><DialogTitle>Удалить задачу</DialogTitle></DialogHeader>
          <DialogBody>
            <p className={styles.deleteText}>
              Вы уверены, что хотите удалить &quot;{deleteConfirm?.title}&quot;? Все связанные записи времени и расписание также будут удалены.
            </p>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Отмена</Button>
            <Button variant="destructive" onClick={handleDelete}>Удалить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
