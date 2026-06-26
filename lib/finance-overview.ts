import { db } from "@/lib/db";
import { getCompletedTasksInRange } from "@/lib/task-metrics";
import {
  FIXED_EXPENSES,
  MONTHLY_EXPENSE_CATEGORIES,
  calculateAdditionalIncomeNeeded,
  calculateAfterNdfl,
  calculateFixedExpenseAmount,
  calculateMonthsToReach,
  getCurrentPeriod,
} from "@/lib/money";
import { endOfMonth, format, startOfMonth, startOfWeek } from "date-fns";

export async function getFinanceOverview(now = new Date()) {
  const monthStart = format(startOfMonth(now), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(now), "yyyy-MM-dd");
  const weekStart = format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const weekEnd = format(
    (() => {
      const end = startOfWeek(now, { weekStartsOn: 1 });
      end.setDate(end.getDate() + 6);
      return end;
    })(),
    "yyyy-MM-dd",
  );
  const period = getCurrentPeriod(now);

  const [settings, tasks, expenses, wishlistItems] = await Promise.all([
    db.settings.findUnique({ where: { id: "default" } }),
    db.task.findMany({
      select: {
        id: true,
        title: true,
        externalId: true,
        status: true,
        plannedDate: true,
        completedAt: true,
        actualHours: true,
      },
    }),
    db.monthlyExpense.findMany({
      where: {
        month: period.month,
        year: period.year,
      },
      orderBy: { name: "asc" },
    }),
    db.wishlistItem.findMany({
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const hourlyRate = settings?.hourlyRate ?? 1000;
  const netHourlyRate = calculateAfterNdfl(hourlyRate);
  const monthlyGoal = settings?.monthlyPlanHours ?? 80;
  const weeklyGoal = settings?.weeklyPlanHours ?? 20;
  const monthlyIncomeGoal = settings?.monthlyIncomeGoal ?? 0;
  const forecastMode: "CURRENT_MONTH_PACE" = "CURRENT_MONTH_PACE";

  const monthTasks = getCompletedTasksInRange(tasks, monthStart, monthEnd);
  const weekTasks = getCompletedTasksInRange(tasks, weekStart, weekEnd);
  const workedHoursMonth = monthTasks.reduce((sum, task) => sum + task.actualHours, 0);
  const workedHoursWeek = weekTasks.reduce((sum, task) => sum + task.actualHours, 0);
  const monthlyIncome = workedHoursMonth * netHourlyRate;
  const remainingToMonthly = Math.max(0, monthlyGoal - workedHoursMonth);

  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysElapsed = now.getDate();
  const projectedIncome = daysElapsed > 0
    ? (workedHoursMonth / daysElapsed) * daysInMonth * netHourlyRate
    : 0;
  const incomeGoalProgressPercent = monthlyIncomeGoal > 0
    ? Math.min((monthlyIncome / monthlyIncomeGoal) * 100, 100)
    : 0;

  const manualExpenseMap = new Map(expenses.map((expense) => [expense.name, expense.amount]));
  const manualExpenses = MONTHLY_EXPENSE_CATEGORIES.map((name) => ({
    name,
    amount: manualExpenseMap.get(name) ?? 0,
    isFixed: false,
  }));
  const fixedExpenses = FIXED_EXPENSES.map((expense) => ({
    name: expense.name,
    amount: calculateFixedExpenseAmount(monthlyIncome, expense.percent),
    isFixed: true,
    percent: expense.percent,
  }));
  const expenseRows = [...manualExpenses, ...fixedExpenses];
  const totalManualExpenses = manualExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const totalFixedExpenses = fixedExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const totalExpenses = totalManualExpenses + totalFixedExpenses;
  const freeCash = monthlyIncome - totalExpenses;

  const wishlist = wishlistItems.map((item) => ({
    ...item,
    additionalIncomeNeeded: calculateAdditionalIncomeNeeded(item.amount, freeCash),
    monthsToReach: calculateMonthsToReach(item.amount, freeCash),
  }));

  return {
    period,
    hourlyRate,
    netHourlyRate,
    monthlyGoal,
    weeklyGoal,
    monthlyIncomeGoal,
    forecastMode,
    monthTasks,
    weekTasks,
    workedHoursMonth,
    workedHoursWeek,
    monthlyIncome,
    incomeGoalProgressPercent,
    remainingToMonthly,
    projectedIncome,
    expenseRows,
    totalManualExpenses,
    totalFixedExpenses,
    totalExpenses,
    freeCash,
    wishlist,
  };
}
