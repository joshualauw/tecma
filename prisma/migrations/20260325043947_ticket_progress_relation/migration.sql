-- AlterTable
ALTER TABLE "ticket_progress" ALTER COLUMN "created_by" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "ticket_progress" ADD CONSTRAINT "ticket_progress_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
