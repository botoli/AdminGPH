import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatHours } from "@/lib/utils";
import {
  generateMonthlyReport,
  getStoredReports,
  storeMonthlyReport,
  type ReportData,
} from "@/lib/reports";
import { isMonthValue, resolveSelectedMonthDate } from "@/lib/selected-month";
import styles from "./page.module.css";
import { FileText, Download } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ month?: string; year?: string; generate?: string }> }) {
  const params = await searchParams;
  const defaultDate = resolveSelectedMonthDate(params.month);
  const parsedMonth = params.month ? Number.parseInt(params.month, 10) : NaN;
  const parsedYear = params.year ? Number.parseInt(params.year, 10) : NaN;
  const selectedMonth = isMonthValue(params.month)
    ? defaultDate.getMonth() + 1
    : Number.isInteger(parsedMonth) && parsedMonth >= 1 && parsedMonth <= 12
    ? parsedMonth
    : defaultDate.getMonth() + 1;
  const selectedYear = isMonthValue(params.month)
    ? defaultDate.getFullYear()
    : Number.isInteger(parsedYear)
    ? parsedYear
    : defaultDate.getFullYear();
  const shouldGenerate = params.generate === "1";
  let reportData: ReportData | null = null;
  if (shouldGenerate) {
    reportData = await generateMonthlyReport(selectedMonth, selectedYear);
    await storeMonthlyReport(selectedMonth, selectedYear, reportData);
  }
  const storedReports = await getStoredReports();
  const months = ["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"];
  const years = Array.from({ length: 5 }, (_, i) => defaultDate.getFullYear() - 2 + i);

  return (
    <AppShell variant="dashboard">
      <div className={styles.page}>
        <div><p className={styles.eyebrow}>Документы</p><h1 className={styles.title}>Сформировать акт</h1><p className={styles.subtitle}>Сначала проверьте состав и итоговую сумму, затем скачайте Excel.</p></div>
        <Card>
          <Card.Header><h2 className={styles.sectionTitle}>Сформировать отчёт</h2></Card.Header>
          <Card.Content>
            <form className={styles.form}>
              <div className={styles.field}>
                <label className={styles.label}>Месяц</label>
                <select name="month" defaultValue={selectedMonth} className={styles.select}>{months.map((m,i)=><option key={i} value={i+1}>{m}</option>)}</select>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Год</label>
                <select name="year" defaultValue={selectedYear} className={styles.select}>{years.map(y=><option key={y} value={y}>{y}</option>)}</select>
              </div>
              <Button type="submit" name="generate" value="1"><FileText className={styles.fileIcon}/>Показать состав акта</Button>
            </form>
          </Card.Content>
        </Card>
        {reportData && (
          <Card>
            <Card.Header>
              <div className={styles.headerRow}>
                <h2 className={styles.sectionTitle}>{months[reportData.month - 1]} {reportData.year} Отчёт</h2>
                <div className={styles.headerActions}>
                  <span className={styles.recordCount}>{reportData.rows.length} записей</span>
                  <a
                    href={`/reports/export?month=${reportData.month}&year=${reportData.year}`}
                    className={styles.downloadButton}
                  >
                    <Download className={styles.fileIcon} />
                    Скачать Excel
                  </a>
                </div>
              </div>
            </Card.Header>
            <Card.Content>
              <div className={styles.reportSummary}>
                <div><span>Месяц</span><strong>{months[reportData.month - 1]} {reportData.year}</strong></div>
                <div><span>Завершённых задач</span><strong>{new Set(reportData.rows.map((row) => row.taskId)).size}</strong></div>
                <div><span>Часов</span><strong>{formatHours(reportData.totalHours)}</strong></div>
                <div className={styles.summaryAmount}><span>К оплате</span><strong>{formatCurrency(reportData.totalAmount)}</strong></div>
              </div>
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead className={styles.thead}>
                    <tr>
                      <th className={styles.th}>Дата</th>
                      <th className={styles.th}>Задача</th>
                      <th className={styles.th}>Описание</th>
                      <th className={`${styles.th} ${styles.thRight}`}>Часы</th>
                      <th className={`${styles.th} ${styles.thRight}`}>Ставка после НДФЛ</th>
                      <th className={`${styles.th} ${styles.thRight}`}>Сумма после НДФЛ</th>
                    </tr>
                  </thead>
                  <tbody className={styles.tbody}>
                    {reportData.rows.map((row, i) => (
                      <tr key={i} className={styles.tr}>
                        <td className={styles.td}>{row.date}</td>
                        <td className={`${styles.td} ${styles.tdMono}`}>{row.taskExternalId ?? row.taskId.slice(0, 8)}</td>
                        <td className={`${styles.td} ${styles.tdTitle}`}>{row.taskDescription}</td>
                        <td className={`${styles.td} ${styles.tdRight}`}>{formatHours(row.hours)}</td>
                        <td className={`${styles.td} ${styles.tdRight}`}>{formatCurrency(row.hourlyRate)}</td>
                        <td className={`${styles.td} ${styles.tdRight} ${styles.tdAmount}`}>{formatCurrency(row.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className={styles.tfoot}>
                    <tr>
                      <td colSpan={3} className={styles.tfTd}>Итого после НДФЛ</td>
                      <td className={`${styles.tfTd} ${styles.tdRight} ${styles.tfBold}`}>{formatHours(reportData.totalHours)}</td>
                      <td />
                      <td className={`${styles.tfTd} ${styles.tdRight} ${styles.tfBold}`}>{formatCurrency(reportData.totalAmount)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </Card.Content>
          </Card>
        )}
        {storedReports.length > 0 && (
          <Card>
            <Card.Header><h2 className={styles.sectionTitle}>Сохранённые отчёты</h2></Card.Header>
            <Card.Content>
              <div className={styles.storedGrid}>
                {storedReports.map((r) => (
                  <a key={r.id} href={`/reports/export?month=${r.month}&year=${r.year}`} className={styles.storedCard}>
                    <div><p className={styles.storedTitle}>{months[r.month - 1]} {r.year}</p><p className={styles.storedSub}>{formatHours(r.totalHours)} - {formatCurrency(r.totalAmount)} после НДФЛ</p></div>
                    <Download className={styles.storedIcon} />
                  </a>
                ))}
              </div>
            </Card.Content>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
