import { MonthPanel } from "@/components/dashboard/month-panel";

export const dynamic = "force-dynamic";

interface DashboardPageProps {
  searchParams: Promise<{ month?: string }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const { month } = await searchParams;
  return <MonthPanel period={month} />;
}
