/*
  Warnings:

  - You are about to drop the column `employee_id` on the `ticket_progress` table. All the data in the column will be lost.
  - Added the required column `created_by` to the `ticket_progress` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ticket_progress" DROP COLUMN "employee_id",
ADD COLUMN     "created_by" INTEGER NOT NULL;
