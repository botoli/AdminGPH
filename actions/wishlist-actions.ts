"use server";

import { db } from "@/lib/db";
import { allocateWishlistItemSchema, createWishlistItemSchema, updateWishlistItemSchema } from "@/lib/validators";
import { getFinanceOverview } from "@/lib/finance-overview";
import { getWishlistProductPreview } from "@/lib/wishlist-product-preview";
import { revalidatePath } from "next/cache";

function revalidateWishlistPaths() {
  revalidatePath("/wishlist");
  revalidatePath("/");
}

export async function createWishlistItem(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const parsed = createWishlistItemSchema.parse(raw);
  const now = new Date().toISOString();
  const preview = parsed.productUrl ? await getWishlistProductPreview(parsed.productUrl) : { productImageUrl: null, productSource: null };

  await db.wishlistItem.create({
    data: {
      ...parsed,
      productImageUrl: preview.productImageUrl,
      productSource: preview.productSource,
      createdAt: now,
      updatedAt: now,
    },
  });

  revalidateWishlistPaths();
}

export async function updateWishlistItem(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const parsed = updateWishlistItemSchema.parse(raw);
  const preview = parsed.productUrl ? await getWishlistProductPreview(parsed.productUrl) : { productImageUrl: null, productSource: null };

  await db.wishlistItem.update({
    where: { id: parsed.id },
    data: {
      title: parsed.title,
      amount: parsed.amount,
      kind: parsed.kind,
      productUrl: parsed.productUrl ?? null,
      productImageUrl: preview.productImageUrl,
      productSource: preview.productSource,
      updatedAt: new Date().toISOString(),
    },
  });

  revalidateWishlistPaths();
}

export async function setWishlistAllocation(formData: FormData) {
  const parsed = allocateWishlistItemSchema.parse(Object.fromEntries(formData.entries()));
  const overview = await getFinanceOverview();
  const item = await db.wishlistItem.findUniqueOrThrow({ where: { id: parsed.id } });
  const currentAllocation = item.allocationMonth === overview.period.month && item.allocationYear === overview.period.year
    ? item.allocationAmount
    : 0;
  const available = Math.max(0, overview.freeCash - overview.selectedWishlistTotal + currentAllocation);
  const maxAllocation = item.kind === "SAVINGS"
    ? Math.max(0, item.amount - item.savedAmount + currentAllocation)
    : item.amount;

  if (parsed.amount > available || parsed.amount > maxAllocation) {
    throw new Error("На эту хотелку не хватает свободных денег");
  }

  await db.wishlistItem.update({
    where: { id: parsed.id },
    data: {
      allocationAmount: parsed.amount,
      allocationMonth: parsed.amount > 0 ? overview.period.month : null,
      allocationYear: parsed.amount > 0 ? overview.period.year : null,
      savedAmount: item.kind === "SAVINGS"
        ? Math.max(0, item.savedAmount - currentAllocation + parsed.amount)
        : item.savedAmount,
      updatedAt: new Date().toISOString(),
    },
  });
  revalidateWishlistPaths();
}

export async function completeWishlistItem(id: string) {
  const item = await db.wishlistItem.findUniqueOrThrow({ where: { id } });
  await db.wishlistItem.update({
    where: { id },
    data: {
      completed: true,
      savedAmount: item.savedAmount,
      allocationAmount: 0,
      allocationMonth: null,
      allocationYear: null,
      updatedAt: new Date().toISOString(),
    },
  });
  revalidateWishlistPaths();
}

export async function deleteWishlistItem(id: string) {
  await db.wishlistItem.delete({ where: { id } });
  revalidateWishlistPaths();
}
