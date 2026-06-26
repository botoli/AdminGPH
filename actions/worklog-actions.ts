"use server";

import { db } from "@/lib/db";
import { createWorklogSchema, updateWorklogSchema } from "@/lib/validators";
import { revalidatePath } from "next/cache";

export async function createWorklog(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const parsed = createWorklogSchema.parse(raw);
  const worklog = await db.worklog.create({
    data: {
      ...parsed,
      comment: parsed.comment || "",
      createdAt: new Date().toISOString(),
    },
  });
  revalidatePath("/worklog");
  revalidatePath("/");
  return worklog;
}

export async function updateWorklog(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const parsed = updateWorklogSchema.parse(raw);
  const worklog = await db.worklog.update({
    where: { id: parsed.id },
    data: {
      ...parsed,
      comment: parsed.comment || "",
    },
  });
  revalidatePath("/worklog");
  revalidatePath("/");
  return worklog;
}

export async function deleteWorklog(id: string) {
  await db.worklog.delete({ where: { id } });
  revalidatePath("/worklog");
  revalidatePath("/");
}

export async function getWorklogs(filters?: {
  startDate?: string;
  endDate?: string;
  taskId?: string;
}) {
  const where: Record<string, unknown> = {};
  if (filters?.startDate) {
    where.workDate = { ...(where.workDate as object || {}), gte: filters.startDate };
  }
  if (filters?.endDate) {
    where.workDate = { ...(where.workDate as object || {}), lte: filters.endDate };
  }
  if (filters?.taskId) {
    where.taskId = filters.taskId;
  }
  return db.worklog.findMany({
    where,
    orderBy: { workDate: "desc" },
    include: { task: true },
  });
}
