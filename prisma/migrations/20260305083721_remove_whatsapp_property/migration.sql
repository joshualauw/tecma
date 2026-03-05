/*
  Warnings:

  - You are about to drop the column `property_id` on the `whatsapp` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "whatsapp" DROP CONSTRAINT "whatsapp_property_id_properties_id_fk";

-- AlterTable
ALTER TABLE "whatsapp" DROP COLUMN "property_id",
ADD COLUMN     "propertiesId" INTEGER,
ADD COLUMN     "quality_rating" VARCHAR NOT NULL DEFAULT 'high';

-- AddForeignKey
ALTER TABLE "whatsapp" ADD CONSTRAINT "whatsapp_propertiesId_fkey" FOREIGN KEY ("propertiesId") REFERENCES "properties"("id") ON DELETE SET NULL ON UPDATE CASCADE;
