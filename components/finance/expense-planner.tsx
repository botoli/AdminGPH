"use client";

import { useMemo, useState, useTransition } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { saveMonthlyExpenses } from "@/actions/expense-actions";
import { formatCurrency } from "@/lib/utils";
import { MONTHLY_EXPENSE_CATEGORIES } from "@/lib/money";
import styles from "./expense-planner.module.css";
import { Lock, ReceiptText, Wallet } from "lucide-react";

export interface ExpensePlannerRow {
  name: string;
  amount: number;
  isFixed: boolean;
  percent?: number;
}

interface ExpensePlannerProps {
  month: number;
  year: number;
  income: number;
  rows: ExpensePlannerRow[];
}

export function ExpensePlanner({ month, year, income, rows }: ExpensePlannerProps) {
  const [isPending, startTransition] = useTransition();
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(
      rows.filter((row) => !row.isFixed).map((row) => [row.name, String(row.amount || "")]),
    ),
  );

  const totalManual = useMemo(
    () =>
      rows
        .filter((row) => !row.isFixed)
        .reduce((sum, row) => sum + Number(values[row.name] || 0), 0),
    [rows, values],
  );
  const totalFixed = rows
    .filter((row) => row.isFixed)
    .reduce((sum, row) => sum + row.amount, 0);
  const totalExpenses = totalManual + totalFixed;
  const freeCash = income - totalExpenses;
  const isDeficit = freeCash < 0;
  const deficitAmount = Math.abs(freeCash);

  return (
    <div className={styles.pageGrid}>
      <Card className={styles.formCard}>
        <Card.Header>
          <div className={styles.heading}>
            <div>
              <p className={styles.eyebrow}>Расходы месяца</p>
              <h2 className={styles.title}>Обязательные траты</h2>
            </div>
            <span className={styles.period}>{month.toString().padStart(2, "0")}.{year}</span>
          </div>
        </Card.Header>
        <Card.Content>
          <form
            className={styles.form}
            action={(formData) =>
              startTransition(async () => {
                await saveMonthlyExpenses(formData);
              })
            }
          >
            <input type="hidden" name="month" value={month} />
            <input type="hidden" name="year" value={year} />

            <div className={styles.formGrid}>
              {MONTHLY_EXPENSE_CATEGORIES.map((name) => (
                <Input
                  key={name}
                  label={name}
                  type="number"
                  min="0"
                  step="1"
                  name={name}
                  value={values[name] ?? ""}
                  onChange={(event) =>
                    setValues((current) => ({ ...current, [name]: event.target.value }))
                  }
                />
              ))}
            </div>

            <div className={styles.fixedList}>
              {rows.filter((row) => row.isFixed).map((row) => (
                <div key={row.name} className={styles.fixedRow}>
                  <div className={styles.fixedMeta}>
                    <Lock className={styles.lockIcon} />
                    <div>
                      <p className={styles.fixedName}>{row.name}</p>
                      <p className={styles.fixedHint}>{row.percent}% от дохода месяца</p>
                    </div>
                  </div>
                  <strong className={styles.fixedValue}>{formatCurrency(row.amount)}</strong>
                </div>
              ))}
            </div>

            <div className={styles.formFooter}>
              <p className={styles.footerHint}>Копилки считаются автоматически и входят в общую сумму расходов месяца.</p>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Сохраняю..." : "Сохранить расходы"}
              </Button>
            </div>
          </form>
        </Card.Content>
      </Card>

      <div className={styles.aside}>
        <Card>
          <Card.Content className={styles.metricCard}>
            <ReceiptText className={styles.metricIcon} />
            <p className={styles.metricLabel}>Общие расходы месяца</p>
            <p className={styles.metricValue}>{formatCurrency(totalExpenses)}</p>
            <p className={styles.metricSub}>Обязательные {formatCurrency(totalManual)} + копилки {formatCurrency(totalFixed)}</p>
          </Card.Content>
        </Card>
        <Card>
          <Card.Content className={styles.metricCard}>
            <Wallet className={styles.metricIcon} />
            <p className={styles.metricLabel}>Свободно после расходов</p>
            <p className={`${styles.metricValue} ${isDeficit ? styles.metricDanger : ""}`}>{formatCurrency(freeCash)}</p>
            <p className={styles.metricSub}>
              {isDeficit
                ? `Дохода не хватает на обязательные расходы: дефицит ${formatCurrency(deficitAmount)}`
                : `${formatCurrency(income)} - ${formatCurrency(totalExpenses)} = ${formatCurrency(freeCash)}`}
            </p>
          </Card.Content>
        </Card>
      </div>
    </div>
  );
}
