"use server";

import { generateMonthlyReport, storeMonthlyReport, getStoredReports } from "@/lib/reports";

export async function generateReport(month: number, year: number) {
  const report = await generateMonthlyReport(month, year);
  await storeMonthlyReport(month, year, report);
  return report;
}

export async function fetchStoredReports() {
  return getStoredReports();
}

export async function fetchReport(month: number, year: number) {
  return generateMonthlyReport(month, year);
}
