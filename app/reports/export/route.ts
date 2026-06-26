import {
  buildMonthlyReportWorkbookBuffer,
  generateMonthlyReport,
  storeMonthlyReport,
} from "@/lib/reports";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const now = new Date();
  const parsedMonth = Number.parseInt(url.searchParams.get("month") ?? "", 10);
  const parsedYear = Number.parseInt(url.searchParams.get("year") ?? "", 10);
  const month =
    Number.isInteger(parsedMonth) && parsedMonth >= 1 && parsedMonth <= 12
      ? parsedMonth
      : now.getMonth() + 1;
  const year = Number.isInteger(parsedYear) ? parsedYear : now.getFullYear();

  const report = await generateMonthlyReport(month, year);
  await storeMonthlyReport(month, year, report);
  const buffer = await buildMonthlyReportWorkbookBuffer(report);
  const body = buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength
  ) as ArrayBuffer;
  const filename = `report-${year}-${String(month).padStart(2, "0")}.xlsx`;

  return new Response(body, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
