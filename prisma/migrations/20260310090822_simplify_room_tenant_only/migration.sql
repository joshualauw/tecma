/*
  Warnings:

  - You are about to drop the column `temporary_name` on the `rooms` table. All the data in the column will be lost.
  - You are about to drop the column `tenant_number` on the `rooms` table. All the data in the column will be lost.
  - You are about to drop the column `whatsapp_number` on the `rooms` table. All the data in the column will be lost.
  - Made the column `tenant_id` on table `rooms` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "rooms" DROP COLUMN "temporary_name",
DROP COLUMN "tenant_number",
DROP COLUMN "whatsapp_number",
ALTER COLUMN "tenant_id" SET NOT NULL;
