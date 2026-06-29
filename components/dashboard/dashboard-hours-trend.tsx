import { format, isValid, parse } from "date-fns";
import { ru } from "date-fns/locale";
import { BarChart3 } from "lucide-react";
import { formatHours } from "@/lib/utils";
import styles from "./dashboard-hours-trend.module.css";

interface TrendPoint {
  month: string;
  hours: number;
}

export function DashboardHoursTrend({ points }: { points: TrendPoint[] }) {
  const maxHours = Math.max(...points.map((point) => point.hours), 1);
  const current = points.at(-1)?.hours ?? 0;
  const previous = points.at(-2)?.hours ?? 0;
  const change = previous > 0 ? Math.round(((current - previous) / previous) * 100) : null;

  return (
    <article className={styles.card} aria-labelledby="hours-trend-title">
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}><BarChart3 aria-hidden="true" /> Динамика</span>
          <h2 id="hours-trend-title">Рабочие часы</h2>
        </div>
        <div className={styles.summary}>
          <strong>{formatHours(current)}</strong>
          <span>{change === null ? "нет базы для сравнения" : `${change >= 0 ? "+" : ""}${change}% к прошлому месяцу`}</span>
        </div>
      </header>

      <div className={styles.chart} role="img" aria-label="Рабочие часы за последние шесть месяцев">
        {points.map((point, index) => {
          const date = parse(point.month, "yyyy-MM", new Date());
          const label = isValid(date) ? format(date, "LLL", { locale: ru }).replace(".", "") : point.month;
          const height = point.hours > 0 ? Math.max(7, (point.hours / maxHours) * 100) : 2;
          const isCurrent = index === points.length - 1;
          return (
            <div className={styles.column} key={point.month} title={`${label}: ${formatHours(point.hours)}`}>
              <div className={styles.barArea}>
                <span className={`${styles.bar} ${isCurrent ? styles.current : ""}`} style={{ height: `${height}%` }} />
              </div>
              <span className={isCurrent ? styles.currentLabel : undefined}>{label}</span>
            </div>
          );
        })}
      </div>
    </article>
  );
}
