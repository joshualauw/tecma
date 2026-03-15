-- CreateIndex
CREATE INDEX "idx_messages_room_id_created_at" ON "messages"("room_id", "created_at");
