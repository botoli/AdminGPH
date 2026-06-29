import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock3, GraduationCap, Home, PiggyBank, ReceiptText, ShoppingBag, WalletCards } from "lucide-react";
import { format, isSameMonth, isValid, parse } from "date-fns";
import { ru } from "date-fns/locale";
import { AppShell } from "@/components/layout/app-shell";
import { MonthSelector } from "@/components/dashboard/month-selector";
import { DashboardWishlistPlan } from "@/components/dashboard/dashboard-wishlist-plan";
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
  const progress = overview.monthlyGoal > 0 ? Math.min(100, overview.workedHoursMonth / overview.monthlyGoal * 100) : 0;
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
    { label: "Доход на руки", value: overview.monthlyIncome, hint: "После НДФЛ 13%", icon: WalletCards, tone: styles.warm },
    { label: "Свободно после обязательных трат", value: overview.freeCash, hint: "Копилки и расходы уже учтены", icon: PiggyBank, tone: styles.green },
    { label: "После выбранных хотелок", value: overview.afterWishlist, hint: `${Math.max(0, Math.round(overview.afterWishlist / Math.max(overview.monthlyIncome, 1) * 100))}% от дохода на руки`, icon: ShoppingBag, tone: styles.warm },
  ];

  return <AppShell><main className={styles.page}>
    <header className={styles.header}>
      <div className={styles.titleRow}><h1>Панель месяца</h1><MonthSelector value={format(date, "yyyy-MM")} label={monthTitle} /></div>
      <p className={styles.flow}><span>Доход</span><ArrowRight/><span>обязательные траты</span><ArrowRight/><span>свободно</span><ArrowRight/><span>хотелки</span><ArrowRight/><span>остаток</span></p>
    </header>

    <section className={styles.moneyGrid} aria-label="Финансовые показатели">
      {cards.map((card) => { const Icon = card.icon; return <article className={`${styles.moneyCard} ${card.tone}`} key={card.label}>
        <div className={styles.moneyTop}><span className={styles.moneyIcon}><Icon/></span><span>{card.label}</span></div>
        <strong>{formatCurrency(card.value)}</strong><small>{card.hint}</small>
        <svg className={styles.spark} viewBox="0 0 220 50" preserveAspectRatio="none" aria-hidden="true"><path d="M0 48 C45 48 57 43 76 38 C98 32 105 15 129 17 C151 19 157 7 176 9 C194 10 207 2 220 1"/></svg>
      </article>; })}
    </section>

    <section className={styles.middleGrid}>
      <article className={styles.panel} aria-labelledby="progress-title">
        <div className={styles.panelHeader}><div className={styles.panelTitle}><span><Clock3/></span><h2 id="progress-title">Прогресс месяца</h2></div><b className={styles.percent}>{Math.round(progress)}%</b></div>
        <div className={styles.hours}><strong>{formatHours(overview.workedHoursMonth).replace(" ч", "")}</strong><span>/ {formatHours(overview.monthlyGoal)}</span></div>
        <div className={styles.progressTrack} role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}><div style={{ width: `${progress}%` }}/></div>
        <div className={styles.progressCaption}><span>Выполнено часов</span><span>от месячной цели</span></div>
        <div className={styles.facts}>
          <div><Clock3/><span>Осталось</span><strong>{formatHours(remainingHours)}</strong><small>до цели</small></div>
          <div><CheckCircle2/><span>Завершено задач</span><strong>{overview.monthTasks.length}</strong><small>попадут в акт</small></div>
          <div><ReceiptText/><span>Рабочих дней</span><strong>{new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 1 }).format(workedDays)}</strong><small>по 8 часов</small></div>
        </div>
      </article>

    </section>

    <DashboardWishlistPlan key={`${overview.period.year}-${overview.period.month}`} freeCash={overview.freeCash} items={overview.wishlist} monthName={monthName} editable={wishlistEditable} />

    <section className={`${styles.panel} ${styles.deductions}`} aria-labelledby="deductions-title">
      <div className={styles.panelHeader}><div className={styles.panelTitle}><span><ReceiptText/></span><h2 id="deductions-title">Обязательные удержания</h2></div></div>
      <div className={styles.deductionGrid}>
        <Deduction icon={<Home/>} label="Копилка на квартиру" note="40% от дохода на руки" value={home?.amount ?? 0}/>
        <Deduction icon={<GraduationCap/>} label="Копилка на учёбу" note="5% от дохода на руки" value={study?.amount ?? 0}/>
        <Deduction icon={<WalletCards/>} label="Прочие расходы" note="фиксированные траты" value={overview.totalManualExpenses}/>
      </div>
      <Link href="/expenses" className={styles.expenseLink}>Настроить расходы <ArrowRight/></Link>
    </section>
  </main></AppShell>;
}

function Deduction({ icon, label, note, value }: { icon: React.ReactNode; label: string; note: string; value: number }) {
  return <div className={styles.deduction}><span className={styles.deductionIcon}>{icon}</span><span>{label}<small>{note}</small></span><strong>{formatCurrency(value)}</strong></div>;
}
