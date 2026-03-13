-- DropForeignKey
ALTER TABLE "tickets" DROP CONSTRAINT "tickets_category_id_ticket_category_id_fk";

-- AlterTable
ALTER TABLE "tickets" ALTER COLUMN "category_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_category_id_ticket_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "ticket_categories"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
