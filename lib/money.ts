import { format } from "date-fns";

export const NDFL_RATE = 0.13;

export const FIXED_EXPENSES = [
  { name: "Копилка на квартиру", percent: 40 },
  { name: "Копилка на учебу", percent: 5 },
] as const;

export const MONTHLY_EXPENSE_CATEGORIES = [
  "Прогулки",
  "Прогулки с Васей",
  "Транспорт",
  "Самокат",
  "Подписка",
  "Вкусняшки",
] as const;

export function getCurrentPeriod(date = new Date()) {
  return {
    month: Number(format(date, "M")),
    year: Number(format(date, "yyyy")),
  };
}

export function calculateFixedExpenseAmount(income: number, percent: number) {
  return Math.round((income * percent) / 100);
}

export function calculateAfterNdfl(grossAmount: number) {
  return grossAmount * (1 - NDFL_RATE);
}

export function calculateAdditionalIncomeNeeded(
  targetAmount: number,
  freeCash: number,
) {
  return Math.max(0, targetAmount - Math.max(0, freeCash));
}

export function calculateMonthsToReach(targetAmount: number, freeCash: number) {
  if (targetAmount <= 0) return 0;
  if (freeCash <= 0) return null;
  return Math.ceil(targetAmount / freeCash);
}
