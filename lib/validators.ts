import { z } from "zod";

const optionalUrlSchema = z.preprocess(
  (value) => {
    if (typeof value !== "string") return value;
    const normalized = value.trim();
    return normalized.length === 0 ? undefined : normalized;
  },
  z.url("Укажите корректную ссылку").optional(),
);

export const taskStatusEnum = z.enum([
  "NEW",
  "PLANNED",
  "IN_PROGRESS",
  "COMPLETED",
  "PAID",
]);

export type TaskStatus = z.infer<typeof taskStatusEnum>;

export const createTaskSchema = z.object({
  externalId: z.string().optional(),
  title: z.string().min(1, "Название обязательно"),
  description: z.string().optional(),
  plannedHours: z.coerce.number().min(0).default(0),
  actualHours: z.coerce.number().min(0).default(0),
  status: taskStatusEnum.default("NEW"),
  plannedDate: z.string().optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;

export const updateTaskSchema = createTaskSchema.extend({
  id: z.string(),
  completedAt: z.string().nullable().optional(),
});

export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

export const createWorklogSchema = z.object({
  taskId: z.string().min(1, "Выберите задачу"),
  workDate: z.string().min(1, "Укажите дату"),
  hours: z.coerce.number().min(0.25, "Минимум 0.25 ч"),
  comment: z.string().optional(),
});

export type CreateWorklogInput = z.infer<typeof createWorklogSchema>;

export const updateWorklogSchema = createWorklogSchema.extend({
  id: z.string(),
});

export type UpdateWorklogInput = z.infer<typeof updateWorklogSchema>;

export const createScheduleSchema = z.object({
  taskId: z.string().min(1),
  scheduleDate: z.string().min(1),
  plannedHours: z.coerce.number().min(0).default(0),
});

export type CreateScheduleInput = z.infer<typeof createScheduleSchema>;

export const updateSettingsSchema = z.object({
  dailyRate: z.coerce.number().min(1),
  weeklyPlanHours: z.coerce.number().min(1),
  monthlyPlanHours: z.coerce.number().min(1),
  forecastMode: z.enum(["CURRENT_MONTH_PACE"]),
});

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;

export const generateReportSchema = z.object({
  month: z.coerce.number().min(1).max(12),
  year: z.coerce.number().min(2020).max(2100),
});

export type GenerateReportInput = z.infer<typeof generateReportSchema>;

export const createExpenseSchema = z.object({
  name: z.string().trim().min(1, "Название обязательно"),
  amount: z.coerce.number().min(0, "Сумма не может быть отрицательной"),
  month: z.coerce.number().min(1).max(12),
  year: z.coerce.number().min(2020).max(2100),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;

export const updateExpenseSchema = createExpenseSchema.extend({
  id: z.string(),
});

export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;

export const createWishlistItemSchema = z.object({
  title: z.string().trim().min(1, "Название обязательно"),
  amount: z.coerce.number().min(1, "Сумма должна быть больше 0"),
  kind: z.enum(["PURCHASE", "SAVINGS"]).default("PURCHASE"),
  productUrl: optionalUrlSchema,
});

export type CreateWishlistItemInput = z.infer<typeof createWishlistItemSchema>;

export const updateWishlistItemSchema = createWishlistItemSchema.extend({
  id: z.string(),
});

export const allocateWishlistItemSchema = z.object({
  id: z.string().min(1),
  amount: z.coerce.number().min(0, "Сумма не может быть отрицательной"),
});

export type UpdateWishlistItemInput = z.infer<typeof updateWishlistItemSchema>;
