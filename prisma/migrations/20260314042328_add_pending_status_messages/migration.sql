-- AlterEnum
ALTER TYPE "message_status" ADD VALUE 'pending';

-- AlterTable
ALTER TABLE "messages" ALTER COLUMN "status" SET DEFAULT 'pending';
