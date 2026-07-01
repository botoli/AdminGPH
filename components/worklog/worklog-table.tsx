"use client";

import styles from "./worklog-table.module.css";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Dialog, DialogOverlay, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { formatHours, formatCurrency } from "@/lib/utils";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { createWorklog, updateWorklog, deleteWorklog } from "@/actions/worklog-actions";

export interface WorklogRow {
  id: string; taskId: string; taskTitle: string; taskExternalId: string | null;
  workDate: string; hours: number; comment: string; hourlyRate: number;
}

interface Props {
  initialWorklogs: WorklogRow[];
  initialTasks: Array<{ id: string; title: string; externalId: string | null }>;
  hourlyRate: number;
  selectedMonth: string;
  initialStartDate: string;
  initialEndDate: string;
}

const schema = z.object({
  taskId: z.string().min(1, "Выберите задачу"),
  workDate: z.string().min(1, "Укажите дату"),
  hours: z.coerce.number().min(0.25, "Минимум 0.25 ч"),
  comment: z.string().optional(),
});
type FV = z.output<typeof schema>;
type FVI = z.input<typeof schema>;

export function WorklogTable({
  initialWorklogs,
  initialTasks,
  hourlyRate,
  selectedMonth,
  initialStartDate,
  initialEndDate,
}: Props) {
  const r = useRouter();
  const [worklogs] = useState(initialWorklogs);
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<WorklogRow | null>(null);
  const [del, setDel] = useState<WorklogRow | null>(null);
  const [sub, setSub] = useState(false);
  const defaultWorkDate = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return today.startsWith(selectedMonth) ? today : `${selectedMonth}-01`;
  }, [selectedMonth]);

  const opts = initialTasks.map(t => ({
    value: t.id,
    label: `${t.externalId ? t.externalId+" – " : ""}${t.title}`,
  }));

  const filtered = worklogs.filter(w => {
    if (startDate && w.workDate < startDate) return false;
    if (endDate && w.workDate > endDate) return false;
    return true;
  });
  const th = filtered.reduce((s,w) => s + w.hours, 0);

  const form = useForm<FVI, unknown, FV>({
    resolver: zodResolver(schema),
    defaultValues: { taskId: "", workDate: "", hours: 1, comment: "" },
  });

  const openCreate = () => {
    setEdit(null);
    form.reset({ taskId: "", workDate: defaultWorkDate, hours: 1, comment: "" });
    setOpen(true);
  };

  const openEdit = (w: WorklogRow) => {
    setEdit(w);
    form.reset({ taskId: w.taskId, workDate: w.workDate, hours: w.hours, comment: w.comment });
    setOpen(true);
  };

  const onSubmit = async (v: FV) => {
    setSub(true);
    try {
      const fd = new FormData();
      if (edit) fd.set("id", edit.id);
      fd.set("taskId", v.taskId);
      fd.set("workDate", v.workDate);
      fd.set("hours", String(v.hours));
      fd.set("comment", v.comment ?? "");
      if (edit) await updateWorklog(fd);
      else await createWorklog(fd);
      setOpen(false);
      r.refresh();
    } finally { setSub(false); }
  };

  const handleDelete = async () => {
    if (!del) return;
    await deleteWorklog(del.id);
    setDel(null);
    r.refresh();
  };

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <Input label="С" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={styles.dateInput} />
        <Input label="По" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={styles.dateInput} />
        <div className={styles.spacer} />
        <Button onClick={openCreate} size="sm"><Plus className={styles.buttonIcon} />Записать время</Button>
      </div>
      <Card>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr className={styles.theadRow}>
                <th className={styles.th}>Дата</th>
                <th className={styles.th}>Задача</th>
                <th className={`${styles.th} ${styles.thRight}`}>Часы</th>
                <th className={`${styles.th} ${styles.thRight}`}>Сумма</th>
                <th className={styles.th}>Комментарий</th>
                <th className={styles.thAction} />
              </tr>
            </thead>
            <tbody className={styles.tbody}>
              {filtered.map(w => (
                <tr key={w.id} className={styles.tr}>
                  <td className={styles.td}>{w.workDate}</td>
                  <td className={styles.tdCell}>
                    <span className={styles.tdText}>{w.taskTitle}</span>
                    {w.taskExternalId && <span className={styles.tdExtId}>{w.taskExternalId}</span>}
                  </td>
                  <td className={`${styles.tdCell} ${styles.tdRight} ${styles.tdBold}`}>{formatHours(w.hours)}</td>
                  <td className={`${styles.tdCell} ${styles.tdRight} ${styles.tdMuted}`}>{formatCurrency(w.hours * hourlyRate)}</td>
                  <td className={styles.tdComment}>{w.comment || "—"}</td>
                  <td className={styles.tdActions}>
                    <div className={styles.actionsRow}>
                      <Button variant="ghost" size="sm" onClick={() => openEdit(w)}><Pencil className={styles.actionIconSmall} /></Button>
                      <Button variant="ghost" size="sm" onClick={() => setDel(w)}><Trash2 className={styles.actionIconDanger} /></Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className={styles.emptyRow}>Нет записей о работе.</td></tr>
              )}
            </tbody>
            {filtered.length > 0 && (
              <tfoot>
                <tr className={styles.tfootRow}>
                  <td colSpan={2} className={styles.tfootLabel}>Итого</td>
                  <td className={`${styles.tfootValue} ${styles.tdRight}`}>{formatHours(th)}</td>
                  <td className={`${styles.tfootValue} ${styles.tdRight}`}>{formatCurrency(th * hourlyRate)}</td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogOverlay />
        <DialogContent>
          <DialogHeader><DialogTitle>{edit ? "Редактировать" : "Записать"} время</DialogTitle></DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogBody className={styles.dialogBody}>
              <Select label="Задача" options={opts} placeholder="Выберите задачу..." {...form.register("taskId")} error={form.formState.errors.taskId?.message} />
              <div className={styles.dialogGrid}>
                <Input label="Дата" type="date" {...form.register("workDate")} error={form.formState.errors.workDate?.message} />
                <Input label="Часы" type="number" step="0.25" min="0.25" {...form.register("hours", { valueAsNumber: true })} error={form.formState.errors.hours?.message} />
              </div>
              <Input label="Комментарий" {...form.register("comment")} />
            </DialogBody>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Отмена</Button>
              <Button type="submit" disabled={sub}>{sub ? "Сохранение..." : edit ? "Сохранить" : "Записать"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!del} onOpenChange={() => setDel(null)}>
        <DialogOverlay />
        <DialogContent>
          <DialogHeader><DialogTitle>Удалить запись</DialogTitle></DialogHeader>
          <DialogBody>
            <p className={styles.dialogText}>Удалить {formatHours(del?.hours ?? 0)} для &quot;{del?.taskTitle}&quot; от {del?.workDate}?</p>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDel(null)}>Отмена</Button>
            <Button variant="destructive" onClick={handleDelete}>Удалить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
