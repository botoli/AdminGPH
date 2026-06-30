import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Upsert default settings
  await prisma.settings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      dailyRate: 8000,
      hourlyRate: 1000,
      weeklyPlanHours: 20,
      monthlyPlanHours: 80,
      monthlyIncomeGoal: 0,
      forecastMode: "CURRENT_MONTH_PACE",
    },
  });

  const taskData = [
    {
      externalId: "T-1001",
      title: "Implement user authentication flow",
      description: "Set up JWT-based authentication with refresh tokens",
      plannedHours: 16, status: "COMPLETED", plannedDate: "2026-06-15",
      completedAt: new Date("2026-06-20").toISOString(),
      createdAt: new Date("2026-06-15").toISOString(),
      updatedAt: new Date("2026-06-20").toISOString(),
    },
    {
      externalId: "T-1002",
      title: "Design database schema for reporting module",
      description: "Create ERD and migration scripts for the reporting module",
      plannedHours: 8, status: "IN_PROGRESS", plannedDate: "2026-06-22",
      createdAt: new Date("2026-06-20").toISOString(),
      updatedAt: new Date("2026-06-22").toISOString(),
    },
    {
      externalId: "T-1003",
      title: "Build contractor dashboard MVP",
      description: "Full-stack development of the contractor dashboard",
      plannedHours: 40, status: "IN_PROGRESS", plannedDate: "2026-06-01",
      createdAt: new Date("2026-06-01").toISOString(),
      updatedAt: new Date("2026-06-23").toISOString(),
    },
    {
      externalId: "T-1004",
      title: "Fix pagination bug in task list",
      description: "Pagination resets when filtering by status",
      plannedHours: 4, status: "PLANNED", plannedDate: "2026-06-25",
      createdAt: new Date("2026-06-22").toISOString(),
      updatedAt: new Date("2026-06-22").toISOString(),
    },
    {
      externalId: "T-1005",
      title: "Code review for payment module",
      description: "Review PR #142 for the payment integration module",
      plannedHours: 6, status: "NEW", plannedDate: "2026-06-28",
      createdAt: new Date("2026-06-23").toISOString(),
      updatedAt: new Date("2026-06-23").toISOString(),
    },
    {
      externalId: "T-1006",
      title: "Write unit tests for API handlers",
      description: "Achieve 80% coverage on all API route handlers",
      plannedHours: 12, status: "NEW", plannedDate: "2026-07-01",
      createdAt: new Date("2026-06-23").toISOString(),
      updatedAt: new Date("2026-06-23").toISOString(),
    },
  ];

  for (const td of taskData) {
    const task = await prisma.task.create({ data: td });

    // Worklogs for task T-1001
    if (td.externalId === "T-1001") {
      await prisma.worklog.createMany({
        data: [
          { taskId: task.id, workDate: "2026-06-16", hours: 8, comment: "Initial setup", createdAt: new Date("2026-06-16").toISOString() },
          { taskId: task.id, workDate: "2026-06-17", hours: 6, comment: "Implementation", createdAt: new Date("2026-06-17").toISOString() },
          { taskId: task.id, workDate: "2026-06-18", hours: 2, comment: "Testing and fixes", createdAt: new Date("2026-06-18").toISOString() },
        ],
      });
    }

    // Worklogs for T-1002
    if (td.externalId === "T-1002") {
      await prisma.worklog.createMany({
        data: [
          { taskId: task.id, workDate: "2026-06-22", hours: 4, comment: "Schema design", createdAt: new Date("2026-06-22").toISOString() },
          { taskId: task.id, workDate: "2026-06-23", hours: 3, comment: "Migration scripts", createdAt: new Date("2026-06-23").toISOString() },
        ],
      });
    }

    // Worklogs for T-1003
    if (td.externalId === "T-1003") {
      await prisma.worklog.createMany({
        data: [
          { taskId: task.id, workDate: "2026-06-02", hours: 8, comment: "Project setup", createdAt: new Date("2026-06-02").toISOString() },
          { taskId: task.id, workDate: "2026-06-03", hours: 6, comment: "Backend work", createdAt: new Date("2026-06-03").toISOString() },
          { taskId: task.id, workDate: "2026-06-09", hours: 8, comment: "Frontend pages", createdAt: new Date("2026-06-09").toISOString() },
          { taskId: task.id, workDate: "2026-06-10", hours: 7, comment: "Dashboard UI", createdAt: new Date("2026-06-10").toISOString() },
          { taskId: task.id, workDate: "2026-06-16", hours: 8, comment: "Calendar integration", createdAt: new Date("2026-06-16").toISOString() },
          { taskId: task.id, workDate: "2026-06-17", hours: 5, comment: "Worklog module", createdAt: new Date("2026-06-17").toISOString() },
        ],
      });
    }

    // Add schedule for each task
    if (task.plannedDate) {
      await prisma.taskSchedule.create({
        data: { taskId: task.id, scheduleDate: task.plannedDate!, plannedHours: task.plannedHours },
      });
    }
  }

  // June monthly report
  await prisma.monthlyReport.upsert({
    where: { month_year: { month: 6, year: 2026 } },
    update: { totalHours: 52, totalAmount: 52000, generatedAt: new Date("2026-06-23").toISOString() },
    create: { month: 6, year: 2026, totalHours: 52, totalAmount: 52000, generatedAt: new Date("2026-06-23").toISOString() },
  });

  console.log("Seed completed successfully!");
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
