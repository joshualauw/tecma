/*
  Warnings:

  - You are about to alter the column `name` on the `bots` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(50)`.
  - You are about to alter the column `phone_number` on the `employees` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(20)`.
  - You are about to alter the column `name` on the `employees` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(50)`.
  - You are about to alter the column `name` on the `properties` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(50)`.
  - You are about to alter the column `tenant_number` on the `rooms` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(20)`.
  - You are about to alter the column `whatsapp_number` on the `rooms` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(20)`.
  - You are about to alter the column `title` on the `sources` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(50)`.
  - You are about to alter the column `name` on the `tenants` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(50)`.
  - You are about to alter the column `phone_number` on the `tenants` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(20)`.
  - You are about to alter the column `name` on the `ticket_categories` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(50)`.
  - You are about to alter the column `title` on the `tickets` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(50)`.
  - You are about to alter the column `code` on the `units` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(25)`.
  - You are about to alter the column `name` on the `users` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(50)`.
  - You are about to alter the column `password` on the `users` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to alter the column `display_name` on the `whatsapp` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(50)`.
  - You are about to alter the column `phone_number` on the `whatsapp` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(20)`.

*/
-- AlterTable
ALTER TABLE "bots" ALTER COLUMN "name" SET DATA TYPE VARCHAR(50);

-- AlterTable
ALTER TABLE "employees" ALTER COLUMN "phone_number" SET DATA TYPE VARCHAR(20),
ALTER COLUMN "name" SET DATA TYPE VARCHAR(50);

-- AlterTable
ALTER TABLE "properties" ALTER COLUMN "name" SET DATA TYPE VARCHAR(50);

-- AlterTable
ALTER TABLE "rooms" ALTER COLUMN "last_message_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "closed_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "expired_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "tenant_number" SET DATA TYPE VARCHAR(20),
ALTER COLUMN "whatsapp_number" SET DATA TYPE VARCHAR(20);

-- AlterTable
ALTER TABLE "sources" ALTER COLUMN "title" SET DATA TYPE VARCHAR(50);

-- AlterTable
ALTER TABLE "tenants" ALTER COLUMN "name" SET DATA TYPE VARCHAR(50),
ALTER COLUMN "phone_number" SET DATA TYPE VARCHAR(20);

-- AlterTable
ALTER TABLE "ticket_categories" ALTER COLUMN "name" SET DATA TYPE VARCHAR(50);

-- AlterTable
ALTER TABLE "tickets" ALTER COLUMN "title" SET DATA TYPE VARCHAR(50);

-- AlterTable
ALTER TABLE "units" ALTER COLUMN "code" SET DATA TYPE VARCHAR(25);

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "name" SET DATA TYPE VARCHAR(50),
ALTER COLUMN "password" SET DATA TYPE VARCHAR(255);

-- AlterTable
ALTER TABLE "whatsapp" ALTER COLUMN "display_name" SET DATA TYPE VARCHAR(50),
ALTER COLUMN "phone_number" SET DATA TYPE VARCHAR(20);
