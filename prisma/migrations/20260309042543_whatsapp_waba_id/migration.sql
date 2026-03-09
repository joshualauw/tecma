/*
  Warnings:

  - You are about to drop the column `wa_id` on the `whatsapp` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[waba_id]` on the table `whatsapp` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `waba_id` to the `whatsapp` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "whatsapp_wa_id_unique";

-- AlterTable
ALTER TABLE "whatsapp" DROP COLUMN "wa_id",
ADD COLUMN     "waba_id" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_waba_id_unique" ON "whatsapp"("waba_id");
