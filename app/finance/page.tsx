import { AppShell } from "@/components/layout/app-shell";
import { FinanceCards } from "@/components/finance/finance-cards";
import type { FinanceData } from "@/components/finance/finance-cards";
import { getFinanceOverview } from "@/lib/finance-overview";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export default async function FinancePage() {
  const overview = await getFinanceOverview();

  const data: FinanceData = {
    hourlyRate: overview.hourlyRate,
    netHourlyRate: overview.netHourlyRate,
    monthlyIncome: overview.monthlyIncome,
    workedHoursMonth: overview.workedHoursMonth,
    weeklyGoal: overview.weeklyGoal,
    monthlyGoal: overview.monthlyGoal,
    monthlyIncomeGoal: overview.monthlyIncomeGoal,
    forecastMode: overview.forecastMode,
    incomeGoalProgressPercent: overview.incomeGoalProgressPercent,
    workedHoursWeek: overview.workedHoursWeek,
    remainingToMonthly: overview.remainingToMonthly,
    projectedIncome: overview.projectedIncome,
    completedTasksMonth: overview.monthTasks.length,
    completedTasksWeek: overview.weekTasks.length,
    totalExpenses: overview.totalExpenses,
    freeCash: overview.freeCash,
  };

  return (
    <AppShell>
      <div className={styles.page}>
        <div>
          <h1 className={styles.title}>Настройки</h1>
          <p className={styles.subtitle}>Ставка до НДФЛ, цели по часам и текущий финансовый расчет</p>
        </div>
        <FinanceCards data={data} />
      </div>
    </AppShell>
  );
}
