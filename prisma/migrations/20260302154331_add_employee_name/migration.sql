/*
  Warnings:

  - Added the required column `name` to the `employees` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "name" TEXT NOT NULL;
