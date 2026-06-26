-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "externalId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "plannedHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "actualHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "plannedDate" TEXT,
    "completedAt" TEXT,
    "createdAt" TEXT NOT NULL DEFAULT '',
    "updatedAt" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Worklog" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "workDate" TEXT NOT NULL,
    "hours" DOUBLE PRECISION NOT NULL,
    "comment" TEXT NOT NULL DEFAULT '',
    "createdAt" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "Worklog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskSchedule" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "scheduleDate" TEXT NOT NULL,
    "plannedHours" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "TaskSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "hourlyRate" DOUBLE PRECISION NOT NULL DEFAULT 1000,
    "weeklyPlanHours" DOUBLE PRECISION NOT NULL DEFAULT 20,
    "monthlyPlanHours" DOUBLE PRECISION NOT NULL DEFAULT 80,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonthlyExpense" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "isFixed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TEXT NOT NULL DEFAULT '',
    "updatedAt" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "MonthlyExpense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WishlistItem" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "createdAt" TEXT NOT NULL DEFAULT '',
    "updatedAt" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "WishlistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonthlyReport" (
    "id" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "totalHours" DOUBLE PRECISION NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "generatedAt" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "MonthlyReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Task_status_idx" ON "Task"("status");

-- CreateIndex
CREATE INDEX "Task_plannedDate_idx" ON "Task"("plannedDate");

-- CreateIndex
CREATE INDEX "Worklog_taskId_idx" ON "Worklog"("taskId");

-- CreateIndex
CREATE INDEX "Worklog_workDate_idx" ON "Worklog"("workDate");

-- CreateIndex
CREATE INDEX "TaskSchedule_taskId_idx" ON "TaskSchedule"("taskId");

-- CreateIndex
CREATE INDEX "TaskSchedule_scheduleDate_idx" ON "TaskSchedule"("scheduleDate");

-- CreateIndex
CREATE UNIQUE INDEX "TaskSchedule_taskId_scheduleDate_key" ON "TaskSchedule"("taskId", "scheduleDate");

-- CreateIndex
CREATE UNIQUE INDEX "MonthlyExpense_name_month_year_key" ON "MonthlyExpense"("name", "month", "year");

-- CreateIndex
CREATE INDEX "MonthlyExpense_month_year_idx" ON "MonthlyExpense"("month", "year");

-- CreateIndex
CREATE INDEX "WishlistItem_createdAt_idx" ON "WishlistItem"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "MonthlyReport_month_year_key" ON "MonthlyReport"("month", "year");

-- AddForeignKey
ALTER TABLE "Worklog" ADD CONSTRAINT "Worklog_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskSchedule" ADD CONSTRAINT "TaskSchedule_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
