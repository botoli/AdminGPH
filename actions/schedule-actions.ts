"use server";

import { db } from "@/lib/db";
import { createScheduleSchema } from "@/lib/validators";
import { revalidatePath } from "next/cache";

export async function createSchedule(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const parsed = createScheduleSchema.parse(raw);
  const schedule = await db.taskSchedule.upsert({
    where: {
      taskId_scheduleDate: {
        taskId: parsed.taskId,
        scheduleDate: parsed.scheduleDate,
      },
    },
    update: { plannedHours: parsed.plannedHours },
    create: parsed,
  });
  revalidatePath("/calendar");
  return schedule;
}

export async function updateSchedule(
  id: string,
  data: { scheduleDate?: string; plannedHours?: number }
) {
  const schedule = await db.taskSchedule.update({
    where: { id },
    data,
  });
  revalidatePath("/calendar");
  return schedule;
}

export async function deleteSchedule(id: string) {
  await db.taskSchedule.delete({ where: { id } });
  revalidatePath("/calendar");
}

export async function getSchedules(startDate: string, endDate: string) {
  return db.taskSchedule.findMany({
    where: {
      scheduleDate: { gte: startDate, lte: endDate },
    },
    include: { task: true },
  });
}
