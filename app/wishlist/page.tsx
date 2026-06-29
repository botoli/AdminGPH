import { AppShell } from "@/components/layout/app-shell";
import { WishlistPlannerV2 } from "@/components/finance/wishlist-planner-v2";
import { getFinanceOverview } from "@/lib/finance-overview";

export const dynamic = "force-dynamic";

export default async function WishlistPage() {
  const overview = await getFinanceOverview();

  return (
    <AppShell>
      <WishlistPlannerV2
        freeCash={overview.freeCash}
        selectedTotal={overview.selectedWishlistTotal}
        afterWishlist={overview.afterWishlist}
        items={overview.wishlist}
        month={overview.period.month}
      />
    </AppShell>
  );
}
