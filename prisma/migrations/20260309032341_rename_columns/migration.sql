/*
  Warnings:

  - The values [in-progress] on the enum `ticket_status` will be removed. If these variants are still used in the database, this will fail.
  - The values [super-admin] on the enum `user_role` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `waba_id` on the `whatsapp` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[wa_id]` on the table `whatsapp` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `wa_id` to the `whatsapp` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ticket_status_new" AS ENUM ('open', 'in_progress', 'closed');
ALTER TABLE "public"."tickets" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "tickets" ALTER COLUMN "status" TYPE "ticket_status_new" USING ("status"::text::"ticket_status_new");
ALTER TYPE "ticket_status" RENAME TO "ticket_status_old";
ALTER TYPE "ticket_status_new" RENAME TO "ticket_status";
DROP TYPE "public"."ticket_status_old";
ALTER TABLE "tickets" ALTER COLUMN "status" SET DEFAULT 'open';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "user_role_new" AS ENUM ('super_admin');
ALTER TABLE "users" ALTER COLUMN "role" TYPE "user_role_new" USING ("role"::text::"user_role_new");
ALTER TYPE "user_role" RENAME TO "user_role_old";
ALTER TYPE "user_role_new" RENAME TO "user_role";
DROP TYPE "public"."user_role_old";
COMMIT;

-- DropIndex
DROP INDEX "whatsapp_waba_id_unique";

-- AlterTable
ALTER TABLE "employees" ALTER COLUMN "phone_number" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "rooms" ALTER COLUMN "tenant_number" SET DATA TYPE TEXT,
ALTER COLUMN "whatsapp_number" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "tenants" ALTER COLUMN "phone_number" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "email" SET DATA TYPE TEXT,
ALTER COLUMN "password" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "whatsapp" DROP COLUMN "waba_id",
ADD COLUMN     "wa_id" TEXT NOT NULL,
ALTER COLUMN "phone_id" SET DATA TYPE TEXT,
ALTER COLUMN "phone_number" SET DATA TYPE TEXT,
ALTER COLUMN "quality_rating" SET DATA TYPE TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_wa_id_unique" ON "whatsapp"("wa_id");
