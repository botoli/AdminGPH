import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { Database } from "bun:sqlite";
import { PrismaClient } from "@prisma/client";

type TaskRow = {
  id: string;
  externalId: string | null;
  title: string;
  description: string;
  plannedHours: number;
  actualHours?: number;
  status: string;
  plannedDate: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type WorklogRow = {
  id: string;
  taskId: string;
  workDate: string;
  hours: number;
  comment: string;
  createdAt: string;
};

type TaskScheduleRow = {
  id: string;
  taskId: string;
  scheduleDate: string;
  plannedHours: number;
};

type SettingsRow = {
  id: string;
  hourlyRate: number;
  weeklyPlanHours: number;
  monthlyPlanHours: number;
  monthlyIncomeGoal?: number;
  forecastMode?: string;
};

type MonthlyExpenseRow = {
  id: string;
  name: string;
  amount: number;
  month: number;
  year: number;
  isFixed: number | boolean;
  createdAt: string;
  updatedAt: string;
};

type WishlistItemRow = {
  id: string;
  title: string;
  amount: number;
  createdAt: string;
  updatedAt: string;
};

type MonthlyReportRow = {
  id: string;
  month: number;
  year: number;
  totalHours: number;
  totalAmount: number;
  generatedAt: string;
};

const sqlitePath = resolve(process.env.SQLITE_DATABASE_PATH ?? "prisma/dev.db");

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must point to the target Postgres database.");
}

if (!process.env.DATABASE_URL.startsWith("postgresql://") && !process.env.DATABASE_URL.startsWith("postgres://")) {
  throw new Error("DATABASE_URL must be a Postgres connection string.");
}

if (!existsSync(sqlitePath)) {
  throw new Error(`SQLite database not found: ${sqlitePath}`);
}

const sqlite = new Database(sqlitePath, { readonly: true });
const prisma = new PrismaClient();

function all<T>(table: string): T[] {
  const exists = sqlite
    .query<{ name: string }, [string]>("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?")
    .get(table);

  if (!exists) {
    return [];
  }

  return sqlite.query(`SELECT * FROM "${table}"`).all() as T[];
}

async function main() {
  const tasks = all<TaskRow>("Task");
  const worklogs = all<WorklogRow>("Worklog");
  const taskSchedules = all<TaskScheduleRow>("TaskSchedule");
  const settings = all<SettingsRow>("Settings");
  const monthlyExpenses = all<MonthlyExpenseRow>("MonthlyExpense");
  const wishlistItems = all<WishlistItemRow>("WishlistItem");
  const monthlyReports = all<MonthlyReportRow>("MonthlyReport");

  await prisma.$transaction(async (tx) => {
    if (tasks.length > 0) {
      await tx.task.createMany({
        data: tasks.map((task) => ({
          id: task.id,
          externalId: task.externalId,
          title: task.title,
          description: task.description,
          plannedHours: task.plannedHours,
          actualHours: task.actualHours ?? 0,
          status: task.status,
          plannedDate: task.plannedDate,
          completedAt: task.completedAt,
          createdAt: task.createdAt,
          updatedAt: task.updatedAt,
        })),
        skipDuplicates: true,
      });
    }

    if (worklogs.length > 0) {
      await tx.worklog.createMany({
        data: worklogs,
        skipDuplicates: true,
      });
    }

    if (taskSchedules.length > 0) {
      await tx.taskSchedule.createMany({
        data: taskSchedules,
        skipDuplicates: true,
      });
    }

    if (settings.length > 0) {
      await tx.settings.createMany({
        data: settings.map((setting) => ({
          ...setting,
          monthlyIncomeGoal: setting.monthlyIncomeGoal ?? 0,
          forecastMode: setting.forecastMode ?? "CURRENT_MONTH_PACE",
        })),
        skipDuplicates: true,
      });
    }

    if (monthlyExpenses.length > 0) {
      await tx.monthlyExpense.createMany({
        data: monthlyExpenses.map((expense) => ({
          ...expense,
          isFixed: Boolean(expense.isFixed),
        })),
        skipDuplicates: true,
      });
    }

    if (wishlistItems.length > 0) {
      await tx.wishlistItem.createMany({
        data: wishlistItems,
        skipDuplicates: true,
      });
    }

    if (monthlyReports.length > 0) {
      await tx.monthlyReport.createMany({
        data: monthlyReports,
        skipDuplicates: true,
      });
    }
  });

  console.log("SQLite to Postgres migration completed:");
  console.table({
    Task: tasks.length,
    Worklog: worklogs.length,
    TaskSchedule: taskSchedules.length,
    Settings: settings.length,
    MonthlyExpense: monthlyExpenses.length,
    WishlistItem: wishlistItems.length,
    MonthlyReport: monthlyReports.length,
  });
}

main()
  .finally(async () => {
    sqlite.close();
    await prisma.$disconnect();
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
