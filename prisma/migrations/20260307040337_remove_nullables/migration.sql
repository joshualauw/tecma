/*
  Warnings:

  - You are about to drop the column `propertiesId` on the `whatsapp` table. All the data in the column will be lost.
  - Made the column `model` on table `bots` required. This step will fail if there are existing NULL values in that column.
  - Made the column `instructions` on table `bots` required. This step will fail if there are existing NULL values in that column.
  - Made the column `temperature` on table `bots` required. This step will fail if there are existing NULL values in that column.
  - Made the column `top_p` on table `bots` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_at` on table `bots` required. This step will fail if there are existing NULL values in that column.
  - Made the column `property_id` on table `bots` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_at` on table `employees` required. This step will fail if there are existing NULL values in that column.
  - Made the column `property_id` on table `employees` required. This step will fail if there are existing NULL values in that column.
  - Made the column `room_id` on table `messages` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_at` on table `messages` required. This step will fail if there are existing NULL values in that column.
  - Made the column `property_id` on table `messages` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_at` on table `properties` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_at` on table `rooms` required. This step will fail if there are existing NULL values in that column.
  - Made the column `whatsapp_id` on table `rooms` required. This step will fail if there are existing NULL values in that column.
  - Made the column `property_id` on table `rooms` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `property_id` to the `sources` table without a default value. This is not possible if the table is not empty.
  - Made the column `bot_id` on table `sources` required. This step will fail if there are existing NULL values in that column.
  - Made the column `type` on table `sources` required. This step will fail if there are existing NULL values in that column.
  - Made the column `title` on table `sources` required. This step will fail if there are existing NULL values in that column.
  - Made the column `content` on table `sources` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_at` on table `sources` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_at` on table `tenants` required. This step will fail if there are existing NULL values in that column.
  - Made the column `property_id` on table `tenants` required. This step will fail if there are existing NULL values in that column.
  - Made the column `unit_id` on table `tenants` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_at` on table `ticket_categories` required. This step will fail if there are existing NULL values in that column.
  - Made the column `property_id` on table `tickets` required. This step will fail if there are existing NULL values in that column.
  - Made the column `category_id` on table `tickets` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tenant_id` on table `tickets` required. This step will fail if there are existing NULL values in that column.
  - Made the column `unit_id` on table `tickets` required. This step will fail if there are existing NULL values in that column.
  - Made the column `employee_id` on table `tickets` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_at` on table `tickets` required. This step will fail if there are existing NULL values in that column.
  - Made the column `property_id` on table `units` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_at` on table `units` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_at` on table `whatsapp` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "whatsapp" DROP CONSTRAINT "whatsapp_propertiesId_fkey";

-- AlterTable
ALTER TABLE "bots" ALTER COLUMN "model" SET NOT NULL,
ALTER COLUMN "instructions" SET NOT NULL,
ALTER COLUMN "temperature" SET NOT NULL,
ALTER COLUMN "top_p" SET NOT NULL,
ALTER COLUMN "created_at" SET NOT NULL,
ALTER COLUMN "property_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "employees" ALTER COLUMN "created_at" SET NOT NULL,
ALTER COLUMN "property_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "messages" ALTER COLUMN "room_id" SET NOT NULL,
ALTER COLUMN "created_at" SET NOT NULL,
ALTER COLUMN "property_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "properties" ALTER COLUMN "created_at" SET NOT NULL;

-- AlterTable
ALTER TABLE "rooms" ALTER COLUMN "created_at" SET NOT NULL,
ALTER COLUMN "whatsapp_id" SET NOT NULL,
ALTER COLUMN "property_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "sources" ADD COLUMN     "property_id" INTEGER NOT NULL,
ALTER COLUMN "bot_id" SET NOT NULL,
ALTER COLUMN "type" SET NOT NULL,
ALTER COLUMN "type" SET DEFAULT 'text',
ALTER COLUMN "title" SET NOT NULL,
ALTER COLUMN "content" SET NOT NULL,
ALTER COLUMN "created_at" SET NOT NULL;

-- AlterTable
ALTER TABLE "tenants" ALTER COLUMN "created_at" SET NOT NULL,
ALTER COLUMN "property_id" SET NOT NULL,
ALTER COLUMN "unit_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "ticket_categories" ALTER COLUMN "created_at" SET NOT NULL;

-- AlterTable
ALTER TABLE "tickets" ALTER COLUMN "property_id" SET NOT NULL,
ALTER COLUMN "category_id" SET NOT NULL,
ALTER COLUMN "tenant_id" SET NOT NULL,
ALTER COLUMN "unit_id" SET NOT NULL,
ALTER COLUMN "employee_id" SET NOT NULL,
ALTER COLUMN "created_at" SET NOT NULL;

-- AlterTable
ALTER TABLE "units" ALTER COLUMN "property_id" SET NOT NULL,
ALTER COLUMN "created_at" SET NOT NULL;

-- AlterTable
ALTER TABLE "whatsapp" DROP COLUMN "propertiesId",
ALTER COLUMN "created_at" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "sources" ADD CONSTRAINT "sources_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
