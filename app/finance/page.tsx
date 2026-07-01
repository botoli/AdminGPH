import { AppShell } from "@/components/layout/app-shell";
import { FinanceCards } from "@/components/finance/finance-cards";
import type { FinanceData } from "@/components/finance/finance-cards";
import { getFinanceOverview } from "@/lib/finance-overview";
import { resolveSelectedMonthDate } from "@/lib/selected-month";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export default async function FinancePage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const { month } = await searchParams;
  const overview = await getFinanceOverview(resolveSelectedMonthDate(month));

  const data: FinanceData = {
    dailyRate: overview.dailyRate,
    hourlyRate: overview.hourlyRate,
    netHourlyRate: overview.netHourlyRate,
    monthlyIncome: overview.monthlyIncome,
    workedHoursMonth: overview.workedHoursMonth,
    weeklyGoal: overview.weeklyGoal,
    monthlyGoal: overview.monthlyGoal,
    forecastMode: overview.forecastMode,
    workedHoursWeek: overview.workedHoursWeek,
    remainingToMonthly: overview.remainingToMonthly,
    projectedIncome: overview.projectedIncome,
    completedTasksMonth: overview.monthTasks.length,
    completedTasksWeek: overview.weekTasks.length,
    totalExpenses: overview.totalExpenses,
    freeCash: overview.freeCash,
  };

  return (
    <AppShell variant="dashboard">
      <div className={styles.page}>
        <header className={styles.pageHeader}>
          <p className={styles.eyebrow}>Система</p>
          <h1 className={styles.title}>Настройки</h1>
          <p className={styles.subtitle}>Ставка за человеко-день, цели по часам и текущий финансовый расчет</p>
        </header>
        <FinanceCards data={data} />
      </div>
    </AppShell>
  );
}
