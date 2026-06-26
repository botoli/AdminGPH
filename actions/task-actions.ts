"use server";

import { db } from "@/lib/db";
import { createTaskSchema, updateTaskSchema } from "@/lib/validators";
import { revalidatePath } from "next/cache";

export async function createTask(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const parsed = createTaskSchema.parse(raw);
  const task = await db.task.create({
    data: {
      externalId: parsed.externalId || null,
      title: parsed.title,
      description: parsed.description || "",
      plannedHours: parsed.plannedHours,
      actualHours: parsed.actualHours,
      status: parsed.status,
      plannedDate: parsed.plannedDate || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  });
  revalidatePath("/tasks");
  revalidatePath("/");
  return task;
}

export async function updateTask(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const parsed = updateTaskSchema.parse(raw);
  const task = await db.task.update({
    where: { id: parsed.id },
    data: {
      externalId: parsed.externalId || null,
      title: parsed.title,
      description: parsed.description || "",
      plannedHours: parsed.plannedHours,
      actualHours: parsed.actualHours,
      status: parsed.status,
      plannedDate: parsed.plannedDate || null,
      completedAt: parsed.completedAt ?? (parsed.status === "COMPLETED" ? new Date().toISOString() : undefined),
      updatedAt: new Date().toISOString(),
    },
  });
  revalidatePath("/tasks");
  revalidatePath("/");
  return task;
}

export async function deleteTask(id: string) {
  await db.task.delete({ where: { id } });
  revalidatePath("/tasks");
  revalidatePath("/");
}

export async function getTask(id: string) {
  return db.task.findUnique({ where: { id } });
}

export async function getTasks(filters?: {
  status?: string;
  search?: string;
}) {
  const where: Record<string, unknown> = {};
  if (filters?.status && filters.status !== "ALL") {
    where.status = filters.status;
  }
  if (filters?.search) {
    where.OR = [
      { title: { contains: filters.search } },
      { externalId: { contains: filters.search } },
    ];
  }
  return db.task.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
}

export async function getTasksWithActualHours(filters?: {
  status?: string;
  search?: string;
}) {
  const tasks = await getTasks(filters);
  return tasks.map((task) => ({
    ...task,
    plannedHours: task.plannedHours ?? 0,
    actualHours: task.actualHours ?? 0,
  }));
}
