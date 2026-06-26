"use server";

import { db } from "@/lib/db";
import { updateSettingsSchema } from "@/lib/validators";
import { revalidatePath } from "next/cache";

export async function getSettings() {
  return db.settings.findUnique({ where: { id: "default" } });
}

export async function updateSettings(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const parsed = updateSettingsSchema.parse(raw);
  await db.settings.upsert({
    where: { id: "default" },
    update: parsed,
    create: { id: "default", ...parsed },
  });
  revalidatePath("/finance");
  revalidatePath("/");
}
