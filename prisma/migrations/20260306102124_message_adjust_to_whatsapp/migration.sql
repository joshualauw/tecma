/*
  Warnings:

  - A unique constraint covering the columns `[wa_id]` on the table `messages` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "message_type" AS ENUM ('text', 'image', 'document', 'audio', 'video', 'location');

-- CreateEnum
CREATE TYPE "message_status" AS ENUM ('sent', 'delivered', 'read', 'failed');

-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "message_type" "message_type" NOT NULL DEFAULT 'text',
ADD COLUMN     "status" "message_status" NOT NULL DEFAULT 'sent',
ADD COLUMN     "wa_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "messages_wa_id_key" ON "messages"("wa_id");
