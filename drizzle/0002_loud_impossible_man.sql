CREATE TABLE "properties" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"address" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "whatsapp" RENAME COLUMN "name" TO "display_name";--> statement-breakpoint
ALTER TABLE "sources" DROP CONSTRAINT "sources_bot_id_bots_id_fk";
--> statement-breakpoint
ALTER TABLE "bots" ADD COLUMN "property_id" integer;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "property_id" integer;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "property_id" integer;--> statement-breakpoint
ALTER TABLE "rooms" ADD COLUMN "property_id" integer;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "property_id" integer;--> statement-breakpoint
ALTER TABLE "whatsapp" ADD COLUMN "property_id" integer;--> statement-breakpoint
ALTER TABLE "bots" ADD CONSTRAINT "bots_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sources" ADD CONSTRAINT "sources_bot_id_bots_id_fk" FOREIGN KEY ("bot_id") REFERENCES "public"."bots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenants" ADD CONSTRAINT "tenants_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp" ADD CONSTRAINT "whatsapp_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;