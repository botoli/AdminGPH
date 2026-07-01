"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin, { type DateClickArg } from "@fullcalendar/interaction";
import type { EventClickArg, EventContentArg, EventDropArg } from "@fullcalendar/core";
import styles from "./calendar-view.module.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogOverlay, DialogContent, DialogHeader,
  DialogTitle, DialogBody, DialogFooter,
} from "@/components/ui/dialog";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createSchedule, updateSchedule, deleteSchedule } from "@/actions/schedule-actions";
import type { EventInput } from "@fullcalendar/core";
import { Search, Hash, ListFilter, Clock3 } from "lucide-react";

export interface CalendarEvent {
  id: string; taskId: string; title: string; start: string;
  plannedHours: number; backgroundColor?: string; borderColor?: string;
  kind?: "schedule" | "completed";
}

interface CalendarViewProps {
  initialEvents: CalendarEvent[];
  tasks: Array<{ id: string; title: string; externalId: string | null }>;
  initialDate: string;
}

const EVENT_COLORS = [
  "#8f73e6","#b18cff","#6f9bd1","#6faf95",
  "#c28b69","#a96f91","#7e78b8","#8b6eaa",
];

const scheduleSchema = z.object({
  taskId: z.string().min(1, "Выберите задачу"),
  scheduleDate: z.string().min(1, "Укажите дату"),
  plannedHours: z.number().min(0, "Минимум 0"),
});
type ScheduleFormValues = z.infer<typeof scheduleSchema>;

