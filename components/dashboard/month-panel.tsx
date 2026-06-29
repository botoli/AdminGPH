import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  GraduationCap,
  Home,
  PiggyBank,
  ReceiptText,
  ShoppingBag,
  WalletCards,
} from "lucide-react";
import { format, isSameMonth, isValid, parse } from "date-fns";
import { ru } from "date-fns/locale";
import { AppShell } from "@/components/layout/app-shell";
import { DashboardWishlistPlan } from "@/components/dashboard/dashboard-wishlist-plan";
import { MonthSelector } from "@/components/dashboard/month-selector";
import { getFinanceOverview } from "@/lib/finance-overview";
import { formatCurrency, formatHours } from "@/lib/utils";
import styles from "./month-panel.module.css";

function resolvePeriod(period?: string) {
  if (!period) return new Date();
  const value = parse(period, "yyyy-MM", new Date());
  return isValid(value) ? value : new Date();
}

export async function MonthPanel({ period }: { period?: string }) {
  const date = resolvePeriod(period);
  const overview = await getFinanceOverview(date);
  const progress = overview.monthlyGoal > 0
    ? Math.min(100, (overview.workedHoursMonth / overview.monthlyGoal) * 100)
    : 0;
  const monthLabel = format(date, "LLLL yyyy", { locale: ru });
  const monthTitle = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);
  const monthName = format(date, "LLLL", { locale: ru });
  const wishlistEditable = isSameMonth(date, new Date());
  const fixed = overview.expenseRows.filter((row) => row.isFixed);
  const home = fixed.find((row) => "percent" in row && row.percent === 40);
  const study = fixed.find((row) => "percent" in row && row.percent === 5);
  const workedDays = overview.workedHoursMonth / 8;
  const remainingHours = Math.max(0, overview.monthlyGoal - overview.workedHoursMonth);
  const cards = [
    {
      label: "Доход на руки",
      value: overview.monthlyIncome,
      hint: "После НДФЛ 13%",
      icon: WalletCards,
      tone: styles.accentTone,
    },
    {
      label: "Свободно после обязательных трат",
      value: overview.freeCash,
      hint: "Копилки и расходы уже учтены",
      icon: PiggyBank,
      tone: styles.successTone,
    },
    {
      label: "После выбранных хотелок",
      value: overview.afterWishlist,
      hint: `${Math.max(0, Math.round((overview.afterWishlist / Math.max(overview.monthlyIncome, 1)) * 100))}% от дохода на руки`,
      icon: ShoppingBag,
      tone: styles.accentTone,
    },
  ];

  return (
    <AppShell variant="dashboard">
      <main className={styles.page}>
        <header className={styles.pageHeader}>
          <div>
            <p className={styles.eyebrow}>Личный финансовый пульт</p>
            <h1>Обзор месяца</h1>
            <p className={styles.subtitle}>Доход, рабочий темп и планы — в одном спокойном рабочем пространстве.</p>
          </div>
          <MonthSelector value={format(date, "yyyy-MM")} label={monthTitle} />
        </header>

        <section className={styles.moneyGrid} aria-label="Финансовые показатели">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <article className={`${styles.moneyCard} ${card.tone}`} key={card.label}>
                <div className={styles.moneyTop}>
                  <span className={styles.moneyIcon}><Icon aria-hidden="true" /></span>
                  <span>{card.label}</span>
                </div>
                <strong>{formatCurrency(card.value)}</strong>
                <small>{card.hint}</small>
              </article>
            );
          })}
        </section>

        <section className={styles.panel} aria-labelledby="progress-title">
          <div className={styles.panelHeader}>
            <div className={styles.panelTitle}>
              <span><Clock3 aria-hidden="true" /></span>
              <h2 id="progress-title">Прогресс месяца</h2>
            </div>
            <b className={styles.percent}>{Math.round(progress)}%</b>
          </div>
          <div className={styles.hours}>
            <strong>{formatHours(overview.workedHoursMonth).replace(" ч", "")}</strong>
            <span>/ {formatHours(overview.monthlyGoal)}</span>
          </div>
          <div
            className={styles.progressTrack}
            role="progressbar"
            aria-label="Прогресс месячной цели по часам"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div style={{ width: `${progress}%` }} />
          </div>
          <div className={styles.progressCaption}>
            <span>Выполнено часов</span>
            <span>от месячной цели</span>
          </div>
          <div className={styles.facts}>
            <ProgressFact icon={<Clock3 />} label="Осталось" value={formatHours(remainingHours)} note="до цели" />
            <ProgressFact icon={<CheckCircle2 />} label="Завершено задач" value={String(overview.monthTasks.length)} note="попадут в акт" />
            <ProgressFact icon={<ReceiptText />} label="Рабочих дней" value={new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 1 }).format(workedDays)} note="по 8 часов" />
          </div>
        </section>

        <DashboardWishlistPlan
          key={`${overview.period.year}-${overview.period.month}`}
          freeCash={overview.freeCash}
          items={overview.wishlist}
          monthName={monthName}
          editable={wishlistEditable}
        />

        <section className={`${styles.panel} ${styles.deductions}`} aria-labelledby="deductions-title">
          <div className={styles.panelHeader}>
            <div className={styles.panelTitle}>
              <span><ReceiptText aria-hidden="true" /></span>
              <h2 id="deductions-title">Обязательные удержания</h2>
            </div>
          </div>
          <div className={styles.deductionGrid}>
            <Deduction icon={<Home />} label="Копилка на квартиру" note="40% от дохода на руки" value={home?.amount ?? 0} />
            <Deduction icon={<GraduationCap />} label="Копилка на учёбу" note="5% от дохода на руки" value={study?.amount ?? 0} />
            <Deduction icon={<WalletCards />} label="Прочие расходы" note="фиксированные траты" value={overview.totalManualExpenses} />
          </div>
          <Link href="/expenses" prefetch={false} className={styles.expenseLink}>
            Настроить расходы <ArrowRight aria-hidden="true" />
          </Link>
        </section>
      </main>
    </AppShell>
  );
}

function ProgressFact({ icon, label, value, note }: { icon: React.ReactNode; label: string; value: string; note: string }) {
  return (
    <div className={styles.fact}>
      <span className={styles.factIcon}>{icon}</span>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </div>
  );
}

function Deduction({ icon, label, note, value }: { icon: React.ReactNode; label: string; note: string; value: number }) {
  return (
    <div className={styles.deduction}>
      <span className={styles.deductionIcon}>{icon}</span>
      <span>{label}<small>{note}</small></span>
      <strong>{formatCurrency(value)}</strong>
    </div>
  );
}
