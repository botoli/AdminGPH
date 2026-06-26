import { AppShell } from "@/components/layout/app-shell";
import { ExpensePlanner } from "@/components/finance/expense-planner";
import { getFinanceOverview } from "@/lib/finance-overview";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export default async function ExpensesPage() {
  const overview = await getFinanceOverview();

  return (
    <AppShell>
      <div className={styles.page}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Расходы</h1>
            <p className={styles.subtitle}>Обязательные траты и копилки, которые вместе формируют общий расход месяца.</p>
          </div>
        </div>
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
