"use server";

import { db } from "@/lib/db";
import { MONTHLY_EXPENSE_CATEGORIES } from "@/lib/money";
import { createExpenseSchema, updateExpenseSchema } from "@/lib/validators";
import { revalidatePath } from "next/cache";

function revalidateFinancePaths() {
  revalidatePath("/expenses");
  revalidatePath("/finance");
  revalidatePath("/");
}

export async function createExpense(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const parsed = createExpenseSchema.parse(raw);
  const now = new Date().toISOString();

  await db.monthlyExpense.create({
    data: {
      ...parsed,
      createdAt: now,
      updatedAt: now,
    },
  });

  revalidateFinancePaths();
}

export async function updateExpense(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const parsed = updateExpenseSchema.parse(raw);

  await db.monthlyExpense.update({
    where: { id: parsed.id },
    data: {
      name: parsed.name,
      amount: parsed.amount,
      month: parsed.month,
      year: parsed.year,
      updatedAt: new Date().toISOString(),
    },
  });

  revalidateFinancePaths();
}

export async function deleteExpense(id: string) {
  await db.monthlyExpense.delete({ where: { id } });
  revalidateFinancePaths();
}

export async function saveMonthlyExpenses(formData: FormData) {
  const month = Number(formData.get("month"));
  const year = Number(formData.get("year"));

  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error("Некорректный месяц");
  }

  if (!Number.isInteger(year) || year < 2020 || year > 2100) {
    throw new Error("Некорректный год");
  }

  const now = new Date().toISOString();

  await Promise.all(
    MONTHLY_EXPENSE_CATEGORIES.map((name) =>
      db.monthlyExpense.upsert({
        where: {
          name_month_year: {
            name,
            month,
            year,
          },
        },
        update: {
          amount: Number(formData.get(name)) || 0,
          updatedAt: now,
        },
        create: {
          name,
          amount: Number(formData.get(name)) || 0,
          month,
          year,
          isFixed: false,
          createdAt: now,
          updatedAt: now,
        },
      }),
    ),
  );

  revalidateFinancePaths();
}
