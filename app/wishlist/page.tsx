import { AppShell } from "@/components/layout/app-shell";
import { WishlistPlanner } from "@/components/finance/wishlist-planner";
import { getFinanceOverview } from "@/lib/finance-overview";

export const dynamic = "force-dynamic";

export default async function WishlistPage() {
  const overview = await getFinanceOverview();

  return (
    <AppShell>
      <WishlistPlanner freeCash={overview.freeCash} items={overview.wishlist} />
    </AppShell>
  );
}
