import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db } from "@workspace/db";
import { requestsTable, usersTable } from "@workspace/db";
import {
  ListRequestsQueryParams,
  CreateRequestBody,
  UpdateRequestStatusParams,
  UpdateRequestStatusBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

const requestsWithUser = async (whereClause?: Parameters<typeof db.select>[0]) => {
  const query = db
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
    .orderBy(desc(requestsTable.createdAt));
  return query;
};

router.get("/requests", async (req, res): Promise<void> => {
  const qp = ListRequestsQueryParams.safeParse(req.query);
  if (!qp.success) {
    res.status(400).json({ error: qp.error.message });
    return;
  }

  let rows = await requestsWithUser();

  if (qp.data.userId) {
    rows = rows.where(eq(requestsTable.userId, qp.data.userId));
  }
  if (qp.data.status) {
    rows = rows.where(eq(requestsTable.status, qp.data.status as "Pending" | "Approved" | "Denied"));
  }

  const results = await rows;
  res.json(results);
});

router.post("/requests", async (req, res): Promise<void> => {
  const body = CreateRequestBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const [inserted] = await db
    .insert(requestsTable)
    .values({
      userId: body.data.userId,
      type: body.data.type as "Time Off" | "Equipment" | "Remote Work" | "Other",
      reason: body.data.reason,
      status: "Pending",
    })
    .returning();

  const [row] = await db
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
    .where(eq(requestsTable.id, inserted.id));

  res.status(201).json(row);
});

router.patch("/requests/:id/status", async (req, res): Promise<void> => {
  const params = UpdateRequestStatusParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const body = UpdateRequestStatusBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const [updated] = await db
    .update(requestsTable)
    .set({ status: body.data.status as "Approved" | "Denied" })
    .where(eq(requestsTable.id, params.data.id))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Request not found" });
    return;
  }
  const [row] = await db
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
    .where(eq(requestsTable.id, updated.id));

  res.json(row);
});

export default router;
