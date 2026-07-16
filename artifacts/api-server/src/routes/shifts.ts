import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { shiftsTable, usersTable } from "@workspace/db";
import {
  ListShiftsQueryParams,
  CreateShiftBody,
} from "@workspace/api-zod";
import { requireAuth, requireAdmin } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/shifts", requireAuth, async (req, res): Promise<void> => {
  const qp = ListShiftsQueryParams.safeParse(req.query);
  if (!qp.success) {
    res.status(400).json({ error: qp.error.message });
    return;
  }

  const userId = req.user!.id;
  const isAdmin = req.user!.role === "Admin";
  const targetUserId = isAdmin && qp.data.userId ? qp.data.userId : userId;

  const query = db
    .select({
      id: shiftsTable.id,
      userId: shiftsTable.userId,
      userName: usersTable.name,
      date: shiftsTable.date,
      startTime: shiftsTable.startTime,
      endTime: shiftsTable.endTime,
      notes: shiftsTable.notes,
    })
    .from(shiftsTable)
    .leftJoin(usersTable, eq(shiftsTable.userId, usersTable.id))
    .where(eq(shiftsTable.userId, targetUserId))
    .orderBy(shiftsTable.date);

  const shifts = await query;
  res.json(shifts);
});

router.post("/shifts", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const body = CreateShiftBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const [inserted] = await db
    .insert(shiftsTable)
    .values({
      userId: body.data.userId,
      date: body.data.date,
      startTime: body.data.startTime,
      endTime: body.data.endTime,
      notes: body.data.notes ?? null,
    })
    .returning();

  const [row] = await db
    .select({
      id: shiftsTable.id,
      userId: shiftsTable.userId,
      userName: usersTable.name,
      date: shiftsTable.date,
      startTime: shiftsTable.startTime,
      endTime: shiftsTable.endTime,
      notes: shiftsTable.notes,
    })
    .from(shiftsTable)
    .leftJoin(usersTable, eq(shiftsTable.userId, usersTable.id))
    .where(eq(shiftsTable.id, inserted.id));

  res.status(201).json(row);
});

export default router;
