import { pgTable, serial, text, varchar, pgEnum, integer, doublePrecision, timestamp } from "drizzle-orm/pg-core";

export const senderTypeEnum = pgEnum("senderType", ["tenant", "bot", "user"]);
export const userRoleEnum = pgEnum("userRole", ["super-admin", "dispatcher", "worker"]);
export const sourceTypeEnum = pgEnum("sourceType", ["text", "file"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: varchar("email").unique().notNull(),
  password: varchar("password").notNull(),
  role: userRoleEnum("role").notNull(),
});

export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const units = pgTable("units", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").references(() => properties.id, { onDelete: "cascade" }),
  code: text("code").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const occupancies = pgTable("occupancies", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").references(() => properties.id, { onDelete: "cascade" }),
  unitId: integer("unit_id").references(() => units.id, { onDelete: "cascade" }),
  tenantId: integer("tenant_id").references(() => tenants.id, { onDelete: "cascade" }),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const tenants = pgTable("tenants", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").references(() => properties.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  address: text("address"),
  phoneNumber: varchar("phone_number").unique().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").references(() => properties.id, { onDelete: "cascade" }),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  address: text("address"),
  phoneNumber: varchar("phone_number").unique().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const whatsapp = pgTable("whatsapp", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").references(() => properties.id, { onDelete: "cascade" }),
  displayName: text("display_name").notNull(),
  wabaId: varchar("waba_id").unique().notNull(),
  phoneId: varchar("phone_id").unique().notNull(),
  phoneNumber: varchar("phone_number").unique().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const rooms = pgTable("rooms", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").references(() => properties.id, { onDelete: "cascade" }),
  whatsappId: integer("whatsapp_id").references(() => whatsapp.id, { onDelete: "cascade" }),
  tenantId: integer("tenant_id").references(() => tenants.id, { onDelete: "cascade" }),
  lastMessage: text("last_message"),
  lastMessageAt: timestamp("last_message_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").references(() => properties.id, { onDelete: "cascade" }),
  roomId: integer("room_id").references(() => rooms.id, { onDelete: "cascade" }),
  senderType: senderTypeEnum("sender_type").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const bots = pgTable("bots", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").references(() => properties.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  model: text("model").default("gpt-4o"),
  instructions: text("instructions"),
  temperature: doublePrecision("temperature").default(0.5),
  topP: doublePrecision("top_p").default(1.0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const sources = pgTable("sources", {
  id: serial("id").primaryKey(),
  botId: integer("bot_id").references(() => bots.id, { onDelete: "cascade" }),
  type: sourceTypeEnum("type"),
  title: text("title"),
  content: text("content"), // The actual raw text or the file path/URL
  createdAt: timestamp("created_at").defaultNow(),
});
