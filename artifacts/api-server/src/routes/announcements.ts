import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db } from "@workspace/db";
import { announcementsTable, usersTable } from "@workspace/db";
import {
  GetAnnouncementParams,
  CreateAnnouncementBody,
  DeleteAnnouncementParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/announcements", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      id: announcementsTable.id,
      title: announcementsTable.title,
      content: announcementsTable.content,
      authorId: announcementsTable.authorId,
      authorName: usersTable.name,
      imageUrl: announcementsTable.imageUrl,
      createdAt: announcementsTable.createdAt,
    })
    .from(announcementsTable)
    .leftJoin(usersTable, eq(announcementsTable.authorId, usersTable.id))
    .orderBy(desc(announcementsTable.createdAt));
  res.json(rows);
});

router.post("/announcements", async (req, res): Promise<void> => {
  const body = CreateAnnouncementBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const [announcement] = await db
    .insert(announcementsTable)
    .values({
      title: body.data.title,
      content: body.data.content,
      authorId: body.data.authorId,
      imageUrl: body.data.imageUrl ?? null,
    })
    .returning();

  // Fetch with author name
  const [row] = await db
    .select({
      id: announcementsTable.id,
      title: announcementsTable.title,
      content: announcementsTable.content,
      authorId: announcementsTable.authorId,
      authorName: usersTable.name,
      imageUrl: announcementsTable.imageUrl,
      createdAt: announcementsTable.createdAt,
    })
    .from(announcementsTable)
    .leftJoin(usersTable, eq(announcementsTable.authorId, usersTable.id))
    .where(eq(announcementsTable.id, announcement.id));

  res.status(201).json(row);
});

router.get("/announcements/:id", async (req, res): Promise<void> => {
  const params = GetAnnouncementParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [row] = await db
    .select({
      id: announcementsTable.id,
      title: announcementsTable.title,
      content: announcementsTable.content,
      authorId: announcementsTable.authorId,
      authorName: usersTable.name,
      imageUrl: announcementsTable.imageUrl,
      createdAt: announcementsTable.createdAt,
    })
    .from(announcementsTable)
    .leftJoin(usersTable, eq(announcementsTable.authorId, usersTable.id))
    .where(eq(announcementsTable.id, params.data.id));
  if (!row) {
    res.status(404).json({ error: "Announcement not found" });
    return;
  }
  res.json(row);
});

router.delete("/announcements/:id", async (req, res): Promise<void> => {
  const params = DeleteAnnouncementParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [row] = await db
    .delete(announcementsTable)
    .where(eq(announcementsTable.id, params.data.id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Announcement not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
