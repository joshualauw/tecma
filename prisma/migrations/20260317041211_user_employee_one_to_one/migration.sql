/*
  Warnings:

  - A unique constraint covering the columns `[user_id]` on the table `employees` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "employees_user_id_key" ON "employees"("user_id");
