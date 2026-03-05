/*
  Warnings:

  - Added the required column `expired_at` to the `rooms` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenant_number` to the `rooms` table without a default value. This is not possible if the table is not empty.
  - Added the required column `whatsapp_number` to the `rooms` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "room_status" AS ENUM ('active', 'closed', 'expired');

-- AlterTable
ALTER TABLE "rooms" ADD COLUMN     "closed_at" TIMESTAMP(6),
ADD COLUMN     "expired_at" TIMESTAMP(6) NOT NULL,
ADD COLUMN     "status" "room_status" NOT NULL DEFAULT 'active',
ADD COLUMN     "tenant_number" VARCHAR NOT NULL,
ADD COLUMN     "whatsapp_number" VARCHAR NOT NULL;
