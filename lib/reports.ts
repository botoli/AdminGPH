import { db } from "@/lib/db";
import { startOfMonth, endOfMonth, format } from "date-fns";
import ExcelJS from "exceljs";
import { getCompletedTasksInRange } from "@/lib/task-metrics";
import { calculateAfterNdfl } from "@/lib/money";

export type ReportRow = {
  date: string;
  taskId: string;
  taskExternalId: string | null;
  taskDescription: string;
  hours: number;
  hourlyRate: number;
  amount: number;
};

export type ReportData = {
  month: number;
  year: number;
  rows: ReportRow[];
  totalHours: number;
  totalAmount: number;
  taskExternalIds: string[];
};

export async function generateMonthlyReport(
  month: number,
  year: number
): Promise<ReportData> {
  const start = format(startOfMonth(new Date(year, month - 1)), "yyyy-MM-dd");
  const end = format(endOfMonth(new Date(year, month - 1)), "yyyy-MM-dd");

  const [settings, worklogs, tasks] = await Promise.all([
    db.settings.findUnique({ where: { id: "default" } }),
    db.worklog.findMany({
      where: {
        workDate: { gte: start, lte: end },
      },
      include: { task: true },
      orderBy: { workDate: "asc" },
    }),
    db.task.findMany({
      select: {
        id: true,
        title: true,
        externalId: true,
        description: true,
        status: true,
        plannedDate: true,
        completedAt: true,
        actualHours: true,
      },
      orderBy: { plannedDate: "asc" },
    }),
  ]);

  const rate = calculateAfterNdfl((settings?.dailyRate ?? (settings?.hourlyRate ?? 1000) * 8) / 8);
  const rows: ReportRow[] = worklogs.length > 0
    ? worklogs.map((w) => ({
        date: w.workDate,
        taskId: w.taskId,
        taskExternalId: w.task.externalId,
        taskDescription: w.comment?.trim() || w.task.title,
        hours: w.hours,
        hourlyRate: rate,
        amount: calculateReportAmount(w.hours, rate),
      }))
    : getCompletedTasksInRange(tasks, start, end).map((task) => ({
        date: task.date,
        taskId: task.id,
        taskExternalId: task.externalId,
        taskDescription: task.title,
        hours: task.actualHours,
        hourlyRate: rate,
        amount: calculateReportAmount(task.actualHours, rate),
      }));

  const totalHours = rows.reduce((sum, r) => sum + r.hours, 0);
  const totalAmount = rows.reduce((sum, r) => sum + r.amount, 0);
  const taskExternalIds = Array.from(
    new Set(rows.map((r) => r.taskExternalId ?? r.taskId))
  );

  return { month, year, rows, totalHours, totalAmount, taskExternalIds };
}

export function calculateReportAmount(hours: number, hourlyRate: number): number {
  return hours * hourlyRate;
}

export async function storeMonthlyReport(
  month: number,
  year: number,
  data: ReportData
) {
  return db.monthlyReport.upsert({
    where: { month_year: { month, year } },
    update: {
      totalHours: data.totalHours,
      totalAmount: data.totalAmount,
      generatedAt: new Date().toISOString(),
    },
    create: {
      month,
      year,
      totalHours: data.totalHours,
      totalAmount: data.totalAmount,
      generatedAt: new Date().toISOString(),
    },
  });
}

export async function getStoredReports() {
  return db.monthlyReport.findMany({
    orderBy: [{ year: "desc" }, { month: "desc" }],
  });
}

export async function buildMonthlyReportWorkbookBuffer(
  data: ReportData
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "adminGPH";
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet("Отчет", {
    pageSetup: {
      orientation: "landscape",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 1,
      margins: {
        left: 0.25,
        right: 0.25,
        top: 0.25,
        bottom: 0.25,
        header: 0.1,
        footer: 0.1,
      },
    },
  });

  worksheet.columns = [
    { key: "number", width: 5 },
    { key: "periodStart", width: 13 },
    { key: "periodEnd", width: 13 },
    { key: "content", width: 22 },
    { key: "result", width: 38 },
    { key: "characteristics", width: 28 },
    { key: "cost", width: 18 },
  ];

  worksheet.mergeCells("A1:A2");
  worksheet.mergeCells("B1:C1");
  worksheet.mergeCells("D1:D2");
  worksheet.mergeCells("E1:E2");
  worksheet.mergeCells("F1:F2");
  worksheet.mergeCells("G1:G2");

  worksheet.getCell("A1").value = "№";
  worksheet.getCell("B1").value = "Период\nвыполнения";
  worksheet.getCell("B2").value = "с";
  worksheet.getCell("C2").value = "по";
  worksheet.getCell("D1").value = "Содержание\nработ\n(перечень\nдействий)";
  worksheet.getCell("E1").value = "Результат выполнения работ";
  worksheet.getCell("F1").value = "Характеристики\nработ и их\nрезультата\n(количество,\nобъем, иные\nхарактеристики)";
  worksheet.getCell("G1").value = "Стоимость\nпосле НДФЛ,\nруб.";

  const start = formatDateForReport(startOfMonth(new Date(data.year, data.month - 1)));
  const end = formatDateForReport(endOfMonth(new Date(data.year, data.month - 1)));
  const taskIds = data.taskExternalIds.length > 0 ? data.taskExternalIds.join("\n") : "-";

  worksheet.getRow(3).values = [
    1,
    start,
    end,
    "Выполнение\nработ по\nразработке\nпрограммного\nобеспечения\nпо запросам\nзаказчика",
    `Выполненные задачи:\n${taskIds}`,
    `Проведено\n${formatHoursValue(data.totalHours)}`,
    data.totalAmount,
  ];

  worksheet.getRow(4).values = ["", "", "", "", "", "", data.totalAmount];

  worksheet.getRow(1).height = 42;
  worksheet.getRow(2).height = 80;
  worksheet.getRow(3).height = 210;
  worksheet.getRow(4).height = 34;

  worksheet.eachRow((row) => {
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.alignment = {
        horizontal: "center",
        vertical: "top",
        wrapText: true,
      };
      cell.font = { name: "Times New Roman", size: 12 };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });
  });

  worksheet.getCell("E3").alignment = {
    horizontal: "left",
    vertical: "top",
    wrapText: true,
  };
  worksheet.getCell("E3").font = { name: "Times New Roman", size: 12, bold: true };
  worksheet.getCell("E3").fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFFFFF00" },
  };
  worksheet.getCell("F3").fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFFFFF00" },
  };
  worksheet.getCell("G3").numFmt = "#,##0.00";
  worksheet.getCell("G3").fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFFFFF00" },
  };
  worksheet.getCell("G4").numFmt = "#,##0.00";
  worksheet.getCell("G4").fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFFFFF00" },
  };

  worksheet.views = [{ showGridLines: false }];

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

function formatDateForReport(date: Date): string {
  return format(date, "dd.MM.yy");
}

function formatHoursValue(hours: number): string {
  return Number.isInteger(hours) ? String(hours) : hours.toFixed(1);
}
