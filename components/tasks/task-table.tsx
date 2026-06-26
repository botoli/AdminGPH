"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  createColumnHelper,
  flexRender,
  type SortingState,
} from "@tanstack/react-table";
import styles from "./task-table.module.css";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
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
import { formatHours } from "@/lib/utils";
import { Plus, Search, Pencil, Trash2, ArrowUpDown } from "lucide-react";
import { createTask, updateTask, deleteTask } from "@/actions/task-actions";

export interface TaskRow {
  id: string;
  externalId: string | null;
  title: string;
  plannedHours: number;
  actualHours: number;
  status: string;
  plannedDate: string | null;
}

interface TaskTableProps {
  initialTasks: TaskRow[];
}

const STATUS_VARIANT_MAP: Record<string, BadgeVariant> = {
  NEW: "new",
  PLANNED: "planned",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  PAID: "paid",
};

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

const columnHelper = createColumnHelper<TaskRow>();

export function TaskTable({ initialTasks }: TaskTableProps) {
  const router = useRouter();
  const [data, setData] = useState<TaskRow[]>(initialTasks);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskRow | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<TaskRow | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const columns = useMemo(
    () => [
      columnHelper.accessor("externalId", {
        header: "Внешний ID",
        cell: (info) => (
          <span className={styles.externalId}>
            {info.getValue() ?? "\u2014"}
          </span>
        ),
        size: 120,
      }),
      columnHelper.accessor("title", {
        header: "Название",
        cell: (info) => (
          <span className={styles.title}>
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor("plannedHours", {
        header: "План",
        cell: (info) => (
          <span className={styles.hoursText}>
            {formatHours(info.getValue())}
          </span>
        ),
        size: 90,
      }),
      columnHelper.accessor("actualHours", {
        header: "Факт",
        cell: (info) => (
          <span
            className={
              info.getValue() > (info.row.original.plannedHours || 0)
                ? styles.hoursOver
                : styles.hoursText
            }
          >
            {formatHours(info.getValue())}
          </span>
        ),
        size: 90,
      }),
      columnHelper.accessor("status", {
        header: "Статус",
        cell: (info) => {
          const s = info.getValue();
          return (
            <Badge variant={STATUS_VARIANT_MAP[s] ?? "default"} size="sm">
              {s.replace("_", " ")}
            </Badge>
          );
        },
        size: 120,
      }),
      columnHelper.accessor("plannedDate", {
        header: "Дата",
        cell: (info) => (
          <span className={styles.dateText}>
            {info.getValue() ?? "\u2014"}
          </span>
        ),
        size: 120,
      }),
    ],
    [],
  );

  useEffect(() => {
    setData(initialTasks);
  }, [initialTasks]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters: [], globalFilter },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: "auto",
  });

  const filteredByStatus = useMemo(() => {
    if (statusFilter === "ALL") return data;
    return data.filter((t) => t.status === statusFilter);
  }, [data, statusFilter]);

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
        <Button onClick={openCreate} style={{ marginLeft: "auto" }}><Plus style={{ width: "1rem", height: "1rem", marginRight: "0.375rem" }} />Добавить задачу</Button>
      </div>
      <Card>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead className={styles.thead}>
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id}>
                  {hg.headers.map((header) => (
                    <th key={header.id} className={styles.th}
                      style={{ width: header.getSize() }} onClick={header.column.getToggleSortingHandler()}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", cursor: "pointer", userSelect: "none" }}>
                        {flexRender(header.column.columnDef.header, header.getContext())}<ArrowUpDown className={styles.sortIcon} />
                      </div>
                    </th>
                  ))}
                  <th className={styles.th} style={{ width: "6rem", textAlign: "right" }}>Действия</th>
                </tr>
              ))}
            </thead>
            <tbody>
              {filteredByStatus.map((task) => (
                <tr key={task.id} className={styles.tr} onClick={() => openEdit(task)}>
                  <td className={`${styles.td} ${styles.externalId}`}>{task.externalId ?? "\u2014"}</td>
                  <td className={`${styles.td} ${styles.title}`}>{task.title}</td>
                  <td className={`${styles.td} ${styles.hoursText}`}>{formatHours(task.plannedHours)}</td>
                  <td className={`${styles.td} ${task.actualHours > (task.plannedHours || 0) ? styles.hoursOver : styles.hoursText}`}>{formatHours(task.actualHours)}</td>
                  <td className={styles.td}><Badge variant={STATUS_VARIANT_MAP[task.status] ?? "default"} size="sm">{task.status.replace("_", " ")}</Badge></td>
                  <td className={`${styles.td} ${styles.dateText}`}>{task.plannedDate ?? "\u2014"}</td>
                  <td className={styles.td} style={{ textAlign: "right" }}>
                    <div className={styles.actions}>
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); openEdit(task); }}><Pencil className={styles.actionIcon} /></Button>
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setDeleteConfirm(task); }}><Trash2 className={styles.deleteIcon} /></Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredByStatus.length === 0 && (
                <tr><td colSpan={7} className={styles.emptyRow}>Задачи не найдены.</td></tr>
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
