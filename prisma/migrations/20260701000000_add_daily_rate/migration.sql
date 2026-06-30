ALTER TABLE "Settings" ADD COLUMN "dailyRate" DOUBLE PRECISION NOT NULL DEFAULT 8000;

UPDATE "Settings" SET "dailyRate" = "hourlyRate" * 8;
