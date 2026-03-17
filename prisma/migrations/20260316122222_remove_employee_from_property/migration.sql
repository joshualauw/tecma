/*
  Warnings:

  - You are about to drop the column `property_id` on the `employees` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "employees" DROP CONSTRAINT "employees_property_id_properties_id_fk";

-- AlterTable
ALTER TABLE "employees" DROP COLUMN "property_id";
