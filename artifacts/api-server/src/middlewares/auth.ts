import { type Request, type Response, type NextFunction } from "express";
import { getAuth } from "@clerk/express";
import { db, usersTable } from "@workspace/db";
import { eq, count } from "drizzle-orm";
import { clerkClient } from "@clerk/express";
import { logger } from "../lib/logger";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        clerkId: string | null;
        name: string;
        email: string;
        role: "Admin" | "Employee";
        department: string | null;
        avatarUrl: string | null;
        shiftPreferences: string | null;
      };
    }
  }
}

export async function getLocalUser(clerkUserId: string) {
  const [existing] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkId, clerkUserId))
    .limit(1);

  if (existing) {
    return existing;
  }

  // New user: provision a local record. First user becomes Admin.
  const user = await clerkClient.users.getUser(clerkUserId);
  const email = user.emailAddresses[0]?.emailAddress ?? `${clerkUserId}@localhost`;
  const name = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || email.split("@")[0];

  const [totalUsers] = await db.select({ count: count() }).from(usersTable);
  const role = totalUsers.count === 0 ? "Admin" : "Employee";

  const [inserted] = await db
    .insert(usersTable)
    .values({
      clerkId: clerkUserId,
      email,
      name,
      role,
      department: null,
      avatarUrl: user.imageUrl,
      shiftPreferences: null,
    })
    .returning();

  return inserted;
}

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const auth = getAuth(req);
  const clerkUserId = auth?.userId;

  if (!clerkUserId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const user = await getLocalUser(clerkUserId);
    req.user = user;
    next();
  } catch (err) {
    logger.error({ err, clerkUserId }, "Failed to load local user");
    res.status(500).json({ error: "Failed to load user" });
  }
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user || req.user.role !== "Admin") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  next();
};
