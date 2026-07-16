import { Router, type IRouter } from "express";
import { eq, and, gte, lt } from "drizzle-orm";
import { db } from "@workspace/db";
import { timeEntriesTable, usersTable } from "@workspace/db";
import {
  ListTimeEntriesQueryParams,
  CreateTimeEntryBody,
  GetWeekTimeEntriesQueryParams,
} from "@workspace/api-zod";
import { requireAuth, requireAdmin } from "../middlewares/auth";

const router: IRouter = Router();

// Helper: compute hours worked from entries
function computeHoursFromEntries(entries: { type: string; timestamp: Date }[]): number {
  let total = 0;
  let clockInTime: Date | null = null;
  let pauseStartTime: Date | null = null;

  for (const entry of entries) {
    const ts = new Date(entry.timestamp);
    if (entry.type === "ClockIn") {
      clockInTime = ts;
      pauseStartTime = null;
    } else if (entry.type === "ClockOut" && clockInTime) {
      total += (ts.getTime() - clockInTime.getTime()) / 3600000;
      clockInTime = null;
    } else if (entry.type === "PauseStart" && clockInTime) {
      // Add time up to pause
      total += (ts.getTime() - clockInTime.getTime()) / 3600000;
      clockInTime = null;
      pauseStartTime = ts;
    } else if (entry.type === "PauseEnd") {
      pauseStartTime = null;
      clockInTime = ts; // resume
    }
  }

  // If still clocked in
  if (clockInTime) {
    total += (Date.now() - clockInTime.getTime()) / 3600000;
  }

  return Math.round(total * 100) / 100;
}

router.get("/time-entries", requireAuth, async (req, res): Promise<void> => {
  const qp = ListTimeEntriesQueryParams.safeParse(req.query);
  if (!qp.success) {
    res.status(400).json({ error: qp.error.message });
    return;
  }

  const userId = req.user!.id;
  const isAdmin = req.user!.role === "Admin";
  const targetUserId = isAdmin && qp.data.userId ? qp.data.userId : userId;

  const conditions: any[] = [eq(timeEntriesTable.userId, targetUserId)];

  if (qp.data.date) {
    const dayStart = new Date(qp.data.date);
    dayStart.setUTCHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);
    conditions.push(gte(timeEntriesTable.timestamp, dayStart));
    conditions.push(lt(timeEntriesTable.timestamp, dayEnd));
  }

  const entries = await db
    .select()
    .from(timeEntriesTable)
    .where(and(...conditions))
    .orderBy(timeEntriesTable.timestamp);
  res.json(entries);
});

router.post("/time-entries", requireAuth, async (req, res): Promise<void> => {
  const body = CreateTimeEntryBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const [entry] = await db
    .insert(timeEntriesTable)
    .values({
      userId: req.user!.id,
      type: body.data.type as "ClockIn" | "ClockOut" | "PauseStart" | "PauseEnd",
      timestamp: body.data.timestamp ? new Date(body.data.timestamp) : new Date(),
    })
    .returning();
  res.status(201).json(entry);
});

// GET /time-entries/today — all users' today status (admin view)
router.get("/time-entries/today", requireAuth, requireAdmin, async (_req, res): Promise<void> => {
  const now = new Date();
  const dayStart = new Date(now);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(now);
  dayEnd.setHours(23, 59, 59, 999);

  const users = await db.select().from(usersTable).where(eq(usersTable.role, "Employee"));
  const todayEntries = await db
    .select()
    .from(timeEntriesTable)
    .where(and(gte(timeEntriesTable.timestamp, dayStart), lt(timeEntriesTable.timestamp, dayEnd)))
    .orderBy(timeEntriesTable.timestamp);

  const result = users.map((user) => {
    const entries = todayEntries.filter((e) => e.userId === user.id);
    const lastEntry = entries[entries.length - 1];

    let status: "ClockedIn" | "OnPause" | "ClockedOut" | "NotStarted" = "NotStarted";
    if (lastEntry) {
      if (lastEntry.type === "ClockIn" || lastEntry.type === "PauseEnd") status = "ClockedIn";
      else if (lastEntry.type === "PauseStart") status = "OnPause";
      else if (lastEntry.type === "ClockOut") status = "ClockedOut";
    }

    const clockInEntry = entries.find((e) => e.type === "ClockIn");
    const hoursWorkedToday = computeHoursFromEntries(entries);

    return {
      userId: user.id,
      userName: user.name,
      userAvatarUrl: user.avatarUrl,
      department: user.department,
      status,
      clockInTime: clockInEntry ? clockInEntry.timestamp.toISOString() : null,
      hoursWorkedToday,
      entries,
    };
  });

  res.json(result);
});

// GET /time-entries/week — weekly summary for a user
router.get("/time-entries/week", requireAuth, async (req, res): Promise<void> => {
  const qp = GetWeekTimeEntriesQueryParams.safeParse(req.query);
  if (!qp.success) {
    res.status(400).json({ error: qp.error.message });
    return;
  }

  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon...
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() + mondayOffset);
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  const entries = await db
    .select()
    .from(timeEntriesTable)
    .where(
      and(
        eq(timeEntriesTable.userId, req.user!.id),
        gte(timeEntriesTable.timestamp, weekStart),
        lt(timeEntriesTable.timestamp, weekEnd)
      )
    )
    .orderBy(timeEntriesTable.timestamp);

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const dailyBreakdown = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    const dateStr = date.toISOString().split("T")[0];
    const dayEntries = entries.filter((e) => {
      const entryDate = new Date(e.timestamp).toISOString().split("T")[0];
      return entryDate === dateStr;
    });
    return {
      date: dateStr,
      label: days[i],
      hours: computeHoursFromEntries(dayEntries),
    };
  });

  const totalHours = dailyBreakdown.reduce((sum, d) => sum + d.hours, 0);
  const workDays = dailyBreakdown.filter((d) => d.hours > 0).length;

  res.json({
    userId: qp.data.userId,
    weekStart: weekStart.toISOString().split("T")[0],
    weekEnd: weekEnd.toISOString().split("T")[0],
    totalHours: Math.round(totalHours * 100) / 100,
    averageHoursPerDay: workDays > 0 ? Math.round((totalHours / workDays) * 100) / 100 : 0,
    dailyBreakdown,
  });
});

export default router;
