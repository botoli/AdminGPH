"use client";

import { Card } from "@/components/ui/card";
import { formatCurrency, formatHours, formatPercent } from "@/lib/utils";
import styles from "./kpi-cards.module.css";
import {
  Banknote,
  CalendarCheck,
  TrendingUp,
  CheckCircle2,
  CalendarDays,
  TimerReset,
} from "lucide-react";

export interface KpiData {
  monthlyIncome: number;
  workedHoursMonth: number;
  monthlyGoalHours: number;
  weeklyGoalHours: number;
  goalCompletionPercent: number;
  remainingGoalHours: number;
  completedTasksCount: number;
  workedDaysCount: number;
}

interface KpiCardsProps {
  data: KpiData;
  className?: string;
}

const cardDefs: Array<{
  key: keyof KpiData;
  label: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  format: (val: number) => string;
  subLabel: string;
  color: "default" | "blue" | "emerald" | "amber" | "purple" | "rose" | "slate";
}> = [
  {
    key: "monthlyIncome",
    label: "Доход за месяц",
    icon: Banknote,
    format: (v) => formatCurrency(v),
    subLabel: "после НДФЛ 13%",
    color: "emerald",
  },
  {
    key: "weeklyGoalHours",
    label: "Цель на неделю",
    icon: CalendarCheck,
    format: (v) => formatHours(v),
    subLabel: "плановые часы",
    color: "amber",
  },
  {
    key: "goalCompletionPercent",
    label: "Выполнение цели",
    icon: TrendingUp,
    format: (v) => formatPercent(v),
    subLabel: "прогресс за месяц",
    color: "rose",
  },
  {
    key: "remainingGoalHours",
    label: "Осталось до цели",
    icon: TimerReset,
    format: (v) => formatHours(v),
    subLabel: "до месячного плана",
    color: "purple",
  },
  {
    key: "completedTasksCount",
    label: "Завершено задач",
    icon: CheckCircle2,
    format: (v) => `${v}`,
    subLabel: "в этом месяце",
    color: "slate",
  },
  {
    key: "workedDaysCount",
    label: "Рабочих дней",
    icon: CalendarDays,
    format: (v) => `${v}`,
    subLabel: "в этом месяце",
    color: "default",
  },
];

const iconColorMap: Record<string, string> = {
  emerald: styles.iconEmerald,
  blue: styles.iconBlue,
  purple: styles.iconPurple,
  amber: styles.iconAmber,
  rose: styles.iconRose,
  slate: styles.iconZinc,
  default: styles.iconZinc,
};

const valueColorMap: Record<string, string> = {
  emerald: styles.valueEmerald,
  blue: styles.valueBlue,
  purple: styles.valuePurple,
  amber: styles.valueAmber,
  rose: styles.valueRose,
  slate: styles.valueZinc,
  default: styles.valueZinc,
};

export function KpiCards({ data, className }: KpiCardsProps) {
  const gridCls = [styles.grid, className].filter(Boolean).join(" ");
  const monthlyPct = data.monthlyGoalHours > 0 ? Math.min((data.workedHoursMonth / data.monthlyGoalHours) * 100, 100) : 0;

  return (
    <div className={gridCls}>
      <Card hover className={styles.progressCard}>
        <Card.Content className={styles.progressCardContent}>
          <div className={styles.progressMeta}>
            <div className={styles.row}>
              <span className={styles.label}>Месячная цель</span>
              <TrendingUp className={`${styles.icon} ${styles.iconBlue}`} />
            </div>
            <div className={styles.progressNumbers}>
              <span className={styles.progressValue}>{formatHours(data.workedHoursMonth)}</span>
              <span className={styles.progressDivider}>из {formatHours(data.monthlyGoalHours)}</span>
            </div>
            <p className={styles.progressSubLabel}>
              Осталось {formatHours(data.remainingGoalHours)}. Выполнение {formatPercent(monthlyPct)}.
            </p>
          </div>

          <div
            className={styles.progressDial}
            style={{ ["--progress" as string]: `${monthlyPct}%` }}
            aria-label={`Выполнение месячной цели ${monthlyPct.toFixed(1)} процентов`}
          >
            <div className={styles.progressDialInner}>
              <span className={styles.progressDialPercent}>{Math.round(monthlyPct)}%</span>
              <span className={styles.progressDialCaption}>темп месяца</span>
            </div>
          </div>
        </Card.Content>
      </Card>

      {cardDefs.map((def) => {
        const Icon = def.icon;
        const value = data[def.key];
        const iconColor = iconColorMap[def.color] ?? iconColorMap.default;
        const valueColor = valueColorMap[def.color] ?? valueColorMap.default;

        return (
          <Card key={def.key} hover>
            <Card.Content className={styles.cardContent}>
              <div className={styles.row}>
                <span className={styles.label}>
                  {def.label}
                </span>
                <Icon className={`${styles.icon} ${iconColor}`} />
              </div>
              <div className={styles.valueGroup}>
                <span className={`${styles.value} ${valueColor}`}>
                  {def.format(value)}
                </span>
                <span className={styles.subLabel}>
                  {def.subLabel}
                </span>
              </div>
            </Card.Content>
          </Card>
        );
      })}
    </div>
  );
}
