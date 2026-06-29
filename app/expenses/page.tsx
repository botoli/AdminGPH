import { AppShell } from "@/components/layout/app-shell";
import { ExpensePlanner } from "@/components/finance/expense-planner";
import { getFinanceOverview } from "@/lib/finance-overview";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export default async function ExpensesPage() {
  const overview = await getFinanceOverview();

  return (
    <AppShell variant="dashboard">
      <div className={styles.page}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Финансовый план</p>
            <h1 className={styles.title}>Расходы</h1>
            <p className={styles.subtitle}>Обязательные траты и копилки, которые вместе формируют общий расход месяца.</p>
          </div>
        </header>
        <ExpensePlanner
          month={overview.period.month}
          year={overview.period.year}
          income={overview.monthlyIncome}
          rows={overview.expenseRows}
        />
      </div>
    </AppShell>
  );
}