export function CalendarView({ initialEvents, tasks, initialDate }: CalendarViewProps) {
  const router = useRouter();
  const [events, setEvents] = useState(initialEvents);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [taskQuery, setTaskQuery] = useState("");
  const [taskFilter, setTaskFilter] = useState<"all" | "withId" | "withoutId">("all");

  const filteredTasks = useMemo(() => {
    const query = taskQuery.trim().toLowerCase();
    return tasks
      .filter((task) => {
        if (taskFilter === "withId" && !task.externalId) return false;
        if (taskFilter === "withoutId" && task.externalId) return false;
        if (!query) return true;
        return `${task.externalId ?? ""} ${task.title}`.toLowerCase().includes(query);
      })
      .sort((a, b) => {
        if (a.externalId && !b.externalId) return -1;
        if (!a.externalId && b.externalId) return 1;
        return a.title.localeCompare(b.title, "ru");
      });
  }, [taskFilter, taskQuery, tasks]);

  const form = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: { taskId: "", scheduleDate: "", plannedHours: 0 },
  });

  const selectedTaskId = useWatch({ control: form.control, name: "taskId" });

  const normalizeDate = useCallback((dateStr: string) => dateStr.slice(0, 10), []);

  const handleDateClick = useCallback((arg: DateClickArg) => {
    setEditingEvent(null);
    setTaskQuery("");
    setTaskFilter("all");
    const normalizedDate = normalizeDate(arg.dateStr);
    setSelectedDate(normalizedDate);
    form.reset({ taskId: "", scheduleDate: normalizedDate, plannedHours: 0 });
    setDialogOpen(true);
  }, [form, normalizeDate]);

  const handleEventClick = useCallback((arg: EventClickArg) => {
    const evt = events.find((e) => e.id === arg.event.id);
    if (!evt) return;
    if (evt.kind === "completed") return;
    setEditingEvent(evt);
    setTaskQuery("");
    setTaskFilter("all");
    setSelectedDate(evt.start);
    form.reset({
      taskId: evt.taskId,
      scheduleDate: evt.start,
      plannedHours: evt.plannedHours,
    });
    setDialogOpen(true);
  }, [events, form]);

  const handleEventDrop = useCallback(async (arg: EventDropArg) => {
    const { event } = arg;
    try {
      await updateSchedule(event.id, { scheduleDate: normalizeDate(event.startStr) });
      setEvents((prev) =>
        prev.map((e) =>
          e.id === event.id ? { ...e, start: normalizeDate(event.startStr) } : e
        )
      );
      router.refresh();
    } catch {
      arg.revert();
    }
  }, [normalizeDate, router]);

  const onSubmit = async (values: ScheduleFormValues) => {
    setSubmitting(true);
    try {
      if (editingEvent) {
        await updateSchedule(editingEvent.id, {
          scheduleDate: values.scheduleDate,
          plannedHours: values.plannedHours,
        });
      } else {
        const fd = new FormData();
        fd.set("taskId", values.taskId);
        fd.set("scheduleDate", values.scheduleDate);
        fd.set("plannedHours", String(values.plannedHours));
        await createSchedule(fd);
      }
      setDialogOpen(false);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!editingEvent) return;
    await deleteSchedule(editingEvent.id);
    setDialogOpen(false);
    router.refresh();
  };

  const renderEventContent = useCallback((arg: EventContentArg) => {
    const plannedHours = Number(arg.event.extendedProps.plannedHours ?? 0);
    const kind = arg.event.extendedProps.kind as CalendarEvent["kind"];

    return (
      <div className={kind === "completed" ? styles.eventDone : styles.eventCard}>
        <div className={styles.eventTitleRow}>
          <span className={styles.eventTitleText}>{arg.event.title}</span>
          <span className={styles.eventHoursBadge}>{plannedHours}ч</span>
        </div>
      </div>
    );
  }, []);

  const fcEvents: EventInput[] = events.map((e, i) => ({
    id: e.id,
    title: e.title,
    start: e.start,
    allDay: true,
    editable: e.kind !== "completed",
    backgroundColor: e.backgroundColor ?? EVENT_COLORS[i % EVENT_COLORS.length],
    borderColor: e.backgroundColor ?? EVENT_COLORS[i % EVENT_COLORS.length],
    extendedProps: { taskId: e.taskId, plannedHours: e.plannedHours, kind: e.kind },
  }));

  return (
    <div className={styles.wrapper}>
      <div className={styles.calendarCard}>
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          initialDate={initialDate}
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          events={fcEvents}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          eventDrop={handleEventDrop}
          eventContent={renderEventContent}
          editable
          height="auto"
          dayMaxEvents={4}
          slotMinTime="06:00:00"
          slotMaxTime="22:00:00"
          allDaySlot
          eventDisplay="block"
          firstDay={1}
          locale="ru"
        />
      </div>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogOverlay />
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingEvent ? "Изменить" : "Добавить"} расписание — {selectedDate}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogBody>
              <input type="hidden" value={selectedDate} {...form.register("scheduleDate")} />
              <div className={styles.fieldBlock}>
                <div className={styles.fieldHeader}>
                  <label className={styles.fieldLabel}>Задача</label>
                  <span className={styles.fieldMeta}>{filteredTasks.length} найдено</span>
                </div>
                <Input
                  value={taskQuery}
                  onChange={(event) => setTaskQuery(event.target.value)}
                  placeholder="Поиск по названию или ID"
                  icon={<Search className={styles.searchIcon} />}
                />
                <div className={styles.filterRow}>
                  <button
                    type="button"
                    className={taskFilter === "all" ? styles.filterChipActive : styles.filterChip}
                    onClick={() => setTaskFilter("all")}
                  >
                    <ListFilter className={styles.filterIcon} />
                    Все
                  </button>
                  <button
                    type="button"
                    className={taskFilter === "withId" ? styles.filterChipActive : styles.filterChip}
                    onClick={() => setTaskFilter("withId")}
                  >
                    <Hash className={styles.filterIcon} />
                    С ID
                  </button>
                  <button
                    type="button"
                    className={taskFilter === "withoutId" ? styles.filterChipActive : styles.filterChip}
                    onClick={() => setTaskFilter("withoutId")}
                  >
                    Без ID
                  </button>
                </div>
                <div className={styles.taskListBox}>
                  {filteredTasks.length > 0 ? filteredTasks.map((task) => {
                    const isSelected = task.id === selectedTaskId;
                    return (
                      <button
                        key={task.id}
                        type="button"
                        className={isSelected ? styles.taskOptionSelected : styles.taskOption}
                        onClick={() => form.setValue("taskId", task.id, { shouldValidate: true })}
                      >
                        <div className={styles.taskOptionMain}>
                          <span className={styles.taskOptionTitle}>{task.title}</span>
                          <span className={styles.taskOptionId}>{task.externalId ?? "Без ID"}</span>
                        </div>
                      </button>
                    );
                  }) : (
                    <div className={styles.emptyTasks}>Ничего не найдено. Попробуй другой запрос или фильтр.</div>
                  )}
                </div>
                {form.formState.errors.taskId?.message ? (
                  <p className={styles.fieldError}>{form.formState.errors.taskId.message}</p>
                ) : null}
              </div>
              <Input
                label="План (часы)"
                type="number"
                step="0.5"
                icon={<Clock3 className={styles.searchIcon} />}
                {...form.register("plannedHours", { valueAsNumber: true })}
                error={form.formState.errors.plannedHours?.message}
              />
            </DialogBody>
            <DialogFooter>
              {editingEvent && (
                <Button type="button" variant="destructive" onClick={handleDelete}>
                  Удалить
                </Button>
              )}
              <div className={styles.spacer} />
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Отмена
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Сохранение..." : "Сохранить"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
