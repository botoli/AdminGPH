export const APP_TIME_ZONE = "Europe/Moscow";

function getAppDateParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return { year: value.year, month: value.month, day: value.day };
}

export function getCurrentAppDateValue(date = new Date()) {
  const { year, month, day } = getAppDateParts(date);
  return `${year}-${month}-${day}`;
}

export function getCurrentAppMonthValue(date = new Date()) {
  const { year, month } = getAppDateParts(date);
  return `${year}-${month}`;
}

export function getCurrentAppDate(date = new Date()) {
  const { year, month, day } = getAppDateParts(date);
  return new Date(Number(year), Number(month) - 1, Number(day), 12);
}
