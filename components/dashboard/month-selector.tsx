"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import styles from "./month-selector.module.css";

interface MonthSelectorProps {
  value: string;
  label: string;
  onChange?: (value: string) => void;
  storageKey?: string;
}

const MONTHS = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
];

export function MonthSelector({ value, label, onChange, storageKey }: MonthSelectorProps) {
  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [selectedYear, selectedMonth] = value.split("-").map(Number);
  const [year, setYear] = useState(selectedYear || new Date().getFullYear());

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  useEffect(() => {
    if (!storageKey) return;
    const savedMonth = localStorage.getItem(storageKey);
    if (!savedMonth || savedMonth === value || !/^\d{4}-(0[1-9]|1[0-2])$/.test(savedMonth)) return;
    if (onChange) onChange(savedMonth);
    else router.replace(`/?month=${savedMonth}`);
  }, [onChange, router, storageKey, value]);

  const selectMonth = (month: string) => {
    if (!month) return;
    if (storageKey) localStorage.setItem(storageKey, month);
    if (onChange) onChange(month);
    else router.push(`/?month=${month}`);
    setOpen(false);
  };

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <button
        type="button"
        className={styles.control}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => {
          if (!open && selectedYear) setYear(selectedYear);
          setOpen((current) => !current);
        }}
      >
        <CalendarDays aria-hidden="true" />
        <span>{label}</span>
        <ChevronDown className={styles.chevron} aria-hidden="true" />
      </button>
      {open ? (
        <div className={styles.picker} role="dialog" aria-label="Выбор месяца">
          <div className={styles.yearRow}>
            <button type="button" onClick={() => setYear((current) => current - 1)} aria-label="Предыдущий год"><ChevronLeft /></button>
            <strong>{year}</strong>
            <button type="button" onClick={() => setYear((current) => current + 1)} aria-label="Следующий год"><ChevronRight /></button>
          </div>
          <div className={styles.monthGrid}>
            {MONTHS.map((month, index) => {
              const monthNumber = index + 1;
              const active = year === selectedYear && monthNumber === selectedMonth;
              return (
                <button
                  type="button"
                  className={active ? styles.activeMonth : undefined}
                  aria-pressed={active}
                  key={month}
                  onClick={() => selectMonth(`${year}-${String(monthNumber).padStart(2, "0")}`)}
                >
                  {month.slice(0, 3)}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
