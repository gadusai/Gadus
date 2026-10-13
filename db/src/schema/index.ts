import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const gadusConversations = pgTable("gadus_conversations", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  modeId: text("mode_id").notNull(),
  modeName: text("mode_name").notNull(),
  preview: text("preview").notNull().default(""),
  starred: boolean("starred").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const gadusMessages = pgTable("gadus_messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id")
    .notNull()
    .references(() => gadusConversations.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const gadusStudioAssets = pgTable("gadus_studio_assets", {
  id: serial("id").primaryKey(),
  kind: text("kind").notNull(),
  title: text("title").notNull(),
  prompt: text("prompt").notNull(),
  url: text("url").notNull(),
  favorite: boolean("favorite").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertGadusConversationSchema = createInsertSchema(gadusConversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertGadusConversation = z.infer<typeof insertGadusConversationSchema>;
export type GadusConversation = typeof gadusConversations.$inferSelect;
export type GadusMessage = typeof gadusMessages.$inferSelect;
export type GadusStudioAsset = typeof gadusStudioAssets.$inferSelect;