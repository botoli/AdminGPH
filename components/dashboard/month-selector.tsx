"use client";

import { CalendarDays, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import styles from "./month-selector.module.css";

interface MonthSelectorProps {
  value: string;
  label: string;
}

export function MonthSelector({ value, label }: MonthSelectorProps) {
  const router = useRouter();

  return (
    <label className={styles.control}>
      <CalendarDays aria-hidden="true" />
      <span>{label}</span>
      <input
        aria-label="Выбрать месяц"
        type="month"
        value={value}
        onChange={(event) => router.push(`/?month=${event.target.value}`)}
      />
      <ChevronDown className={styles.chevron} aria-hidden="true" />
    </label>
  );
}
