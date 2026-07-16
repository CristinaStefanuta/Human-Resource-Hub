import { Router, type IRouter } from "express";
import { eq, and, gte, lt, count, sql } from "drizzle-orm";
import { db } from "@workspace/db";
import { usersTable, requestsTable, timeEntriesTable } from "@workspace/db";
import { requireAuth, requireAdmin } from "../middlewares/auth";

const router: IRouter = Router();

function computeHoursFromEntries(entries: { type: string; timestamp: Date }[]): number {
  let total = 0;
  let clockInTime: Date | null = null;

  for (const entry of entries) {
    const ts = new Date(entry.timestamp);
    if (entry.type === "ClockIn" || entry.type === "PauseEnd") {
      clockInTime = ts;
    } else if ((entry.type === "ClockOut" || entry.type === "PauseStart") && clockInTime) {
      total += (ts.getTime() - clockInTime.getTime()) / 3600000;
      clockInTime = null;
    }
  }
  if (clockInTime) {
    total += (Date.now() - clockInTime.getTime()) / 3600000;
  }
  return Math.round(total * 100) / 100;
}

router.get("/dashboard/employee", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.id;

  // This week
  const now = new Date();
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() + mondayOffset);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  // Today
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  const [weekEntries, todayEntries, allRequests, recentRequests] = await Promise.all([
    db
      .select()
      .from(timeEntriesTable)
      .where(
        and(
          eq(timeEntriesTable.userId, userId),
          gte(timeEntriesTable.timestamp, weekStart),
          lt(timeEntriesTable.timestamp, weekEnd)
        )
      )
      .orderBy(timeEntriesTable.timestamp),
    db
      .select()
      .from(timeEntriesTable)
      .where(
        and(
          eq(timeEntriesTable.userId, userId),
          gte(timeEntriesTable.timestamp, todayStart),
          lt(timeEntriesTable.timestamp, todayEnd)
        )
      )
      .orderBy(timeEntriesTable.timestamp),
    db.select().from(requestsTable).where(eq(requestsTable.userId, userId)),
    db
      .select({
        id: requestsTable.id,
        userId: requestsTable.userId,
        userName: usersTable.name,
        userAvatarUrl: usersTable.avatarUrl,
        type: requestsTable.type,
        reason: requestsTable.reason,
        status: requestsTable.status,
        createdAt: requestsTable.createdAt,
      })
      .from(requestsTable)
      .leftJoin(usersTable, eq(requestsTable.userId, usersTable.id))
      .where(eq(requestsTable.userId, userId))
      .orderBy(sql`${requestsTable.createdAt} DESC`)
      .limit(5),
  ]);

  const hoursThisWeek = computeHoursFromEntries(weekEntries);
  const hoursToday = computeHoursFromEntries(todayEntries);

  // Work days this week so far
  const daysMap = new Set(
    weekEntries.map((e) => new Date(e.timestamp).toISOString().split("T")[0])
  );
  const avgDailyHours = daysMap.size > 0 ? Math.round((hoursThisWeek / daysMap.size) * 100) / 100 : 0;

  const requestStats = {
    total: allRequests.length,
    pending: allRequests.filter((r) => r.status === "Pending").length,
    approved: allRequests.filter((r) => r.status === "Approved").length,
    denied: allRequests.filter((r) => r.status === "Denied").length,
  };

  const lastEntry = todayEntries[todayEntries.length - 1];
  let currentStatus: "ClockedIn" | "OnPause" | "ClockedOut" | "NotStarted" = "NotStarted";
  if (lastEntry) {
    if (lastEntry.type === "ClockIn" || lastEntry.type === "PauseEnd") currentStatus = "ClockedIn";
    else if (lastEntry.type === "PauseStart") currentStatus = "OnPause";
    else if (lastEntry.type === "ClockOut") currentStatus = "ClockedOut";
  }

  res.json({
    hoursThisWeek,
    avgDailyHours,
    requestStats,
    recentRequests,
    currentStatus,
    hoursToday,
  });
});

router.get("/dashboard/admin", requireAuth, requireAdmin, async (_req, res): Promise<void> => {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  const [allUsers, allRequests, todayEntries, recentRequests] = await Promise.all([
    db.select().from(usersTable).where(eq(usersTable.role, "Employee")),
    db.select().from(requestsTable),
    db
      .select()
      .from(timeEntriesTable)
      .where(
        and(
          gte(timeEntriesTable.timestamp, todayStart),
          lt(timeEntriesTable.timestamp, todayEnd)
        )
      )
      .orderBy(timeEntriesTable.timestamp),
    db
      .select({
        id: requestsTable.id,
        userId: requestsTable.userId,
        userName: usersTable.name,
        userAvatarUrl: usersTable.avatarUrl,
        type: requestsTable.type,
        reason: requestsTable.reason,
        status: requestsTable.status,
        createdAt: requestsTable.createdAt,
      })
      .from(requestsTable)
      .leftJoin(usersTable, eq(requestsTable.userId, usersTable.id))
      .orderBy(sql`${requestsTable.createdAt} DESC`)
      .limit(10),
  ]);

  // Attendance status per user
  const userStatusMap = new Map<number, string>();
  for (const user of allUsers) {
    const entries = todayEntries.filter((e) => e.userId === user.id);
    const last = entries[entries.length - 1];
    let status = "NotStarted";
    if (last) {
      if (last.type === "ClockIn" || last.type === "PauseEnd") status = "ClockedIn";
      else if (last.type === "PauseStart") status = "OnPause";
      else if (last.type === "ClockOut") status = "ClockedOut";
    }
    userStatusMap.set(user.id, status);
  }

  const activeTodayCount = Array.from(userStatusMap.values()).filter(
    (s) => s === "ClockedIn" || s === "OnPause"
  ).length;

  // Avg hours per employee today
  let totalHoursToday = 0;
  for (const user of allUsers) {
    const entries = todayEntries.filter((e) => e.userId === user.id);
    totalHoursToday += computeHoursFromEntries(entries);
  }
  const avgHoursPerEmployee =
    allUsers.length > 0 ? Math.round((totalHoursToday / allUsers.length) * 100) / 100 : 0;

  // Request stats
  const requestStats = {
    total: allRequests.length,
    pending: allRequests.filter((r) => r.status === "Pending").length,
    approved: allRequests.filter((r) => r.status === "Approved").length,
    denied: allRequests.filter((r) => r.status === "Denied").length,
  };

  // Requests by type
  const typeMap = new Map<string, number>();
  for (const r of allRequests) {
    typeMap.set(r.type, (typeMap.get(r.type) ?? 0) + 1);
  }
  const requestsByType = Array.from(typeMap.entries()).map(([type, count]) => ({ type, count }));

  // Attendance overview
  const statusMap = new Map<string, number>();
  for (const s of userStatusMap.values()) {
    statusMap.set(s, (statusMap.get(s) ?? 0) + 1);
  }
  const attendanceOverview = Array.from(statusMap.entries()).map(([status, count]) => ({
    status,
    count,
  }));

  res.json({
    totalEmployees: allUsers.length,
    activeTodayCount,
    avgHoursPerEmployee,
    requestStats,
    requestsByType,
    attendanceOverview,
    recentRequests,
  });
});

export default router;
