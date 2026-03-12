/*
  Warnings:

  - You are about to drop the column `unit_id` on the `tickets` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "tickets" DROP CONSTRAINT "tickets_unit_id_units_id_fk";

-- AlterTable
ALTER TABLE "tickets" DROP COLUMN "unit_id";
