"use server";

import { db } from "@/lib/db";
import { createWishlistItemSchema, updateWishlistItemSchema } from "@/lib/validators";
import { revalidatePath } from "next/cache";

function revalidateWishlistPaths() {
  revalidatePath("/wishlist");
  revalidatePath("/");
}

export async function createWishlistItem(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const parsed = createWishlistItemSchema.parse(raw);
  const now = new Date().toISOString();

  await db.wishlistItem.create({
    data: {
      ...parsed,
      createdAt: now,
      updatedAt: now,
    },
  });

  revalidateWishlistPaths();
}

export async function updateWishlistItem(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const parsed = updateWishlistItemSchema.parse(raw);

  await db.wishlistItem.update({
    where: { id: parsed.id },
    data: {
      title: parsed.title,
      amount: parsed.amount,
      updatedAt: new Date().toISOString(),
    },
  });

  revalidateWishlistPaths();
}

export async function deleteWishlistItem(id: string) {
  await db.wishlistItem.delete({ where: { id } });
  revalidateWishlistPaths();
}
