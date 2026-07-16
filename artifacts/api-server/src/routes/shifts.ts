import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { shiftsTable, usersTable } from "@workspace/db";
import {
  ListShiftsQueryParams,
  CreateShiftBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/shifts", async (req, res): Promise<void> => {
  const qp = ListShiftsQueryParams.safeParse(req.query);
  if (!qp.success) {
    res.status(400).json({ error: qp.error.message });
    return;
  }

  let query = db
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
    .orderBy(shiftsTable.date);

  if (qp.data.userId) {
    query = query.where(eq(shiftsTable.userId, qp.data.userId));
  }

  const shifts = await query;
  res.json(shifts);
});

router.post("/shifts", async (req, res): Promise<void> => {
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
