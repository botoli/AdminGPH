import { db } from "@/lib/db";
import { getCompletedTaskDate, getCompletedTasksInRange } from "@/lib/task-metrics";
import {
  FIXED_EXPENSES,
  MONTHLY_EXPENSE_CATEGORIES,
  calculateAdditionalIncomeNeeded,
  calculateAfterNdfl,
  calculateFixedExpenseAmount,
  calculateMonthsToReach,
  getCurrentPeriod,
} from "@/lib/money";
import { endOfMonth, format, startOfMonth, startOfWeek, subMonths } from "date-fns";

interface FinanceOverviewOptions {
  includeWishlist?: boolean;
}

export async function getFinanceOverview(now = new Date(), options: FinanceOverviewOptions = {}) {
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

  const wishlistQuery = options.includeWishlist === false
    ? Promise.resolve([])
    : db.wishlistItem.findMany({ orderBy: { createdAt: "desc" } });

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
        createdAt: true,
        updatedAt: true,
      },
    }),
    db.monthlyExpense.findMany({
      where: {
        month: period.month,
        year: period.year,
      },
      orderBy: { name: "asc" },
    }),
    wishlistQuery,
  ]);

  const dailyRate = settings?.dailyRate ?? (settings?.hourlyRate ?? 1000) * 8;
  const hourlyRate = dailyRate / 8;
  const netHourlyRate = calculateAfterNdfl(hourlyRate);
  const monthlyGoal = settings?.monthlyPlanHours ?? 80;
  const weeklyGoal = settings?.weeklyPlanHours ?? 20;
  const monthlyIncomeGoal = settings?.monthlyIncomeGoal ?? 0;
  const forecastMode = "CURRENT_MONTH_PACE" as const;

  const monthTasks = getCompletedTasksInRange(tasks, monthStart, monthEnd);
  const weekTasks = getCompletedTasksInRange(tasks, weekStart, weekEnd);
  const workedHoursMonth = monthTasks.reduce((sum, task) => sum + task.actualHours, 0);
  const workedHoursWeek = weekTasks.reduce((sum, task) => sum + task.actualHours, 0);
  const completedTasksCount = tasks.filter((task) => {
    const completedDate = getCompletedTaskDate(task);
    return task.status === "COMPLETED" && completedDate && completedDate >= monthStart && completedDate <= monthEnd;
  }).length;
  const paidTasksCount = tasks.filter((task) => {
    const completedDate = getCompletedTaskDate(task);
    return task.status === "PAID" && completedDate && completedDate >= monthStart && completedDate <= monthEnd;
  }).length;
  const activeStatuses = new Set(["IN_PROGRESS", "PLANNED", "NEW"]);
  const statusPriority: Record<string, number> = { IN_PROGRESS: 0, PLANNED: 1, NEW: 2 };
  const activeTasks = tasks
    .filter((task) => activeStatuses.has(task.status))
    .sort((left, right) => {
      const statusDifference = (statusPriority[left.status] ?? 9) - (statusPriority[right.status] ?? 9);
      if (statusDifference !== 0) return statusDifference;
      return (left.plannedDate ?? "9999-12-31").localeCompare(right.plannedDate ?? "9999-12-31");
    });
  const recentCompletedTasks = tasks
    .filter((task) => task.status === "COMPLETED" || task.status === "PAID")
    .sort((left, right) => {
      const leftDate = getCompletedTaskDate(left) ?? left.updatedAt ?? left.createdAt;
      const rightDate = getCompletedTaskDate(right) ?? right.updatedAt ?? right.createdAt;
      return rightDate.localeCompare(leftDate);
    });
  const dashboardTasks = (activeTasks.length > 0 ? activeTasks : recentCompletedTasks)
    .slice(0, 5)
    .map((task) => ({
      id: task.id,
      title: task.title,
      externalId: task.externalId,
      status: task.status,
      plannedDate: task.plannedDate,
      completedAt: task.completedAt,
      actualHours: task.actualHours ?? 0,
    }));
  const hoursTrend = Array.from({ length: 6 }, (_, index) => {
    const trendDate = subMonths(startOfMonth(now), 5 - index);
    const trendStart = format(startOfMonth(trendDate), "yyyy-MM-dd");
    const trendEnd = format(endOfMonth(trendDate), "yyyy-MM-dd");
    const hours = getCompletedTasksInRange(tasks, trendStart, trendEnd)
      .reduce((sum, task) => sum + task.actualHours, 0);
    return { month: format(trendDate, "yyyy-MM"), hours };
  });
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

  const wishlist = wishlistItems.map((item) => {
    const isCurrentAllocation = item.allocationMonth === period.month && item.allocationYear === period.year;
    const allocationAmount = isCurrentAllocation ? item.allocationAmount : 0;
    const remainingAmount = Math.max(0, item.amount - item.savedAmount);
    return {
      ...item,
      allocationAmount,
      remainingAmount,
      additionalIncomeNeeded: calculateAdditionalIncomeNeeded(remainingAmount, freeCash),
      monthsToReach: calculateMonthsToReach(remainingAmount, freeCash),
    };
  });
  const selectedWishlist = wishlist.filter((item) => !item.completed && item.allocationAmount > 0);
  const selectedWishlistTotal = selectedWishlist.reduce((sum, item) => sum + item.allocationAmount, 0);
  const afterWishlist = freeCash - selectedWishlistTotal;

  return {
    period,
    dailyRate,
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
    completedTasksCount,
    paidTasksCount,
    dashboardTasks,
    hoursTrend,
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
    selectedWishlist,
    selectedWishlistTotal,
    afterWishlist,
  };
}
