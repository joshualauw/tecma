-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "reply_wa_id" TEXT;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_reply_wa_id_messages_wa_id_fk" FOREIGN KEY ("reply_wa_id") REFERENCES "messages"("wa_id") ON DELETE CASCADE ON UPDATE NO ACTION;
