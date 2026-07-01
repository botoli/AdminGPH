"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select } from "@/components/ui/select";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { formatCurrency, formatHours, formatPercent } from "@/lib/utils";
import styles from "./finance-cards.module.css";
import { Banknote, Clock3, Coins, TrendingUp } from "lucide-react";
import { updateSettings } from "@/actions/settings-actions";

const FORECAST_MODE_LABELS = {
  CURRENT_MONTH_PACE: "По текущему темпу месяца",
} as const;

export interface FinanceData {
  dailyRate: number; hourlyRate: number; netHourlyRate: number; monthlyIncome: number; workedHoursMonth: number;
  weeklyGoal: number; monthlyGoal: number; workedHoursWeek: number;
  remainingToMonthly: number; projectedIncome: number; forecastMode: keyof typeof FORECAST_MODE_LABELS;
  completedTasksMonth: number; completedTasksWeek: number;
  totalExpenses: number; freeCash: number;
}

interface Props { data: FinanceData; className?: string; }

const schema = z.object({
  dailyRate: z.coerce.number().min(1, "Минимум 1"),
  weeklyPlanHours: z.coerce.number().min(1, "Минимум 1"),
  monthlyPlanHours: z.coerce.number().min(1, "Минимум 1"),
  forecastMode: z.enum(["CURRENT_MONTH_PACE"]),
});
type FV = z.output<typeof schema>;
type FormInput = z.input<typeof schema>;

function NumberField({
  label,
  value,
  onChange,
  step,
  min = 0,
  suffix,
  hint,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  step: number;
  min?: number;
  suffix: string;
  hint: string;
}) {
  const setValue = (next: number) => {
    const safe = Number.isFinite(next) ? next : min;
    onChange(Math.max(min, Math.round(safe * 10) / 10));
  };

  return (
    <div className={styles.fieldCard}>
      <div className={styles.fieldTopline}>
        <span className={styles.fieldLabel}>{label}</span>
        <span className={styles.fieldHint}>{hint}</span>
      </div>
      <div className={styles.fieldControl}>
        <button type="button" className={styles.stepper} onClick={() => setValue(value - step)} aria-label={`Уменьшить ${label}`}>-</button>
        <label className={styles.inputShell}>
          <input
            className={styles.input}
            type="number"
            min={min}
            step="0.1"
            value={Number.isFinite(value) ? value : ""}
            onChange={(event) => setValue(Number(event.target.value))}
          />
          <span className={styles.inputSuffix}>{suffix}</span>
        </label>
        <button type="button" className={styles.stepper} onClick={() => setValue(value + step)} aria-label={`Увеличить ${label}`}>+</button>
      </div>
    </div>
  );
}

function ReadonlyRateField({ value }: { value: number }) {
  return (
    <div className={`${styles.fieldCard} ${styles.readonlyCard}`}>
      <div className={styles.fieldTopline}>
        <span className={styles.fieldLabel}>Почасовая ставка</span>
        <span className={styles.fieldHint}>ставка за ч.дн / 8</span>
      </div>
      <div className={styles.readonlyValue}>{formatCurrency(value)}<span>/ч</span></div>
    </div>
  );
}

function fillCls(pct: number) {
  if (pct >= 100) return styles.progressFillEmerald;
  if (pct >= 75) return styles.progressFillBlue;
  if (pct >= 50) return styles.progressFillAmber;
  return styles.progressFillZinc;
}

