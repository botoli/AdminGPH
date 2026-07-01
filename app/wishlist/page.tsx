import { AppShell } from "@/components/layout/app-shell";
import { WishlistPlannerV2 } from "@/components/finance/wishlist-planner-v2";
import { getFinanceOverview } from "@/lib/finance-overview";
import { resolveSelectedMonthDate } from "@/lib/selected-month";

export const dynamic = "force-dynamic";

export default async function WishlistPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const { month } = await searchParams;
  const overview = await getFinanceOverview(resolveSelectedMonthDate(month));

  return (
    <AppShell variant="dashboard">
      <WishlistPlannerV2
        freeCash={overview.freeCash}
        selectedTotal={overview.selectedWishlistTotal}
        afterWishlist={overview.afterWishlist}
        items={overview.wishlist}
        month={overview.period.month}
        year={overview.period.year}
      />
    </AppShell>
  );
}
