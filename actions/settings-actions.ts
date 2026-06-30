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
  const settings = { ...parsed, hourlyRate: parsed.dailyRate / 8 };
  await db.settings.upsert({
    where: { id: "default" },
    update: settings,
    create: { id: "default", ...settings },
  });
  revalidatePath("/finance");
  revalidatePath("/");
}
