import { pgTable, serial, text, varchar, pgEnum, integer, doublePrecision, timestamp } from "drizzle-orm/pg-core";

export const senderTypeEnum = pgEnum("senderType", ["user", "ai", "admin"]);
export const platformTypeEnum = pgEnum("platformType", ["web"]);
export const userRoleEnum = pgEnum("userRole", ["super-admin", "admin"]);
export const sourceTypeEnum = pgEnum("sourceType", ["text", "file"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: varchar("email").unique().notNull(),
  password: varchar("password").notNull(),
  role: userRoleEnum("role").notNull(),
});

export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  platform: platformTypeEnum("platform"),
  platformId: varchar("platform_id").unique(), // The Cookie UUID, Phone #, or IG ID
  name: text("name"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const rooms = pgTable("rooms", {
  id: serial("id").primaryKey(),
  contactId: integer("contact_id").references(() => contacts.id, { onDelete: "cascade" }),
  lastMessage: text("last_message"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  roomId: integer("room_id").references(() => rooms.id, { onDelete: "cascade" }),
  sender: senderTypeEnum("sender"),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const bots = pgTable("bots", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  model: text("model").default("gpt-4o"),
  instructions: text("instructions"),
  temperature: doublePrecision("temperature").default(0.5),
  topP: doublePrecision("top_p").default(1.0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const sources = pgTable("sources", {
  id: serial("id").primaryKey(),
  botId: integer("bot_id").references(() => bots.id),
  type: sourceTypeEnum("type"),
  title: text("title"),
  content: text("content"), // The actual raw text or the file path/URL
  createdAt: timestamp("created_at").defaultNow(),
});
