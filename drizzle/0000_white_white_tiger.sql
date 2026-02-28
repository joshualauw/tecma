CREATE TYPE "public"."platformType" AS ENUM('whatsapp');--> statement-breakpoint
CREATE TYPE "public"."senderType" AS ENUM('tenant', 'bot', 'user');--> statement-breakpoint
CREATE TYPE "public"."sourceType" AS ENUM('text', 'file');--> statement-breakpoint
CREATE TYPE "public"."userRole" AS ENUM('super-admin', 'dispatcher', 'worker');--> statement-breakpoint
CREATE TABLE "bots" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"model" text DEFAULT 'gpt-4o',
	"instructions" text,
	"temperature" double precision DEFAULT 0.5,
	"top_p" double precision DEFAULT 1,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "employees" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"address" text,
	"phone_number" varchar,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "employees_phone_number_unique" UNIQUE("phone_number")
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"room_id" integer,
	"sender_type" "senderType" NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "rooms" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer,
	"platform_type" "platformType" NOT NULL,
	"last_message" text,
	"last_message_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sources" (
	"id" serial PRIMARY KEY NOT NULL,
	"bot_id" integer,
	"type" "sourceType",
	"title" text,
	"content" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tenants" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"address" text,
	"phone_number" varchar,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "tenants_phone_number_unique" UNIQUE("phone_number")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" varchar NOT NULL,
	"password" varchar NOT NULL,
	"role" "userRole" NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sources" ADD CONSTRAINT "sources_bot_id_bots_id_fk" FOREIGN KEY ("bot_id") REFERENCES "public"."bots"("id") ON DELETE no action ON UPDATE no action;