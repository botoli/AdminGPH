import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getDatabaseUrl() {
  const value = process.env.DATABASE_URL;
  if (!value) return undefined;

  const url = new URL(value);
  if (!url.searchParams.has("connect_timeout")) url.searchParams.set("connect_timeout", "15");
  if (!url.searchParams.has("pool_timeout")) url.searchParams.set("pool_timeout", "15");
  if (!url.searchParams.has("connection_limit")) url.searchParams.set("connection_limit", "5");
  return url.toString();
}

const databaseUrl = getDatabaseUrl();

export const db = globalForPrisma.prisma ?? new PrismaClient(
  databaseUrl ? { datasourceUrl: databaseUrl } : undefined,
);

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
