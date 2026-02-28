CREATE TABLE "whatsapp" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"waba_id" varchar NOT NULL,
	"phone_id" varchar NOT NULL,
	"phone_number" varchar NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "whatsapp_waba_id_unique" UNIQUE("waba_id"),
	CONSTRAINT "whatsapp_phone_id_unique" UNIQUE("phone_id"),
	CONSTRAINT "whatsapp_phone_number_unique" UNIQUE("phone_number")
);
--> statement-breakpoint
ALTER TABLE "employees" ALTER COLUMN "phone_number" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "tenants" ALTER COLUMN "phone_number" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "rooms" ADD COLUMN "whatsapp_id" integer;--> statement-breakpoint
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_whatsapp_id_whatsapp_id_fk" FOREIGN KEY ("whatsapp_id") REFERENCES "public"."whatsapp"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rooms" DROP COLUMN "platform_type";--> statement-breakpoint
DROP TYPE "public"."platformType";