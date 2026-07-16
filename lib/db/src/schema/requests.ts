import { pgTable, text, serial, timestamp, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const requestTypeEnum = pgEnum("request_type", ["Time Off", "Equipment", "Remote Work", "Other"]);
export const requestStatusEnum = pgEnum("request_status", ["Pending", "Approved", "Denied"]);

export const requestsTable = pgTable("requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: requestTypeEnum("type").notNull(),
  reason: text("reason").notNull(),
  status: requestStatusEnum("status").notNull().default("Pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertRequestSchema = createInsertSchema(requestsTable).omit({ id: true, createdAt: true, status: true });
export type InsertRequest = z.infer<typeof insertRequestSchema>;
export type Request = typeof requestsTable.$inferSelect;