export function FinanceCards({ data, className }: Props) {
  const r = useRouter();
  const [sub, setSub] = useState(false);
  const [wholeHours, setWholeHours] = useState(true);
  const [syncMonthToWeek, setSyncMonthToWeek] = useState(data.monthlyGoal === data.weeklyGoal * 4);
  const form = useForm<FormInput, unknown, FV>({
    resolver: zodResolver(schema),
    defaultValues: {
      dailyRate: data.dailyRate,
      weeklyPlanHours: data.weeklyGoal,
      monthlyPlanHours: data.monthlyGoal,
      forecastMode: data.forecastMode,
    },
  });

  const weeklyValue = Number(useWatch({ control: form.control, name: "weeklyPlanHours" })) || 0;
  const monthlyValue = Number(useWatch({ control: form.control, name: "monthlyPlanHours" })) || 0;
  const dailyValue = Number(useWatch({ control: form.control, name: "dailyRate" })) || 0;

  useEffect(() => {
    if (!syncMonthToWeek) return;
    form.setValue("monthlyPlanHours", Math.max(1, weeklyValue * 4), { shouldDirty: true });
  }, [form, syncMonthToWeek, weeklyValue]);

  const onSubmit = async (v: FV) => {
    setSub(true);
    try {
      const fd = new FormData();
      fd.set("dailyRate", String(v.dailyRate));
      fd.set("weeklyPlanHours", String(v.weeklyPlanHours));
      fd.set("monthlyPlanHours", String(v.monthlyPlanHours));
      fd.set("forecastMode", v.forecastMode);
      await updateSettings(fd);
      r.refresh();
    } finally {
      setSub(false);
    }
  };

  const weekPct = data.weeklyGoal > 0 ? Math.min((data.workedHoursWeek / data.weeklyGoal) * 100, 100) : 0;
  const monthPct = data.monthlyGoal > 0 ? Math.min((data.workedHoursMonth / data.monthlyGoal) * 100, 100) : 0;
  const step = wholeHours ? 1 : 0.5;
  const freeCashDeficit = data.freeCash < 0 ? Math.abs(data.freeCash) : 0;

  return (
    <div className={[styles.wrapper, className].filter(Boolean).join(" ")}>
      <form id="settings" className={styles.settingsPanel} onSubmit={form.handleSubmit(onSubmit)}>
        <div className={styles.settingsHeader}>
          <div>
            <p className={styles.eyebrow}>Настройки расчета</p>
            <h2 className={styles.settingsTitle}>Ставка, цели и прогноз</h2>
          </div>
          <p className={styles.settingsNote}>Ставка вводится до НДФЛ, расчеты ниже после 13%.</p>
        </div>

        <div className={styles.fieldGrid}>
          <NumberField
            label="Ставка за ч.дн"
            value={dailyValue}
            onChange={(value) => form.setValue("dailyRate", Math.max(1, value), { shouldDirty: true, shouldValidate: true })}
            step={100}
            min={1}
            suffix="₽/ч.дн"
            hint="1 ч.дн = 8 часов"
          />
          <ReadonlyRateField value={dailyValue / 8} />
          <NumberField
            label="Цель на неделю"
            value={weeklyValue}
            onChange={(value) => form.setValue("weeklyPlanHours", Math.max(1, value), { shouldDirty: true, shouldValidate: true })}
            step={step}
            min={1}
            suffix="ч"
            hint="план на 7 дней"
          />
          <NumberField
            label="Цель на месяц"
            value={monthlyValue}
            onChange={(value) => form.setValue("monthlyPlanHours", Math.max(1, value), { shouldDirty: true, shouldValidate: true })}
            step={step}
            min={1}
            suffix="ч"
            hint={syncMonthToWeek ? "авто от недели" : `шаг ${step} ч`}
          />
          <div className={styles.selectCard}>
            <Select
              label="Режим прогноза"
              size="md"
              options={[{ value: "CURRENT_MONTH_PACE", label: FORECAST_MODE_LABELS.CURRENT_MONTH_PACE }]}
              {...form.register("forecastMode")}
              error={form.formState.errors.forecastMode?.message}
            />
          </div>
        </div>

        <div className={styles.controlsRow}>
          <div className={styles.switchGroup}>
            <div className={styles.switchInline}>
              <span className={styles.switchLabel}>Связать месяц с неделей</span>
              <Switch checked={syncMonthToWeek} onClick={() => setSyncMonthToWeek((prev) => !prev)} label="Связать месяц с неделей" />
            </div>
            <div className={styles.switchInline}>
              <span className={styles.switchLabel}>Целые часы</span>
              <Switch checked={wholeHours} onClick={() => setWholeHours((prev) => !prev)} label="Использовать целые часы" />
            </div>
          </div>

          <Button type="submit" disabled={sub} className={styles.saveButton}>
            {sub ? "Сохраняю..." : "Сохранить настройки"}
          </Button>
        </div>

        <div className={styles.inlineErrors}>
          {form.formState.errors.dailyRate?.message ? <p>{form.formState.errors.dailyRate.message}</p> : null}
          {form.formState.errors.weeklyPlanHours?.message ? <p>{form.formState.errors.weeklyPlanHours.message}</p> : null}
          {form.formState.errors.monthlyPlanHours?.message ? <p>{form.formState.errors.monthlyPlanHours.message}</p> : null}
        </div>
      </form>

      <Card className={styles.summaryPanel}>
        <Card.Content className={styles.summaryContent}>
          <div className={styles.summaryHeader}>
            <div>
              <p className={styles.eyebrow}>Текущий расчет</p>
              <h3 className={styles.summaryTitle}>Что получится при этих настройках</h3>
            </div>
            <div className={styles.summaryBadge}>после НДФЛ 13%</div>
          </div>

          <div className={styles.summaryGrid}>
            <div className={styles.incomeBlock}>
              <div className={styles.incomeIconWrap}>
                <TrendingUp className={styles.incomeIcon} />
              </div>
              <div>
                <p className={styles.summaryLabel}>Доход за месяц</p>
                <p className={styles.incomeValue}>{formatCurrency(data.monthlyIncome)}</p>
                <p className={styles.summarySub}>
                  Прогноз: {formatCurrency(data.projectedIncome)} · {FORECAST_MODE_LABELS[data.forecastMode]}
                </p>
              </div>
            </div>

            <div className={styles.metricList}>
              <div className={styles.metricRow}>
                <span><Banknote className={styles.metricIcon} />Ставка</span>
                <strong>{formatCurrency(data.netHourlyRate)}/ч</strong>
                <em>до НДФЛ {formatCurrency(data.hourlyRate)}/ч</em>
              </div>
              <div className={styles.metricRow}>
                <span><Coins className={styles.metricIcon} />Свободно</span>
                <strong className={freeCashDeficit > 0 ? styles.metricDanger : undefined}>{formatCurrency(data.freeCash)}</strong>
                <em>{freeCashDeficit > 0 ? `Дефицит на обязательных расходах: ${formatCurrency(freeCashDeficit)}` : `после расходов ${formatCurrency(data.totalExpenses)}`}</em>
              </div>
              <div className={styles.metricRow}>
                <span><Clock3 className={styles.metricIcon} />Часы</span>
                <strong>{formatHours(data.workedHoursMonth)}</strong>
                <em>{(data.workedHoursMonth / 8).toLocaleString("ru-RU", { maximumFractionDigits: 1 })} ч.дн · осталось {formatHours(data.remainingToMonthly)}</em>
              </div>
            </div>
          </div>

          <div className={styles.progressGrid}>
            <div className={styles.progressPanel}>
              <div className={styles.progressRow}>
                <span className={styles.progressLabel}>Неделя</span>
                <span className={styles.progressOf}>{formatHours(data.workedHoursWeek)} из {formatHours(data.weeklyGoal)}</span>
              </div>
              <div className={styles.progressBar}>
                <div className={`${styles.progressFill} ${fillCls(weekPct)}`} style={{ width: `${weekPct}%` }} />
              </div>
              <p className={styles.progressPct}>{formatPercent(weekPct)}</p>
            </div>
            <div className={styles.progressPanel}>
              <div className={styles.progressRow}>
                <span className={styles.progressLabel}>Месяц</span>
                <span className={styles.progressOf}>{formatHours(data.workedHoursMonth)} из {formatHours(data.monthlyGoal)}</span>
              </div>
              <div className={styles.progressBar}>
                <div className={`${styles.progressFill} ${fillCls(monthPct)}`} style={{ width: `${monthPct}%` }} />
              </div>
              <p className={styles.progressPct}>{formatPercent(monthPct)}</p>
            </div>
          </div>
        </Card.Content>
      </Card>
    </div>
  );
}
