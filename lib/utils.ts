export function formatCurrency(amount: number, currency = "RUB"): string {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatHours(hours: number | null | undefined): string {
  const safeHours = typeof hours === "number" && Number.isFinite(hours) ? hours : 0;
  return `${safeHours.toFixed(1)}h`;
}

export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}
