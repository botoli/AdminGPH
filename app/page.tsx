import { AppShell } from "@/components/layout/app-shell";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import type { KpiData } from "@/components/dashboard/kpi-cards";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { db } from "@/lib/db";
import { getFinanceOverview } from "@/lib/finance-overview";
import { formatCurrency, formatHours, formatPercent } from "@/lib/utils";
import styles from "./page.module.css";
import Link from "next/link";
import {
  Plus,
  Calendar,
  BarChart3,
  WalletCards,
  Heart,
  ArrowRight,
  Bell,
  SlidersHorizontal,
  CircleDot,
  Target,
  ChevronDown,
} from "lucide-react";
import { subDays, format, eachDayOfInterval } from "date-fns";
import { ru } from "date-fns/locale";

export const dynamic = "force-dynamic";

function CollapsibleCard({
  title,
  action,
  defaultOpen = true,
  children,
  footer,
  className,
}: {
  title: string;
  action?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <Card
      className={[styles.collapsibleCard, className].filter(Boolean).join(" ")}
    >
      <details className={styles.collapsible} open={defaultOpen}>
        <summary className={styles.collapsibleSummary}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>{title}</h2>
            <div className={styles.collapsibleSummaryMeta}>
              {action}
              <span className={styles.collapseIconWrap} aria-hidden="true">
                <ChevronDown className={styles.collapseIcon} />
              </span>
            </div>
          </div>
        </summary>
        <div className={styles.collapsibleBody}>{children}</div>
        {footer ? (
          <div className={styles.collapsibleFooter}>{footer}</div>
        ) : null}
      </details>
    </Card>
  );
}

