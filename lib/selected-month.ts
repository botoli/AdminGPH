import { endOfMonth, format, isValid, parse, startOfMonth } from "date-fns";
import { getCurrentAppDate } from "@/lib/app-date";

const MONTH_VALUE_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

export function isMonthValue(value?: string | null): value is string {
  return typeof value === "string" && MONTH_VALUE_PATTERN.test(value);
}

export function resolveSelectedMonthDate(value?: string | null, fallback = getCurrentAppDate()) {
  if (!isMonthValue(value)) return fallback;
  const parsed = parse(value, "yyyy-MM", fallback);
  return isValid(parsed) ? parsed : fallback;
}

export function getMonthValue(date: Date) {
  return format(date, "yyyy-MM");
}

export function getMonthDateRange(value?: string | null, fallback = getCurrentAppDate()) {
  const date = resolveSelectedMonthDate(value, fallback);
  return {
    date,
    monthValue: getMonthValue(date),
    startDate: format(startOfMonth(date), "yyyy-MM-dd"),
    endDate: format(endOfMonth(date), "yyyy-MM-dd"),
  };
}