export default async function DashboardPage() {
  const now = new Date();
  const today = format(now, "yyyy-MM-dd");
  const [overview, schedules] = await Promise.all([
    getFinanceOverview(now),
    db.taskSchedule.findMany({
      where: {
        scheduleDate: {
          gte: format(
            new Date(now.getFullYear(), now.getMonth(), 1),
            "yyyy-MM-dd",
          ),
          lte: format(
            new Date(now.getFullYear(), now.getMonth() + 1, 0),
            "yyyy-MM-dd",
          ),
        },
      },
      include: { task: true },
    }),
  ]);

  const completedTasksCount = overview.monthTasks.length;
  const workedDaysSet = new Set(overview.monthTasks.map((task) => task.date));
  const workedDaysCount = workedDaysSet.size;
  const goalCompletionPercent =
    overview.monthlyGoal > 0
      ? (overview.workedHoursMonth / overview.monthlyGoal) * 100
      : 0;

  const kpiData: KpiData = {
    monthlyIncome: overview.monthlyIncome,
    workedHoursMonth: overview.workedHoursMonth,
    monthlyGoalHours: overview.monthlyGoal,
    weeklyGoalHours: overview.weeklyGoal,
    goalCompletionPercent,
    remainingGoalHours: Math.max(
      0,
      overview.monthlyGoal - overview.workedHoursMonth,
    ),
    completedTasksCount,
    workedDaysCount,
  };

  const taskHoursMap = new Map<string, number>();
  for (const task of overview.monthTasks) {
    const title = task.title ?? "Без названия";
    taskHoursMap.set(title, (taskHoursMap.get(title) ?? 0) + task.actualHours);
  }

  const quickActions = [
    { label: "Добавить задачу", href: "/tasks", icon: Plus },
    { label: "Расходы", href: "/expenses", icon: WalletCards },
    { label: "Хотелки", href: "/wishlist", icon: Heart },
    { label: "Календарь", href: "/calendar", icon: Calendar },
    { label: "Отчёт", href: "/reports", icon: BarChart3 },
  ];

  const topWishlist = overview.wishlist.slice(0, 3);
  const todayTasks = overview.monthTasks.filter((task) => task.date === today);
  const upcomingSchedule = schedules
    .filter((item) => item.scheduleDate >= today)
    .sort((a, b) => a.scheduleDate.localeCompare(b.scheduleDate))
    .slice(0, 4);
  const topExpenses = overview.expenseRows
    .filter((item) => item.amount > 0)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3);
  const projectedGoalPercent =
    overview.monthlyGoal > 0
      ? (overview.projectedIncome /
          (overview.monthlyGoal * overview.netHourlyRate)) *
        100
      : 0;
  const monthLabel = format(now, "LLLL yyyy", { locale: ru });
  const weekdayLabel = format(now, "EEEE", { locale: ru });
  const monthTitle = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);
  const weekdayTitle =
    weekdayLabel.charAt(0).toUpperCase() + weekdayLabel.slice(1);

  return (
    <AppShell>
      <div className={styles.page}>
        <div className={styles.headerRow}>
          <div className={styles.headerLeft}>
            <p className={styles.subtitle}>
              Обзор за {monthTitle}. Сегодня {weekdayTitle},{" "}
              {format(now, "d MMMM", { locale: ru })}.
            </p>
          </div>

          <div className={styles.actions}>
            <Link href="/tasks">
              <Button size="md" type="button">
                <Plus className={styles.iconSm} />
                Добавить задачу
              </Button>
            </Link>
            <Link
              href="/calendar"
              className={styles.iconAction}
              aria-label="Календарь"
            >
              <Calendar className={styles.iconOnly} />
            </Link>
            <button
              className={styles.iconAction}
              type="button"
              aria-label="Уведомления"
            >
              <Bell className={styles.iconOnly} />
            </button>
            <Link
              href="/finance"
              className={styles.iconAction}
              aria-label="Настройки"
            >
              <SlidersHorizontal className={styles.iconOnly} />
            </Link>
          </div>
        </div>

        <KpiCards data={kpiData} />

        <div className={styles.compactGrid}>
          <Card className={styles.moneyHero}>
            <Card.Content className={styles.moneyHeroContent}>
              <div className={styles.moneyTopline}>
                <div>
                  <p className={styles.moneyEyebrow}>Финансовый обзор</p>
                  <h2 className={styles.moneyTitle}>
                    Доход после НДФЛ, обязательные траты и свободный остаток в одном месте
                  </h2>
                </div>
                <Link href="/finance" className={styles.inlineLink}>
                  Подробнее о финансах
                  <ArrowRight className={styles.linkIcon} />
                </Link>
              </div>

              <div className={styles.moneyStats}>
                <div className={styles.moneyStat}>
                  <span className={styles.moneyLabel}>Доход после НДФЛ</span>
                  <strong className={styles.moneyValue}>
                    {formatCurrency(overview.monthlyIncome)}
                  </strong>
                </div>
                <div className={styles.moneyStat}>
                  <span className={styles.moneyLabel}>Расходы</span>
                  <strong className={styles.moneyValue}>
                    {formatCurrency(overview.totalExpenses)}
                  </strong>
                </div>
                <div className={styles.moneyStat}>
                  <span className={styles.moneyLabel}>Свободно</span>
                  <strong className={styles.moneyValue}>
                    {formatCurrency(overview.freeCash)}
                  </strong>
                </div>
              </div>

              <div className={styles.moneySplit}>
                <span>
                  Ручные траты: {formatCurrency(overview.totalManualExpenses)}
                </span>
                <span>
                  Копилки: {formatCurrency(overview.totalFixedExpenses)}
                </span>
                <span>
                  Прогноз выполнения цели: {formatPercent(projectedGoalPercent)}
                </span>
              </div>

              <div className={styles.moneyDetailsGrid}>
                <div className={styles.moneyPanel}>
                  <div className={styles.moneyPanelHeader}>
                    <h3 className={styles.moneyPanelTitle}>Хотелки</h3>
                    <Link href="/wishlist" className={styles.inlineLink}>
                      Открыть
                      <ArrowRight className={styles.linkIcon} />
                    </Link>
                  </div>
                  <div className={styles.moneyPanelList}>
                    {topWishlist.length === 0 ? (
                      <p className={styles.emptyText}>
                        Добавь первую хотелку, и здесь появится прогноз по
                        срокам.
                      </p>
                    ) : (
                      topWishlist.map((item) => (
                        <div key={item.id} className={styles.wishlistItem}>
                          <div>
                            <p className={styles.wishlistTitle}>{item.title}</p>
                            <p className={styles.wishlistSub}>
                              {formatCurrency(item.amount)}
                            </p>
                          </div>
                          <div className={styles.wishlistMeta}>
                            <span>
                              {item.monthsToReach === null
                                ? "Нет запаса"
                                : `${item.monthsToReach} мес.`}
                            </span>
                            <span>
                              +{formatCurrency(item.additionalIncomeNeeded)}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className={styles.moneyPanel}>
                  <div className={styles.moneyPanelHeader}>
                    <h3 className={styles.moneyPanelTitle}>Топ-траты</h3>
                    <Link href="/expenses" className={styles.inlineLink}>
                      Все расходы
                      <ArrowRight className={styles.linkIcon} />
                    </Link>
                  </div>
                  <div className={styles.expenseList}>
                    {topExpenses.length > 0 ? (
                      topExpenses.map((expense) => (
                        <div key={expense.name} className={styles.expenseRow}>
                          <span>{expense.name}</span>
                          <span>{formatCurrency(expense.amount)}</span>
                        </div>
                      ))
                    ) : (
                      <p className={styles.emptyText}>
                        Трат за месяц пока нет.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </Card.Content>
          </Card>

          <Card className={styles.actionCard}>
            <Card.Header>
              <h2 className={styles.sectionTitle}>Быстрые действия</h2>
            </Card.Header>
            <Card.Content className={styles.quickPanel}>
              {quickActions.slice(1, 4).map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.href}
                    href={action.href}
                    className={styles.quickLink}
                  >
                    <div className={styles.quickIconWrap}>
                      <Icon className={styles.quickIcon} />
                    </div>
                    <div className={styles.quickCopy}>
                      <p className={styles.quickLabel}>{action.label}</p>
                      <p className={styles.quickHint}>Открыть раздел</p>
                    </div>
                    <ArrowRight className={styles.quickArrow} />
                  </Link>
                );
              })}
            </Card.Content>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
